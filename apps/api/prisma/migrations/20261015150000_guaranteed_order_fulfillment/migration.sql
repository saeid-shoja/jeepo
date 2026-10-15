DO $$ BEGIN
  CREATE TYPE "GuaranteedOrderItemStatus" AS ENUM (
    'WAITING_SELLER_CONFIRMATION',
    'PACKAGING',
    'READY_TO_SHIP',
    'SHIPPED',
    'BUYER_CONFIRMED',
    'BUYER_CANCELLED',
    'REFUND_PENDING',
    'UNDER_REVIEW',
    'REFUNDED',
    'PAID_TO_SELLER',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "guaranteeStatus" "GuaranteedOrderItemStatus",
  ADD COLUMN IF NOT EXISTS "packagingVideo" TEXT,
  ADD COLUMN IF NOT EXISTS "packagingImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "shippingReceipt" TEXT,
  ADD COLUMN IF NOT EXISTS "guaranteeStatusChangedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3);

UPDATE "OrderItem" AS item
SET "guaranteeStatus" = CASE order_record."status"
  WHEN 'PACKAGING' THEN 'PACKAGING'::"GuaranteedOrderItemStatus"
  WHEN 'SHIPPED' THEN 'SHIPPED'::"GuaranteedOrderItemStatus"
  WHEN 'DELIVERED' THEN 'BUYER_CONFIRMED'::"GuaranteedOrderItemStatus"
  ELSE 'WAITING_SELLER_CONFIRMATION'::"GuaranteedOrderItemStatus"
END,
"guaranteeStatusChangedAt" = COALESCE(order_record."statusChangedAt", order_record."createdAt"),
"shippedAt" = CASE WHEN order_record."status" IN ('SHIPPED', 'DELIVERED') THEN order_record."statusChangedAt" ELSE NULL END
FROM "Order" AS order_record, "Product" AS product
WHERE item."orderId" = order_record."id"
  AND product."id" = item."productId"
  AND product."hasGuarantee" = true
  AND order_record."status" <> 'PENDING'
  AND order_record."status" <> 'CANCELLED';