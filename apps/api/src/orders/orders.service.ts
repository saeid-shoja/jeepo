import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../prisma/generated/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

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

  async create(data: {
    userId: string;
    items: { productId: string; quantity: number; price: number }[];
    address?: string;
  }) {
    const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return this.prisma.order.create({
      data: {
        userId: data.userId,
        total,
        address: data.address,
        items: {
          create: data.items,
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
    });
  }
}
