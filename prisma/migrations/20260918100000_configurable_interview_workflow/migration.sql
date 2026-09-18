-- Configurable interview workflows and per-interviewer feedback
CREATE TYPE "CandidateFeedbackPolicy" AS ENUM ('REQUIRED','OPTIONAL','NOT_SHARED');
CREATE TYPE "PreviousFeedbackVisibility" AS ENUM ('FULL','SUMMARY_ONLY','HIDDEN_UNTIL_OWN_FEEDBACK','HIDDEN');
CREATE TYPE "InterviewRoundProgressStatus" AS ENUM ('PENDING','SCHEDULED','LIVE','ENDED_PENDING_FEEDBACK','ROUND_COMPLETE','TRANSFERRED','CANCELLED');

CREATE TABLE "JobInterviewProcess" (
  "id" TEXT NOT NULL, "jobId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "JobInterviewProcess_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "JobInterviewProcess_jobId_key" ON "JobInterviewProcess"("jobId");
CREATE INDEX "JobInterviewProcess_companyId_idx" ON "JobInterviewProcess"("companyId");

CREATE TABLE "InterviewRound" (
  "id" TEXT NOT NULL, "processId" TEXT NOT NULL, "sequence" INTEGER NOT NULL, "name" TEXT NOT NULL,
  "purpose" TEXT, "department" TEXT, "interviewType" TEXT NOT NULL DEFAULT 'VIDEO',
  "durationMins" INTEGER NOT NULL DEFAULT 30, "mandatory" BOOLEAN NOT NULL DEFAULT true,
  "mandatoryFeedback" BOOLEAN NOT NULL DEFAULT true,
  "candidateFeedbackPolicy" "CandidateFeedbackPolicy" NOT NULL DEFAULT 'OPTIONAL',
  "previousFeedbackVisibility" "PreviousFeedbackVisibility" NOT NULL DEFAULT 'HIDDEN_UNTIL_OWN_FEEDBACK',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterviewRound_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InterviewRound_processId_sequence_key" ON "InterviewRound"("processId","sequence");
CREATE INDEX "InterviewRound_processId_idx" ON "InterviewRound"("processId");

CREATE TABLE "InterviewRoundInterviewer" (
  "id" TEXT NOT NULL, "roundId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InterviewRoundInterviewer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InterviewRoundInterviewer_roundId_userId_key" ON "InterviewRoundInterviewer"("roundId","userId");
CREATE INDEX "InterviewRoundInterviewer_userId_idx" ON "InterviewRoundInterviewer"("userId");

CREATE TABLE "InterviewRoundProgress" (
  "id" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "roundId" TEXT NOT NULL, "interviewId" TEXT,
  "status" "InterviewRoundProgressStatus" NOT NULL DEFAULT 'PENDING', "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "InterviewRoundProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InterviewRoundProgress_interviewId_key" ON "InterviewRoundProgress"("interviewId");
CREATE UNIQUE INDEX "InterviewRoundProgress_applicationId_roundId_key" ON "InterviewRoundProgress"("applicationId","roundId");
CREATE INDEX "InterviewRoundProgress_applicationId_status_idx" ON "InterviewRoundProgress"("applicationId","status");

CREATE TABLE "InterviewFeedback" (
  "id" TEXT NOT NULL, "interviewId" TEXT NOT NULL, "roundProgressId" TEXT, "authorId" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL, "internalFeedback" JSONB NOT NULL, "candidateFeedback" TEXT,
  "candidateVisible" BOOLEAN NOT NULL DEFAULT false, "finalizedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InterviewFeedback_interviewId_authorId_key" ON "InterviewFeedback"("interviewId","authorId");
CREATE INDEX "InterviewFeedback_roundProgressId_idx" ON "InterviewFeedback"("roundProgressId");
CREATE INDEX "InterviewFeedback_authorId_finalizedAt_idx" ON "InterviewFeedback"("authorId","finalizedAt");

ALTER TABLE "JobInterviewProcess" ADD CONSTRAINT "JobInterviewProcess_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobInterviewProcess" ADD CONSTRAINT "JobInterviewProcess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_processId_fkey" FOREIGN KEY ("processId") REFERENCES "JobInterviewProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewRoundInterviewer" ADD CONSTRAINT "InterviewRoundInterviewer_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewRoundInterviewer" ADD CONSTRAINT "InterviewRoundInterviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewRoundProgress" ADD CONSTRAINT "InterviewRoundProgress_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewRoundProgress" ADD CONSTRAINT "InterviewRoundProgress_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InterviewRoundProgress" ADD CONSTRAINT "InterviewRoundProgress_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_roundProgressId_fkey" FOREIGN KEY ("roundProgressId") REFERENCES "InterviewRoundProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
