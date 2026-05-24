import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        city: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }

  async getUserProducts(userId: string) {
    return this.prisma.product.findMany({
      where: { userId, type: 'CLIENT' },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProfile(userId: string, data: { name?: string; city?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, phone: true, name: true, role: true, city: true },
    });
  }
}
