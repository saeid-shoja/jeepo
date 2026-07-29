-- AlterEnum
CREATE TYPE "VehiclePaintCondition" AS ENUM (
  'UNPAINTED',
  'SCRATCHES',
  'PARTIAL_PAINT',
  'FULL_PAINT',
  'ACCIDENT'
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "mileageKm" INTEGER,
ADD COLUMN "paintCondition" "VehiclePaintCondition";
