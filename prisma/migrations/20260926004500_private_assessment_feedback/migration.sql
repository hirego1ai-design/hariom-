-- Private candidate assessment coaching generated from deterministic facts.
-- This record cannot alter the authoritative MCQ score or skill evidence.

DO $$ BEGIN
  CREATE TYPE "AssessmentFeedbackStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AssessmentFeedback" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "status" "AssessmentFeedbackStatus" NOT NULL DEFAULT 'PENDING',
  "feedback" JSONB,
  "provider" TEXT,
  "model" TEXT,
  "schemaVersion" TEXT NOT NULL DEFAULT 'assessment-feedback-v1',
  "errorMessage" TEXT,
  "generatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentFeedback_attemptId_key"
  ON "AssessmentFeedback"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentFeedback_candidateProfileId_status_idx"
  ON "AssessmentFeedback"("candidateProfileId", "status");
CREATE INDEX IF NOT EXISTS "AssessmentFeedback_generatedAt_idx"
  ON "AssessmentFeedback"("generatedAt");

DO $$ BEGIN
  ALTER TABLE "AssessmentFeedback" ADD CONSTRAINT "AssessmentFeedback_attemptId_fkey"
    FOREIGN KEY ("attemptId") REFERENCES "McqAttempt"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AssessmentFeedback" ADD CONSTRAINT "AssessmentFeedback_candidateProfileId_fkey"
    FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public."AssessmentFeedback" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AssessmentFeedback" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."AssessmentFeedback" FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."AssessmentFeedback" FROM authenticated';
  END IF;
END
$$;
