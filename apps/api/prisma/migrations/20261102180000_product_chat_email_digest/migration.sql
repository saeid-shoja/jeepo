CREATE TABLE "ProductChatEmailDigest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductChatEmailDigest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductChatEmailDigest_userId_dateKey_key"
ON "ProductChatEmailDigest"("userId", "dateKey");

CREATE INDEX "ProductChatEmailDigest_dateKey_idx"
ON "ProductChatEmailDigest"("dateKey");

ALTER TABLE "ProductChatEmailDigest"
ADD CONSTRAINT "ProductChatEmailDigest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
