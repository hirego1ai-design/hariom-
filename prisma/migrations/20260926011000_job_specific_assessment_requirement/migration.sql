ALTER TABLE "JobListing"
  ADD COLUMN IF NOT EXISTS "requiresJobSpecificAssessment" BOOLEAN NOT NULL DEFAULT false;
