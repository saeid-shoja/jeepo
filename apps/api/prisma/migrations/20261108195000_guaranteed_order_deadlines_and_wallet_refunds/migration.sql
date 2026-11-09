ALTER TABLE "OrderItem"
  ADD COLUMN "guaranteeDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "guaranteeCancellationReason" TEXT,
  ADD COLUMN "guaranteeWalletRefundedAt" TIMESTAMP(3),
  ADD COLUMN "guaranteeRefundAmount" INTEGER;

CREATE INDEX "OrderItem_guaranteeStatus_guaranteeDeadlineAt_idx"
  ON "OrderItem"("guaranteeStatus", "guaranteeDeadlineAt");

UPDATE "OrderItem" AS item
SET "guaranteeDeadlineAt" = COALESCE(order_record."paidAt", order_record."createdAt") + INTERVAL '7 days'
FROM "Order" AS order_record
WHERE item."orderId" = order_record."id"
  AND item."guaranteeStatus" = 'WAITING_SELLER_CONFIRMATION';

UPDATE "OrderItem"
SET "guaranteeDeadlineAt" = CURRENT_TIMESTAMP + INTERVAL '7 days'
WHERE "guaranteeStatus" IN ('PACKAGING', 'READY_TO_SHIP');

UPDATE "OrderItem"
SET "guaranteeCancellationReason" = CASE
  WHEN "guaranteeStatus" = 'CANCELLED' THEN 'لغو سفارش در نسخه قبلی سامانه'
  ELSE NULL
END
WHERE "guaranteeStatus" = 'CANCELLED';
