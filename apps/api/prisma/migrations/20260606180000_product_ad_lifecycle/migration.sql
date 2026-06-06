-- Rename INACTIVE to DEPRECATED
ALTER TYPE "ProductStatus" RENAME VALUE 'INACTIVE' TO 'DEPRECATED';

-- Add lifecycle timestamps
ALTER TABLE "Product" ADD COLUMN "activeUntil" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN "deprecatedAt" TIMESTAMP(3);

-- Backfill: client ads expire 30 days after creation
UPDATE "Product"
SET "activeUntil" = "createdAt" + INTERVAL '30 days'
WHERE "advertiser" = 'CLIENT';

-- Backfill deprecatedAt for already-deprecated ads
UPDATE "Product"
SET "deprecatedAt" = COALESCE("updatedAt", "createdAt")
WHERE "status" = 'DEPRECATED' AND "deprecatedAt" IS NULL;

-- Index for lifecycle cron queries
CREATE INDEX "Product_status_activeUntil_idx" ON "Product"("status", "activeUntil");
CREATE INDEX "Product_status_deprecatedAt_idx" ON "Product"("status", "deprecatedAt");
