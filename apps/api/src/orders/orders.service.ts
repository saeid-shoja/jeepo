import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  canTransitionOrderStatus,
  getOrderStatusEmailCopy,
  getOrderStatusLabel,
  getProductColorLabel,
  isProductColorId,
  ORDER_NEEDS_ATTENTION_STATUSES,
  type OrderStatusCode,
  parseProductColorIds,
  productRequiresColorChoice,
  SITE_EMAIL,
  SITE_NAME_FA,
  SITE_TELEGRAM_SUPPORT,
} from '@offroad/shared';
import { getProductSalePrice, isPurchasableProduct } from '../common/purchasable';
import type { OrderEmailPayload } from '../mail/mail.service';
import { MailService } from '../mail/mail.service';
import type {
  GuaranteedOrderItemStatus,
  OrderStatus,
  PaymentMethod,
} from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateOrderDto,
  OrderItemDto,
  PreviewOrderDto,
  SubmitPackagingEvidenceDto,
  SubmitShippingEvidenceDto,
} from './dto';

type ResolvedLine = {
  productId: string;
  quantity: number;
  price: number;
  title: string;
  image: string | null;
  color: string | null;
};

const orderInclude = {
  user: {
    select: { id: true, name: true, phone: true, email: true, city: true },
  },
  items: {
    include: {
      product: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              city: true,
            },
          },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
} as const;

const ORDER_ADMIN_EMAIL = SITE_EMAIL;
const GUARANTEE_SELLER_RESPONSE_MS = 7 * 24 * 60 * 60 * 1000;
const GUARANTEE_BUYER_REVIEW_MS = 7 * 24 * 60 * 60 * 1000;
const GUARANTEE_ACTIVE_STATUSES: GuaranteedOrderItemStatus[] = [
  'WAITING_SELLER_CONFIRMATION',
  'PACKAGING',
  'READY_TO_SHIP',
] as const;
const MAX_VIDEO_BYTES = 1024 * 1024;
const MAX_PROOF_IMAGE_BYTES = 100 * 1024;

/** Remove sold client listings (تضمین جیپو) and auctions from public lists. */
function shouldDeactivateSoldListing(product: {
  advertiser: string;
  hasGuarantee: boolean;
  isAuction: boolean;
  stockQuantity: number;
}): boolean {
  if (product.advertiser !== 'CLIENT') return false;
  if (product.stockQuantity > 0) return false;
  return product.hasGuarantee || product.isAuction;
}

