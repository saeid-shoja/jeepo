/*
  Warnings:

  - The `paymentMethod` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'COD');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod";
