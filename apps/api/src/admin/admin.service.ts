import { Injectable } from '@nestjs/common';
import type { Advertiser, ProductStatus } from '../prisma/generated/client';
import type { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [products, clientProducts, orders, users] = await Promise.all([
      this.prisma.product.count({ where: { advertiser: 'SHOP' } }),
      this.prisma.product.count({ where: { advertiser: 'CLIENT' } }),
      this.prisma.order.count(),
      this.prisma.user.count(),
    ]);

    const recentProducts = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { category: true, user: { select: { name: true } } },
    });

    const recentOrders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true } },
        items: { include: { product: true } },
      },
    });

    return {
      stats: { products, clientProducts, orders, users },
      recentProducts: recentProducts.map((p: { images: string }) => ({
        ...p,
        images: JSON.parse(p.images),
      })),
      recentOrders,
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: { id: true, phone: true, name: true, role: true, city: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllProducts(params: {
    page?: number;
    limit?: number;
    advertiser?: Advertiser;
    status?: ProductStatus;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.advertiser) where.advertiser = params.advertiser;
    if (params.status) where.status = params.status;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, user: { select: { name: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p: { images: string }) => ({
        ...p,
        images: JSON.parse(p.images),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateProductStatus(id: string, status: ProductStatus) {
    return this.prisma.product.update({
      where: { id },
      data: { status },
    });
  }
}
