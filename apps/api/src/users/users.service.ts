import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  findProvinceNameByCity,
  resolveUserListingLimit,
  shouldShowPublicListingCount,
  USER_ACCOUNT_KIND_LABELS,
} from '@offroad/shared';
import * as bcrypt from 'bcryptjs';
import { ensureUserReferralCode } from '../common/referrals';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService, productListSelect } from '../products/products.service';
import type { ChangePasswordDto, UpdateProfileDto } from './dto';

const PROFILE_SELECT = {
  id: true,
  phone: true,
  name: true,
  role: true,
  city: true,
  nationalId: true,
  nationalIdCardImage: true,
  consentSelfieImage: true,
  shopLicenseImage: true,
  address: true,
  postalCode: true,
  violationReportCount: true,
  accountKind: true,
  verifiedSeller: true,
  rating: true,
  telegramChatId: true,
  telegramLinkedAt: true,
  boostCredits: true,
  maxActiveListings: true,
  createdAt: true,
} as const;

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
          select: PROFILE_SELECT,
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
      accountKindLabel: USER_ACCOUNT_KIND_LABELS[user.accountKind],
      referralCode,
      referralCount,
      telegramLinked: Boolean(telegramChatId),
      activeListingsCount,
      totalListingsCount,
      unlimitedListings: user.role === 'ADMIN',
    };
  }

  /** Public seller card — no secrets (national ID images, etc.). */
  async getPublicSeller(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        address: true,
        accountKind: true,
        verifiedSeller: true,
        rating: true,
        violationReportCount: true,
        maxActiveListings: true,
        createdAt: true,
        role: true,
      },
    });
    if (!user || user.role === 'ADMIN') {
      throw new NotFoundException('فروشنده یافت نشد');
    }

    const activeListingsCount = await this.prisma.product.count({
      where: { userId, status: 'ACTIVE', advertiser: 'CLIENT' },
    });

    const listingCeiling = resolveUserListingLimit(user.maxActiveListings);
    const showListingCount = shouldShowPublicListingCount(listingCeiling);

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      city: user.city,
      province: findProvinceNameByCity(user.city) ?? null,
      address: user.address,
      accountKind: user.accountKind,
      accountKindLabel: USER_ACCOUNT_KIND_LABELS[user.accountKind],
      verifiedSeller: user.verifiedSeller,
      rating: user.rating,
      violationReportCount: user.violationReportCount,
      createdAt: user.createdAt,
      activeListingsCount: showListingCount ? activeListingsCount : null,
      listingCeiling,
      showListingCount,
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
    const updateData: Record<string, unknown> = {};
    const keys = [
      'name',
      'city',
      'nationalId',
      'nationalIdCardImage',
      'consentSelfieImage',
      'shopLicenseImage',
      'address',
      'postalCode',
      'accountKind',
    ] as const;
    for (const key of keys) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          city: true,
          nationalId: true,
          nationalIdCardImage: true,
          consentSelfieImage: true,
          shopLicenseImage: true,
          address: true,
          postalCode: true,
          accountKind: true,
          verifiedSeller: true,
          rating: true,
          violationReportCount: true,
        },
      });
    } catch {
      throw new BadRequestException('به‌روزرسانی پروفایل ناموفق بود');
    }
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
