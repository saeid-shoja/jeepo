UPDATE "OrderItem"
SET "guaranteeStatus" = 'SUCCESSFUL'
WHERE "guaranteeStatus" = 'BUYER_CONFIRMED';
