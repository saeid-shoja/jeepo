-- CreateEnum
CREATE TYPE "ProductSituation" AS ENUM ('NEW', 'USED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "situation" "ProductSituation";
