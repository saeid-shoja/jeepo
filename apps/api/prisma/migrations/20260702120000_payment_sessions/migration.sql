-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('LISTING_FEE', 'LISTING_STRENGTHENED', 'LISTING_BOOST');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('ZIBAL');

-- CreateEnum
CREATE TYPE "PaymentSessionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PaymentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "status" "PaymentSessionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "trackId" TEXT,
    "refNumber" TEXT,
    "paidAt" TIMESTAMP(3),
    "nextPurpose" "PaymentPurpose",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSession_trackId_key" ON "PaymentSession"("trackId");

-- CreateIndex
CREATE INDEX "PaymentSession_userId_status_idx" ON "PaymentSession"("userId", "status");

-- CreateIndex
CREATE INDEX "PaymentSession_productId_purpose_idx" ON "PaymentSession"("productId", "purpose");

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
