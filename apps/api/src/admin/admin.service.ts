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
  isAdminApprovalRequiredCategory,
  resolveUserListingLimit,
} from '@offroad/shared';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import type { Advertiser, ProductStatus, UserRole } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeActiveUntil } from '../products/product-lifecycle.constants';
import type { CreateAdminUserDto, UpdateAdminUserDto } from './dto';
import type { AdminProductTab } from './dto/find-admin-products-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
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

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        city: true,
        maxActiveListings: true,
        createdAt: true,
        _count: {
          select: {
            products: { where: { advertiser: 'CLIENT', status: 'ACTIVE' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      city: user.city,
      maxActiveListings: user.maxActiveListings,
      activeListingCount: user._count.products,
      effectiveListingLimit: resolveUserListingLimit(user.maxActiveListings),
      defaultListingLimit: FREE_CLIENT_LISTING_LIMIT,
      createdAt: user.createdAt,
    }));
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
        createdAt: true,
        _count: {
          select: {
            products: { where: { advertiser: 'CLIENT', status: 'ACTIVE' } },
          },
        },
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
      activeListingCount: updated._count.products,
      effectiveListingLimit: resolveUserListingLimit(updated.maxActiveListings),
      defaultListingLimit: FREE_CLIENT_LISTING_LIMIT,
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
        where.category = {
          slug: { in: [...ADMIN_APPROVAL_REQUIRED_CATEGORY_SLUGS] },
        };
        break;
      case 'auction':
        where.isAuction = true;
        break;
      default:
        if (params.advertiser) where.advertiser = params.advertiser;
        if (params.status) where.status = params.status;
    }

    return where;
  }

  async getAllProducts(params: {
    page?: number;
    limit?: number;
    tab?: AdminProductTab;
    advertiser?: Advertiser;
    status?: ProductStatus;
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

  async updateProductStatus(id: string, status: ProductStatus) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        advertiser: true,
        status: true,
        title: true,
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
    if (
      status === 'ACTIVE' &&
      product?.status === 'PENDING' &&
      categorySlug &&
      isAdminApprovalRequiredCategory(categorySlug) &&
      product.user?.email
    ) {
      const productUrl = `${this.webUrl.replace(/\/$/, '')}/product/${id}`;
      await this.mailService
        .sendListingApproved(product.user.email, product.user.name, product.title, productUrl)
        .catch(() => {});
    }

    return updated;
  }
}
