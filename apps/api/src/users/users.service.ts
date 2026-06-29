import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import type { UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        city: true,
        telegramId: true,
        telegramChatId: true,
        telegramLinkedAt: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    const { telegramChatId, ...profile } = user;
    return {
      ...profile,
      telegramLinked: Boolean(telegramChatId),
    };
  }

  async getUserProducts(userId: string) {
    const products = await this.prisma.product.findMany({
      where: { userId, advertiser: 'CLIENT' },
      include: { category: true, carBrands: true },
      orderBy: [{ listedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return Promise.all(products.map((product) => this.productsService.mapProduct(product)));
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const { telegramId, ...rest } = data;
    const updateData = {
      ...rest,
      ...(telegramId !== undefined ? { telegramId } : {}),
    };

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, phone: true, name: true, role: true, city: true, telegramId: true },
    });
  }
}
