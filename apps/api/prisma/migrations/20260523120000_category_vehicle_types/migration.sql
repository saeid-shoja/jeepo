-- CreateEnum
CREATE TYPE "CategoryGroup" AS ENUM ('PART', 'VEHICLE_TYPE');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "group" "CategoryGroup" NOT NULL DEFAULT 'PART';
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductVehicleType" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ProductVehicleType_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateIndex
CREATE INDEX "Category_group_idx" ON "Category"("group");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX "ProductVehicleType_categoryId_idx" ON "ProductVehicleType"("categoryId");

-- AddForeignKey
ALTER TABLE "ProductVehicleType" ADD CONSTRAINT "ProductVehicleType_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVehicleType" ADD CONSTRAINT "ProductVehicleType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
