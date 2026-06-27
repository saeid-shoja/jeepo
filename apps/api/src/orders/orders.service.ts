import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SITE_NAME_FA } from '@offroad/shared';
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
};

const orderInclude = {
  user: { select: { id: true, name: true, phone: true, email: true, city: true } },
  items: {
    include: {
      product: {
        include: {
          user: { select: { id: true, name: true, phone: true, email: true, city: true } },
        },
      },
    },
  },
} as const;

const ORDER_ADMIN_EMAIL = 'jeepoinfo@gmail.com';

/** Remove sold client listings (تضمین فروشگاه) and auctions from public lists. */
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

    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('برخی محصولات یافت نشدند');
    }

    const byId = new Map(products.map((p) => [p.id, p]));
    const lines: ResolvedLine[] = [];

    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product) {
        throw new BadRequestException('محصول یافت نشد');
      }
      if (!isPurchasableProduct(product)) {
        throw new BadRequestException(`محصول «${product.title}» قابل خرید آنلاین نیست`);
      }
      if (buyerId && product.userId === buyerId && product.hasGuarantee) {
        throw new BadRequestException('نمی‌توانید آگهی تضمین‌شده خود را خریداری کنید');
      }

      const available = product.stockQuantity ?? 1;
      if (item.quantity > available) {
        throw new BadRequestException(
          `موجودی «${product.title}» کافی نیست (حداکثر ${available} عدد)`,
        );
      }
      if (item.quantity < 1) {
        throw new BadRequestException('تعداد باید حداقل ۱ باشد');
      }

      const images: string[] = JSON.parse(product.images || '[]');
      lines.push({
        productId: product.id,
        quantity: item.quantity,
        price: getProductSalePrice(product),
        title: product.title,
        image: images[0] ?? null,
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
      })),
      subtotal,
      total: subtotal,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    };
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { product: true } },
      },
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
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('شما اجازه مشاهده این سفارش را ندارید');
    }

    return order;
  }

  private sellerLabel(product: {
    advertiser: string;
    user: { name: string } | null;
  }): string {
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
        this.mailService.sendBuyerPurchaseSuccess(order.user.email, order.user.name, payload).catch(
          (err) => {
            this.logger.warn(`Buyer email failed: ${String(err)}`);
          },
        ),
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

    const order = await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stockQuantity: { gte: line.quantity } },
          data: { stockQuantity: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException('موجودی یکی از محصولات کافی نیست');
        }

        const product = await tx.product.findUnique({
          where: { id: line.productId },
          select: {
            advertiser: true,
            hasGuarantee: true,
            isAuction: true,
            stockQuantity: true,
          },
        });
        if (product && shouldDeactivateSoldListing(product)) {
          await tx.product.update({
            where: { id: line.productId },
            data: { status: 'DEPRECATED', deprecatedAt: new Date() },
          });
        }
      }

      return tx.order.create({
        data: {
          userId,
          total,
          address: data.address,
          phone: data.phone ?? user.phone,
          note: data.note,
          paymentMethod: data.paymentMethod,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              price: line.price,
            })),
          },
        },
        include: orderInclude,
      });
    });

    void this.notifyOrderPlaced(order);

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
