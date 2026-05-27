-- Rename ProductType enum to Advertiser
ALTER TYPE "ProductType" RENAME TO "Advertiser";

-- Rename column on Product
ALTER TABLE "Product" RENAME COLUMN "type" TO "advertiser";

-- Rename index if it exists (from init migration)
ALTER INDEX IF EXISTS "Product_type_status_idx" RENAME TO "Product_advertiser_status_idx";
