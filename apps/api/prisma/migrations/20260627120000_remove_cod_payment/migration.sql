-- Migrate any legacy COD orders to ONLINE, then drop COD from PaymentMethod enum.
UPDATE "Order" SET "paymentMethod" = 'ONLINE' WHERE "paymentMethod" = 'COD';

ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING ("paymentMethod"::text::"PaymentMethod");
DROP TYPE "PaymentMethod_old";
