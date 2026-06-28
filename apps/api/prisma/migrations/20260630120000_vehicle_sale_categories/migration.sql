-- Rename parts library display name (slug unchanged for stable URLs).
UPDATE "Library"
SET "name" = 'خودرو'
WHERE "slug" = 'parts';
