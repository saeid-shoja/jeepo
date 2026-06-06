import {
  DEFAULT_CAR_BRAND_SUBGROUPS,
  DEFAULT_CAR_BRANDS,
  DEFAULT_LIBRARIES,
  DEFAULT_PART_CHILDREN,
  DEFAULT_PART_GROUPS,
  LIBRARY_CAR_BRANDS_SLUG,
  LIBRARY_PARTS_SLUG,
  MOTORCYCLE_ATV_SLUG,
  MOTORCYCLE_ATV_SUBCATEGORIES,
} from '@offroad/shared';
import type { CategoryGroup, LibraryKind, PrismaClient } from '../prisma/generated/client';

// pick just needed models
type Db = Pick<PrismaClient, 'library' | 'category' | 'product'>;

/**
 * Seed-only sync — runs on API startup and `prisma seed`.
 *
 * - **Database is the runtime source of truth.** Shop, admin, and filters all read from DB.
 * - **category-defaults.ts** is a template for first install and new built-in slugs in deploys.
 * - Every upsert uses `update: {}` so existing rows are never overwritten (names, order, parents
 *   changed in admin stay as saved).
 * - Admin-created rows (`isSystem: false`) are never touched by this file.
 * - If a system default is deleted, it is re-created on next boot (by slug). Custom admin rows
 *   with new slugs are unaffected.
 */
export async function syncDefaultCategories(db: Db): Promise<void> {
  const libraryIds = new Map<string, string>();

  for (const lib of DEFAULT_LIBRARIES) {
    const row = await db.library.upsert({
      where: { slug: lib.slug },
      create: {
        name: lib.name,
        slug: lib.slug,
        kind: lib.kind as LibraryKind,
        sortOrder: lib.sortOrder,
        isSystem: true,
      },
      update: {},
    });
    libraryIds.set(lib.slug, row.id);
  }

  // use ! because we sure their exist
  const partsLibraryId = libraryIds.get(LIBRARY_PARTS_SLUG)!;
  const motorcycleLibraryId = libraryIds.get(MOTORCYCLE_ATV_SLUG)!;

  const groupIds = new Map<string, string>();

  for (const g of DEFAULT_PART_GROUPS) {
    const row = await db.category.upsert({
      where: { slug: g.slug },
      create: {
        name: g.name,
        slug: g.slug,
        group: 'PART' as CategoryGroup,
        sortOrder: g.sortOrder,
        parentId: null,
        libraryId: partsLibraryId,
        isSystem: true,
      },
      update: {},
    });
    groupIds.set(g.slug, row.id);
  }

  for (const sub of MOTORCYCLE_ATV_SUBCATEGORIES) {
    await db.category.upsert({
      where: { slug: sub.slug },
      create: {
        name: sub.name,
        slug: sub.slug,
        group: 'PART',
        sortOrder: sub.sortOrder,
        parentId: null,
        libraryId: motorcycleLibraryId,
        isSystem: true,
      },
      update: {},
    });
  }

  const motorcycleSlugs = MOTORCYCLE_ATV_SUBCATEGORIES.map((s) => s.slug);
  await db.category.updateMany({
    where: { slug: { in: motorcycleSlugs } },
    data: { parentId: null, libraryId: motorcycleLibraryId },
  });

  const legacyMotorcycleGroup = await db.category.findUnique({
    where: { slug: MOTORCYCLE_ATV_SLUG },
  });
  if (legacyMotorcycleGroup) {
    await db.category.updateMany({
      where: { parentId: legacyMotorcycleGroup.id },
      data: { parentId: null, libraryId: motorcycleLibraryId },
    });

    const fallbackSub = await db.category.findFirst({
      where: { slug: { in: motorcycleSlugs } },
    });
    if (fallbackSub) {
      await db.product.updateMany({
        where: { categoryId: legacyMotorcycleGroup.id },
        data: { categoryId: fallbackSub.id },
      });
    }

    await db.category.delete({ where: { id: legacyMotorcycleGroup.id } });
  }

  for (const cat of DEFAULT_PART_CHILDREN) {
    const parentId = groupIds.get(cat.parentSlug);
    await db.category.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        group: 'PART',
        sortOrder: cat.sortOrder,
        parentId: parentId ?? null,
        libraryId: partsLibraryId,
        isSystem: true,
      },
      update: {},
    });
  }

  const partSlugs = [
    ...DEFAULT_PART_GROUPS.map((g) => g.slug),
    ...DEFAULT_PART_CHILDREN.map((c) => c.slug),
  ];
  const motorcycleSlugList = [...motorcycleSlugs];

  await db.category.updateMany({
    where: { slug: { in: partSlugs }, libraryId: null },
    data: { libraryId: partsLibraryId },
  });
  await db.category.updateMany({
    where: { slug: { in: motorcycleSlugList }, libraryId: null },
    data: { libraryId: motorcycleLibraryId },
  });

  const carBrandsLibraryId = libraryIds.get(LIBRARY_CAR_BRANDS_SLUG)!;
  const carSubgroupIds = new Map<string, string>();

  for (const subgroup of DEFAULT_CAR_BRAND_SUBGROUPS) {
    const row = await db.category.upsert({
      where: { slug: subgroup.slug },
      create: {
        name: subgroup.name,
        slug: subgroup.slug,
        group: 'CAR_BRAND',
        sortOrder: subgroup.sortOrder,
        parentId: null,
        libraryId: carBrandsLibraryId,
        isSystem: true,
      },
      update: {},
    });
    carSubgroupIds.set(subgroup.slug, row.id);
  }

  for (const brand of DEFAULT_CAR_BRANDS) {
    const parentId = brand.parentSlug ? (carSubgroupIds.get(brand.parentSlug) ?? null) : null;
    await db.category.upsert({
      where: { slug: brand.slug },
      create: {
        name: brand.name,
        slug: brand.slug,
        brandCode: brand.code,
        group: 'CAR_BRAND',
        sortOrder: brand.sortOrder,
        parentId,
        libraryId: carBrandsLibraryId,
        isSystem: true,
      },
      update: {},
    });
  }

  const other = await db.category.findFirst({ where: { slug: 'other', group: 'PART' } });
  const misc = await db.category.findUnique({ where: { slug: 'misc-group' } });
  if (other && misc) {
    await db.product.updateMany({
      where: { categoryId: other.id },
      data: { categoryId: misc.id },
    });
    await db.category.delete({ where: { id: other.id } });
  } else if (other) {
    await db.category.delete({ where: { id: other.id } });
  }
}
