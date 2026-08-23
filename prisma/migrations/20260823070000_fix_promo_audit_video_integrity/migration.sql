-- Additive integrity migration: no historical rows are deleted or rewritten.
-- Existing video scores remain readable; newly submitted videos may keep
-- scores NULL until trusted server-side analysis writes them.
ALTER TABLE "PromoCode"
  ADD COLUMN "reservedUsage" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PaymentOrder"
  ADD COLUMN "promoReservationState" TEXT;

ALTER TABLE "AuditLog"
  ADD COLUMN "companyId" TEXT;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

ALTER TABLE "VideoResume"
  ALTER COLUMN "communicationScore" DROP NOT NULL,
  ALTER COLUMN "confidenceScore" DROP NOT NULL,
  ALTER COLUMN "clarityScore" DROP NOT NULL,
  ALTER COLUMN "professionalism" DROP NOT NULL;
