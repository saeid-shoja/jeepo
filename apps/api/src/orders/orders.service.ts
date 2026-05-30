import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getProductSalePrice, isPurchasableProduct } from '../common/purchasable';
import type { OrderStatus } from '../prisma/generated/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateOrderDto, OrderItemDto, PreviewOrderDto } from './dto';

type ResolvedLine = {
  productId: string;
  quantity: number;
  price: number;
  title: string;
  image: string | null;
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async resolveItems(items: OrderItemDto[]): Promise<ResolvedLine[]> {
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
    const lines = await this.resolveItems(data.items);
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

  async create(userId: string, data: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const lines = await this.resolveItems(data.items);
    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

    return this.prisma.order.create({
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
      include: {
        items: { include: { product: true } },
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
