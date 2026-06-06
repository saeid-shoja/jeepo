import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { getAuctionCurrentPrice, isAuctionActive } from '../common/auction';
import { isPurchasableProduct } from '../common/purchasable';
import type { Advertiser, ProductSituation } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProductDto, UpdateProductDto } from './dto';

const productInclude = {
  category: true,
  user: { select: { name: true, city: true } },
  carBrands: true,
  _count: { select: { auctionBids: true } },
};

const productIncludeDetail = {
  category: true,
  user: { select: { id: true, name: true, phone: true, city: true } },
  carBrands: true,
  _count: { select: { auctionBids: true } },
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
  ) {}

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

  async mapProduct<
    T extends {
      images: string;
      carBrands?: { brandCode: string }[];
      advertiser: Advertiser;
      hasGuarantee: boolean;
      status: string;
      situation?: ProductSituation | null;
      isAuction?: boolean;
      auctionStartPrice?: number | null;
      auctionCurrentPrice?: number | null;
      buyNowPrice?: number | null;
      realPriceMin?: number | null;
      realPriceMax?: number | null;
      auctionEndsAt?: Date | null;
      price: number;
      _count?: { auctionBids: number };
    },
  >(product: T) {
    const brandLabels = await this.categoriesService.getCarBrandLabelMap();
    const brands = product.carBrands?.map((row) => row.brandCode) ?? [];
    const isAuction = Boolean(product.isAuction);
    const startPrice = product.auctionStartPrice ?? product.price;
    const currentPrice = isAuction
      ? getAuctionCurrentPrice(startPrice, product.auctionCurrentPrice)
      : product.price;
    const auctionActive =
      isAuction &&
      product.auctionEndsAt != null &&
      isAuctionActive(product.auctionEndsAt) &&
      product.status === 'ACTIVE';

    const mapped: Record<string, unknown> = {
      ...product,
      images: JSON.parse(product.images),
      carBrands: brands.map((brand) => ({
        value: brand,
        label: brandLabels.get(brand) ?? brand,
      })),
      situation: product.advertiser === 'SHOP' ? 'IN_STOCK' : (product.situation ?? null),
      /** @deprecated use advertiser — kept for existing web clients */
      type: product.advertiser,
      purchasable: isPurchasableProduct({
        advertiser: product.advertiser,
        hasGuarantee: product.hasGuarantee,
        status: product.status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
        isAuction,
        buyNowPrice: product.buyNowPrice,
        auctionEndsAt: product.auctionEndsAt,
      }),
      isAuction,
      auctionStartPrice: product.auctionStartPrice,
      auctionCurrentPrice: currentPrice,
      buyNowPrice: product.buyNowPrice,
      realPriceMin: product.realPriceMin,
      realPriceMax: product.realPriceMax,
      auctionEndsAt: product.auctionEndsAt,
      auctionActive,
      bidCount: product._count?.auctionBids ?? 0,
      displayPrice: isAuction ? currentPrice : product.price,
      hideSellerPhone: isAuction,
    };

    if (isAuction) {
      mapped.price = currentPrice;
    }

    delete mapped._count;
    return mapped;
  }

  async findAll(params: {
    advertiser?: string;
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
    situation?: ProductSituation;
    hasGuarantee?: boolean;
    auction?: boolean;
    auctionActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 30;
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };

    if (params.advertiser) where.advertiser = params.advertiser;
    if (params.advertiser === 'CLIENT' && params.auction !== true) {
      where.isAuction = false;
    }
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
      const brands = await this.categoriesService.parseCarBrandCodes([params.carBrand]);
      if (brands.length) {
        where.carBrands = { some: { brandCode: brands[0] } };
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
    if (params.situation === 'NEW') {
      if (params.advertiser === 'CLIENT') {
        where.situation = 'NEW';
      } else if (params.advertiser !== 'SHOP') {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          { OR: [{ situation: 'NEW' }, { advertiser: 'SHOP' }] },
        ];
      }
    } else if (params.situation === 'USED') {
      where.situation = 'USED';
    }
    if (params.hasGuarantee === true) {
      where.hasGuarantee = true;
    } else if (params.hasGuarantee === false) {
      where.hasGuarantee = false;
    }

    if (params.auction === true) {
      where.isAuction = true;
    }

    if (params.auctionActive === true) {
      where.isAuction = true;
      where.status = 'ACTIVE';
      where.auctionEndsAt = { gt: new Date() };
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
      products: await Promise.all(products.map((p) => this.mapProduct(p))),
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

  private buildAuctionCreateData(data: CreateProductDto) {
    if (!data.isAuction) return {};

    const start = data.auctionStartPrice ?? data.price;
    const endsAt = data.auctionEndsAt ? new Date(data.auctionEndsAt) : null;

    if (!endsAt || endsAt.getTime() <= Date.now()) {
      throw new BadRequestException('زمان پایان مزایده باید در آینده باشد');
    }

    if (
      data.realPriceMin != null &&
      data.realPriceMax != null &&
      data.realPriceMin > data.realPriceMax
    ) {
      throw new BadRequestException('حداقل قیمت واقعی نمی‌تواند بیشتر از حداکثر باشد');
    }

    return {
      isAuction: true,
      auctionStartPrice: start,
      auctionCurrentPrice: start,
      price: start,
      buyNowPrice: data.buyNowPrice ?? null,
      realPriceMin: data.realPriceMin ?? null,
      realPriceMax: data.realPriceMax ?? null,
      auctionEndsAt: endsAt,
      phone: null,
    };
  }

  async create(data: CreateProductDto, userId?: string) {
    const brands = await this.categoriesService.parseCarBrandCodes(data.carBrands);
    const auctionData = this.buildAuctionCreateData(data);
    const listingPrice = data.isAuction ? (data.auctionStartPrice ?? data.price) : data.price;

    const product = await this.prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: listingPrice,
        images: JSON.stringify(data.images || []),
        categoryId: data.categoryId,
        hasGuarantee: data.isAuction ? false : data.hasGuarantee || false,
        isBoosted: data.isBoosted || false,
        city: data.city,
        phone: data.isAuction ? undefined : data.phone,
        advertiser: data.advertiser ?? 'CLIENT',
        situation: data.situation,
        userId: userId || null,
        ...auctionData,
        carBrands: brands.length
          ? { create: brands.map((brandCode) => ({ brandCode })) }
          : undefined,
      },
      include: productIncludeDetail,
    });
    return this.mapProduct(product);
  }

  async update(id: string, data: UpdateProductDto, userId?: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    if (product.advertiser === 'CLIENT' && product.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('شما اجازه ویرایش این محصول را ندارید');
    }

    const updateData: any = { ...data };
    delete updateData.carBrands;
    if (updateData.type != null && updateData.advertiser == null) {
      updateData.advertiser = updateData.type;
      delete updateData.type;
    }
    if (data.images) updateData.images = JSON.stringify(data.images);
    if (data.auctionEndsAt) updateData.auctionEndsAt = new Date(data.auctionEndsAt);
    if (data.auctionStartPrice != null && product.isAuction) {
      updateData.auctionStartPrice = data.auctionStartPrice;
    }

    if (data.carBrands !== undefined) {
      const brands = await this.categoriesService.parseCarBrandCodes(data.carBrands);
      await this.prisma.productCarBrand.deleteMany({ where: { productId: id } });
      if (brands.length > 0) {
        updateData.carBrands = {
          create: brands.map((brandCode) => ({ brandCode })),
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

    if (product.advertiser === 'CLIENT' && product.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('شما اجازه حذف این محصول را ندارید');
    }

    return this.prisma.product.delete({ where: { id } });
  }
}
