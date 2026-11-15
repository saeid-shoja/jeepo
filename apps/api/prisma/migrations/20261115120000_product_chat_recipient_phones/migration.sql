CREATE TABLE "ProductChatRecipientPhone" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductChatRecipientPhone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductChatRecipientPhone_dateKey_phone_key"
ON "ProductChatRecipientPhone"("dateKey", "phone");

CREATE INDEX "ProductChatRecipientPhone_dateKey_finalizedAt_idx"
ON "ProductChatRecipientPhone"("dateKey", "finalizedAt");
