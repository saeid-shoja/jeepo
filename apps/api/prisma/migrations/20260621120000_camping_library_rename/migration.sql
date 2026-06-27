-- Rename camping library (slug unchanged for stable URLs/filters).
UPDATE "Library"
SET "name" = 'تورهای گردشگری آفرودی و لوازم کمپی'
WHERE "slug" = 'camping';
