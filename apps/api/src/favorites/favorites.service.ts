import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class FavoritesService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async getProductIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { productId: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.productId);
  }

  async listProducts(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            carBrands: true,
            _count: { select: { auctionBids: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const active = favorites.filter((row) => row.product.status === 'ACTIVE');

    return Promise.all(
      active.map((row) =>
        this.productsService.mapProduct(row.product, { viewerUserId: userId }),
      ),
    );
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    await this.prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return { productId, favorited: true };
  }

  async remove(userId: string, productId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, productId } });
    return { productId, favorited: false };
  }
}
