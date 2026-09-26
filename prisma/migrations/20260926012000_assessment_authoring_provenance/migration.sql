ALTER TABLE "McqAssessment"
  ADD COLUMN IF NOT EXISTS "authoringProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "authoringModel" TEXT,
  ADD COLUMN IF NOT EXISTS "authoringVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "authoringSource" TEXT;
