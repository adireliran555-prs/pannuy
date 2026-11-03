-- External (ICS) calendar sources
ALTER TYPE "AvailabilitySource" ADD VALUE IF NOT EXISTS 'ICLOUD';
ALTER TYPE "AvailabilitySource" ADD VALUE IF NOT EXISTS 'OUTLOOK';
CREATE TYPE "ExternalCalendarProvider" AS ENUM ('ICLOUD', 'OUTLOOK');

-- Agents
CREATE TABLE "Agent" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "referralCode" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "agreementVersion" TEXT,
  "agreementAcceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Agent_phone_key" ON "Agent"("phone");
CREATE UNIQUE INDEX "Agent_referralCode_key" ON "Agent"("referralCode");

CREATE TABLE "AgentEarning" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "amountIls" INTEGER NOT NULL,
  "status" "AffiliateStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  CONSTRAINT "AgentEarning_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AgentEarning_meetingId_key" ON "AgentEarning"("meetingId");
CREATE INDEX "AgentEarning_agentId_idx" ON "AgentEarning"("agentId");
ALTER TABLE "AgentEarning" ADD CONSTRAINT "AgentEarning_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentEarning" ADD CONSTRAINT "AgentEarning_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Supplier: external calendar + agent referral
ALTER TABLE "Supplier" ADD COLUMN "externalCalendarUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "externalCalendarProvider" "ExternalCalendarProvider";
ALTER TABLE "Supplier" ADD COLUMN "externalCalendarSyncedAt" TIMESTAMP(3);
ALTER TABLE "Supplier" ADD COLUMN "referredByAgentId" TEXT;
CREATE INDEX "Supplier_referredByAgentId_idx" ON "Supplier"("referredByAgentId");
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_referredByAgentId_fkey" FOREIGN KEY ("referredByAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- User: agent referral
ALTER TABLE "User" ADD COLUMN "referredByAgentId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_referredByAgentId_fkey" FOREIGN KEY ("referredByAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Meeting: deal value + commission
ALTER TABLE "Meeting" ADD COLUMN "dealAmountIls" INTEGER;
ALTER TABLE "Meeting" ADD COLUMN "commissionIls" INTEGER;
