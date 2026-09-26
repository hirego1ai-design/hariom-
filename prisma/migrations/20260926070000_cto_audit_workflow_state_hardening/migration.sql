-- Persist candidate screening answers instead of accepting and discarding them.
ALTER TABLE "Application"
ADD COLUMN "screeningAnswers" JSONB;

-- HOLD is a real workflow state, not only an audit message.
ALTER TYPE "InterviewRoundProgressStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

-- Consequential approvals must expire and be revocable.
ALTER TABLE "WorkflowApproval"
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "revokedBy" TEXT,
ADD COLUMN "revocationReason" TEXT;

-- Existing pending/approved-but-unconsumed approvals receive a bounded legacy
-- window. New approvals set the expiry explicitly in application code.
UPDATE "WorkflowApproval"
SET "expiresAt" = "requestedAt" + INTERVAL '24 hours'
WHERE "expiresAt" IS NULL
  AND "consumedAt" IS NULL
  AND "decision" IN ('PENDING', 'APPROVED');

CREATE INDEX "WorkflowApproval_expiresAt_revokedAt_idx"
ON "WorkflowApproval"("expiresAt", "revokedAt");
