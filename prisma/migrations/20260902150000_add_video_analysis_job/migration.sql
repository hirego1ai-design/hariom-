-- Safe additive migration for VideoResume analysis fields and VideoAnalysisJob queue.
ALTER TABLE "VideoResume" 
  ADD COLUMN IF NOT EXISTS "speechDeliveryScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "contentStructureScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "analysisStatus" TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "analysisVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "workerVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "modelName" TEXT,
  ADD COLUMN IF NOT EXISTS "modelVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "detectedLanguage" TEXT,
  ADD COLUMN IF NOT EXISTS "wordsPerMinute" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pauseRatio" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "fillerWordCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "transcriptConfidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lowConfidence" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "audioQuality" TEXT,
  ADD COLUMN IF NOT EXISTS "facePresenceRatio" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "cameraFacingRatioEstimate" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "headPoseIndicators" JSONB,
  ADD COLUMN IF NOT EXISTS "postureIndicators" JSONB,
  ADD COLUMN IF NOT EXISTS "strengths" JSONB,
  ADD COLUMN IF NOT EXISTS "improvementSuggestions" JSONB,
  ADD COLUMN IF NOT EXISTS "analysisError" TEXT,
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retryCount" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "retentionExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT NOW();

CREATE TABLE IF NOT EXISTS "VideoAnalysisJob" (
  "id" TEXT NOT NULL,
  "videoResumeId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "error" TEXT,
  "payload" JSONB,
  "result" JSONB,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VideoAnalysisJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VideoAnalysisJob_idempotencyKey_key" ON "VideoAnalysisJob"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "VideoAnalysisJob_videoResumeId_idx" ON "VideoAnalysisJob"("videoResumeId");
CREATE INDEX IF NOT EXISTS "VideoAnalysisJob_status_idx" ON "VideoAnalysisJob"("status");
