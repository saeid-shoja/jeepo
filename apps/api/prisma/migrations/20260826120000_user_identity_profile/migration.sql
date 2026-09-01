-- CreateEnum
CREATE TYPE "UserAccountKind" AS ENUM ('REGULAR', 'SHOP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "nationalId" TEXT,
ADD COLUMN "nationalIdCardImage" TEXT,
ADD COLUMN "consentSelfieImage" TEXT,
ADD COLUMN "shopLicenseImage" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "postalCode" TEXT,
ADD COLUMN "violationReportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "accountKind" "UserAccountKind" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN "verifiedSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rating" DOUBLE PRECISION;
