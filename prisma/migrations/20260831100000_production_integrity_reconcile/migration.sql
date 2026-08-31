-- Production integrity reconciliation. Additive/nullable-only changes; no
-- historical rows are deleted or rewritten.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Application"
    GROUP BY "candidateProfileId", "jobId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate Application(candidateProfileId, jobId) rows exist; reconcile before uniqueness is added.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Application_candidateProfileId_jobId_key"
  ON "Application"("candidateProfileId", "jobId");

ALTER TABLE "AiExecutionLog"
  ALTER COLUMN "promptTokens" DROP NOT NULL,
  ALTER COLUMN "completionTokens" DROP NOT NULL,
  ALTER COLUMN "totalTokens" DROP NOT NULL,
  ALTER COLUMN "costEstUsd" DROP NOT NULL;

ALTER TABLE "PromoCode"
  ADD COLUMN IF NOT EXISTS "reservedUsage" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PaymentOrder"
  ADD COLUMN IF NOT EXISTS "promoReservationState" TEXT;

ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "companyId" TEXT;
DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "AuditLog_companyId_createdAt_idx"
  ON "AuditLog"("companyId", "createdAt");

ALTER TABLE "VideoResume"
  ALTER COLUMN "communicationScore" DROP NOT NULL,
  ALTER COLUMN "confidenceScore" DROP NOT NULL,
  ALTER COLUMN "clarityScore" DROP NOT NULL,
  ALTER COLUMN "professionalism" DROP NOT NULL;
