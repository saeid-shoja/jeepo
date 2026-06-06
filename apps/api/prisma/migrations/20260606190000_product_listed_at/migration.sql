-- Sort/display time for listings (bumped on reactivate)
ALTER TABLE "Product" ADD COLUMN "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Product" SET "listedAt" = "createdAt";

CREATE INDEX "Product_listedAt_idx" ON "Product"("listedAt");
