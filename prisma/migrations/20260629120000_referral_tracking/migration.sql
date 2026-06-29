-- CreateEnum
CREATE TYPE "ReferralChannel" AS ENUM ('IN_APP', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('NEW', 'AWAITING_REPLY', 'CONNECTED', 'NO_ANSWER', 'CONVERTED', 'LOST');

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "channel" "ReferralChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "ReferralStatus" NOT NULL DEFAULT 'NEW',
    "meetingId" TEXT,
    "customerNotes" TEXT,
    "adminNotes" TEXT,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "lastFollowUpAt" TIMESTAMP(3),
    "customerConfirmedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_meetingId_key" ON "Referral"("meetingId");

-- CreateIndex
CREATE INDEX "Referral_supplierId_idx" ON "Referral"("supplierId");

-- CreateIndex
CREATE INDEX "Referral_customerId_idx" ON "Referral"("customerId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "Referral_status_lastFollowUpAt_idx" ON "Referral"("status", "lastFollowUpAt");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
