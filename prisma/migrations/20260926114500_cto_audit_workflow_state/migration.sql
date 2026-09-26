-- CTO audit remediation: durable application screening answers, hold state,
-- and expiring/revocable workflow approvals.

ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "InterviewRoundProgressStatus" ADD VALUE IF NOT EXISTS 'HOLD';

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "screeningAnswers" JSONB;

ALTER TABLE "WorkflowApproval"
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revokedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "revocationReason" TEXT;

UPDATE "WorkflowApproval"
SET "expiresAt" = "requestedAt" + INTERVAL '24 hours'
WHERE "expiresAt" IS NULL;

CREATE INDEX IF NOT EXISTS "WorkflowApproval_companyId_decision_expiresAt_idx"
  ON "WorkflowApproval"("companyId", "decision", "expiresAt");
