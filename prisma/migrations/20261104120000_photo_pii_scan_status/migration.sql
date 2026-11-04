CREATE TYPE "PiiScanStatus" AS ENUM ('PENDING', 'CLEAN', 'FLAGGED', 'LEGACY');
ALTER TABLE "SupplierPhoto" ADD COLUMN "piiScanStatus" "PiiScanStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "SupplierPhoto" ADD COLUMN "piiScannedAt" TIMESTAMP(3);
-- Existing photos stay visible but are queued for the daily sweep.
UPDATE "SupplierPhoto" SET "piiScanStatus" = 'LEGACY';
CREATE INDEX "SupplierPhoto_piiScanStatus_idx" ON "SupplierPhoto"("piiScanStatus");
