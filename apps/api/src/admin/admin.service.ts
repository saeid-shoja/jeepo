import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ADMIN_APPROVAL_REQUIRED_CATEGORY_SLUGS,
  FREE_CLIENT_LISTING_LIMIT,
  FREE_CLIENT_NEW_LISTING_LIMIT,
  isAdminApprovalRequiredCategory,
  resolveUserListingLimit,
  resolveUserNewListingLimit,
  toEnglishDigits,
} from '@offroad/shared';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import type { Advertiser, ProductStatus, UserRole } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeActiveUntil } from '../products/product-lifecycle.constants';
import { ProductsService } from '../products/products.service';
import { TelegramChannelService } from '../telegram/telegram-channel.service';
import type { CreateAdminUserDto, SetProductsGuaranteeDto, UpdateAdminUserDto } from './dto';
import type { AdminProductTab } from './dto/find-admin-products-query.dto';

function normalizeAdminSearch(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return toEnglishDigits(trimmed);
}
@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private telegramChannel: TelegramChannelService,
    private productsService: ProductsService,
    @Inject('WEB_URL') private readonly webUrl: string,
  ) {}

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

  async getAllUsers(params: { search?: string; page?: number; limit?: number } = {}) {
    const search = normalizeAdminSearch(params.search);
    const page = params.page || 1;
    const limit = params.limit || 24;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : undefined;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          email: true,
          name: true,
          role: true,
          city: true,
          maxActiveListings: true,
          maxActiveNewListings: true,
          createdAt: true,
          _count: {
            select: {
              products: { where: { advertiser: 'CLIENT', status: 'ACTIVE' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);
    const newCounts =
      userIds.length === 0
        ? []
        : await this.prisma.product.groupBy({
            by: ['userId'],
            where: {
              userId: { in: userIds },
              advertiser: 'CLIENT',
              status: 'ACTIVE',
              situation: 'NEW',
            },
            _count: { _all: true },
          });
    const newCountByUser = new Map(newCounts.map((row) => [row.userId!, row._count._all] as const));

    const mapped = users.map((user) => ({
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      city: user.city,
      maxActiveListings: user.maxActiveListings,
      maxActiveNewListings: user.maxActiveNewListings,
      activeListingCount: user._count.products,
      activeNewListingCount: newCountByUser.get(user.id) ?? 0,
      effectiveListingLimit: resolveUserListingLimit(user.maxActiveListings),
      effectiveNewListingLimit: resolveUserNewListingLimit(user.maxActiveNewListings),
      defaultListingLimit: FREE_CLIENT_LISTING_LIMIT,
      defaultNewListingLimit: FREE_CLIENT_NEW_LISTING_LIMIT,
      createdAt: user.createdAt,
    }));

    return {
      users: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async createUser(data: CreateAdminUserDto) {
    const existingPhone = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone) {
      throw new ConflictException('این شماره موبایل قبلاً ثبت شده است');
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException('این ایمیل قبلاً ثبت شده است');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        phone: data.phone,
        email: data.email.toLowerCase(),
        name: data.name,
        password: hashedPassword,
        city: data.city,
        role: data.role ?? 'CLIENT',
        maxActiveListings: data.maxActiveListings ?? null,
        maxActiveNewListings: data.maxActiveNewListings ?? null,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        city: true,
        createdAt: true,
      },
    });
  }

  async updateUser(id: string, data: UpdateAdminUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    if (data.phone && data.phone !== user.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) throw new ConflictException('این شماره موبایل قبلاً ثبت شده است');
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (existing) throw new ConflictException('این ایمیل قبلاً ثبت شده است');
    }

    if (data.role === 'CLIENT' && user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new BadRequestException('حداقل یک مدیر باید در سیستم باقی بماند');
      }
    }

    const updateData: {
      phone?: string;
      email?: string;
      name?: string;
      city?: string | null;
      role?: UserRole;
      password?: string;
      maxActiveListings?: number | null;
      maxActiveNewListings?: number | null;
    } = {};

    if (data.phone) updateData.phone = data.phone;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.name) updateData.name = data.name;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.role) updateData.role = data.role;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12);
    if (data.maxActiveListings !== undefined) {
      updateData.maxActiveListings = data.maxActiveListings;
    }
    if (data.maxActiveNewListings !== undefined) {
      updateData.maxActiveNewListings = data.maxActiveNewListings;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        city: true,
        maxActiveListings: true,
        maxActiveNewListings: true,
        createdAt: true,
        _count: {
          select: {
            products: { where: { advertiser: 'CLIENT', status: 'ACTIVE' } },
          },
        },
      },
    });

    const activeNewListingCount = await this.prisma.product.count({
      where: {
        userId: updated.id,
        advertiser: 'CLIENT',
        status: 'ACTIVE',
        situation: 'NEW',
      },
    });

    return {
      id: updated.id,
      phone: updated.phone,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      city: updated.city,
      maxActiveListings: updated.maxActiveListings,
      maxActiveNewListings: updated.maxActiveNewListings,
      activeListingCount: updated._count.products,
      activeNewListingCount,
      effectiveListingLimit: resolveUserListingLimit(updated.maxActiveListings),
      effectiveNewListingLimit: resolveUserNewListingLimit(updated.maxActiveNewListings),
      defaultListingLimit: FREE_CLIENT_LISTING_LIMIT,
      defaultNewListingLimit: FREE_CLIENT_NEW_LISTING_LIMIT,
      createdAt: updated.createdAt,
    };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new BadRequestException('حداقل یک مدیر باید در سیستم باقی بماند');
      }
    }

    return this.prisma.user.delete({ where: { id } });
  }

  private buildAdminProductsWhere(params: {
    tab?: AdminProductTab;
    advertiser?: Advertiser;
    status?: ProductStatus;
    search?: string;
  }) {
    const where: Record<string, unknown> = {};

    switch (params.tab) {
      case 'shop':
        where.advertiser = 'SHOP';
        break;
      case 'client':
        where.advertiser = 'CLIENT';
        where.isAuction = false;
        break;
      case 'pending_approval':
        where.status = 'PENDING';
        where.listingFeePaid = true;
        where.OR = [
          { category: { slug: { in: [...ADMIN_APPROVAL_REQUIRED_CATEGORY_SLUGS] } } },
          { hasGuarantee: true },
        ];
        break;
      case 'auction':
        where.isAuction = true;
        break;
      default:
        if (params.advertiser) where.advertiser = params.advertiser;
        if (params.status) where.status = params.status;
    }

    const search = normalizeAdminSearch(params.search);
    if (search) {
      const searchOr = [
        { title: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    return where;
  }

  async getAllProducts(params: {
    page?: number;
    limit?: number;
    tab?: AdminProductTab;
    advertiser?: Advertiser;
    status?: ProductStatus;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where = this.buildAdminProductsWhere(params);

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

  async getUserProducts(userId: string, params: { page?: number; limit?: number } = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true, email: true, city: true },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where = { userId };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      user,
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        advertiser: true,
        status: true,
        situation: true,
        title: true,
        userId: true,
        hasGuarantee: true,
        user: { select: { name: true, email: true } },
        category: { select: { slug: true } },
      },
    });

    const data: {
      status: ProductStatus;
      activeUntil?: Date;
      deprecatedAt?: Date | null;
      listedAt?: Date;
    } = { status };

    if (status === 'ACTIVE' && product?.advertiser === 'CLIENT') {
      if (product.status !== 'ACTIVE' && product.userId) {
        await this.productsService.assertNewListingQuota(product.userId, product.situation);
      }
      data.activeUntil = computeActiveUntil();
      data.deprecatedAt = null;
      if (product.status === 'DEPRECATED' || product.status === 'PENDING') {
        data.listedAt = new Date();
      }
    } else if (status === 'DEPRECATED') {
      data.deprecatedAt = new Date();
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    const categorySlug = product?.category?.slug;
    const needsSellerApprovalEmail =
      status === 'ACTIVE' &&
      product?.status === 'PENDING' &&
      product.user?.email &&
      (Boolean(product.hasGuarantee) ||
        (categorySlug != null && isAdminApprovalRequiredCategory(categorySlug)));

    if (needsSellerApprovalEmail && product.user?.email) {
      const productUrl = `${this.webUrl.replace(/\/$/, '')}/product/${id}`;
      await this.mailService
        .sendListingApproved(product.user.email, product.user.name, product.title, productUrl)
        .catch(() => {});
    }

    if (status === 'ACTIVE' && product?.status === 'PENDING') {
      this.telegramChannel.announceProductActive(id);
    }

    this.productsService.invalidateListCache();
    return updated;
  }

  async announceBestPrice(productIds: string[]) {
    if (!this.telegramChannel.isChannelConfigured()) {
      throw new BadRequestException('کانال تلگرام پیکربندی نشده است');
    }

    const uniqueIds = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('حداقل یک محصول را انتخاب کنید');
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueIds }, status: 'ACTIVE' },
      select: { id: true, title: true },
    });

    const foundIds = new Set(products.map((p) => p.id));
    const skipped = uniqueIds.filter((id) => !foundIds.has(id));

    let sent = 0;
    const failed: Array<{ id: string; title: string }> = [];

    for (const product of products) {
      try {
        await this.telegramChannel.announceBestPrice(product.id);
        sent += 1;
      } catch {
        failed.push({ id: product.id, title: product.title });
      }
    }

    return {
      sent,
      failed: failed.length,
      skipped: skipped.length,
      failedProducts: failed,
      skippedIds: skipped,
    };
  }

  /**
   * Admin-only: set hasGuarantee on CLIENT (non-auction) listings.
   * Scope: one product, all listings in a category tree, or all listings of a user.
   */
  async setProductsGuarantee(dto: SetProductsGuaranteeDto) {
    const scopes = [dto.productId, dto.categoryId, dto.userId].filter(Boolean);
    if (scopes.length !== 1) {
      throw new BadRequestException(
        'دقیقاً یکی از فیلدهای productId، categoryId یا userId را ارسال کنید',
      );
    }

    const where: {
      advertiser: 'CLIENT';
      isAuction: false;
      id?: string;
      userId?: string;
      categoryId?: { in: string[] };
    } = {
      advertiser: 'CLIENT',
      isAuction: false,
    };

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
        select: { id: true, advertiser: true, isAuction: true },
      });
      if (!product) throw new NotFoundException('محصول یافت نشد');
      if (product.advertiser !== 'CLIENT' || product.isAuction) {
        throw new BadRequestException('تضمین جیپو فقط برای آگهی‌های کاربری غیرمزایده است');
      }
      where.id = dto.productId;
    } else if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true },
      });
      if (!user) throw new NotFoundException('کاربر یافت نشد');
      where.userId = dto.userId;
    } else if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true },
      });
      if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
      where.categoryId = { in: await this.collectCategoryIds(dto.categoryId) };
    }

    const result = await this.prisma.product.updateMany({
      where,
      data: { hasGuarantee: dto.enabled },
    });

    this.productsService.invalidateListCache();
    return { updated: result.count };
  }

  /** Category id + all descendant category ids. */
  private async collectCategoryIds(rootId: string): Promise<string[]> {
    const rows = await this.prisma.category.findMany({
      select: { id: true, parentId: true },
    });
    const childrenByParent = new Map<string, string[]>();
    for (const row of rows) {
      if (!row.parentId) continue;
      const list = childrenByParent.get(row.parentId) ?? [];
      list.push(row.id);
      childrenByParent.set(row.parentId, list);
    }

    const ids: string[] = [];
    const stack = [rootId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      ids.push(id);
      for (const childId of childrenByParent.get(id) ?? []) {
        stack.push(childId);
      }
    }
    return ids;
  }
}