function getGuaranteedOrderFeeRate(productPrice: number): number {
  if (!Number.isFinite(productPrice) || productPrice <= 0) return 0;
  if (productPrice <= 10_000_000) return 0.05;
  if (productPrice < 25_000_000) return 0.07;
  return 0.1;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async resolveItems(items: OrderItemDto[], buyerId: string): Promise<ResolvedLine[]> {
    if (!items.length) {
      throw new BadRequestException('سبد خرید خالی است');
    }

    const merged = new Map<string, OrderItemDto>();
    for (const item of items) {
      const key = `${item.productId}::${item.color ?? ''}`;
      const prev = merged.get(key);
      if (prev) {
        prev.quantity += item.quantity;
      } else {
        merged.set(key, { ...item });
      }
    }
    const normalized = [...merged.values()];

    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('برخی محصولات یافت نشدند');
    }

    const byId = new Map(products.map((p) => [p.id, p]));
    const qtyByProduct = new Map<string, number>();
    for (const item of normalized) {
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
    }

    const lines: ResolvedLine[] = [];

    for (const item of normalized) {
      const product = byId.get(item.productId);
      if (!product) {
        throw new BadRequestException('محصول یافت نشد');
      }
      if (!isPurchasableProduct(product)) {
        throw new BadRequestException(`محصول «${product.title}» قابل خرید آنلاین نیست`);
      }
      if (
        buyerId &&
        product.userId === buyerId &&
        (product.hasGuarantee || product.advertiser === 'SHOP')
      ) {
        throw new BadRequestException('نمی‌توانید آگهی خود را خریداری کنید');
      }

      const available = product.stockQuantity ?? 1;
      const totalRequested = qtyByProduct.get(product.id) ?? item.quantity;
      if (totalRequested > available) {
        throw new BadRequestException(
          `موجودی «${product.title}» کافی نیست (حداکثر ${available} عدد)`,
        );
      }
      if (item.quantity < 1) {
        throw new BadRequestException('تعداد باید حداقل ۱ باشد');
      }

      const availableColors = parseProductColorIds(product.color);
      let color: string | null = item.color ?? null;
      if (productRequiresColorChoice(product) && !color) {
        throw new BadRequestException(`رنگ «${product.title}» را انتخاب کنید`);
      }
      if (color) {
        if (!isProductColorId(color) || !availableColors.includes(color)) {
          throw new BadRequestException(`رنگ انتخاب‌شده برای «${product.title}» موجود نیست`);
        }
      } else {
        color = null;
      }

      const images: string[] = JSON.parse(product.images || '[]');
      lines.push({
        productId: product.id,
        quantity: item.quantity,
        price: getProductSalePrice(product),
        title: product.title,
        image: images[0] ?? null,
        color,
      });
    }

    return lines;
  }

  async preview(data: PreviewOrderDto) {
    const lines = await this.resolveItems(data.items, '');
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

    return {
      items: lines.map((line) => ({
        productId: line.productId,
        title: line.title,
        image: line.image,
        quantity: line.quantity,
        unitPrice: line.price,
        lineTotal: line.price * line.quantity,
        color: line.color,
        colorLabel: line.color ? getProductColorLabel(line.color) : null,
      })),
      subtotal,
      total: subtotal,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    };
  }

  async findAll() {
    return this.prisma.order.findMany({
      where: {
        items: {
          none: { product: { advertiser: 'CLIENT', hasGuarantee: true } },
        },
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllGuaranteed() {
    await this.expireOverdueGuaranteedItems();
    return this.prisma.order.findMany({
      where: {
        items: {
          some: { product: { advertiser: 'CLIENT', hasGuarantee: true } },
        },
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    await this.expireOverdueGuaranteedItems({ buyerId: userId });
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSellerOrders(sellerId: string) {
    await this.expireOverdueGuaranteedItems({ sellerId });
    return this.prisma.order.findMany({
      where: {
        paidAt: { not: null },
        items: {
          some: {
            guaranteeStatus: { not: null },
            product: {
              userId: sellerId,
              advertiser: 'CLIENT',
              hasGuarantee: true,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            city: true,
          },
        },
        items: {
          where: {
            guaranteeStatus: { not: null },
            product: {
              userId: sellerId,
              advertiser: 'CLIENT',
              hasGuarantee: true,
            },
          },
          include: {
            product: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    city: true,
                  },
                },
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getGuaranteedItem(orderId: string, itemId: string) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      include: {
        product: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                city: true,
              },
            },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        order: { include: orderInclude },
      },
    });
    if (!item) throw new NotFoundException('قلم سفارش یافت نشد');
    if (item.product.advertiser !== 'CLIENT' || !item.product.hasGuarantee) {
      throw new BadRequestException('این کالا مشمول تضمین جیپو نیست');
    }
    return item;
  }

  private async getSellerGuaranteedItem(orderId: string, itemId: string, sellerId: string) {
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (!item.guaranteeStatus) {
      throw new BadRequestException('این کالا هنوز وارد فرایند تضمین نشده است');
    }
    if (item.product.userId !== sellerId) {
      throw new ForbiddenException('شما فروشنده این کالا نیستید');
    }
    return item;
  }

  private dataUrlByteLength(value: string, kind: 'video' | 'image'): number {
    const comma = value.indexOf(',');
    const header = comma >= 0 ? value.slice(0, comma) : '';
    const payload = comma >= 0 ? value.slice(comma + 1) : '';
    const prefix = kind === 'video' ? 'data:video/' : 'data:image/';
    if (!header.startsWith(prefix) || !header.endsWith(';base64') || !payload) {
      throw new BadRequestException(
        kind === 'video' ? 'فایل ویدیو معتبر نیست' : 'فایل عکس معتبر نیست',
      );
    }
    return Buffer.from(payload, 'base64').byteLength;
  }

  private async updateGuaranteedItem(
    orderId: string,
    itemId: string,
    from: GuaranteedOrderItemStatus,
    to: GuaranteedOrderItemStatus,
    extra: {
      packagingVideo?: string;
      packagingImages?: string[];
      shippingReceipt?: string;
      shippedAt?: Date;
      guaranteeDeadlineAt?: Date | null;
      guaranteeCancellationReason?: string;
    } = {},
  ) {
    const now = new Date();
    const updated = await this.prisma.orderItem.updateMany({
      where: {
        id: itemId,
        orderId,
        guaranteeStatus: from,
        ...(GUARANTEE_ACTIVE_STATUSES.includes(from) ? { guaranteeDeadlineAt: { gt: now } } : {}),
      },
      data: {
        guaranteeStatus: to,
        guaranteeStatusChangedAt: now,
        ...extra,
      },
    });
    if (!updated.count) {
      await this.expireOverdueGuaranteedItem(orderId, itemId);
      throw new ConflictException('وضعیت این کالا قبلاً تغییر کرده یا مهلت آن پایان یافته است');
    }
    return this.getGuaranteedItem(orderId, itemId);
  }

  private cancellationReasonFor(status: string): string {
    if (status === 'WAITING_SELLER_CONFIRMATION') {
      return 'فروشنده تا ۷ روز کامل پس از واریز موفق خریدار، سفارش را تأیید نکرد.';
    }
    return 'فروشنده تا ۷ روز کامل پس از تأیید سفارش، کالا را ارسال و مدارک ارسال را بارگذاری نکرد.';
  }

  private async syncOrderCancellationStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        items: { select: { guaranteeStatus: true } },
      },
    });
    if (
      order &&
      order.items.length > 0 &&
      order.items.every(
        (item) => item.guaranteeStatus === 'CANCELLED' || item.guaranteeStatus === 'REFUNDED',
      )
    ) {
      await this.prisma.order.updateMany({
        where: { id: orderId, status: { not: 'CANCELLED' } },
        data: { status: 'CANCELLED', statusChangedAt: new Date() },
      });
    }
  }

  async expireOverdueGuaranteedItems(
    scope: { orderId?: string; buyerId?: string; sellerId?: string } = {},
  ): Promise<number> {
    const dueItems = await this.prisma.orderItem.findMany({
      where: {
        guaranteeStatus: { in: GUARANTEE_ACTIVE_STATUSES },
        guaranteeDeadlineAt: { lte: new Date() },
        ...(scope.orderId ? { orderId: scope.orderId } : {}),
        ...(scope.buyerId ? { order: { userId: scope.buyerId } } : {}),
        ...(scope.sellerId ? { product: { userId: scope.sellerId } } : {}),
      },
      select: { orderId: true, id: true },
    });
    let expired = 0;
    for (const item of dueItems) {
      if (await this.expireOverdueGuaranteedItem(item.orderId, item.id)) expired++;
    }
    return expired;
  }

  private async expireOverdueGuaranteedItem(orderId: string, itemId: string): Promise<boolean> {
    const now = new Date();
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      select: { guaranteeStatus: true, guaranteeDeadlineAt: true },
    });
    if (
      !item?.guaranteeStatus ||
      !GUARANTEE_ACTIVE_STATUSES.includes(item.guaranteeStatus) ||
      !item.guaranteeDeadlineAt ||
      item.guaranteeDeadlineAt > now
    ) {
      return false;
    }

    const reason = this.cancellationReasonFor(item.guaranteeStatus);
    const result = await this.prisma.orderItem.updateMany({
      where: {
        id: itemId,
        orderId,
        guaranteeStatus: item.guaranteeStatus,
        guaranteeDeadlineAt: { lte: now },
      },
      data: {
        guaranteeStatus: 'CANCELLED',
        guaranteeStatusChangedAt: now,
        guaranteeCancellationReason: reason,
        guaranteeDeadlineAt: null,
      },
    });
    if (!result.count) return false;

    await this.syncOrderCancellationStatus(orderId);
    const cancelled = await this.getGuaranteedItem(orderId, itemId);
    this.notifyGuaranteedCancellation(cancelled, false);
    void this.notifyGuaranteedAdmins(cancelled, 'لغو خودکار', reason).catch((err) =>
      this.logger.warn(`Guaranteed cancellation admin alert failed: ${String(err)}`),
    );
    return true;
  }

  private notifyGuaranteedBuyer(
    item: Awaited<ReturnType<OrdersService['getGuaranteedItem']>>,
    copy: { subjectSuffix: string; heading: string; body: string },
  ) {
    const email = item.order.user.email;
    if (!email) return;
    const payload = this.buildOrderEmailPayload(item.order);
    void this.mailService
      .sendBuyerOrderStatusUpdate(email, item.order.user.name, payload, copy)
      .catch((err) => this.logger.warn(`Guaranteed order email failed: ${String(err)}`));
  }

  private async notifyGuaranteedAdmins(
    item: Awaited<ReturnType<OrdersService['getGuaranteedItem']>>,
    status: string,
    details: string,
  ) {
    const emails = await this.listAdminNotificationEmails();
    await Promise.all(
      emails.map((email) =>
        this.mailService
          .sendGuaranteedOrderAdminAlert(email, {
            orderId: item.orderId,
            itemId: item.id,
            buyerId: item.order.user.id,
            buyerName: item.order.user.name,
            sellerId: item.product.userId ?? '—',
            sellerName: item.product.user?.name ?? '—',
            productTitle: item.product.title,
            quantity: item.quantity,
            total: item.price * item.quantity,
            status,
            details,
          })
          .catch((err) => this.logger.warn(`Guaranteed order admin email failed: ${String(err)}`)),
      ),
    );
  }

  async sellerConfirmItem(orderId: string, itemId: string, sellerId: string) {
    await this.expireOverdueGuaranteedItem(orderId, itemId);
    const item = await this.getSellerGuaranteedItem(orderId, itemId, sellerId);
    if (item.guaranteeStatus !== 'WAITING_SELLER_CONFIRMATION') {
      throw new BadRequestException('این سفارش در انتظار تأیید فروشنده نیست');
    }
    const now = new Date();
    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      'WAITING_SELLER_CONFIRMATION',
      'PACKAGING',
      { guaranteeDeadlineAt: new Date(now.getTime() + GUARANTEE_SELLER_RESPONSE_MS) },
    );
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: 'سفارش تأیید شد',
      heading: 'سفارش شما دریافت و تأیید شد',
      body: 'فروشنده سفارش را دریافت کرده و در حال بسته‌بندی آن است.',
    });
    return updated;
  }

  async submitPackagingEvidence(
    orderId: string,
    itemId: string,
    sellerId: string,
    evidence: SubmitPackagingEvidenceDto,
  ) {
    await this.expireOverdueGuaranteedItem(orderId, itemId);
    const item = await this.getSellerGuaranteedItem(orderId, itemId, sellerId);
    if (item.guaranteeStatus !== 'PACKAGING') {
      throw new BadRequestException('این سفارش در مرحله بسته‌بندی نیست');
    }
    if (evidence.videoDurationSeconds > 15) {
      throw new BadRequestException('مدت ویدیو نباید بیشتر از ۱۵ ثانیه باشد');
    }
    if (this.dataUrlByteLength(evidence.video, 'video') > MAX_VIDEO_BYTES) {
      throw new BadRequestException('حجم ویدیو نباید بیشتر از ۱ مگابایت باشد');
    }
    if (evidence.images.length < 1 || evidence.images.length > 5) {
      throw new BadRequestException('از ۱ تا ۵ عکس بسته‌بندی بارگذاری کنید');
    }
    for (const image of evidence.images) {
      if (this.dataUrlByteLength(image, 'image') > MAX_PROOF_IMAGE_BYTES) {
        throw new BadRequestException('حجم هر عکس نباید بیشتر از ۱۰۰ کیلوبایت باشد');
      }
    }

    const updated = await this.updateGuaranteedItem(orderId, itemId, 'PACKAGING', 'READY_TO_SHIP', {
      packagingVideo: evidence.video,
      packagingImages: evidence.images,
    });
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: 'بسته‌بندی تکمیل شد',
      heading: 'سفارش آماده ارسال است',
      body: 'فروشنده بسته‌بندی سفارش را تکمیل کرده و آن را برای ارسال آماده می‌کند.',
    });
    return updated;
  }

  async sellerMarkShipped(
    orderId: string,
    itemId: string,
    sellerId: string,
    evidence: SubmitShippingEvidenceDto,
  ) {
    await this.expireOverdueGuaranteedItem(orderId, itemId);
    const item = await this.getSellerGuaranteedItem(orderId, itemId, sellerId);
    if (item.guaranteeStatus !== 'READY_TO_SHIP') {
      throw new BadRequestException('ابتدا بسته‌بندی سفارش را تکمیل کنید');
    }
    if (this.dataUrlByteLength(evidence.receipt, 'image') > MAX_PROOF_IMAGE_BYTES) {
      throw new BadRequestException('حجم تصویر بارنامه نباید بیشتر از ۱۰۰ کیلوبایت باشد');
    }
    const now = new Date();
    const updated = await this.updateGuaranteedItem(orderId, itemId, 'READY_TO_SHIP', 'SHIPPED', {
      shippingReceipt: evidence.receipt,
      shippedAt: now,
      guaranteeDeadlineAt: null,
    });
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: 'سفارش ارسال شد',
      heading: 'سفارش شما ارسال شد',
      body: 'فروشنده سفارش را ارسال کرده است. پس از دریافت، تأیید یا گزارش مشکل تا ۷ روز در پنل شما فعال است.',
    });
    return updated;
  }

  private async getBuyerGuaranteedItem(orderId: string, itemId: string, buyerId: string) {
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (item.order.userId !== buyerId) {
      throw new ForbiddenException('این سفارش متعلق به شما نیست');
    }
    return item;
  }

  async buyerCancelItem(orderId: string, itemId: string, buyerId: string) {
    await this.expireOverdueGuaranteedItem(orderId, itemId);
    const item = await this.getBuyerGuaranteedItem(orderId, itemId, buyerId);
    if (item.guaranteeStatus === 'CANCELLED') return item;
    throw new BadRequestException('لغو سفارش پس از پایان مهلت به‌صورت خودکار انجام می‌شود');
  }

  private assertBuyerReviewWindow(item: Awaited<ReturnType<OrdersService['getGuaranteedItem']>>) {
    if (
      item.guaranteeStatus !== 'SHIPPED' ||
      !item.shippedAt ||
      Date.now() > item.shippedAt.getTime() + GUARANTEE_BUYER_REVIEW_MS
    ) {
      throw new BadRequestException(
        'مهلت ۷ روزه بررسی سفارش پایان یافته یا کالا هنوز ارسال نشده است',
      );
    }
  }

  async buyerConfirmItem(orderId: string, itemId: string, buyerId: string) {
    await this.expireOverdueGuaranteedItem(orderId, itemId);
    const item = await this.getBuyerGuaranteedItem(orderId, itemId, buyerId);
    this.assertBuyerReviewWindow(item);
    const updated = await this.updateGuaranteedItem(orderId, itemId, 'SHIPPED', 'SUCCESSFUL');
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: 'دریافت کالا تأیید شد',
      heading: 'معامله تضمینی شما موفقیت‌آمیز شد',
      body: 'دریافت کالا توسط شما تأیید شد. معامله در تاریخچه سفارش‌های شما ثبت شده و واریز وجه به فروشنده در انتظار اقدام ادمین است.',
    });
    if (updated.product.user?.email) {
      const payload = this.buildOrderEmailPayload({
        ...updated.order,
        total: Math.round(updated.price * updated.quantity),
        items: [updated],
      });
      void this.mailService
        .sendBuyerOrderStatusUpdate(
          updated.product.user.email,
          updated.product.user.name,
          payload,
          {
            subjectSuffix: 'معامله تضمینی موفق شد',
            heading: 'معامله تضمینی موفقیت‌آمیز شد',
            body: 'خریدار دریافت کالا را تأیید کرده است. مبلغ خالص پس از کسر کارمزد تضمین، در انتظار واریز ادمین به کیف پول شماست.',
          },
        )
        .catch((err) =>
          this.logger.warn(`Guaranteed success email to seller failed: ${String(err)}`),
        );
    }
    void this.notifyGuaranteedAdmins(
      updated,
      'معامله موفق؛ نیازمند واریز به فروشنده',
      'خریدار دریافت صحیح کالا را تأیید کرد.',
    );
    return updated;
  }

  async buyerReportItem(orderId: string, itemId: string, buyerId: string) {
    await this.expireOverdueGuaranteedItem(orderId, itemId);
    const item = await this.getBuyerGuaranteedItem(orderId, itemId, buyerId);
    this.assertBuyerReviewWindow(item);
    const updated = await this.updateGuaranteedItem(orderId, itemId, 'SHIPPED', 'UNDER_REVIEW');
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: 'گزارش سفارش ثبت شد',
      heading: 'گزارش تخلف در ارسال کالا',
      body: 'برای پیگیری مشکل، ویدیوی کالا و توضیحات خود را برای پشتیبانی جیپو در تلگرام ارسال کنید.',
    });
    void this.notifyGuaranteedAdmins(
      updated,
      'در حال بررسی',
      'خریدار گزارش مشکل در ارسال را ثبت کرد.',
    );
    const supportUsername = SITE_TELEGRAM_SUPPORT.replace(/^@/, '');
    return {
      ...updated,
      supportUrl: `https://t.me/${supportUsername}?text=${encodeURIComponent(`گزارش سفارش ${orderId}، قلم ${itemId}`)}`,
    };
  }

  async adminResolveItem(
    orderId: string,
    itemId: string,
    action: 'PAY_SELLER' | 'APPROVE_CANCEL' | 'UNDER_REVIEW',
    reason?: string,
  ) {
    await this.expireOverdueGuaranteedItem(orderId, itemId);
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (!item.guaranteeStatus) {
      throw new BadRequestException('این کالا هنوز وارد فرایند تضمین نشده است');
    }
    if (action === 'PAY_SELLER') {
      if (item.guaranteeStatus === 'PAID_TO_SELLER') return item;
      if (item.guaranteeStatus !== 'SUCCESSFUL') {
        throw new BadRequestException('واریز به فروشنده فقط پس از موفقیت معامله ممکن است');
      }
      return this.paySuccessfulGuaranteedOrderToSeller(orderId, itemId);
    }

    let next: GuaranteedOrderItemStatus;
    if (action === 'APPROVE_CANCEL') {
      if (!['REFUND_PENDING', 'UNDER_REVIEW'].includes(item.guaranteeStatus ?? '')) {
        throw new BadRequestException('این سفارش در انتظار تأیید لغو یا بررسی نیست');
      }
      next = 'CANCELLED';
    } else {
      if (
        ['PAID_TO_SELLER', 'REFUNDED', 'CANCELLED', 'SUCCESSFUL'].includes(
          item.guaranteeStatus ?? '',
        )
      ) {
        throw new BadRequestException('وضعیت نهایی سفارش قابل بررسی مجدد نیست');
      }
      next = 'UNDER_REVIEW';
    }
    const cancellationReason =
      action === 'APPROVE_CANCEL'
        ? reason?.trim() || 'لغو سفارش پس از بررسی گزارش خریدار توسط ادمین تأیید شد.'
        : undefined;
    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      item.guaranteeStatus,
      next,
      cancellationReason
        ? { guaranteeCancellationReason: cancellationReason, guaranteeDeadlineAt: null }
        : {},
    );
    if (next === 'CANCELLED') {
      await this.syncOrderCancellationStatus(orderId);
      this.notifyGuaranteedCancellation(updated, false);
      void this.notifyGuaranteedAdmins(updated, 'لغو سفارش', cancellationReason ?? 'لغو شد.').catch(
        (err) => this.logger.warn(`Guaranteed cancellation admin alert failed: ${String(err)}`),
      );
      return updated;
    }

    const copy = {
      subjectSuffix: 'سفارش در حال بررسی',
      heading: 'سفارش شما در حال بررسی است',
      body: 'ادمین جیپو در حال بررسی گزارش این سفارش است.',
    };
    this.notifyGuaranteedBuyer(updated, copy);
    return updated;
  }

  private async paySuccessfulGuaranteedOrderToSeller(orderId: string, itemId: string) {
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (item.guaranteeStatus === 'PAID_TO_SELLER' && item.guaranteeSellerPaidAt) {
      return item;
    }
    if (item.guaranteeStatus !== 'SUCCESSFUL') {
      throw new BadRequestException('این معامله موفق نیست یا قبلاً واریز شده است');
    }
    const sellerId = item.product.userId;
    if (!sellerId) throw new BadRequestException('فروشنده این کالا مشخص نیست');

    const grossAmount = Math.round(item.price * item.quantity);
    const feeRate = getGuaranteedOrderFeeRate(item.price);
    const feeAmount = Math.round(grossAmount * feeRate);
    const payoutAmount = grossAmount - feeAmount;
    if (
      !Number.isSafeInteger(grossAmount) ||
      !Number.isSafeInteger(feeAmount) ||
      !Number.isSafeInteger(payoutAmount) ||
      payoutAmount < 0 ||
      payoutAmount > 2_147_483_647
    ) {
      throw new BadRequestException('مبلغ واریز فروشنده معتبر نیست');
    }
    const paidAt = new Date();
    const paid = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.orderItem.updateMany({
        where: {
          id: itemId,
          orderId,
          guaranteeStatus: 'SUCCESSFUL',
          guaranteeSellerPaidAt: null,
        },
        data: {
          guaranteeStatus: 'PAID_TO_SELLER',
          guaranteeStatusChangedAt: paidAt,
          guaranteeSellerPaidAt: paidAt,
          guaranteeSellerFeeAmount: feeAmount,
          guaranteeSellerPayoutAmount: payoutAmount,
        },
      });
      if (!claimed.count) return false;

      const credited = await tx.user.updateMany({
        where: {
          id: sellerId,
          walletBalance: { lte: 2_147_483_647 - payoutAmount },
        },
        data: { walletBalance: { increment: payoutAmount } },
      });
      if (!credited.count) {
        throw new BadRequestException('موجودی کیف پول فروشنده پس از واریز از سقف مجاز بیشتر می‌شود');
      }
      return true;
    });

    if (!paid) {
      const current = await this.getGuaranteedItem(orderId, itemId);
      if (current.guaranteeStatus !== 'PAID_TO_SELLER' || !current.guaranteeSellerPaidAt) {
        throw new ConflictException('وضعیت واریز هم‌زمان تغییر کرده است');
      }
      return current;
    }

    const updated = await this.getGuaranteedItem(orderId, itemId);
    const seller = updated.product.user;
    if (seller?.email) {
      const payload = this.buildOrderEmailPayload({
        ...updated.order,
        total: grossAmount,
        items: [updated],
      });
      void this.mailService
        .sendGuaranteedSellerPayout(seller.email, seller.name, payload, {
          grossAmount,
          feeAmount,
          feePercent: Math.round(feeRate * 100),
          payoutAmount,
        })
        .catch((err) => this.logger.warn(`Guaranteed seller payout email failed: ${String(err)}`));
    } else {
      this.logger.warn(`Order ${orderId}: seller has no email — skip payout email`);
    }
    return updated;
  }

  async extendGuaranteedOrderDeadline(orderId: string, itemId: string, days: number) {
    await this.expireOverdueGuaranteedItem(orderId, itemId);
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (
      !item.guaranteeStatus ||
      !GUARANTEE_ACTIVE_STATUSES.includes(item.guaranteeStatus) ||
      !item.guaranteeDeadlineAt
    ) {
      throw new BadRequestException('تمدید مهلت فقط برای سفارش فعال و در انتظار ارسال ممکن است');
    }
    const now = new Date();
    const result = await this.prisma.orderItem.updateMany({
      where: {
        id: itemId,
        orderId,
        guaranteeStatus: item.guaranteeStatus,
        guaranteeDeadlineAt: { gt: now },
      },
      data: {
        guaranteeDeadlineAt: new Date(
          item.guaranteeDeadlineAt.getTime() + days * 24 * 60 * 60 * 1000,
        ),
      },
    });
    if (!result.count) {
      await this.expireOverdueGuaranteedItem(orderId, itemId);
      throw new ConflictException('مهلت سفارش پایان یافته و سفارش لغو شده است');
    }
    return this.getGuaranteedItem(orderId, itemId);
  }

  async refundGuaranteedOrderToWallet(orderId: string, itemId: string) {
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (item.guaranteeStatus !== 'CANCELLED') {
      throw new BadRequestException('بازپرداخت فقط برای سفارش لغوشده ممکن است');
    }

    if (item.guaranteeWalletRefundedAt) {
      return {
        id: item.id,
        refundAmount: item.guaranteeRefundAmount ?? Math.round(item.price * item.quantity),
        refundedAt: item.guaranteeWalletRefundedAt,
      };
    }

    const refundAmount = Math.round(item.price * item.quantity);
    if (!Number.isSafeInteger(refundAmount) || refundAmount < 0 || refundAmount > 2_147_483_647) {
      throw new BadRequestException('مبلغ بازپرداخت سفارش معتبر نیست');
    }
    const refundedAt = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.orderItem.updateMany({
        where: {
          id: itemId,
          orderId,
          guaranteeStatus: 'CANCELLED',
          guaranteeWalletRefundedAt: null,
        },
        data: {
          guaranteeWalletRefundedAt: refundedAt,
          guaranteeRefundAmount: refundAmount,
        },
      });
      if (!claimed.count) return null;

      const credited = await tx.user.updateMany({
        where: {
          id: item.order.userId,
          walletBalance: { lte: 2_147_483_647 - refundAmount },
        },
        data: { walletBalance: { increment: refundAmount } },
      });
      if (!credited.count) {
        throw new BadRequestException('موجودی کیف پول پس از بازپرداخت از سقف مجاز بیشتر می‌شود');
      }
      return true;
    });

    if (!result) {
      const current = await this.getGuaranteedItem(orderId, itemId);
      if (!current.guaranteeWalletRefundedAt) {
        throw new ConflictException('بازپرداخت سفارش هم‌زمان تغییر کرده است');
      }
      return {
        id: current.id,
        refundAmount: current.guaranteeRefundAmount ?? refundAmount,
        refundedAt: current.guaranteeWalletRefundedAt,
      };
    }

    const refunded = await this.getGuaranteedItem(orderId, itemId);
    this.notifyGuaranteedCancellation(refunded, true);
    return {
      id: item.id,
      refundAmount,
      refundedAt,
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    let order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('شما اجازه مشاهده این سفارش را ندارید');
    }

    await this.expireOverdueGuaranteedItems({ orderId: id });
    order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  private sellerLabel(product: { advertiser: string; user: { name: string } | null }): string {
    if (product.advertiser === 'SHOP') return `فروشگاه ${SITE_NAME_FA}`;
    return product.user?.name ? `فروشنده: ${product.user.name}` : 'فروشنده';
  }

  private buildOrderEmailPayload(order: {
    id: string;
    createdAt: Date;
    total: number;
    paymentMethod: PaymentMethod | null;
    address: string | null;
    phone: string | null;
    note: string | null;
    user: {
      name: string;
      phone: string | null;
      email: string | null;
      city: string | null;
    };
    items: Array<{
      quantity: number;
      price: number;
      product: {
        title: string;
        advertiser: string;
        user: {
          name: string;
          phone: string | null;
          email: string | null;
          city: string | null;
        } | null;
      };
    }>;
  }): OrderEmailPayload {
    return {
      orderId: order.id,
      createdAt: order.createdAt,
      total: order.total,
      paymentMethod: order.paymentMethod,
      address: order.address,
      phone: order.phone,
      note: order.note,
      buyer: {
        name: order.user.name,
        phone: order.user.phone,
        email: order.user.email,
        city: order.user.city,
      },
      items: order.items.map((item) => {
        const seller =
          item.product.advertiser === 'SHOP' || !item.product.user
            ? {
                name: `فروشگاه ${SITE_NAME_FA}`,
                phone: null,
                email: null,
                city: null,
              }
            : {
                name: item.product.user.name,
                phone: item.product.user.phone,
                email: item.product.user.email,
                city: item.product.user.city,
              };

        return {
          title: item.product.title,
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.price * item.quantity,
          sellerLabel: this.sellerLabel(item.product),
          seller,
        };
      }),
    };
  }

  private notifyGuaranteedCancellation(
    item: Awaited<ReturnType<OrdersService['getGuaranteedItem']>>,
    walletRefunded: boolean,
  ) {
    const itemAmount = Math.round(item.price * item.quantity);
    const payload = this.buildOrderEmailPayload({
      ...item.order,
      total: itemAmount,
      items: [item],
    });
    const details = {
      productTitle: item.product.title,
      quantity: item.quantity,
      itemAmount,
      reason: item.guaranteeCancellationReason ?? 'سفارش لغو شده است.',
      walletRefunded,
    };
    const buyerEmail = item.order.user.email;
    if (buyerEmail) {
      void this.mailService
        .sendGuaranteedOrderCancellation(buyerEmail, item.order.user.name, payload, {
          ...details,
          audience: 'buyer',
        })
        .catch((err) =>
          this.logger.warn(`Guaranteed cancellation email to buyer failed: ${String(err)}`),
        );
    } else {
      this.logger.warn(`Order ${item.orderId}: buyer has no email — skip cancellation email`);
    }

    if (!walletRefunded && item.product.user?.email) {
      void this.mailService
        .sendGuaranteedOrderCancellation(item.product.user.email, item.product.user.name, payload, {
          ...details,
          audience: 'seller',
        })
        .catch((err) =>
          this.logger.warn(`Guaranteed cancellation email to seller failed: ${String(err)}`),
        );
    } else if (!walletRefunded) {
      this.logger.warn(`Order ${item.orderId}: seller has no email — skip cancellation email`);
    }
  }

  private async notifyOrderPlaced(order: {
    id: string;
    createdAt: Date;
    total: number;
    paymentMethod: PaymentMethod | null;
    address: string | null;
    phone: string | null;
    note: string | null;
    user: {
      name: string;
      phone: string;
      email: string | null;
      city: string | null;
    };
    items: Array<{
      quantity: number;
      price: number;
      product: {
        title: string;
        advertiser: string;
        user: {
          name: string;
          phone: string;
          email: string | null;
          city: string | null;
        } | null;
      };
    }>;
  }) {
    const payload = this.buildOrderEmailPayload(order);

    const mailTasks: Promise<void>[] = [];

    if (order.user.email) {
      mailTasks.push(
        this.mailService
          .sendBuyerPurchaseSuccess(order.user.email, order.user.name, payload)
          .catch((err) => {
            this.logger.warn(`Buyer email failed: ${String(err)}`);
          }),
      );
    }

    const sellerItems = new Map<
      string,
      { name: string; items: typeof payload.items; buyer: typeof payload.buyer }
    >();
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const line = payload.items[i];
      const email = item.product.user?.email?.toLowerCase();
      if (!email || !line) continue;

      const existing = sellerItems.get(email);
      if (existing) {
        existing.items.push(line);
      } else {
        sellerItems.set(email, {
          name: item.product.user!.name,
          items: [line],
          buyer: payload.buyer,
        });
      }
    }

    for (const [email, seller] of sellerItems) {
      mailTasks.push(
        this.mailService
          .sendSellerProductSold(email, seller.name, payload.orderId, seller.items, seller.buyer)
          .catch((err) => {
            this.logger.warn(`Seller email to ${email} failed: ${String(err)}`);
          }),
      );
    }

    mailTasks.push(
      this.mailService.sendOrderPlaced(ORDER_ADMIN_EMAIL, payload, 'مدیر').catch((err) => {
        this.logger.warn(`Admin order email failed: ${String(err)}`);
      }),
    );

    await Promise.all(mailTasks);
  }

  async create(userId: string, data: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const lines = await this.resolveItems(data.items, userId);
    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        status: 'PENDING',
        address: data.address,
        phone: data.phone ?? user.phone,
        note: data.note,
        paymentMethod: data.paymentMethod,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            price: line.price,
            color: line.color,
          })),
        },
      },
      include: orderInclude,
    });

    return order;
  }

  /**
   * Re-read catalog prices for a pending order before charging the gateway.
   * Ensures Zibal amount always matches current DB prices, not stale cart/client values.
   */
  async refreshPendingOrderPricing(orderId: string, userId: string): Promise<number> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('سفارش یافت نشد');
    if (order.userId !== userId) {
      throw new ForbiddenException('دسترسی به این سفارش مجاز نیست');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException('این سفارش دیگر در انتظار پرداخت نیست');
    }

    const lines = await this.resolveItems(
      order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        color: item.color ?? undefined,
      })),
      userId,
    );
    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const lineByKey = new Map(
      lines.map((line) => [`${line.productId}::${line.color ?? ''}`, line]),
    );

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const line = lineByKey.get(`${item.productId}::${item.color ?? ''}`);
        if (!line) {
          throw new BadRequestException('برخی اقلام سفارش دیگر قابل خرید نیستند');
        }
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            price: line.price,
            quantity: line.quantity,
            color: line.color,
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { total },
      });
    });

    return total;
  }

  async fulfillAfterPayment(
    orderId: string,
    payment: { trackId: string; refNumber: string | null; paidAt: Date },
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existing) throw new NotFoundException('سفارش یافت نشد');
    if (existing.status !== 'PENDING') {
      return this.prisma.order.findUnique({
        where: { id: orderId },
        include: orderInclude,
      });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException('موجودی یکی از محصولات کافی نیست');
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            advertiser: true,
            hasGuarantee: true,
            isAuction: true,
            stockQuantity: true,
          },
        });
        if (product && shouldDeactivateSoldListing(product)) {
          await tx.product.update({
            where: { id: item.productId },
            data: { status: 'DEPRECATED', deprecatedAt: new Date() },
          });
        }
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            guaranteeStatus: product?.hasGuarantee ? 'WAITING_SELLER_CONFIRMATION' : null,
            guaranteeStatusChangedAt: product?.hasGuarantee ? payment.paidAt : null,
            guaranteeDeadlineAt: product?.hasGuarantee
              ? new Date(payment.paidAt.getTime() + GUARANTEE_SELLER_RESPONSE_MS)
              : null,
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paymentTrackId: payment.trackId,
          paymentRefNumber: payment.refNumber,
          paidAt: payment.paidAt,
          statusChangedAt: payment.paidAt,
        },
        include: orderInclude,
      });
    });

    void this.notifyOrderPlaced(order);

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!existing) throw new NotFoundException('سفارش یافت نشد');

    if (
      existing.items.some(
        (item) => item.product.advertiser === 'CLIENT' && item.product.hasGuarantee,
      )
    ) {
      throw new BadRequestException('وضعیت کالاهای تضمینی باید از مسیر جداگانه هر قلم تغییر کند');
    }

    if (existing.status === status) {
      return existing;
    }

    if (!canTransitionOrderStatus(existing.status, status)) {
      throw new BadRequestException(
        `تغییر وضعیت از «${getOrderStatusLabel(existing.status)}» به «${getOrderStatusLabel(status)}» مجاز نیست`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status, statusChangedAt: now },
      include: orderInclude,
    });

    void this.notifyBuyerStatusChange(updated, status as OrderStatusCode);

    return updated;
  }

  /** Orders still needing admin follow-up (for daily digest). */
  async findOrdersNeedingAttention() {
    return this.prisma.order.findMany({
      where: {
        status: { in: [...ORDER_NEEDS_ATTENTION_STATUSES] as OrderStatus[] },
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { select: { id: true } },
      },
      orderBy: [{ statusChangedAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listAdminNotificationEmails(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', email: { not: null } },
      select: { email: true },
    });
    const emails = new Set<string>();
    emails.add(ORDER_ADMIN_EMAIL.toLowerCase());
    for (const admin of admins) {
      if (admin.email) emails.add(admin.email.toLowerCase());
    }
    return [...emails];
  }

  private async notifyBuyerStatusChange(
    order: Parameters<OrdersService['buildOrderEmailPayload']>[0],
    status: OrderStatusCode,
  ) {
    const buyerEmail = order.user.email;
    if (!buyerEmail) {
      this.logger.warn(`Order ${order.id}: buyer has no email — skip status mail`);
      return;
    }

    const payload = this.buildOrderEmailPayload(order);
    const copy = getOrderStatusEmailCopy(status);
    await this.mailService
      .sendBuyerOrderStatusUpdate(buyerEmail, order.user.name, payload, copy)
      .catch((err) => {
        this.logger.warn(`Buyer status email failed for ${order.id}: ${String(err)}`);
      });
  }
}
