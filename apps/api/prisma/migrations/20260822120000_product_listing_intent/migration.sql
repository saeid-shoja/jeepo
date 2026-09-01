-- CreateEnum
CREATE TYPE "ListingIntent" AS ENUM ('SELLER', 'BUYER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "listingIntent" "ListingIntent" NOT NULL DEFAULT 'SELLER';
