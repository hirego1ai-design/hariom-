-- Phase 2: durable leasing and retry scheduling for video-analysis jobs.
-- Additive and safe for existing rows.
ALTER TABLE "VideoAnalysisJob"
  ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "leaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "claimToken" TEXT;

CREATE INDEX IF NOT EXISTS "VideoAnalysisJob_status_nextAttemptAt_idx"
  ON "VideoAnalysisJob"("status", "nextAttemptAt");

CREATE INDEX IF NOT EXISTS "VideoAnalysisJob_status_leaseExpiresAt_idx"
  ON "VideoAnalysisJob"("status", "leaseExpiresAt");
