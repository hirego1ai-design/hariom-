ALTER TABLE "JobListing"
  ADD COLUMN "managedRequirementId" TEXT,
  ADD COLUMN "managedAgreementId" TEXT,
  ADD COLUMN "managedRoleKey" TEXT;

CREATE UNIQUE INDEX "JobListing_managedRequirementId_managedRoleKey_key"
  ON "JobListing"("managedRequirementId", "managedRoleKey");

CREATE INDEX "JobListing_managedAgreementId_idx"
  ON "JobListing"("managedAgreementId");

ALTER TABLE "JobListing"
  ADD CONSTRAINT "JobListing_managedRequirementId_fkey"
  FOREIGN KEY ("managedRequirementId")
  REFERENCES "HiringRequirement"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JobListing"
  ADD CONSTRAINT "JobListing_managedAgreementId_fkey"
  FOREIGN KEY ("managedAgreementId")
  REFERENCES "CommercialAgreement"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Interview"
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "transcriptProvider" TEXT,
  ADD COLUMN "transcriptModel" TEXT,
  ADD COLUMN "transcriptVersion" TEXT,
  ADD COLUMN "transcriptConfidence" DOUBLE PRECISION;

CREATE TABLE "InterviewEvaluation" (
  "id" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "overallScore" INTEGER NOT NULL,
  "technicalScore" INTEGER,
  "communicationScore" INTEGER,
  "problemSolvingScore" INTEGER,
  "evidenceConfidence" INTEGER NOT NULL,
  "recommendation" TEXT NOT NULL,
  "strengths" JSONB NOT NULL,
  "concerns" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "provider" TEXT,
  "model" TEXT,
  "schemaVersion" TEXT NOT NULL DEFAULT '1.0',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InterviewEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InterviewEvaluation_interviewId_key"
  ON "InterviewEvaluation"("interviewId");

ALTER TABLE "InterviewEvaluation"
  ADD CONSTRAINT "InterviewEvaluation_interviewId_fkey"
  FOREIGN KEY ("interviewId")
  REFERENCES "Interview"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
