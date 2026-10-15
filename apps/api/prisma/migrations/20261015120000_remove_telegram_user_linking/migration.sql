-- Remove data used only by the Telegram bot account-linking flow.
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "telegramLinkedAt",
  DROP COLUMN IF EXISTS "telegramLinkToken",
  DROP COLUMN IF EXISTS "telegramLinkExpiresAt";