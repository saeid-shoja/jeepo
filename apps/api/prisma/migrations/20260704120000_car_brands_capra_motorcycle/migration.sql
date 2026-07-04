-- Add Capra and Motorcycle car brands (idempotent — safe on repeat deploy).
UPDATE "Category"
SET "sortOrder" = 18
WHERE "slug" = 'other' AND "brandCode" = 'OTHER';

INSERT INTO "Category" ("id", "name", "slug", "group", "brandCode", "sortOrder", "isSystem", "libraryId", "parentId")
SELECT
  gen_random_uuid()::text,
  'کاپرا',
  'capra',
  'CAR_BRAND'::"CategoryGroup",
  'CAPRA',
  16,
  true,
  lib."id",
  NULL
FROM "Library" lib
WHERE lib."slug" = 'car-brands'
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'capra');

INSERT INTO "Category" ("id", "name", "slug", "group", "brandCode", "sortOrder", "isSystem", "libraryId", "parentId")
SELECT
  gen_random_uuid()::text,
  'موتورسیکلت',
  'motorcycle',
  'CAR_BRAND'::"CategoryGroup",
  'MOTORCYCLE',
  17,
  true,
  lib."id",
  NULL
FROM "Library" lib
WHERE lib."slug" = 'car-brands'
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'motorcycle');
