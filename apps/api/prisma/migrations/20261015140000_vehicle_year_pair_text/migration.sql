ALTER TABLE "Product"
  ALTER COLUMN "productionYear" TYPE TEXT
  USING CASE
    WHEN "productionYear" IS NULL THEN NULL
    ELSE "productionYear"::TEXT || '/' || ("productionYear" + 621)::TEXT
  END;