import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EXTRA_LISTING_FEE,
  FREE_CLIENT_LISTING_LIMIT,
  FREE_CLIENT_NEW_LISTING_LIMIT,
  getPaymentPurposeAmount,
  isAdminApprovalRequiredCategory,
  isVehicleSaleCategory,
  listingPaymentDueAt,
  PAYMENT_PURPOSES,
  type PaymentPurpose,
  resolveUserListingLimit,
  resolveUserNewListingLimit,
  strengthenedEndsAt,
} from '@offroad/shared';
import { CategoriesService } from '../categories/categories.service';
import { getAuctionCurrentPrice, isAuctionActive } from '../common/auction';
import { isPurchasableProduct } from '../common/purchasable';
import { MailService } from '../mail/mail.service';
import type {
  Advertiser,
  ProductSituation,
  VehiclePaintCondition,
} from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramChannelService } from '../telegram/telegram-channel.service';
import type { CreateProductDto, ReportProductDto, UpdateProductDto } from './dto';
import { computeActiveUntil, computeDeletionAt } from './product-lifecycle.constants';

const productInclude = {
  category: true,
  user: { select: { name: true, city: true } },
  carBrands: true,
  _count: { select: { auctionBids: true } },
};

const productIncludeDetail = {
  category: true,
  user: { select: { id: true, name: true } },
  carBrands: true,
  _count: { select: { auctionBids: true } },
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
    private mailService: MailService,
    private telegramChannel: TelegramChannelService,
    @Inject('WEB_URL') private readonly webUrl: string,
  ) {}

  private postedSince(postedWithin: string): Date | null {
    const now = Date.now();
    const hours: Record<string, number> = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    };
    const h = hours[postedWithin];
    if (!h) return null;
    return new Date(now - h * 60 * 60 * 1000);
  }

  async mapProduct<
    T extends {
      images: string;
      carBrands?: { brandCode: string }[];
      advertiser: Advertiser;
      hasGuarantee: boolean;
      status: string;
      situation?: ProductSituation | null;
      isAuction?: boolean;
      auctionStartPrice?: number | null;
      auctionCurrentPrice?: number | null;
      buyNowPrice?: number | null;
      realPriceMin?: number | null;
      realPriceMax?: number | null;
      auctionEndsAt?: Date | null;
      activeUntil?: Date | null;
      deprecatedAt?: Date | null;
      listedAt?: Date;
      strengthenedUntil?: Date | null;
      price: number;
      salePrice?: number | null;
      _count?: { auctionBids: number };
      category?: { slug: string } | null;
    },
  >(product: T, options?: { viewerUserId?: string | null; coverImageOnly?: boolean }) {
    const strengthenedActive =
      product.strengthenedUntil != null && product.strengthenedUntil.getTime() > Date.now();
    const brandLabels =
      (product.carBrands?.length ?? 0)
        ? await this.categoriesService.getCarBrandLabelMap()
        : new Map<string, string>();
    const brands = product.carBrands?.map((row) => row.brandCode) ?? [];
    const isAuction = Boolean(product.isAuction);
    const startPrice = product.auctionStartPrice ?? product.price;
    const currentPrice = isAuction
      ? getAuctionCurrentPrice(startPrice, product.auctionCurrentPrice)
      : product.price;
    const salePrice = (product as { salePrice?: number | null }).salePrice ?? null;
    const hasDiscount = salePrice != null && salePrice > 0 && salePrice < product.price;
    const effectivePrice = hasDiscount ? salePrice : currentPrice;
    const auctionActive =
      isAuction &&
      product.auctionEndsAt != null &&
      isAuctionActive(product.auctionEndsAt) &&
      product.status === 'ACTIVE';

    const parsedImages: string[] = JSON.parse(product.images || '[]');
    const images = options?.coverImageOnly ? parsedImages.slice(0, 1) : parsedImages;

    const mapped: Record<string, unknown> = {
      ...product,
      images,
      carBrands: brands.map((brand) => ({
        value: brand,
        label: brandLabels.get(brand) ?? brand,
      })),
      situation:
        product.advertiser === 'SHOP'
          ? ((product as { stockQuantity?: number }).stockQuantity ?? 1) < 1
            ? 'OUT_OF_STOCK'
            : 'IN_STOCK'
          : (product.situation ?? null),
      /** @deprecated use advertiser — kept for existing web clients */
      type: product.advertiser,
      purchasable: isPurchasableProduct({
        advertiser: product.advertiser,
        hasGuarantee: product.hasGuarantee,
        status: product.status as 'ACTIVE' | 'DEPRECATED' | 'PENDING',
        stockQuantity: (product as { stockQuantity?: number }).stockQuantity ?? 1,
        isAuction,
        buyNowPrice: product.buyNowPrice,
        auctionEndsAt: product.auctionEndsAt,
      }),
      isAuction,
      auctionStartPrice: product.auctionStartPrice,
      auctionCurrentPrice: currentPrice,
      buyNowPrice: product.buyNowPrice,
      realPriceMin: product.realPriceMin,
      realPriceMax: product.realPriceMax,
      auctionEndsAt: product.auctionEndsAt,
      activeUntil: product.activeUntil,
      deprecatedAt: product.deprecatedAt,
      deletionAt: product.deprecatedAt ? computeDeletionAt(product.deprecatedAt) : null,
      listedAt: product.listedAt,
      strengthenedUntil: product.strengthenedUntil,
      isStrengthenedActive: strengthenedActive,
      auctionActive,
      bidCount: product._count?.auctionBids ?? 0,
      displayPrice: isAuction ? currentPrice : effectivePrice,
      hideSellerPhone: isAuction,
      listingFeePaid: (product as { listingFeePaid?: boolean }).listingFeePaid ?? true,
      listingPaymentDueAt:
        (product as { listingPaymentDueAt?: Date | null }).listingPaymentDueAt ?? null,
      awaitingListingPayment:
        product.status === 'PENDING' &&
        (product as { listingFeePaid?: boolean }).listingFeePaid === false,
      awaitingAdminApproval:
        product.status === 'PENDING' &&
        (product as { listingFeePaid?: boolean }).listingFeePaid !== false &&
        (Boolean((product as { hasGuarantee?: boolean }).hasGuarantee) ||
          (product.category?.slug != null &&
            isAdminApprovalRequiredCategory(product.category.slug))),
      stockQuantity: (product as { stockQuantity?: number }).stockQuantity ?? 1,
    };

    if (isAuction) {
      mapped.price = currentPrice;
    }

    if (product.advertiser === 'CLIENT' && !product.isAuction && !options?.viewerUserId) {
      mapped.phone = null;
    }

    delete mapped._count;
    return mapped;
  }

  private async expireStrengthenedProducts(): Promise<void> {
    await this.prisma.product.updateMany({
      where: { strengthenedUntil: { lt: new Date() } },
      data: { strengthenedUntil: null },
    });
  }

  private assertListingOwner(
    product: { userId: string | null; advertiser: string },
    userId: string,
  ) {
    if (product.userId !== userId) {
      throw new ForbiddenException('شما اجازه تغییر این آگهی را ندارید');
    }
  }

  async purgeExpiredListingPaymentDrafts(): Promise<number> {
    const result = await this.prisma.product.deleteMany({
      where: {
        advertiser: 'CLIENT',
        status: 'PENDING',
        listingFeePaid: false,
        listingPaymentDueAt: { lte: new Date() },
        orderItems: { none: {} },
      },
    });
    return result.count;
  }

  async countActiveClientListings(userId: string): Promise<number> {
    return this.prisma.product.count({
      where: { userId, advertiser: 'CLIENT', status: 'ACTIVE' },
    });
  }

  async countActiveNewClientListings(userId: string): Promise<number> {
    return this.prisma.product.count({
      where: { userId, advertiser: 'CLIENT', status: 'ACTIVE', situation: 'NEW' },
    });
  }

  private async getListingQuotaState(userId: string) {
    const [activeCount, activeNewCount, user] = await Promise.all([
      this.countActiveClientListings(userId),
      this.countActiveNewClientListings(userId),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, maxActiveListings: true, maxActiveNewListings: true },
      }),
    ]);

    /** Admins have no free-listing or NEW-listing caps. */
    if (user?.role === 'ADMIN') {
      return {
        /** Include admin-created SHOP listings in the admin's own active count. */
        activeCount: await this.prisma.product.count({
          where: { userId, status: 'ACTIVE' },
        }),
        activeNewCount,
        freeLimit: null,
        newLimit: null,
        unlimitedListings: true,
        requiresListingFee: false,
      };
    }

    const freeLimit = resolveUserListingLimit(user?.maxActiveListings);
    const newLimit = resolveUserNewListingLimit(user?.maxActiveNewListings);
    const requiresListingFee = activeCount >= freeLimit;
    return {
      activeCount,
      activeNewCount,
      freeLimit,
      newLimit,
      requiresListingFee,
      unlimitedListings: false as const,
    };
  }

  /** Hard-block when user already has max ACTIVE listings with situation=NEW. */
  async assertNewListingQuota(userId: string, situation?: string | null) {
    if (situation !== 'NEW') return;
    const state = await this.getListingQuotaState(userId);
    if (state.unlimitedListings) return;
    const { activeNewCount, newLimit } = state;
    if (activeNewCount >= newLimit!) {
      throw new BadRequestException(
        `سقف آگهی‌های فعال با وضعیت «نو» برای شما ${newLimit!.toLocaleString('fa-IR')} عدد است. برای ثبت آگهی نو، ابتدا یکی از آگهی‌های نو فعال را ببندید یا وضعیت آن را تغییر دهید.`,
      );
    }
  }

  async getListingQuota(userId: string) {
    void this.purgeExpiredListingPaymentDrafts();
    const state = await this.getListingQuotaState(userId);
    const {
      activeCount,
      activeNewCount,
      freeLimit,
      newLimit,
      requiresListingFee,
      unlimitedListings,
    } = state;

    if (unlimitedListings) {
      return {
        activeCount,
        activeNewCount,
        freeLimit: null,
        newLimit: null,
        defaultLimit: FREE_CLIENT_LISTING_LIMIT,
        hasCustomLimit: false,
        remainingFree: null,
        requiresListingFee: false,
        listingFee: EXTRA_LISTING_FEE,
        paymentGraceDays: 3,
        defaultNewLimit: FREE_CLIENT_NEW_LISTING_LIMIT,
        hasCustomNewLimit: false,
        remainingNew: null,
        atNewLimit: false,
        unlimitedListings: true,
      };
    }

    return {
      activeCount,
      freeLimit: freeLimit!,
      defaultLimit: FREE_CLIENT_LISTING_LIMIT,
      hasCustomLimit: freeLimit !== FREE_CLIENT_LISTING_LIMIT,
      remainingFree: Math.max(0, freeLimit! - activeCount),
      requiresListingFee,
      listingFee: EXTRA_LISTING_FEE,
      paymentGraceDays: 3,
      activeNewCount,
      newLimit: newLimit!,
      defaultNewLimit: FREE_CLIENT_NEW_LISTING_LIMIT,
      hasCustomNewLimit: newLimit !== FREE_CLIENT_NEW_LISTING_LIMIT,
      remainingNew: Math.max(0, newLimit! - activeNewCount),
      atNewLimit: activeNewCount >= newLimit!,
      unlimitedListings: false,
    };
  }

  private async listingNeedsAdminApproval(opts: {
    categoryId: string;
    hasGuarantee?: boolean;
    isAuction?: boolean;
  }): Promise<boolean> {
    if (!opts.isAuction && opts.hasGuarantee) return true;
    return this.categoriesService.categoryRequiresAdminApproval(opts.categoryId);
  }

  private async notifyAdminGuaranteeListing(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        user: { select: { id: true, name: true, phone: true, email: true, city: true } },
      },
    });
    if (!product?.hasGuarantee || !product.user) return;

    const productUrl = `${this.webUrl.replace(/\/$/, '')}/product/${product.id}`;
    await this.mailService
      .sendGuaranteeListingPending({
        product: {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          newPrice: (product as { newPrice?: number | null }).newPrice ?? null,
          city: product.city,
          neighborhood: product.neighborhood,
          categoryName: product.category?.name ?? null,
          phone: product.phone,
          situation: product.situation,
          stockQuantity: product.stockQuantity,
          url: productUrl,
        },
        seller: {
          id: product.user.id,
          name: product.user.name,
          phone: product.user.phone,
          email: product.user.email,
          city: product.user.city,
        },
      })
      .catch(() => {});
  }

  private async resolveVehicleSaleFields(
    categoryId: string,
    data: {
      mileageKm?: number | null;
      paintCondition?: VehiclePaintCondition | null;
    },
  ): Promise<{ mileageKm: number | null; paintCondition: VehiclePaintCondition | null }> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });
    if (!category || !isVehicleSaleCategory(category.slug)) {
      return { mileageKm: null, paintCondition: null };
    }

    if (data.mileageKm == null || !Number.isFinite(data.mileageKm) || data.mileageKm < 0) {
      throw new BadRequestException('میزان کارکرد (کیلومتر) را وارد کنید');
    }
    if (!data.paintCondition) {
      throw new BadRequestException('وضعیت رنگ بدنه را انتخاب کنید');
    }

    return {
      mileageKm: Math.round(data.mileageKm),
      paintCondition: data.paintCondition,
    };
  }

  /**
   * Shop catalog may be 0 (out of stock). Client marketplace listings must be ≥ 1.
   */
  private assertStockQuantity(params: {
    advertiser: Advertiser | string;
    stockQuantity?: number | null;
    isAuction?: boolean;
  }) {
    if (params.isAuction) return;
    if (params.stockQuantity == null) return;
    const qty = Number(params.stockQuantity);
    if (!Number.isFinite(qty) || !Number.isInteger(qty)) {
      throw new BadRequestException('موجودی باید عدد صحیح باشد');
    }
    if (qty < 0) {
      throw new BadRequestException('موجودی نمی‌تواند منفی باشد');
    }
    if (params.advertiser === 'CLIENT' && qty < 1) {
      throw new BadRequestException('تعداد موجودی آگهی باید حداقل ۱ باشد');
    }
  }

  private normalizeSalePrice(listPrice: number, salePrice?: number | null): number | null {
    if (salePrice == null || salePrice <= 0) return null;
    if (salePrice >= listPrice) {
      throw new BadRequestException('قیمت با تخفیف باید کمتر از قیمت اصلی باشد');
    }
    return salePrice;
  }

  private async buildCreateData(
    data: CreateProductDto,
    userId: string,
    options: {
      status: 'ACTIVE' | 'PENDING';
      listingFeePaid: boolean;
      listingPaymentDueAt: Date | null;
    },
  ) {
    const brands = await this.categoriesService.parseCarBrandCodes(data.carBrands);
    const auctionData = this.buildAuctionCreateData(data);
    const listingPrice = data.isAuction ? (data.auctionStartPrice ?? data.price) : data.price;
    const now = new Date();
    const isClient = (data.advertiser ?? 'CLIENT') === 'CLIENT';
    const advertiser = (data.advertiser ?? 'CLIENT') as Advertiser;
    this.assertStockQuantity({
      advertiser,
      stockQuantity: data.stockQuantity,
      isAuction: data.isAuction,
    });
    const newPrice =
      data.isAuction || data.newPrice == null || data.newPrice <= 0 ? null : data.newPrice;
    const salePrice = data.isAuction ? null : this.normalizeSalePrice(listingPrice, data.salePrice);
    const vehicleFields = await this.resolveVehicleSaleFields(data.categoryId, data);

    return {
      title: data.title,
      description: data.description,
      price: listingPrice,
      salePrice,
      newPrice,
      images: JSON.stringify(data.images || []),
      categoryId: data.categoryId,
      hasGuarantee: data.isAuction ? false : data.hasGuarantee || false,
      isBoosted: data.isBoosted || false,
      strengthenedUntil: null,
      city: data.city,
      neighborhood: data.neighborhood?.trim() || null,
      phone: data.isAuction ? undefined : data.phone,
      advertiser: data.advertiser ?? 'CLIENT',
      situation: data.situation,
      mileageKm: vehicleFields.mileageKm,
      paintCondition: vehicleFields.paintCondition,
      userId: userId || null,
      status: options.status,
      listingFeePaid: options.listingFeePaid,
      listingPaymentDueAt: options.listingPaymentDueAt,
      stockQuantity: data.isAuction ? 1 : (data.stockQuantity ?? 1),
      color: data.color?.trim() || null,
      activeUntil: isClient && options.status === 'ACTIVE' ? computeActiveUntil(now) : null,
      listedAt: data.isBoosted || options.status === 'ACTIVE' ? now : undefined,
      ...auctionData,
      carBrands: brands.length ? { create: brands.map((brandCode) => ({ brandCode })) } : undefined,
    };
  }

  async createPublicListing(data: CreateProductDto, userId: string, role?: string) {
    void this.purgeExpiredListingPaymentDrafts();
    await this.categoriesService.assertLeafCategory(data.categoryId);

    /** Admin-created listings belong to the shop catalog, not the user marketplace. */
    if (role === 'ADMIN') {
      const product = await this.prisma.product.create({
        data: await this.buildCreateData({ ...data, advertiser: 'SHOP' }, userId, {
          status: 'ACTIVE',
          listingFeePaid: true,
          listingPaymentDueAt: null,
        }),
        include: productIncludeDetail,
      });

      this.telegramChannel.announceProductActive(product.id);

      return {
        product: await this.mapProduct(product),
        requiresListingFee: false,
        requiresAdminApproval: false,
        activeCount: 0,
        freeLimit: 0,
        activeNewCount: 0,
        newLimit: 0,
        listingFee: 0,
        paymentDueAt: null,
      };
    }

    // Guarantee badge is admin-only; ignore client-provided hasGuarantee.
    const clientData = { ...data, hasGuarantee: false };

    await this.assertNewListingQuota(userId, clientData.situation);
    const { requiresListingFee, freeLimit, activeCount, activeNewCount, newLimit } =
      await this.getListingQuotaState(userId);
    const needsAdminApproval = await this.listingNeedsAdminApproval({
      categoryId: clientData.categoryId,
      hasGuarantee: false,
      isAuction: clientData.isAuction,
    });

    const createOptions = needsAdminApproval
      ? requiresListingFee
        ? {
            status: 'PENDING' as const,
            listingFeePaid: false,
            listingPaymentDueAt: listingPaymentDueAt(),
          }
        : {
            status: 'PENDING' as const,
            listingFeePaid: true,
            listingPaymentDueAt: null,
          }
      : requiresListingFee
        ? {
            status: 'PENDING' as const,
            listingFeePaid: false,
            listingPaymentDueAt: listingPaymentDueAt(),
          }
        : {
            status: 'ACTIVE' as const,
            listingFeePaid: true,
            listingPaymentDueAt: null,
          };

    const product = await this.prisma.product.create({
      data: await this.buildCreateData(
        { ...clientData, advertiser: 'CLIENT' },
        userId,
        createOptions,
      ),
      include: productIncludeDetail,
    });

    const mapped = await this.mapProduct(product);

    if (createOptions.status === 'ACTIVE') {
      this.telegramChannel.announceProductActive(product.id);
    }

    return {
      product: mapped,
      requiresListingFee,
      requiresAdminApproval: needsAdminApproval,
      activeCount,
      freeLimit,
      activeNewCount,
      newLimit,
      listingFee: requiresListingFee ? EXTRA_LISTING_FEE : 0,
      paymentDueAt: requiresListingFee ? product.listingPaymentDueAt : null,
    };
  }

  async payListingFee(productId: string, userId: string) {
    await this.assertPaymentPurposeAllowed(productId, userId, PAYMENT_PURPOSES.LISTING_FEE);
    throw new BadRequestException(
      'برای پرداخت هزینه ثبت آگهی از صفحه پرداخت و درگاه زیبال استفاده کنید',
    );
  }

  async getPaymentProductContext(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        isAuction: true,
        listingFeePaid: true,
        listingPaymentDueAt: true,
        userId: true,
        advertiser: true,
        images: true,
      },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    this.assertListingOwner(product, userId);
    return product;
  }

  async assertPaymentPurposeAllowed(productId: string, userId: string, purpose: PaymentPurpose) {
    const product = await this.getPaymentProductContext(productId, userId);

    switch (purpose) {
      case PAYMENT_PURPOSES.LISTING_FEE:
        if (product.listingFeePaid) {
          throw new BadRequestException('هزینه ثبت این آگهی قبلاً پرداخت شده است');
        }
        if (product.status !== 'PENDING') {
          throw new BadRequestException('این آگهی در انتظار پرداخت نیست');
        }
        if (product.listingPaymentDueAt && product.listingPaymentDueAt.getTime() <= Date.now()) {
          throw new BadRequestException('مهلت پرداخت این آگهی به پایان رسیده است');
        }
        break;
      case PAYMENT_PURPOSES.LISTING_STRENGTHENED:
        if (product.status !== 'ACTIVE') {
          throw new BadRequestException('فقط آگهی‌های فعال قابل تقویت هستند');
        }
        if (product.isAuction) {
          throw new BadRequestException('مزایده‌ها قابل تقویت نیستند');
        }
        break;
      case PAYMENT_PURPOSES.LISTING_BOOST:
        if (product.status !== 'ACTIVE') {
          throw new BadRequestException('فقط آگهی‌های فعال قابل پله‌شدن هستند');
        }
        if (product.isAuction) {
          throw new BadRequestException('مزایده‌ها قابل پله‌شدن نیستند');
        }
        break;
      default:
        throw new BadRequestException('نوع پرداخت نامعتبر است');
    }

    return product;
  }

  getPaymentAmountForPurpose(purpose: PaymentPurpose): number {
    return getPaymentPurposeAmount(purpose);
  }

  async fulfillListingFeePayment(productId: string) {
    await this.purgeExpiredListingPaymentDrafts();

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    if (product.listingFeePaid) {
      return { requiresAdminApproval: false, alreadyPaid: true };
    }

    const now = new Date();
    const needsAdminApproval = await this.listingNeedsAdminApproval({
      categoryId: product.categoryId,
      hasGuarantee: product.hasGuarantee,
      isAuction: product.isAuction,
    });

    if (!needsAdminApproval && product.userId) {
      await this.assertNewListingQuota(product.userId, product.situation);
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: needsAdminApproval
        ? {
            listingFeePaid: true,
            listingPaymentDueAt: null,
            status: 'PENDING',
          }
        : {
            status: 'ACTIVE',
            listingFeePaid: true,
            listingPaymentDueAt: null,
            activeUntil: computeActiveUntil(now),
            listedAt: now,
          },
    });

    if (!needsAdminApproval) {
      this.telegramChannel.announceProductActive(productId);
    } else if (product.hasGuarantee) {
      void this.notifyAdminGuaranteeListing(productId);
    }

    return { requiresAdminApproval: needsAdminApproval, alreadyPaid: false };
  }

  async fulfillStrengthenedPayment(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    await this.prisma.product.update({
      where: { id: productId },
      data: { strengthenedUntil: strengthenedEndsAt() },
    });

    this.telegramChannel.announceStrengthened(productId);
  }

  async fulfillBoostPayment(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const now = new Date();
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        isBoosted: true,
        listedAt: now,
        activeUntil: product.advertiser === 'CLIENT' ? computeActiveUntil(now) : null,
      },
    });

    this.telegramChannel.announceBoost(productId);
  }

  /** Include root category and all nested descendants (any depth). */
  private async collectCategoryAndDescendantIds(rootId: string): Promise<string[]> {
    const ids = [rootId];
    let frontier = [rootId];
    while (frontier.length) {
      const children = await this.prisma.category.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map((c) => c.id).filter((id) => !ids.includes(id));
      ids.push(...frontier);
    }
    return ids;
  }

  /** Categories in a library, including descendants that may not have libraryId set. */
  private async collectLibraryCategoryIds(libraryId: string): Promise<string[]> {
    const inLibrary = await this.prisma.category.findMany({
      where: { libraryId },
      select: { id: true },
    });
    const ids = new Set(inLibrary.map((row) => row.id));
    let frontier = [...ids];
    while (frontier.length) {
      const children = await this.prisma.category.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true },
      });
      frontier = [];
      for (const child of children) {
        if (ids.has(child.id)) continue;
        ids.add(child.id);
        frontier.push(child.id);
      }
    }
    return [...ids];
  }

  async findAll(params: {
    advertiser?: string;
    categoryId?: string;
    libraryId?: string;
    carBrand?: string;
    search?: string;
    page?: number;
    limit?: number;
    city?: string;
    cities?: string[];
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    postedWithin?: string;
    situation?: ProductSituation;
    hasGuarantee?: boolean;
    auction?: boolean;
    auctionActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 30;
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };

    if (params.advertiser) where.advertiser = params.advertiser;
    if (params.advertiser === 'CLIENT' && params.auction !== true) {
      where.isAuction = false;
    }
    if (params.libraryId) {
      const categoryIds = await this.collectLibraryCategoryIds(params.libraryId);
      if (categoryIds.length === 0) {
        return { products: [], total: 0, page, totalPages: 0 };
      }
      where.categoryId = { in: categoryIds };
    }
    if (params.categoryId) {
      const categoryIds = await this.collectCategoryAndDescendantIds(params.categoryId);
      where.categoryId = categoryIds.length > 1 ? { in: categoryIds } : params.categoryId;
    }
    if (params.cities?.length) {
      where.city = { in: params.cities };
    } else if (params.city) {
      where.city = params.city;
    }
    if (params.carBrand) {
      const brands = await this.categoriesService.parseCarBrandCodes([params.carBrand]);
      if (brands.length) {
        where.carBrands = { some: { brandCode: brands[0] } };
      }
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.minPrice != null || params.maxPrice != null) {
      where.price = {};
      if (params.minPrice != null) where.price.gte = params.minPrice;
      if (params.maxPrice != null) where.price.lte = params.maxPrice;
    }
    if (params.postedWithin) {
      const since = this.postedSince(params.postedWithin);
      if (since) where.listedAt = { gte: since };
    }
    if (params.situation === 'NEW') {
      if (params.advertiser === 'CLIENT') {
        where.situation = 'NEW';
      } else if (params.advertiser !== 'SHOP') {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          { OR: [{ situation: 'NEW' }, { advertiser: 'SHOP' }] },
        ];
      }
    } else if (params.situation === 'USED') {
      where.situation = 'USED';
    }
    if (params.hasGuarantee === true) {
      where.hasGuarantee = true;
    } else if (params.hasGuarantee === false) {
      where.hasGuarantee = false;
    }

    if (params.auction === true) {
      where.isAuction = true;
    }

    if (params.auctionActive === true) {
      where.isAuction = true;
      where.status = 'ACTIVE';
      where.auctionEndsAt = { gt: new Date() };
    }

    await this.expireStrengthenedProducts();

    const orderBy: any = [
      { strengthenedUntil: { sort: 'desc', nulls: 'last' } },
      { listedAt: 'desc' },
    ];

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: await Promise.all(
        products.map((p) => this.mapProduct(p, { viewerUserId: null, coverImageOnly: true })),
      ),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, viewerUserId?: string | null) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productIncludeDetail,
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    return this.mapProduct(product, { viewerUserId });
  }

  /** Same subcategory (newest 15) plus 2 random items from another subcategory. */
  async findRelated(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, categoryId: true, advertiser: true },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const relatedWhere = {
      status: 'ACTIVE' as const,
      advertiser: product.advertiser,
      categoryId: product.categoryId,
      id: { not: product.id },
      isAuction: false,
    };

    const relatedRows = await this.prisma.product.findMany({
      where: relatedWhere,
      include: productInclude,
      orderBy: { listedAt: 'desc' },
      take: 15,
    });

    const otherGroups = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        status: 'ACTIVE',
        advertiser: product.advertiser,
        categoryId: { not: product.categoryId },
        id: { not: product.id },
        isAuction: false,
      },
    });

    let unrelatedRows: typeof relatedRows = [];
    if (otherGroups.length > 0) {
      const pick = otherGroups[Math.floor(Math.random() * otherGroups.length)]!;
      const pool = await this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          advertiser: product.advertiser,
          categoryId: pick.categoryId,
          id: { not: product.id },
          isAuction: false,
        },
        include: productInclude,
        take: 24,
      });
      unrelatedRows = shufflePick(pool, 2);
    }

    const products = await Promise.all(
      [...relatedRows, ...unrelatedRows].map((p) =>
        this.mapProduct(p, { viewerUserId: null, coverImageOnly: true }),
      ),
    );

    return { products };
  }

  private buildAuctionCreateData(data: CreateProductDto) {
    if (!data.isAuction) return {};

    const start = data.auctionStartPrice ?? data.price;
    const endsAt = data.auctionEndsAt ? new Date(data.auctionEndsAt) : null;

    if (!endsAt || endsAt.getTime() <= Date.now()) {
      throw new BadRequestException('زمان پایان مزایده باید در آینده باشد');
    }

    if (
      data.realPriceMin != null &&
      data.realPriceMax != null &&
      data.realPriceMin > data.realPriceMax
    ) {
      throw new BadRequestException('حداقل قیمت واقعی نمی‌تواند بیشتر از حداکثر باشد');
    }

    return {
      isAuction: true,
      auctionStartPrice: start,
      auctionCurrentPrice: start,
      price: start,
      buyNowPrice: data.buyNowPrice ?? null,
      realPriceMin: data.realPriceMin ?? null,
      realPriceMax: data.realPriceMax ?? null,
      auctionEndsAt: endsAt,
      phone: null,
    };
  }

  async create(data: CreateProductDto, userId?: string, role?: string) {
    await this.categoriesService.assertLeafCategory(data.categoryId);
    const advertiser = role === 'ADMIN' ? 'SHOP' : (data.advertiser ?? 'CLIENT');
    const product = await this.prisma.product.create({
      data: await this.buildCreateData({ ...data, advertiser }, userId || '', {
        status: 'ACTIVE',
        listingFeePaid: true,
        listingPaymentDueAt: null,
      }),
      include: productIncludeDetail,
    });
    this.telegramChannel.announceProductActive(product.id);
    return this.mapProduct(product);
  }

  async update(id: string, data: UpdateProductDto, userId?: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (product.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('شما اجازه ویرایش این محصول را ندارید');
    }

    this.assertStockQuantity({
      advertiser: product.advertiser,
      stockQuantity: data.stockQuantity,
      isAuction: product.isAuction,
    });

    if (
      product.advertiser === 'CLIENT' &&
      product.userId &&
      product.status === 'ACTIVE' &&
      data.situation === 'NEW' &&
      product.situation !== 'NEW'
    ) {
      await this.assertNewListingQuota(product.userId, 'NEW');
    }

    const updateData: any = { ...data };
    delete updateData.carBrands;
    // Guarantee badge is admin-only — clients cannot set or clear it via product update.
    if (userRole !== 'ADMIN') {
      delete updateData.hasGuarantee;
    }
    if (updateData.type != null && updateData.advertiser == null) {
      updateData.advertiser = updateData.type;
      delete updateData.type;
    }
    if (data.images) updateData.images = JSON.stringify(data.images);
    if (data.auctionEndsAt) updateData.auctionEndsAt = new Date(data.auctionEndsAt);
    if (data.auctionStartPrice != null && product.isAuction) {
      updateData.auctionStartPrice = data.auctionStartPrice;
    }
    if (data.neighborhood !== undefined) {
      updateData.neighborhood = data.neighborhood?.trim() || null;
    }

    if (data.newPrice !== undefined) {
      updateData.newPrice =
        data.newPrice == null || Number(data.newPrice) <= 0 ? null : Number(data.newPrice);
    }

    if (data.salePrice !== undefined) {
      const listPrice = data.price != null ? Number(data.price) : product.price;
      updateData.salePrice =
        data.salePrice == null || Number(data.salePrice) <= 0
          ? null
          : this.normalizeSalePrice(listPrice, Number(data.salePrice));
    } else if (data.price != null && (product as { salePrice?: number | null }).salePrice != null) {
      const existingSale = (product as { salePrice?: number | null }).salePrice;
      if (existingSale != null && existingSale >= Number(data.price)) {
        updateData.salePrice = null;
      }
    }

    const enablingGuarantee =
      userRole === 'ADMIN' &&
      product.advertiser === 'CLIENT' &&
      data.hasGuarantee === true &&
      !product.hasGuarantee &&
      product.status === 'ACTIVE' &&
      !product.isAuction;

    if (enablingGuarantee) {
      // Admin can grant without forcing PENDING (badge only).
      updateData.hasGuarantee = true;
    }

    if (data.carBrands !== undefined) {
      const brands = await this.categoriesService.parseCarBrandCodes(data.carBrands);
      await this.prisma.productCarBrand.deleteMany({ where: { productId: id } });
      if (brands.length > 0) {
        updateData.carBrands = {
          create: brands.map((brandCode) => ({ brandCode })),
        };
      }
    }

    if (data.categoryId) {
      await this.categoriesService.assertLeafCategory(data.categoryId);
    }

    const categoryIdForVehicle = data.categoryId ?? product.categoryId;
    const vehicleFields = await this.resolveVehicleSaleFields(categoryIdForVehicle, {
      mileageKm:
        data.mileageKm !== undefined
          ? data.mileageKm
          : (product as { mileageKm?: number | null }).mileageKm,
      paintCondition:
        data.paintCondition !== undefined
          ? data.paintCondition
          : (product as { paintCondition?: VehiclePaintCondition | null }).paintCondition,
    });
    updateData.mileageKm = vehicleFields.mileageKm;
    updateData.paintCondition = vehicleFields.paintCondition;

    if (data.isBoosted === true && !product.isBoosted) {
      const now = new Date();
      updateData.listedAt = now;
      if (product.advertiser === 'CLIENT') {
        updateData.activeUntil = computeActiveUntil(now);
      } else {
        updateData.activeUntil = null;
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: productIncludeDetail,
    });

    return this.mapProduct(updated);
  }

  async applyStrengthened(id: string, userId: string) {
    await this.assertPaymentPurposeAllowed(id, userId, PAYMENT_PURPOSES.LISTING_STRENGTHENED);
    throw new BadRequestException(
      'برای پرداخت تقویت آگهی از صفحه پرداخت و درگاه زیبال استفاده کنید',
    );
  }

  async applyBoost(id: string, userId: string) {
    await this.assertPaymentPurposeAllowed(id, userId, PAYMENT_PURPOSES.LISTING_BOOST);
    throw new BadRequestException(
      'برای پرداخت پله‌شدن آگهی از صفحه پرداخت و درگاه زیبال استفاده کنید',
    );
  }

  async applyBoostWithCredit(id: string, userId: string) {
    await this.assertPaymentPurposeAllowed(id, userId, PAYMENT_PURPOSES.LISTING_BOOST);

    await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.updateMany({
        where: { id: userId, boostCredits: { gte: 1 } },
        data: { boostCredits: { decrement: 1 } },
      });
      if (updatedUser.count === 0) {
        throw new BadRequestException('امتیاز پله‌شدن رایگان ندارید');
      }

      const product = await tx.product.findUnique({ where: { id } });
      if (!product) throw new NotFoundException('محصول یافت نشد');

      const now = new Date();
      await tx.product.update({
        where: { id },
        data: {
          isBoosted: true,
          listedAt: now,
          activeUntil: product.advertiser === 'CLIENT' ? computeActiveUntil(now) : null,
        },
      });
    });

    this.telegramChannel.announceBoost(id);

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    return this.mapProduct(product);
  }

  async remove(id: string, userId?: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (product.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('شما اجازه حذف این محصول را ندارید');
    }

    const orderItemCount = await this.prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      throw new BadRequestException(
        'این محصول در سفارش ثبت شده و قابل حذف نیست. می‌توانید وضعیت آن را به ناموجود یا غیرفعال تغییر دهید.',
      );
    }

    return this.prisma.product.delete({ where: { id } });
  }

  async reactivate(id: string, userId: string) {
    await this.purgeExpiredListingPaymentDrafts();

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (product.advertiser !== 'CLIENT' || product.userId !== userId) {
      throw new ForbiddenException('شما اجازه فعال‌سازی این آگهی را ندارید');
    }

    if (product.status !== 'DEPRECATED') {
      throw new BadRequestException('فقط آگهی‌های منقضی‌شده قابل فعال‌سازی مجدد هستند');
    }

    const { requiresListingFee, freeLimit, activeCount } = await this.getListingQuotaState(userId);
    const needsAdminApproval = await this.listingNeedsAdminApproval({
      categoryId: product.categoryId,
      hasGuarantee: product.hasGuarantee,
      isAuction: product.isAuction,
    });
    const now = new Date();

    if (!requiresListingFee && !needsAdminApproval) {
      await this.assertNewListingQuota(userId, product.situation);
    }

    if (requiresListingFee) {
      const pending = await this.prisma.product.update({
        where: { id },
        data: {
          status: 'PENDING',
          listingFeePaid: false,
          listingPaymentDueAt: listingPaymentDueAt(),
          deprecatedAt: null,
        },
        include: productIncludeDetail,
      });

      return {
        product: await this.mapProduct(pending),
        requiresListingFee: true,
        requiresAdminApproval: needsAdminApproval,
        activeCount,
        freeLimit,
        listingFee: EXTRA_LISTING_FEE,
        paymentDueAt: pending.listingPaymentDueAt,
      };
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: needsAdminApproval
        ? {
            status: 'PENDING',
            listingFeePaid: true,
            listingPaymentDueAt: null,
            deprecatedAt: null,
          }
        : {
            status: 'ACTIVE',
            listingFeePaid: true,
            listingPaymentDueAt: null,
            activeUntil: computeActiveUntil(now),
            deprecatedAt: null,
            listedAt: now,
          },
      include: productIncludeDetail,
    });

    if (needsAdminApproval && product.hasGuarantee) {
      void this.notifyAdminGuaranteeListing(id);
    }

    return {
      product: await this.mapProduct(updated),
      requiresListingFee: false,
      requiresAdminApproval: needsAdminApproval,
      activeCount,
      freeLimit,
      listingFee: 0,
      paymentDueAt: null,
    };
  }

  async reportProduct(productId: string, reporterId: string, data: ReportProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { name: true } },
        user: {
          select: { id: true, name: true, phone: true, email: true, city: true, telegramId: true },
        },
      },
    });

    if (!product) throw new NotFoundException('آگهی یافت نشد');
    if (product.userId === reporterId) {
      throw new BadRequestException('نمی‌توانید آگهی خود را گزارش کنید');
    }

    const reporter = await this.prisma.user.findUnique({
      where: { id: reporterId },
      select: { id: true, name: true, phone: true, email: true },
    });
    if (!reporter) throw new NotFoundException('کاربر یافت نشد');

    const title = data.title.trim();
    const description = data.description.trim();
    const productUrl = `${this.webUrl.replace(/\/$/, '')}/product/${product.id}`;

    await this.mailService.sendProductReport({
      reportTitle: title,
      reportDescription: description,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        city: product.city,
        advertiser: product.advertiser,
        categoryName: product.category?.name ?? null,
        url: productUrl,
      },
      advertiser: product.user
        ? {
            id: product.user.id,
            name: product.user.name,
            phone: product.user.phone,
            email: product.user.email,
            city: product.user.city,
            telegramId: product.user.telegramId,
          }
        : null,
      reporter: {
        id: reporter.id,
        name: reporter.name,
        phone: reporter.phone,
        email: reporter.email,
      },
    });

    return { message: 'گزارش شما ثبت شد و برای بررسی ارسال شد' };
  }
}

function shufflePick<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = current;
  }
  return copy.slice(0, Math.min(count, copy.length));
}
