-- Admin permission tiers: super admin + per-section access for other admins
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "adminPermissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "adminAccessConfigured" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "isSuperAdmin" = true
WHERE id = (
  SELECT id FROM "User"
  WHERE role = 'ADMIN'
  ORDER BY "createdAt" ASC
  LIMIT 1
);
