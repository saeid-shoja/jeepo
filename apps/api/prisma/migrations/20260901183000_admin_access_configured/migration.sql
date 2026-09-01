-- Add adminAccessConfigured for existing installs that already have isSuperAdmin column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminAccessConfigured" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "isSuperAdmin" = true
WHERE role = 'ADMIN'
  AND "isSuperAdmin" = false
  AND id = (
    SELECT id FROM "User"
    WHERE role = 'ADMIN'
    ORDER BY "createdAt" ASC
    LIMIT 1
  );
