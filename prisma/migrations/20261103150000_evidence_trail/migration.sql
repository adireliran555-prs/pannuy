CREATE TYPE "CustomerOutcome" AS ENUM ('NOT_CONTACTED', 'TALKING', 'CLOSED', 'CLOSED_ELSEWHERE', 'NOT_CLOSING');
CREATE TYPE "DealReportStatus" AS ENUM ('REPORTED', 'VERIFIED', 'DISPUTED');

ALTER TABLE "Referral" ADD COLUMN "customerOutcome" "CustomerOutcome";
ALTER TABLE "Referral" ADD COLUMN "customerReportedIls" INTEGER;

CREATE TABLE "ActivityEvent" (
  "id" TEXT NOT NULL,
  "seq" BIGSERIAL NOT NULL,
  "type" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "actorId" TEXT,
  "customerId" TEXT,
  "supplierId" TEXT,
  "targetType" TEXT,
  "targetId" TEXT,
  "payload" JSONB,
  "ip" TEXT,
  "userAgent" TEXT,
  "sessionId" TEXT,
  "prevHash" TEXT,
  "hash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ActivityEvent_seq_key" ON "ActivityEvent"("seq");
CREATE INDEX "ActivityEvent_customerId_supplierId_createdAt_idx" ON "ActivityEvent"("customerId", "supplierId", "createdAt");
CREATE INDEX "ActivityEvent_supplierId_createdAt_idx" ON "ActivityEvent"("supplierId", "createdAt");
CREATE INDEX "ActivityEvent_customerId_createdAt_idx" ON "ActivityEvent"("customerId", "createdAt");
CREATE INDEX "ActivityEvent_type_createdAt_idx" ON "ActivityEvent"("type", "createdAt");
CREATE INDEX "ActivityEvent_createdAt_idx" ON "ActivityEvent"("createdAt");

-- Append-only: block any UPDATE or DELETE at the database level.
CREATE OR REPLACE FUNCTION activity_event_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ActivityEvent is append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER activity_event_no_update BEFORE UPDATE OR DELETE ON "ActivityEvent"
  FOR EACH ROW EXECUTE FUNCTION activity_event_immutable();

CREATE TABLE "DealReport" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "customerId" TEXT,
  "customerName" TEXT,
  "customerPhone" TEXT,
  "eventDate" DATE,
  "amountIls" INTEGER NOT NULL,
  "commissionIls" INTEGER NOT NULL,
  "note" TEXT,
  "status" "DealReportStatus" NOT NULL DEFAULT 'REPORTED',
  "referralId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DealReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DealReport_supplierId_createdAt_idx" ON "DealReport"("supplierId", "createdAt");
CREATE INDEX "DealReport_customerId_idx" ON "DealReport"("customerId");
ALTER TABLE "DealReport" ADD CONSTRAINT "DealReport_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealReport" ADD CONSTRAINT "DealReport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
