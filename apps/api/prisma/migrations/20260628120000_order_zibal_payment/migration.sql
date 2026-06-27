-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentTrackId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentRefNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentTrackId_key" ON "Order"("paymentTrackId");
