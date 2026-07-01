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
  isAdminApprovalRequiredCategory,
  listingPaymentDueAt,
  resolveUserListingLimit,
  strengthenedEndsAt,
} from '@offroad/shared';
import { CategoriesService } from '../categories/categories.service';
import { getAuctionCurrentPrice, isAuctionActive } from '../common/auction';
import { isPurchasableProduct } from '../common/purchasable';
import { MailService } from '../mail/mail.service';
import type { Advertiser, ProductSituation } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
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
      _count?: { auctionBids: number };
      category?: { slug: string } | null;
    },
  >(product: T, options?: { viewerUserId?: string | null }) {
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
    const auctionActive =
      isAuction &&
      product.auctionEndsAt != null &&
      isAuctionActive(product.auctionEndsAt) &&
      product.status === 'ACTIVE';

    const mapped: Record<string, unknown> = {
      ...product,
      images: JSON.parse(product.images),
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
      displayPrice: isAuction ? currentPrice : product.price,
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
        product.category?.slug != null &&
        isAdminApprovalRequiredCategory(product.category.slug),
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

  private assertClientListingOwner(
    product: { userId: string | null; advertiser: string },
    userId: string,
  ) {
    if (product.advertiser !== 'CLIENT' || product.userId !== userId) {
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
      },
    });
    return result.count;
  }

  async countActiveClientListings(userId: string): Promise<number> {
    return this.prisma.product.count({
      where: { userId, advertiser: 'CLIENT', status: 'ACTIVE' },
    });
  }

  private async getListingQuotaState(userId: string) {
    const [activeCount, user] = await Promise.all([
      this.countActiveClientListings(userId),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { maxActiveListings: true },
      }),
    ]);
    const freeLimit = resolveUserListingLimit(user?.maxActiveListings);
    const requiresListingFee = activeCount >= freeLimit;
    return { activeCount, freeLimit, requiresListingFee };
  }

  async getListingQuota(userId: string) {
    void this.purgeExpiredListingPaymentDrafts();
    const { activeCount, freeLimit, requiresListingFee } = await this.getListingQuotaState(userId);

    return {
      activeCount,
      freeLimit,
      defaultLimit: FREE_CLIENT_LISTING_LIMIT,
      hasCustomLimit: freeLimit !== FREE_CLIENT_LISTING_LIMIT,
      remainingFree: Math.max(0, freeLimit - activeCount),
      requiresListingFee,
      listingFee: EXTRA_LISTING_FEE,
      paymentGraceDays: 3,
    };
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

    return {
      title: data.title,
      description: data.description,
      price: listingPrice,
      images: JSON.stringify(data.images || []),
      categoryId: data.categoryId,
      hasGuarantee: data.isAuction ? false : data.hasGuarantee || false,
      isBoosted: data.isBoosted || false,
      strengthenedUntil: data.applyStrengthened ? strengthenedEndsAt() : null,
      city: data.city,
      phone: data.isAuction ? undefined : data.phone,
      advertiser: data.advertiser ?? 'CLIENT',
      situation: data.situation,
      userId: userId || null,
      status: options.status,
      listingFeePaid: options.listingFeePaid,
      listingPaymentDueAt: options.listingPaymentDueAt,
      stockQuantity: data.isAuction ? 1 : (data.stockQuantity ?? 1),
      activeUntil: isClient && options.status === 'ACTIVE' ? computeActiveUntil(now) : null,
      listedAt: data.isBoosted || options.status === 'ACTIVE' ? now : undefined,
      ...auctionData,
      carBrands: brands.length ? { create: brands.map((brandCode) => ({ brandCode })) } : undefined,
    };
  }

  async createPublicListing(data: CreateProductDto, userId: string) {
    void this.purgeExpiredListingPaymentDrafts();
    await this.categoriesService.assertLeafCategory(data.categoryId);
    const { requiresListingFee, freeLimit, activeCount } = await this.getListingQuotaState(userId);
    const needsAdminApproval = await this.categoriesService.categoryRequiresAdminApproval(
      data.categoryId,
    );

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
      data: await this.buildCreateData({ ...data, advertiser: 'CLIENT' }, userId, createOptions),
      include: productIncludeDetail,
    });

    const mapped = await this.mapProduct(product);

    return {
      product: mapped,
      requiresListingFee,
      requiresAdminApproval: needsAdminApproval,
      activeCount,
      freeLimit,
      listingFee: requiresListingFee ? EXTRA_LISTING_FEE : 0,
      paymentDueAt: requiresListingFee ? product.listingPaymentDueAt : null,
    };
  }

  async payListingFee(productId: string, userId: string) {
    await this.purgeExpiredListingPaymentDrafts();

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    this.assertClientListingOwner(product, userId);

    if (product.listingFeePaid) {
      throw new BadRequestException('هزینه ثبت این آگهی قبلاً پرداخت شده است');
    }

    if (product.status !== 'PENDING') {
      throw new BadRequestException('این آگهی در انتظار پرداخت نیست');
    }

    if (product.listingPaymentDueAt && product.listingPaymentDueAt.getTime() <= Date.now()) {
      throw new BadRequestException('مهلت پرداخت این آگهی به پایان رسیده است');
    }

    const now = new Date();
    const needsAdminApproval = await this.categoriesService.categoryRequiresAdminApproval(
      product.categoryId,
    );

    const updated = await this.prisma.product.update({
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
      include: productIncludeDetail,
    });

    const mapped = await this.mapProduct(updated);
    return {
      ...mapped,
      requiresAdminApproval: needsAdminApproval,
    };
  }

  async findAll(params: {
    advertiser?: string;
    categoryId?: string;
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
    if (params.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: params.categoryId },
        include: { children: { select: { id: true } } },
      });
      if (category?.children.length) {
        where.categoryId = {
          in: [category.id, ...category.children.map((c) => c.id)],
        };
      } else {
        where.categoryId = params.categoryId;
      }
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
      products: await Promise.all(products.map((p) => this.mapProduct(p, { viewerUserId: null }))),
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

  async create(data: CreateProductDto, userId?: string) {
    await this.categoriesService.assertLeafCategory(data.categoryId);
    const product = await this.prisma.product.create({
      data: await this.buildCreateData(data, userId || '', {
        status: 'ACTIVE',
        listingFeePaid: true,
        listingPaymentDueAt: null,
      }),
      include: productIncludeDetail,
    });
    return this.mapProduct(product);
  }

  async update(id: string, data: UpdateProductDto, userId?: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (product.advertiser === 'CLIENT' && product.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('شما اجازه ویرایش این محصول را ندارید');
    }

    const updateData: any = { ...data };
    delete updateData.carBrands;
    if (updateData.type != null && updateData.advertiser == null) {
      updateData.advertiser = updateData.type;
      delete updateData.type;
    }
    if (data.images) updateData.images = JSON.stringify(data.images);
    if (data.auctionEndsAt) updateData.auctionEndsAt = new Date(data.auctionEndsAt);
    if (data.auctionStartPrice != null && product.isAuction) {
      updateData.auctionStartPrice = data.auctionStartPrice;
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

    if (data.isBoosted === true && !product.isBoosted) {
      updateData.listedAt = new Date();
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: productIncludeDetail,
    });
    return this.mapProduct(updated);
  }

  async applyStrengthened(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    this.assertClientListingOwner(product, userId);
    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('فقط آگهی‌های فعال قابل تقویت هستند');
    }
    if (product.isAuction) {
      throw new BadRequestException('مزایده‌ها قابل تقویت نیستند');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { strengthenedUntil: strengthenedEndsAt() },
      include: productIncludeDetail,
    });
    return this.mapProduct(updated);
  }

  async applyBoost(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    this.assertClientListingOwner(product, userId);
    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('فقط آگهی‌های فعال قابل پله‌شدن هستند');
    }
    if (product.isAuction) {
      throw new BadRequestException('مزایده‌ها قابل پله‌شدن نیستند');
    }

    const now = new Date();
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isBoosted: true, listedAt: now },
      include: productIncludeDetail,
    });
    return this.mapProduct(updated);
  }

  async remove(id: string, userId?: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (product.advertiser === 'CLIENT' && product.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('شما اجازه حذف این محصول را ندارید');
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
    const needsAdminApproval = await this.categoriesService.categoryRequiresAdminApproval(
      product.categoryId,
    );
    const now = new Date();

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
