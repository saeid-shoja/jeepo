-- AlterTable
ALTER TABLE "Product" ADD COLUMN "listingFeePaid" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "listingPaymentDueAt" TIMESTAMP(3);
