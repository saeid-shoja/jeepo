import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ensureUserReferralCode } from '../common/referrals';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService, productListSelect } from '../products/products.service';
import type { ChangePasswordDto, UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async getProfile(userId: string) {
    const [user, activeListingsCount, totalListingsCount, referralCount, referralCode] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            city: true,
            telegramChatId: true,
            telegramLinkedAt: true,
            boostCredits: true,
            createdAt: true,
          },
        }),
        this.prisma.product.count({ where: { userId, status: 'ACTIVE' } }),
        this.prisma.product.count({ where: { userId } }),
        this.prisma.user.count({ where: { referredById: userId } }),
        ensureUserReferralCode(this.prisma, userId),
      ]);
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    const { telegramChatId, ...profile } = user;
    return {
      ...profile,
      referralCode,
      referralCount,
      telegramLinked: Boolean(telegramChatId),
      activeListingsCount,
      totalListingsCount,
      unlimitedListings: user.role === 'ADMIN',
    };
  }

  async getUserProducts(userId: string) {
    const products = await this.prisma.product.findMany({
      where: { userId },
      select: productListSelect,
      orderBy: [{ listedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return Promise.all(
      products.map((product) =>
        this.productsService.mapProduct(product, { coverImageOnly: true, listPayload: true }),
      ),
    );
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, phone: true, name: true, role: true, city: true },
    });
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('رمز عبور فعلی اشتباه است');
    }

    if (data.currentPassword === data.newPassword) {
      throw new BadRequestException('رمز عبور جدید باید با رمز فعلی متفاوت باشد');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'رمز عبور با موفقیت تغییر کرد' };
  }
}
