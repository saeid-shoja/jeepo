-- AlterTable
ALTER TABLE "Product" ADD COLUMN "coverImage" TEXT;

-- Backfill cover from the first JSON array element without loading the gallery in app code.
UPDATE "Product"
SET "coverImage" = ("images"::jsonb ->> 0)
WHERE "coverImage" IS NULL
  AND "images" IS NOT NULL
  AND "images" <> ''
  AND "images" <> '[]';
