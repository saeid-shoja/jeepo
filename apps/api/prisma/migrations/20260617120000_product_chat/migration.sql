-- CreateTable
CREATE TABLE "ProductConversation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductConversation_sellerId_lastMessageAt_idx" ON "ProductConversation"("sellerId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "ProductConversation_buyerId_lastMessageAt_idx" ON "ProductConversation"("buyerId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductConversation_productId_buyerId_key" ON "ProductConversation"("productId", "buyerId");

-- CreateIndex
CREATE INDEX "ProductChatMessage_conversationId_createdAt_idx" ON "ProductChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductChatMessage_senderId_idx" ON "ProductChatMessage"("senderId");

-- AddForeignKey
ALTER TABLE "ProductConversation" ADD CONSTRAINT "ProductConversation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductConversation" ADD CONSTRAINT "ProductConversation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductConversation" ADD CONSTRAINT "ProductConversation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductChatMessage" ADD CONSTRAINT "ProductChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ProductConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductChatMessage" ADD CONSTRAINT "ProductChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
