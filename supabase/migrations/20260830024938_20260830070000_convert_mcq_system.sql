-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

ALTER TABLE "TestCase" DROP CONSTRAINT "TestCase_problemId_fkey";
ALTER TABLE "CodingSubmission" DROP CONSTRAINT "CodingSubmission_candidateProfileId_fkey";
ALTER TABLE "CodingSubmission" DROP CONSTRAINT "CodingSubmission_problemId_fkey";
DROP TABLE "TestCase";
DROP TABLE "CodingSubmission";
DROP TABLE "CodingProblem";
DROP TYPE IF EXISTS "CodingDifficulty";
DROP TYPE IF EXISTS "SubmissionStatus";
CREATE TABLE "McqAssessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "passingPercentage" INTEGER NOT NULL DEFAULT 70,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "jobListingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "McqAssessment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "McqQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "McqQuestion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "McqOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "McqOption_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "McqAttempt" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "earnedPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    CONSTRAINT "McqAttempt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "McqCandidateAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    CONSTRAINT "McqCandidateAnswer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "McqAssessment_jobListingId_isActive_idx" ON "McqAssessment"("jobListingId", "isActive");
CREATE INDEX "McqQuestion_assessmentId_orderIndex_idx" ON "McqQuestion"("assessmentId", "orderIndex");
CREATE INDEX "McqOption_questionId_idx" ON "McqOption"("questionId");
CREATE INDEX "McqAttempt_candidateProfileId_assessmentId_idx" ON "McqAttempt"("candidateProfileId", "assessmentId");
CREATE INDEX "McqAttempt_candidateProfileId_startedAt_idx" ON "McqAttempt"("candidateProfileId", "startedAt");
CREATE UNIQUE INDEX "McqCandidateAnswer_attemptId_questionId_key" ON "McqCandidateAnswer"("attemptId", "questionId");
ALTER TABLE "McqAssessment" ADD CONSTRAINT "McqAssessment_jobListingId_fkey" FOREIGN KEY ("jobListingId") REFERENCES "JobListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "McqQuestion" ADD CONSTRAINT "McqQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "McqAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McqOption" ADD CONSTRAINT "McqOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "McqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McqAttempt" ADD CONSTRAINT "McqAttempt_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McqAttempt" ADD CONSTRAINT "McqAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "McqAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McqCandidateAnswer" ADD CONSTRAINT "McqCandidateAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "McqAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McqCandidateAnswer" ADD CONSTRAINT "McqCandidateAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "McqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McqCandidateAnswer" ADD CONSTRAINT "McqCandidateAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "McqOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
