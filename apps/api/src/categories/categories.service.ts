import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isAdminApprovalRequiredCategory } from '@offroad/shared';
import { TtlCache } from '../common/ttl-cache';
import { CategoryGroup, LibraryKind } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateCategoryDto,
  CreateLibraryDto,
  UpdateCategoryDto,
  UpdateLibraryDto,
} from './dto';

export type LibraryNode = {
  id: string;
  name: string;
  slug: string;
  kind: 'PART' | 'CAR_BRAND';
  children: LibraryNode[];
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  brandCode: string | null;
  parentId: string | null;
  sortOrder: number;
};

const CAR_BRAND_LABEL_CACHE_TTL_MS = 60_000;
const CATEGORIES_TREE_CACHE_TTL_MS = 30_000;

@Injectable()
export class CategoriesService {
  private carBrandLabelCache: Map<string, string> | null = null;
  private carBrandLabelCacheAt = 0;
  private readonly treeCache = new TtlCache<Awaited<ReturnType<CategoriesService['loadTree']>>>(
    CATEGORIES_TREE_CACHE_TTL_MS,
  );

  constructor(private prisma: PrismaService) {}

  invalidateCaches() {
    this.treeCache.clear();
    this.carBrandLabelCache = null;
    this.carBrandLabelCacheAt = 0;
  }

