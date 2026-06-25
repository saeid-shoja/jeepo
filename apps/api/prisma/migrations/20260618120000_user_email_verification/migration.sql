-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailVerificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3);

-- Existing accounts were active before email verification was required.
UPDATE "User" SET "emailVerified" = true, "emailVerifiedAt" = CURRENT_TIMESTAMP WHERE "emailVerified" = false;
