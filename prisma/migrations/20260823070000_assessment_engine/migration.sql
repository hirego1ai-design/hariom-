-- CreateEnum: CodingDifficulty
CREATE TYPE "CodingDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum: SubmissionStatus
CREATE TYPE "SubmissionStatus" AS ENUM ('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILE_ERROR', 'PENDING');

-- CreateEnum: MockInterviewStatus
CREATE TYPE "MockInterviewStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- AlterTable: Add matching fields to JobListing
ALTER TABLE "JobListing" ADD COLUMN "matchingConfig" JSONB;
ALTER TABLE "JobListing" ADD COLUMN "screeningQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "JobListing" ADD COLUMN "aiFocusAreas" TEXT;
ALTER TABLE "JobListing" ADD COLUMN "skillRequirements" JSONB;

-- CreateTable: CodingProblem
CREATE TABLE "CodingProblem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "CodingDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'algorithms',
    "description" TEXT NOT NULL,
    "starterCode" JSONB NOT NULL,
    "solutionTemplate" JSONB,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 128,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CodingProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TestCase
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CodingSubmission
CREATE TABLE "CodingSubmission" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER NOT NULL DEFAULT 0,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "runtimeMs" INTEGER,
    "memoryMb" DOUBLE PRECISION,
    "stdout" TEXT,
    "stderr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CodingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TypingAssessment
CREATE TABLE "TypingAssessment" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "wpm" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "promptText" TEXT NOT NULL,
    "typedText" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TypingAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MockInterviewSession
CREATE TABLE "MockInterviewSession" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "roleTarget" TEXT NOT NULL,
    "status" "MockInterviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestions" INTEGER NOT NULL DEFAULT 5,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER,
    "communicationScore" INTEGER,
    "technicalScore" INTEGER,
    "integrityScore" INTEGER,
    "aiFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MockInterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MockInterviewTurn
CREATE TABLE "MockInterviewTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "candidateAnswerTranscript" TEXT,
    "score" INTEGER,
    "feedback" TEXT,
    "turnLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MockInterviewTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodingProblem_slug_key" ON "CodingProblem"("slug");
CREATE INDEX "CodingProblem_difficulty_isActive_idx" ON "CodingProblem"("difficulty", "isActive");
CREATE INDEX "CodingProblem_category_isActive_idx" ON "CodingProblem"("category", "isActive");

CREATE INDEX "TestCase_problemId_isHidden_idx" ON "TestCase"("problemId", "isHidden");

CREATE INDEX "CodingSubmission_candidateProfileId_problemId_idx" ON "CodingSubmission"("candidateProfileId", "problemId");
CREATE INDEX "CodingSubmission_candidateProfileId_createdAt_idx" ON "CodingSubmission"("candidateProfileId", "createdAt");

CREATE UNIQUE INDEX "TypingAssessment_certificateId_key" ON "TypingAssessment"("certificateId");
CREATE INDEX "TypingAssessment_candidateProfileId_createdAt_idx" ON "TypingAssessment"("candidateProfileId", "createdAt");

CREATE INDEX "MockInterviewSession_candidateProfileId_status_idx" ON "MockInterviewSession"("candidateProfileId", "status");
CREATE INDEX "MockInterviewSession_candidateProfileId_createdAt_idx" ON "MockInterviewSession"("candidateProfileId", "createdAt");

CREATE UNIQUE INDEX "MockInterviewTurn_sessionId_questionIndex_key" ON "MockInterviewTurn"("sessionId", "questionIndex");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "CodingProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "CodingProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TypingAssessment" ADD CONSTRAINT "TypingAssessment_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockInterviewTurn" ADD CONSTRAINT "MockInterviewTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
