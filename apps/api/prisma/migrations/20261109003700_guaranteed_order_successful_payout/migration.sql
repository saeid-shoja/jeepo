ALTER TYPE "GuaranteedOrderItemStatus" ADD VALUE IF NOT EXISTS 'SUCCESSFUL';

ALTER TABLE "OrderItem"
  ADD COLUMN "guaranteeSellerPaidAt" TIMESTAMP(3),
  ADD COLUMN "guaranteeSellerFeeAmount" INTEGER,
  ADD COLUMN "guaranteeSellerPayoutAmount" INTEGER;
