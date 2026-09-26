-- Persist candidate acknowledgement of the Universal Skill Validation notice.
-- Server-side Prisma is authoritative; browser roles have no direct table access.

CREATE TABLE IF NOT EXISTS "AssessmentNoticeAcknowledgement" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "applicationId" TEXT,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "noticeVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentNoticeAcknowledgement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentNoticeAcknowledgement_candidateProfileId_assessmentId_key"
  ON "AssessmentNoticeAcknowledgement"("candidateProfileId", "assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentNoticeAcknowledgement_assessmentId_acknowledgedAt_idx"
  ON "AssessmentNoticeAcknowledgement"("assessmentId", "acknowledgedAt");
CREATE INDEX IF NOT EXISTS "AssessmentNoticeAcknowledgement_applicationId_idx"
  ON "AssessmentNoticeAcknowledgement"("applicationId");

DO $$ BEGIN
  ALTER TABLE "AssessmentNoticeAcknowledgement"
    ADD CONSTRAINT "AssessmentNoticeAcknowledgement_candidateProfileId_fkey"
    FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AssessmentNoticeAcknowledgement"
    ADD CONSTRAINT "AssessmentNoticeAcknowledgement_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "McqAssessment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public."AssessmentNoticeAcknowledgement" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AssessmentNoticeAcknowledgement" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."AssessmentNoticeAcknowledgement" FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."AssessmentNoticeAcknowledgement" FROM authenticated';
  END IF;
END
$$;
