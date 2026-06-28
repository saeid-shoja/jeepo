import {
  DEFAULT_CAMPING_GROUPS,
  DEFAULT_CAR_BRAND_SUBGROUPS,
  DEFAULT_CAR_BRANDS,
  DEFAULT_LIBRARIES,
  DEFAULT_PART_CHILDREN,
  DEFAULT_PART_GROUPS,
  LIBRARY_CAMPING_SLUG,
  LIBRARY_CAR_BRANDS_SLUG,
  LIBRARY_PARTS_SLUG,
  MOTORCYCLE_ATV_SALE_CHILDREN,
  MOTORCYCLE_ATV_SLUG,
  MOTORCYCLE_ATV_SUBCATEGORIES,
} from '@offroad/shared';
import type { CategoryGroup, LibraryKind, PrismaClient } from '../prisma/generated/client';

type Db = Pick<PrismaClient, 'library' | 'category' | 'product'>;

type CategorySeed = {
  slug: string;
  name: string;
  sortOrder: number;
  group: CategoryGroup;
  librarySlug: string;
  parentSlug?: string | null;
  brandCode?: string;
};

/** Retired slugs from older flat category lists — products are moved, then the row is removed. */
const LEGACY_CATEGORY_SLUGS: {
  from: string;
  to: string;
  group?: CategoryGroup;
}[] = [
  { from: 'clothing-gear', to: 'inside' },
  { from: 'transmission', to: 'engine-drivetrain' },
  { from: 'other', to: 'misc-group', group: 'PART' },
];

function buildCategorySeeds(): CategorySeed[] {
  const seeds: CategorySeed[] = [
    ...DEFAULT_PART_GROUPS.map((g) => ({
      slug: g.slug,
      name: g.name,
      sortOrder: g.sortOrder,
      group: 'PART' as CategoryGroup,
      librarySlug: LIBRARY_PARTS_SLUG,
      parentSlug: null,
    })),
    ...DEFAULT_PART_CHILDREN.map((c) => ({
      slug: c.slug,
      name: c.name,
      sortOrder: c.sortOrder,
      group: 'PART' as CategoryGroup,
      librarySlug: LIBRARY_PARTS_SLUG,
      parentSlug: c.parentSlug,
    })),
    ...MOTORCYCLE_ATV_SUBCATEGORIES.map((s) => ({
      slug: s.slug,
      name: s.name,
      sortOrder: s.sortOrder,
      group: 'PART' as CategoryGroup,
      librarySlug: MOTORCYCLE_ATV_SLUG,
      parentSlug: null,
    })),
    ...MOTORCYCLE_ATV_SALE_CHILDREN.map((c) => ({
      slug: c.slug,
      name: c.name,
      sortOrder: c.sortOrder,
      group: 'PART' as CategoryGroup,
      librarySlug: MOTORCYCLE_ATV_SLUG,
      parentSlug: c.parentSlug,
    })),
    ...DEFAULT_CAMPING_GROUPS.map((g) => ({
      slug: g.slug,
      name: g.name,
      sortOrder: g.sortOrder,
      group: 'PART' as CategoryGroup,
      librarySlug: LIBRARY_CAMPING_SLUG,
      parentSlug: null,
    })),
    ...DEFAULT_CAR_BRAND_SUBGROUPS.map((g) => ({
      slug: g.slug,
      name: g.name,
      sortOrder: g.sortOrder,
      group: 'CAR_BRAND' as CategoryGroup,
      librarySlug: LIBRARY_CAR_BRANDS_SLUG,
      parentSlug: null,
    })),
    ...DEFAULT_CAR_BRANDS.map((b) => ({
      slug: b.slug,
      name: b.name,
      sortOrder: b.sortOrder,
      group: 'CAR_BRAND' as CategoryGroup,
      librarySlug: LIBRARY_CAR_BRANDS_SLUG,
      parentSlug: b.parentSlug,
      brandCode: b.code,
    })),
  ];

  const seen = new Set<string>();
  for (const seed of seeds) {
    if (seen.has(seed.slug)) {
      throw new Error(`Duplicate default category slug in category-defaults: ${seed.slug}`);
    }
    seen.add(seed.slug);
  }

  return seeds;
}

async function migrateLegacyCategorySlug(
  db: Db,
  from: string,
  to: string,
  group?: CategoryGroup,
): Promise<void> {
  const fromRow = await db.category.findFirst({
    where: { slug: from, ...(group ? { group } : {}) },
  });
  if (!fromRow) return;

  const toRow = await db.category.findUnique({ where: { slug: to } });
  if (toRow) {
    await db.product.updateMany({
      where: { categoryId: fromRow.id },
      data: { categoryId: toRow.id },
    });
  }

  await db.category.delete({ where: { id: fromRow.id } });
}

async function removeLegacyMotorcycleGroupCategory(db: Db): Promise<void> {
  const motorcycleSlugs = MOTORCYCLE_ATV_SUBCATEGORIES.map((s) => s.slug);
  const legacyMotorcycleGroup = await db.category.findUnique({
    where: { slug: MOTORCYCLE_ATV_SLUG },
  });
  if (!legacyMotorcycleGroup) return;

  await db.category.updateMany({
    where: { parentId: legacyMotorcycleGroup.id },
    data: { parentId: null },
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

/**
 * Seed-only sync — runs on API startup and `prisma seed`.
 *
 * - **Database is the runtime source of truth.** Shop, admin, and filters all read from DB.
 * - **category-defaults.ts** is a template for first install and new built-in slugs in deploys.
 * - Each default slug is synced exactly once (parents before children).
 * - **Existing rows are never updated** — admin edits (name, order, parent, library) always win.
 * - Only missing slugs from category-defaults.ts are inserted (`isSystem: true`).
 * - Rows with `isSystem: false` (admin-created or admin-edited) are never touched.
 * - Retired slugs are migrated once, then removed.
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

  await removeLegacyMotorcycleGroupCategory(db);

  const categoryIds = new Map<string, string>();
  const seeds = buildCategorySeeds();

  for (const seed of seeds) {
    const libraryId = libraryIds.get(seed.librarySlug);
    if (!libraryId) {
      throw new Error(`Unknown library slug in category seed: ${seed.librarySlug}`);
    }

    const parentId = seed.parentSlug ? (categoryIds.get(seed.parentSlug) ?? null) : null;
    const existing = await db.category.findUnique({ where: { slug: seed.slug } });

    if (!existing) {
      const row = await db.category.create({
        data: {
          name: seed.name,
          slug: seed.slug,
          group: seed.group,
          sortOrder: seed.sortOrder,
          parentId,
          libraryId,
          brandCode: seed.brandCode ?? null,
          isSystem: true,
        },
      });
      categoryIds.set(seed.slug, row.id);
      continue;
    }

    categoryIds.set(seed.slug, existing.id);
  }

  for (const { from, to, group } of LEGACY_CATEGORY_SLUGS) {
    await migrateLegacyCategorySlug(db, from, to, group);
  }
}

/**
 * Wipe all libraries/categories and rebuild from category-defaults.ts.
 * Fails when products exist (categoryId is required) — delete or reassign products first,
 * or use `prisma migrate reset` for a full database wipe.
 */
export async function resetDefaultCategories(db: Db): Promise<void> {
  const productCount = await db.product.count();
  if (productCount > 0) {
    throw new Error(
      `${productCount} product(s) still reference categories. Delete products first, or run \`pnpm db:migrate:reset\` for a full database reset.`,
    );
  }

  await db.category.updateMany({ data: { parentId: null } });
  await db.category.deleteMany();
  await db.library.deleteMany();
  await syncDefaultCategories(db);
}
