-- Audit 2026-10-21 item 31: missing indexes on hot FK columns.
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_supplierId_idx" ON "Notification"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierPackage_supplierId_idx" ON "SupplierPackage"("supplierId");
CREATE INDEX IF NOT EXISTS "Review_customerId_idx" ON "Review"("customerId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_meetingId_idx" ON "PaymentTransaction"("meetingId");
CREATE INDEX IF NOT EXISTS "Supplier_googleChannelId_idx" ON "Supplier"("googleChannelId");
