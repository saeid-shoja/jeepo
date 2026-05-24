import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CarBrand, ProductType } from '../prisma/generated/client';
import { getCarBrandLabel, parseCarBrands } from '../common/car-brands';

const productInclude = {
  category: true,
  user: { select: { name: true, city: true } },
  carBrands: true,
};

const productIncludeDetail = {
  category: true,
  user: { select: { id: true, name: true, phone: true, city: true } },
  carBrands: true,
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private postedSince(postedWithin: string): Date | null {
    const now = Date.now();
    const hours: Record<string, number> = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    };
    const h = hours[postedWithin];
    if (!h) return null;
    return new Date(now - h * 60 * 60 * 1000);
  }

  private mapProduct<
    T extends {
      images: string;
      carBrands?: { brand: CarBrand }[];
      type?: string;
      createdAt?: Date;
    },
  >(product: T) {
    const brands = product.carBrands?.map((row) => row.brand) ?? [];
    const createdAt = product.createdAt ? new Date(product.createdAt) : null;
    const isNew =
      createdAt != null &&
      Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;
    return {
      ...product,
      images: JSON.parse(product.images),
      carBrands: brands.map((brand) => ({
        value: brand,
        label: getCarBrandLabel(brand),
      })),
      situation:
        product.type === 'SHOP'
          ? 'IN_STOCK'
          : isNew
            ? 'NEW'
            : null,
    };
  }

  async findAll(params: {
    type?: string;
    categoryId?: string;
    carBrand?: string;
    search?: string;
    page?: number;
    limit?: number;
    city?: string;
    cities?: string[];
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    postedWithin?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 30;
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };

    if (params.type) where.type = params.type;
    if (params.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: params.categoryId },
        include: { children: { select: { id: true } } },
      });
      if (category?.children.length) {
        where.categoryId = {
          in: [category.id, ...category.children.map((c) => c.id)],
        };
      } else {
        where.categoryId = params.categoryId;
      }
    }
    if (params.cities?.length) {
      where.city = { in: params.cities };
    } else if (params.city) {
      where.city = params.city;
    }
    if (params.carBrand) {
      const brands = parseCarBrands([params.carBrand]);
      if (brands.length) {
        where.carBrands = { some: { brand: brands[0] } };
      }
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.minPrice != null || params.maxPrice != null) {
      where.price = {};
      if (params.minPrice != null) where.price.gte = params.minPrice;
      if (params.maxPrice != null) where.price.lte = params.maxPrice;
    }
    if (params.postedWithin) {
      const since = this.postedSince(params.postedWithin);
      if (since) where.createdAt = { gte: since };
    }

    const orderBy: any = [{ isBoosted: 'desc' }, { createdAt: 'desc' }];

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p: { images: string; carBrands?: { brand: CarBrand }[] }) =>
        this.mapProduct(p),
      ),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productIncludeDetail,
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    return this.mapProduct(product);
  }

  async create(
    data: {
      title: string;
      description: string;
      price: number;
      images: string[];
      categoryId: string;
      carBrands?: string[];
      hasGuarantee?: boolean;
      isBoosted?: boolean;
      city?: string;
      phone?: string;
      type?: string;
    },
    userId?: string,
  ) {
    const brands = parseCarBrands(data.carBrands);

    const product = await this.prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        images: JSON.stringify(data.images || []),
        categoryId: data.categoryId,
        hasGuarantee: data.hasGuarantee || false,
        isBoosted: data.isBoosted || false,
        city: data.city,
        phone: data.phone,
        type: (data.type as ProductType) || 'CLIENT',
        userId: userId || null,
        carBrands: brands.length
          ? { create: brands.map((brand) => ({ brand })) }
          : undefined,
      },
      include: productIncludeDetail,
    });
    return this.mapProduct(product);
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      images?: string[];
      categoryId?: string;
      carBrands?: string[];
      hasGuarantee?: boolean;
      isBoosted?: boolean;
      status?: string;
      city?: string;
      phone?: string;
    },
    userId?: string,
    userRole?: string,
  ) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (product.type === 'CLIENT' && product.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('شما اجازه ویرایش این محصول را ندارید');
    }

    const updateData: any = { ...data };
    delete updateData.carBrands;
    if (data.images) updateData.images = JSON.stringify(data.images);

    if (data.carBrands !== undefined) {
      const brands = parseCarBrands(data.carBrands);
      await this.prisma.productCarBrand.deleteMany({ where: { productId: id } });
      if (brands.length > 0) {
        updateData.carBrands = {
          create: brands.map((brand) => ({ brand })),
        };
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: productIncludeDetail,
    });
    return this.mapProduct(updated);
  }

  async remove(id: string, userId?: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (product.type === 'CLIENT' && product.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('شما اجازه حذف این محصول را ندارید');
    }

    return this.prisma.product.delete({ where: { id } });
  }
}
