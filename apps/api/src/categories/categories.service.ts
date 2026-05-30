import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MOTORCYCLE_ATV_NAME,
  MOTORCYCLE_ATV_SLUG,
  MOTORCYCLE_ATV_SUBCATEGORIES,
} from '@offroad/shared';
import { getCarBrandOptions } from '../common/car-brands';
import { CategoryGroup } from '../prisma/generated/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto';

export type LibraryNode = {
  id: string;
  name: string;
  slug: string;
  kind: 'PART' | 'CAR_BRAND';
  children: LibraryNode[];
};

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private buildPartTree(
    categories: {
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      sortOrder: number;
    }[],
  ): LibraryNode[] {
    const byParent = new Map<string | null, typeof categories>();
    for (const cat of categories) {
      const key = cat.parentId;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(cat);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fa'));
    }

    const toNode = (cat: (typeof categories)[0]): LibraryNode => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      kind: 'PART',
      children: (byParent.get(cat.id) ?? []).map(toNode),
    });

    return (byParent.get(null) ?? []).map(toNode);
  }

  async findAll() {
    const parts = await this.prisma.category.findMany({
      where: { group: CategoryGroup.PART },
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const motorcycleCat = parts.find((p) => p.slug === MOTORCYCLE_ATV_SLUG);
    const motorcycleId = motorcycleCat?.id;

    const partsForMainTree = parts.filter(
      (p) => p.slug !== MOTORCYCLE_ATV_SLUG && p.parentId !== motorcycleId,
    );
    const partTree = this.buildPartTree(partsForMainTree);

    const motorcycleSubs = parts.filter((p) => p.parentId === motorcycleId);
    const motorcycleChildren: LibraryNode[] =
      motorcycleSubs.length > 0
        ? motorcycleSubs.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            kind: 'PART' as const,
            children: [],
          }))
        : motorcycleCat
          ? [
              {
                id: motorcycleCat.id,
                name: motorcycleCat.name,
                slug: motorcycleCat.slug,
                kind: 'PART' as const,
                children: [],
              },
            ]
          : [];

    const carBrandChildren: LibraryNode[] = getCarBrandOptions().map((b) => ({
      id: b.value,
      name: b.label,
      slug: b.value.toLowerCase(),
      kind: 'CAR_BRAND' as const,
      children: [],
    }));

    const libraries: LibraryNode[] = [
      {
        id: 'library-parts',
        name: 'قطعات',
        slug: 'parts',
        kind: 'PART',
        children: partTree,
      },
      {
        id: 'library-motorcycle',
        name: MOTORCYCLE_ATV_NAME,
        slug: MOTORCYCLE_ATV_SLUG,
        kind: 'PART',
        children: motorcycleChildren,
      },
      {
        id: 'library-car-brands',
        name: 'برند خودرو',
        slug: 'car-brands',
        kind: 'CAR_BRAND',
        children: carBrandChildren,
      },
    ];

    return {
      libraries,
      parts,
      carBrands: getCarBrandOptions(),
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

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        parent: true,
      },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    return category;
  }

  async create(data: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        group: CategoryGroup.PART,
        parentId: data.parentId,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, data: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  async seed() {
    const groups = [
      { name: 'موتور و انتقال', slug: 'engine-drivetrain', sortOrder: 1 },
      { name: 'شاسی و تعلیق', slug: 'chassis', sortOrder: 2 },
      { name: 'برق و روشنایی', slug: 'electrical', sortOrder: 3 },
      { name: 'ظاهر و تجهیزات', slug: 'gear-style', sortOrder: 4 },
      { name: 'سایر', slug: 'misc-group', sortOrder: 5 },
    ];

    const groupIds = new Map<string, string>();

    for (const g of groups) {
      const row = await this.prisma.category.upsert({
        where: { slug: g.slug },
        update: { name: g.name, group: CategoryGroup.PART, sortOrder: g.sortOrder, parentId: null },
        create: { ...g, group: CategoryGroup.PART },
      });
      groupIds.set(g.slug, row.id);
    }

    const motorcycleAtv = await this.prisma.category.upsert({
      where: { slug: MOTORCYCLE_ATV_SLUG },
      update: {
        name: MOTORCYCLE_ATV_NAME,
        group: CategoryGroup.PART,
        sortOrder: 0,
        parentId: null,
      },
      create: {
        name: MOTORCYCLE_ATV_NAME,
        slug: MOTORCYCLE_ATV_SLUG,
        group: CategoryGroup.PART,
        sortOrder: 0,
      },
    });

    for (const sub of MOTORCYCLE_ATV_SUBCATEGORIES) {
      await this.prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          group: CategoryGroup.PART,
          sortOrder: sub.sortOrder,
          parentId: motorcycleAtv.id,
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          group: CategoryGroup.PART,
          sortOrder: sub.sortOrder,
          parentId: motorcycleAtv.id,
        },
      });
    }

    const children: { name: string; slug: string; parentSlug: string; sortOrder: number }[] = [
      {
        name: 'دنده و انتقال قدرت',
        slug: 'transmission',
        parentSlug: 'engine-drivetrain',
        sortOrder: 1,
      },
      {
        name: 'لوازم یدکی انجین',
        slug: 'engine-parts',
        parentSlug: 'engine-drivetrain',
        sortOrder: 2,
      },
      { name: 'تعلیق و زیربندی', slug: 'suspension', parentSlug: 'chassis', sortOrder: 1 },
      { name: 'لاستیک و رینگ', slug: 'tires-rims', parentSlug: 'chassis', sortOrder: 2 },
      { name: 'چراغ و نور', slug: 'lighting', parentSlug: 'electrical', sortOrder: 1 },
      { name: 'راهنما و مسیریاب', slug: 'navigation', parentSlug: 'electrical', sortOrder: 2 },
      { name: 'اکسسوری و تزئینات', slug: 'accessories', parentSlug: 'gear-style', sortOrder: 1 },
      { name: 'لباس و تجهیزات', slug: 'clothing-gear', parentSlug: 'gear-style', sortOrder: 2 },
    ];

    for (const cat of children) {
      const parentId = groupIds.get(cat.parentSlug);
      await this.prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          group: CategoryGroup.PART,
          sortOrder: cat.sortOrder,
          parentId: parentId ?? null,
        },
        create: {
          name: cat.name,
          slug: cat.slug,
          group: CategoryGroup.PART,
          sortOrder: cat.sortOrder,
          parentId: parentId ?? null,
        },
      });
    }

    const other = await this.prisma.category.findUnique({ where: { slug: 'other' } });
    const misc = await this.prisma.category.findUnique({ where: { slug: 'misc-group' } });
    if (other && misc) {
      await this.prisma.product.updateMany({
        where: { categoryId: other.id },
        data: { categoryId: misc.id },
      });
      await this.prisma.category.delete({ where: { id: other.id } });
    } else if (other) {
      await this.prisma.category.delete({ where: { id: other.id } });
    }

    return { message: 'دسته‌بندی‌های قطعه با گروه و زیرگروه ایجاد شدند' };
  }
}