  private buildPartTree(categories: CategoryRow[]): LibraryNode[] {
    const byParent = new Map<string | null, CategoryRow[]>();
    for (const cat of categories) {
      const key = cat.parentId;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(cat);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fa'));
    }

    const toNode = (cat: CategoryRow): LibraryNode => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      kind: 'PART',
      children: (byParent.get(cat.id) ?? []).map(toNode),
    });

    return (byParent.get(null) ?? []).map(toNode);
  }

  private buildCarBrandTree(categories: CategoryRow[]): LibraryNode[] {
    const byParent = new Map<string | null, CategoryRow[]>();
    for (const cat of categories) {
      const key = cat.parentId;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(cat);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fa'));
    }

    const toNode = (cat: CategoryRow): LibraryNode => {
      const childRows = byParent.get(cat.id) ?? [];
      if (cat.brandCode) {
        return {
          id: cat.brandCode,
          name: cat.name,
          slug: cat.slug,
          kind: 'CAR_BRAND',
          children: [],
        };
      }
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        kind: 'PART',
        children: childRows.map(toNode),
      };
    };

    return (byParent.get(null) ?? []).map(toNode);
  }

  async getCarBrandOptions() {
    const brands = await this.prisma.category.findMany({
      where: { group: CategoryGroup.CAR_BRAND, brandCode: { not: null } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { brandCode: true, name: true },
    });
    return brands.map((b) => ({
      value: b.brandCode!,
      label: b.name,
    }));
  }

  async getCarBrandLabelMap(): Promise<Map<string, string>> {
    const now = Date.now();
    if (this.carBrandLabelCache && now - this.carBrandLabelCacheAt < CAR_BRAND_LABEL_CACHE_TTL_MS) {
      return this.carBrandLabelCache;
    }
    const brands = await this.prisma.category.findMany({
      where: { group: CategoryGroup.CAR_BRAND, brandCode: { not: null } },
      select: { brandCode: true, name: true },
    });
    const map = new Map(brands.map((b) => [b.brandCode!, b.name]));
    this.carBrandLabelCache = map;
    this.carBrandLabelCacheAt = now;
    return map;
  }

  async parseCarBrandCodes(codes?: string[]): Promise<string[]> {
    if (!codes?.length) return [];
    const unique = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
    const existing = await this.prisma.category.findMany({
      where: { brandCode: { in: unique } },
      select: { brandCode: true },
    });
    const valid = new Set(existing.map((b) => b.brandCode!));
    const invalid = unique.filter((c) => !valid.has(c));
    if (invalid.length > 0) {
      throw new BadRequestException('برند خودرو نامعتبر است. فقط از لیست مجاز انتخاب کنید.');
    }
    return unique;
  }

  async findAll() {
    const cached = this.treeCache.get('all');
    if (cached) return cached;
    const result = await this.loadTree();
    this.treeCache.set('all', result);
    return result;
  }

  private async loadTree() {
    const [libraries, parts, carBrandCategories, carBrands] = await Promise.all([
      this.prisma.library.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.category.findMany({
        where: { group: CategoryGroup.PART },
        include: { _count: { select: { products: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.category.findMany({
        where: { group: CategoryGroup.CAR_BRAND },
        select: {
          id: true,
          name: true,
          slug: true,
          brandCode: true,
          parentId: true,
          sortOrder: true,
          libraryId: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.getCarBrandOptions(),
    ]);

    const libraryNodes: LibraryNode[] = libraries.map((lib) => {
      if (lib.kind === LibraryKind.CAR_BRANDS) {
        const libCategories = carBrandCategories.filter((c) => c.libraryId === lib.id);
        return {
          id: lib.id,
          name: lib.name,
          slug: lib.slug,
          kind: 'CAR_BRAND' as const,
          children: this.buildCarBrandTree(libCategories),
        };
      }

      const libCategories = parts.filter((p) => p.libraryId === lib.id);
      return {
        id: lib.id,
        name: lib.name,
        slug: lib.slug,
        kind: 'PART' as const,
        children: this.buildPartTree(libCategories),
      };
    });

    const result = {
      libraries: libraryNodes,
      parts,
      carBrands,
      carBrandCategories: await this.prisma.category.findMany({
        where: { group: CategoryGroup.CAR_BRAND },
        include: {
          _count: { select: { children: true } },
          parent: { select: { id: true, name: true } },
          library: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      libraryRecords: libraries,
    };
    return result;
  }

  async resolveCategoryFilterIds(categoryId: string): Promise<string[]> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: { select: { id: true } } },
    });
    if (!category) return [categoryId];
    if (category.children.length === 0) return [categoryId];
    return [category.id, ...category.children.map((c) => c.id)];
  }

  async categoryRequiresAdminApproval(categoryId: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });
    if (!category) return false;
    return isAdminApprovalRequiredCategory(category.slug);
  }

  /** Product listings must use a leaf category (no subcategories). */
  async assertLeafCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { children: true } } },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    if (category._count.children > 0) {
      throw new BadRequestException('فقط یک زیردسته نهایی قابل انتخاب است');
    }
    return category;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        parent: true,
        library: true,
      },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    return category;
  }

  async create(data: CreateCategoryDto) {
    let libraryId = data.libraryId;
    if (!libraryId && data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
        select: { libraryId: true, group: true },
      });
      libraryId = parent?.libraryId ?? undefined;
      if (!data.group && parent?.group) {
        data.group = parent.group;
      }
    }

    const group = data.group ?? CategoryGroup.PART;

    if (group === CategoryGroup.CAR_BRAND && data.brandCode) {
      const code = data.brandCode.trim().toUpperCase();
      const existing = await this.prisma.category.findUnique({ where: { brandCode: code } });
      if (existing) {
        throw new BadRequestException('این کد برند قبلاً ثبت شده است');
      }
      data.brandCode = code;
    }

    const created = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        group,
        brandCode: data.brandCode ?? null,
        parentId: data.parentId,
        libraryId,
        sortOrder: data.sortOrder ?? 0,
        isSystem: false,
      },
      include: { library: true, parent: true },
    });
    this.invalidateCaches();
    return created;
  }

  async update(id: string, data: UpdateCategoryDto) {
    if (data.brandCode) {
      data.brandCode = data.brandCode.trim().toUpperCase();
      const existing = await this.prisma.category.findFirst({
        where: { brandCode: data.brandCode, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException('این کد برند قبلاً ثبت شده است');
      }
    }

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        // Detach from seed sync so admin edits are not overwritten on next boot/seed.
        ...(category.isSystem ? { isSystem: false } : {}),
      },
      include: { library: true, parent: true },
    });
    this.invalidateCaches();
    return updated;
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    if (category._count.products > 0) {
      throw new BadRequestException('این دسته دارای محصول است و قابل حذف نیست');
    }
    if (category._count.children > 0) {
      throw new BadRequestException('ابتدا زیردسته‌ها را حذف کنید');
    }
    if (category.brandCode) {
      const used = await this.prisma.productCarBrand.count({
        where: { brandCode: category.brandCode },
      });
      if (used > 0) {
        throw new BadRequestException('این برند در محصولات استفاده شده و قابل حذف نیست');
      }
    }
    const deleted = await this.prisma.category.delete({ where: { id } });
    this.invalidateCaches();
    return deleted;
  }

  async createLibrary(data: CreateLibraryDto) {
    const existing = await this.prisma.library.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new BadRequestException('این اسلاگ کتابخانه قبلاً ثبت شده است');
    }
    const created = await this.prisma.library.create({
      data: {
        name: data.name,
        slug: data.slug,
        kind: data.kind,
        sortOrder: data.sortOrder ?? 0,
        isSystem: false,
      },
    });
    this.invalidateCaches();
    return created;
  }

  async updateLibrary(id: string, data: UpdateLibraryDto) {
    const library = await this.prisma.library.findUnique({ where: { id } });
    if (!library) throw new NotFoundException('کتابخانه یافت نشد');

    const updated = await this.prisma.library.update({
      where: { id },
      data: {
        ...data,
        ...(library.isSystem ? { isSystem: false } : {}),
      },
    });
    this.invalidateCaches();
    return updated;
  }

  async removeLibrary(id: string) {
    const library = await this.prisma.library.findUnique({
      where: { id },
      include: { _count: { select: { categories: true } } },
    });
    if (!library) throw new NotFoundException('کتابخانه یافت نشد');
    if (library._count.categories > 0) {
      throw new BadRequestException('ابتدا دسته‌های این کتابخانه را حذف کنید');
    }
    const deleted = await this.prisma.library.delete({ where: { id } });
    this.invalidateCaches();
    return deleted;
  }
}
