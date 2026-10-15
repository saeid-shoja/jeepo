CREATE TYPE "VehicleGearbox" AS ENUM ('MANUAL', 'AUTOMATIC');

ALTER TABLE "Product"
  ADD COLUMN "productionYear" INTEGER,
  ADD COLUMN "productionYearBefore1370" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "gearbox" "VehicleGearbox";