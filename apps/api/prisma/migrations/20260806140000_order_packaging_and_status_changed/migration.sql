-- AlterEnum: add packaging stage between confirmed and shipped
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKAGING';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Order"
SET "statusChangedAt" = COALESCE("paidAt", "updatedAt", "createdAt")
WHERE "statusChangedAt" IS NULL OR "statusChangedAt" = "createdAt";

CREATE INDEX IF NOT EXISTS "Order_status_statusChangedAt_idx" ON "Order"("status", "statusChangedAt");
