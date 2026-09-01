-- Track supplier agreement acceptance at signup
ALTER TABLE "Supplier" ADD COLUMN "agreementVersion" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "agreementAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Supplier" ADD COLUMN "agreementAcceptedIp" TEXT;
