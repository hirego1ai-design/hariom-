-- Production reconciliation for the candidate Job-Ready foundation.
-- This is additive only: no existing rows are deleted or rewritten.

DO $$ BEGIN
  CREATE TYPE "AssessmentScope" AS ENUM ('EMPLOYER_JOB', 'PLATFORM_READINESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "CandidateReadinessStatus" AS ENUM ('NOT_STARTED', 'DEVELOPING', 'JOB_READY', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "CandidateCreditLedgerType" AS ENUM ('PURCHASE', 'BONUS', 'SPEND', 'REFUND', 'ADJUSTMENT', 'EXPIRY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "CandidateServiceUsageStatus" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "JobListing"
  ADD COLUMN IF NOT EXISTS "requiresJobReady" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "jobReadyRoleTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "jobReadySeniority" TEXT;

ALTER TABLE "McqAssessment"
  ADD COLUMN IF NOT EXISTS "scope" "AssessmentScope" NOT NULL DEFAULT 'EMPLOYER_JOB',
  ADD COLUMN IF NOT EXISTS "roleTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seniority" TEXT,
  ADD COLUMN IF NOT EXISTS "validityDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "retakeCooldownHours" INTEGER;
ALTER TABLE "McqAssessment" ALTER COLUMN "isActive" SET DEFAULT false;

CREATE INDEX IF NOT EXISTS "McqAssessment_scope_roleTitle_seniority_isActive_idx"
  ON "McqAssessment"("scope", "roleTitle", "seniority", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "McqAttempt_one_active_attempt_per_candidate_assessment_key"
  ON "McqAttempt"("candidateProfileId", "assessmentId")
  WHERE "submittedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "CandidateReadiness" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "roleTitle" TEXT NOT NULL,
  "seniority" TEXT NOT NULL,
  "status" "CandidateReadinessStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "score" INTEGER,
  "assessmentId" TEXT,
  "assessedAt" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateReadiness_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateReadiness_candidateProfileId_roleTitle_seniority_key"
  ON "CandidateReadiness"("candidateProfileId", "roleTitle", "seniority");
CREATE INDEX IF NOT EXISTS "CandidateReadiness_candidateProfileId_status_idx"
  ON "CandidateReadiness"("candidateProfileId", "status");
CREATE INDEX IF NOT EXISTS "CandidateReadiness_roleTitle_seniority_status_idx"
  ON "CandidateReadiness"("roleTitle", "seniority", "status");
DO $$ BEGIN
  ALTER TABLE "CandidateReadiness" ADD CONSTRAINT "CandidateReadiness_candidateProfileId_fkey"
    FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CandidateReadiness" ADD CONSTRAINT "CandidateReadiness_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "McqAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CandidateCreditWallet" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateCreditWallet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateCreditWallet_candidateProfileId_key"
  ON "CandidateCreditWallet"("candidateProfileId");
DO $$ BEGIN
  ALTER TABLE "CandidateCreditWallet" ADD CONSTRAINT "CandidateCreditWallet_candidateProfileId_fkey"
    FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CandidateCreditLedger" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "type" "CandidateCreditLedgerType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "serviceKey" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CandidateCreditLedger_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateCreditLedger_idempotencyKey_key"
  ON "CandidateCreditLedger"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "CandidateCreditLedger_candidateProfileId_createdAt_idx"
  ON "CandidateCreditLedger"("candidateProfileId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "CandidateCreditLedger" ADD CONSTRAINT "CandidateCreditLedger_candidateProfileId_fkey"
    FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CandidateServiceCatalog" (
  "id" TEXT NOT NULL,
  "serviceKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "creditCost" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateServiceCatalog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateServiceCatalog_serviceKey_key"
  ON "CandidateServiceCatalog"("serviceKey");

CREATE TABLE IF NOT EXISTS "CandidateServiceUsage" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "ledgerId" TEXT NOT NULL,
  "status" "CandidateServiceUsageStatus" NOT NULL DEFAULT 'REQUESTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateServiceUsage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateServiceUsage_ledgerId_key"
  ON "CandidateServiceUsage"("ledgerId");
CREATE INDEX IF NOT EXISTS "CandidateServiceUsage_candidateProfileId_status_createdAt_idx"
  ON "CandidateServiceUsage"("candidateProfileId", "status", "createdAt");
DO $$ BEGIN
  ALTER TABLE "CandidateServiceUsage" ADD CONSTRAINT "CandidateServiceUsage_candidateProfileId_fkey"
    FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CandidateServiceUsage" ADD CONSTRAINT "CandidateServiceUsage_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "CandidateServiceCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CandidateServiceUsage" ADD CONSTRAINT "CandidateServiceUsage_ledgerId_fkey"
    FOREIGN KEY ("ledgerId") REFERENCES "CandidateCreditLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "TypingPracticePrompt" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "durationSeconds" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TypingPracticePrompt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TypingPracticePrompt_isActive_updatedAt_idx"
  ON "TypingPracticePrompt"("isActive", "updatedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TypingPracticePrompt_one_active_prompt_key"
  ON "TypingPracticePrompt" ("isActive") WHERE "isActive" = true;
