-- Candidate availability is distinct from assessment-based CandidateReadiness.
-- No candidate is marked available by inference during migration.
CREATE TYPE "CandidateAvailabilityStatus" AS ENUM (
  'ACTIVE_CONFIRMED',
  'RECONFIRMATION_REQUIRED',
  'NOT_LOOKING',
  'JOINED',
  'TEMPORARILY_UNAVAILABLE'
);

ALTER TABLE "CandidateProfile"
  ADD COLUMN "availabilityStatus" "CandidateAvailabilityStatus" NOT NULL DEFAULT 'RECONFIRMATION_REQUIRED',
  ADD COLUMN "lastAvailabilityConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "availabilitySource" TEXT,
  ADD COLUMN "availabilityNote" TEXT;

CREATE INDEX "CandidateProfile_availabilityStatus_lastAvailabilityConfirmedAt_idx"
  ON "CandidateProfile"("availabilityStatus", "lastAvailabilityConfirmedAt");
