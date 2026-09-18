CREATE TYPE "RecordedAssessmentMediaType" AS ENUM ('AUDIO', 'VIDEO');
CREATE TYPE "RecordedAssessmentAttemptStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED_PROCTORING', 'ABANDONED');
CREATE TYPE "RecordedAssessmentAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'BLOCKED_INFRA', 'FAILED');

CREATE TABLE "RecordedAssessmentQuestionBank" (
  "id" TEXT NOT NULL, "roleTitle" TEXT NOT NULL, "industry" TEXT, "department" TEXT,
  "skillTags" TEXT[] DEFAULT ARRAY[]::TEXT[], "questionText" TEXT NOT NULL, "difficulty" TEXT NOT NULL DEFAULT 'BASIC',
  "readingTimeSeconds" INTEGER NOT NULL DEFAULT 10, "answerDurationSeconds" INTEGER NOT NULL DEFAULT 30,
  "version" INTEGER NOT NULL DEFAULT 1, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecordedAssessmentQuestionBank_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecordedAssessmentConfig" (
  "id" TEXT NOT NULL, "jobListingId" TEXT NOT NULL, "mediaType" "RecordedAssessmentMediaType" NOT NULL DEFAULT 'VIDEO',
  "defaultReadingTimeSeconds" INTEGER NOT NULL DEFAULT 10, "defaultAnswerSeconds" INTEGER NOT NULL DEFAULT 30,
  "questionCount" INTEGER NOT NULL DEFAULT 6, "proctoringEnabled" BOOLEAN NOT NULL DEFAULT true, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecordedAssessmentConfig_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecordedAssessmentAttempt" (
  "id" TEXT NOT NULL, "candidateProfileId" TEXT NOT NULL, "jobListingId" TEXT NOT NULL,
  "mediaType" "RecordedAssessmentMediaType" NOT NULL, "status" "RecordedAssessmentAttemptStatus" NOT NULL DEFAULT 'CREATED',
  "questionSetVersion" INTEGER NOT NULL DEFAULT 1, "configSnapshot" JSONB, "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "terminatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecordedAssessmentAttempt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecordedAssessmentAttemptQuestion" (
  "id" TEXT NOT NULL, "attemptId" TEXT NOT NULL, "sourceQuestionId" TEXT, "questionText" TEXT NOT NULL, "roleTitle" TEXT NOT NULL,
  "skillTags" TEXT[] DEFAULT ARRAY[]::TEXT[], "orderIndex" INTEGER NOT NULL, "readingTimeSeconds" INTEGER NOT NULL DEFAULT 10,
  "answerDurationSeconds" INTEGER NOT NULL, "sourceVersion" INTEGER NOT NULL, "difficulty" TEXT NOT NULL, "industry" TEXT, "department" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecordedAssessmentAttemptQuestion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecordedAssessmentResponse" (
  "id" TEXT NOT NULL, "attemptQuestionId" TEXT NOT NULL, "storedFileId" TEXT, "mediaType" "RecordedAssessmentMediaType" NOT NULL,
  "durationSeconds" INTEGER NOT NULL, "transcript" TEXT, "analysisStatus" "RecordedAssessmentAnalysisStatus" NOT NULL DEFAULT 'PENDING',
  "analysisResult" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecordedAssessmentResponse_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecordedAssessmentProctoringEvent" (
  "id" TEXT NOT NULL, "attemptId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "severity" TEXT NOT NULL, "evidence" JSONB,
  "warningNumber" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecordedAssessmentProctoringEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecordedAssessmentConfig_jobListingId_key" ON "RecordedAssessmentConfig"("jobListingId");
CREATE INDEX "RecordedAssessmentQuestionBank_roleTitle_industry_department_isActive_idx" ON "RecordedAssessmentQuestionBank"("roleTitle","industry","department","isActive");
CREATE INDEX "RecordedAssessmentQuestionBank_isActive_updatedAt_idx" ON "RecordedAssessmentQuestionBank"("isActive","updatedAt");
CREATE INDEX "RecordedAssessmentAttempt_candidateProfileId_createdAt_idx" ON "RecordedAssessmentAttempt"("candidateProfileId","createdAt");
CREATE INDEX "RecordedAssessmentAttempt_jobListingId_status_idx" ON "RecordedAssessmentAttempt"("jobListingId","status");
CREATE UNIQUE INDEX "RecordedAssessmentAttemptQuestion_attemptId_orderIndex_key" ON "RecordedAssessmentAttemptQuestion"("attemptId","orderIndex");
CREATE INDEX "RecordedAssessmentAttemptQuestion_sourceQuestionId_idx" ON "RecordedAssessmentAttemptQuestion"("sourceQuestionId");
CREATE UNIQUE INDEX "RecordedAssessmentResponse_attemptQuestionId_key" ON "RecordedAssessmentResponse"("attemptQuestionId");
CREATE INDEX "RecordedAssessmentResponse_storedFileId_idx" ON "RecordedAssessmentResponse"("storedFileId");
CREATE INDEX "RecordedAssessmentResponse_analysisStatus_idx" ON "RecordedAssessmentResponse"("analysisStatus");
CREATE INDEX "RecordedAssessmentProctoringEvent_attemptId_createdAt_idx" ON "RecordedAssessmentProctoringEvent"("attemptId","createdAt");
CREATE INDEX "RecordedAssessmentProctoringEvent_eventType_createdAt_idx" ON "RecordedAssessmentProctoringEvent"("eventType","createdAt");

ALTER TABLE "RecordedAssessmentConfig" ADD CONSTRAINT "RecordedAssessmentConfig_jobListingId_fkey" FOREIGN KEY ("jobListingId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordedAssessmentAttempt" ADD CONSTRAINT "RecordedAssessmentAttempt_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordedAssessmentAttempt" ADD CONSTRAINT "RecordedAssessmentAttempt_jobListingId_fkey" FOREIGN KEY ("jobListingId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordedAssessmentAttemptQuestion" ADD CONSTRAINT "RecordedAssessmentAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "RecordedAssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordedAssessmentAttemptQuestion" ADD CONSTRAINT "RecordedAssessmentAttemptQuestion_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "RecordedAssessmentQuestionBank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecordedAssessmentResponse" ADD CONSTRAINT "RecordedAssessmentResponse_attemptQuestionId_fkey" FOREIGN KEY ("attemptQuestionId") REFERENCES "RecordedAssessmentAttemptQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordedAssessmentResponse" ADD CONSTRAINT "RecordedAssessmentResponse_storedFileId_fkey" FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecordedAssessmentProctoringEvent" ADD CONSTRAINT "RecordedAssessmentProctoringEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "RecordedAssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecordedAssessmentQuestionBank" ADD CONSTRAINT "RecordedAssessmentQuestionBank_readingTimeSeconds_check" CHECK ("readingTimeSeconds" = 10);
ALTER TABLE "RecordedAssessmentQuestionBank" ADD CONSTRAINT "RecordedAssessmentQuestionBank_answerDurationSeconds_check" CHECK ("answerDurationSeconds" IN (30, 60));
ALTER TABLE "RecordedAssessmentQuestionBank" ADD CONSTRAINT "RecordedAssessmentQuestionBank_version_check" CHECK ("version" > 0);
ALTER TABLE "RecordedAssessmentConfig" ADD CONSTRAINT "RecordedAssessmentConfig_defaultReadingTimeSeconds_check" CHECK ("defaultReadingTimeSeconds" = 10);
ALTER TABLE "RecordedAssessmentConfig" ADD CONSTRAINT "RecordedAssessmentConfig_defaultAnswerSeconds_check" CHECK ("defaultAnswerSeconds" IN (30, 60));
ALTER TABLE "RecordedAssessmentConfig" ADD CONSTRAINT "RecordedAssessmentConfig_questionCount_check" CHECK ("questionCount" BETWEEN 1 AND 20);
ALTER TABLE "RecordedAssessmentAttemptQuestion" ADD CONSTRAINT "RecordedAssessmentAttemptQuestion_readingTimeSeconds_check" CHECK ("readingTimeSeconds" = 10);
ALTER TABLE "RecordedAssessmentAttemptQuestion" ADD CONSTRAINT "RecordedAssessmentAttemptQuestion_answerDurationSeconds_check" CHECK ("answerDurationSeconds" IN (30, 60));
ALTER TABLE "RecordedAssessmentResponse" ADD CONSTRAINT "RecordedAssessmentResponse_durationSeconds_check" CHECK ("durationSeconds" BETWEEN 0 AND 60);
ALTER TABLE "RecordedAssessmentProctoringEvent" ADD CONSTRAINT "RecordedAssessmentProctoringEvent_warningNumber_check" CHECK ("warningNumber" IS NULL OR "warningNumber" BETWEEN 1 AND 3);

CREATE TABLE "RecordedAssessmentAnalysisJob" (
  "id" TEXT NOT NULL, "responseId" TEXT NOT NULL, "status" "RecordedAssessmentAnalysisStatus" NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" TEXT NOT NULL, "attempts" INTEGER NOT NULL DEFAULT 0, "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "error" TEXT, "payload" JSONB, "result" JSONB, "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecordedAssessmentAnalysisJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RecordedAssessmentAnalysisJob_idempotencyKey_key" ON "RecordedAssessmentAnalysisJob"("idempotencyKey");
CREATE INDEX "RecordedAssessmentAnalysisJob_responseId_idx" ON "RecordedAssessmentAnalysisJob"("responseId");
CREATE INDEX "RecordedAssessmentAnalysisJob_status_idx" ON "RecordedAssessmentAnalysisJob"("status");
ALTER TABLE "RecordedAssessmentAnalysisJob" ADD CONSTRAINT "RecordedAssessmentAnalysisJob_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "RecordedAssessmentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "RecordedAssessmentAttempt_active_candidate_job_key" ON "RecordedAssessmentAttempt"("candidateProfileId","jobListingId") WHERE "status" IN ('CREATED','IN_PROGRESS');
