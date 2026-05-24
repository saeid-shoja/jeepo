-- CreateEnum
CREATE TYPE "CarBrand" AS ENUM (
  'TOYOTA',
  'NISSAN',
  'MITSUBISHI',
  'MERCEDES',
  'FORD',
  'SUZUKI',
  'JAC',
  'HAVAL',
  'HYUNDAI',
  'KIA',
  'LAND_ROVER',
  'LEXUS',
  'RENAULT',
  'VOLVO',
  'JEEP',
  'OTHER'
);

-- Drop old vehicle name link table if present
DROP TABLE IF EXISTS "ProductVehicleType";
DROP TABLE IF EXISTS "ProductVehicleName";

-- CreateTable
CREATE TABLE "ProductCarBrand" (
    "productId" TEXT NOT NULL,
    "brand" "CarBrand" NOT NULL,

    CONSTRAINT "ProductCarBrand_pkey" PRIMARY KEY ("productId","brand")
);

-- CreateIndex
CREATE INDEX "ProductCarBrand_brand_idx" ON "ProductCarBrand"("brand");

-- AddForeignKey
ALTER TABLE "ProductCarBrand" ADD CONSTRAINT "ProductCarBrand_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove vehicle categories (dynamic names); brands are enum-only now
DELETE FROM "Category" WHERE "group"::text IN ('VEHICLE_TYPE', 'VEHICLE_NAME');

-- Normalize CategoryGroup to PART only
ALTER TYPE "CategoryGroup" RENAME TO "CategoryGroup_old";
CREATE TYPE "CategoryGroup" AS ENUM ('PART');
ALTER TABLE "Category" ALTER COLUMN "group" DROP DEFAULT;
ALTER TABLE "Category" ALTER COLUMN "group" TYPE "CategoryGroup" USING 'PART'::"CategoryGroup";
ALTER TABLE "Category" ALTER COLUMN "group" SET DEFAULT 'PART';
DROP TYPE "CategoryGroup_old";
