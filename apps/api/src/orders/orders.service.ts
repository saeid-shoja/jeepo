import {
  BadRequestException,
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
} from '@offroad/shared';
import { getProductSalePrice, isPurchasableProduct } from '../common/purchasable';
import type { OrderEmailPayload } from '../mail/mail.service';
import { MailService } from '../mail/mail.service';
import type { OrderStatus, PaymentMethod } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrderDto, OrderItemDto, PreviewOrderDto } from './dto';

type ResolvedLine = {
  productId: string;
  quantity: number;
  price: number;
  title: string;
  image: string | null;
  color: string | null;
};

const orderInclude = {
  user: { select: { id: true, name: true, phone: true, email: true, city: true } },
  items: {
    include: {
      product: {
        include: {
          user: { select: { id: true, name: true, phone: true, email: true, city: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
} as const;

const ORDER_ADMIN_EMAIL = SITE_EMAIL;

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
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('شما اجازه مشاهده این سفارش را ندارید');
    }

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
          data: { price: line.price, quantity: line.quantity, color: line.color },
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
