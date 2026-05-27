-- AlterTable
ALTER TABLE "Product" ADD COLUMN "isAuction" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "auctionStartPrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "auctionCurrentPrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "buyNowPrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "realPriceMin" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "realPriceMax" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "auctionEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AuctionBid" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "bidderName" TEXT NOT NULL,
    "bidderPhone" TEXT NOT NULL,
    "bidderAddress" TEXT NOT NULL,
    "bidderCity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionBid_productId_createdAt_idx" ON "AuctionBid"("productId", "createdAt");
CREATE INDEX "AuctionBid_userId_idx" ON "AuctionBid"("userId");
CREATE INDEX "Product_isAuction_auctionEndsAt_idx" ON "Product"("isAuction", "auctionEndsAt");

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
