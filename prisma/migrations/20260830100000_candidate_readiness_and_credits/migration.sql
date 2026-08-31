-- Additive candidate Job-Ready and Career Credit foundations.
-- This migration creates no sample roles, questions, services, balances, or
-- prices. Those business settings must be created by an administrator.

CREATE TYPE "AssessmentScope" AS ENUM ('EMPLOYER_JOB', 'PLATFORM_READINESS');
CREATE TYPE "CandidateReadinessStatus" AS ENUM ('NOT_STARTED', 'DEVELOPING', 'JOB_READY', 'EXPIRED');
CREATE TYPE "CandidateCreditLedgerType" AS ENUM ('PURCHASE', 'BONUS', 'SPEND', 'REFUND', 'ADJUSTMENT', 'EXPIRY');
CREATE TYPE "CandidateServiceUsageStatus" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED');

ALTER TABLE "JobListing"
  ADD COLUMN "requiresJobReady" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "jobReadyRoleTitle" TEXT,
  ADD COLUMN "jobReadySeniority" TEXT;

ALTER TABLE "McqAssessment"
  ADD COLUMN "scope" "AssessmentScope" NOT NULL DEFAULT 'EMPLOYER_JOB',
  ADD COLUMN "roleTitle" TEXT,
  ADD COLUMN "seniority" TEXT,
  ADD COLUMN "validityDays" INTEGER,
  ADD COLUMN "retakeCooldownHours" INTEGER;

CREATE INDEX "McqAssessment_scope_roleTitle_seniority_isActive_idx"
  ON "McqAssessment"("scope", "roleTitle", "seniority", "isActive");

CREATE TABLE "CandidateReadiness" (
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
CREATE UNIQUE INDEX "CandidateReadiness_candidateProfileId_roleTitle_seniority_key"
  ON "CandidateReadiness"("candidateProfileId", "roleTitle", "seniority");
CREATE INDEX "CandidateReadiness_candidateProfileId_status_idx"
  ON "CandidateReadiness"("candidateProfileId", "status");
CREATE INDEX "CandidateReadiness_roleTitle_seniority_status_idx"
  ON "CandidateReadiness"("roleTitle", "seniority", "status");
ALTER TABLE "CandidateReadiness" ADD CONSTRAINT "CandidateReadiness_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateReadiness" ADD CONSTRAINT "CandidateReadiness_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "McqAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CandidateCreditWallet" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateCreditWallet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CandidateCreditWallet_candidateProfileId_key" ON "CandidateCreditWallet"("candidateProfileId");
ALTER TABLE "CandidateCreditWallet" ADD CONSTRAINT "CandidateCreditWallet_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CandidateCreditLedger" (
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
CREATE UNIQUE INDEX "CandidateCreditLedger_idempotencyKey_key" ON "CandidateCreditLedger"("idempotencyKey");
CREATE INDEX "CandidateCreditLedger_candidateProfileId_createdAt_idx" ON "CandidateCreditLedger"("candidateProfileId", "createdAt");
ALTER TABLE "CandidateCreditLedger" ADD CONSTRAINT "CandidateCreditLedger_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CandidateServiceCatalog" (
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
CREATE UNIQUE INDEX "CandidateServiceCatalog_serviceKey_key" ON "CandidateServiceCatalog"("serviceKey");

CREATE TABLE "CandidateServiceUsage" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "ledgerId" TEXT NOT NULL,
  "status" "CandidateServiceUsageStatus" NOT NULL DEFAULT 'REQUESTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateServiceUsage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CandidateServiceUsage_ledgerId_key" ON "CandidateServiceUsage"("ledgerId");
CREATE INDEX "CandidateServiceUsage_candidateProfileId_status_createdAt_idx"
  ON "CandidateServiceUsage"("candidateProfileId", "status", "createdAt");
ALTER TABLE "CandidateServiceUsage" ADD CONSTRAINT "CandidateServiceUsage_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateServiceUsage" ADD CONSTRAINT "CandidateServiceUsage_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "CandidateServiceCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CandidateServiceUsage" ADD CONSTRAINT "CandidateServiceUsage_ledgerId_fkey"
  FOREIGN KEY ("ledgerId") REFERENCES "CandidateCreditLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
