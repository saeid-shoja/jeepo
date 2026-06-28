import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isAdminApprovalRequiredCategory } from '@offroad/shared';
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

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

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
    const brands = await this.prisma.category.findMany({
      where: { group: CategoryGroup.CAR_BRAND, brandCode: { not: null } },
      select: { brandCode: true, name: true },
    });
    return new Map(brands.map((b) => [b.brandCode!, b.name]));
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

    return {
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

    return this.prisma.category.create({
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

    return this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        // Detach from seed sync so admin edits are not overwritten on next boot/seed.
        ...(category.isSystem ? { isSystem: false } : {}),
      },
      include: { library: true, parent: true },
    });
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
    return this.prisma.category.delete({ where: { id } });
  }

  async createLibrary(data: CreateLibraryDto) {
    const existing = await this.prisma.library.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new BadRequestException('این اسلاگ کتابخانه قبلاً ثبت شده است');
    }
    return this.prisma.library.create({
      data: {
        name: data.name,
        slug: data.slug,
        kind: data.kind,
        sortOrder: data.sortOrder ?? 0,
        isSystem: false,
      },
    });
  }

  async updateLibrary(id: string, data: UpdateLibraryDto) {
    const library = await this.prisma.library.findUnique({ where: { id } });
    if (!library) throw new NotFoundException('کتابخانه یافت نشد');

    return this.prisma.library.update({
      where: { id },
      data: {
        ...data,
        ...(library.isSystem ? { isSystem: false } : {}),
      },
    });
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
    return this.prisma.library.delete({ where: { id } });
  }
}
