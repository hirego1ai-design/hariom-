-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

CREATE TABLE "InterviewSignal" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewSignal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InterviewSignal_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "InterviewSignal_interviewId_createdAt_idx" ON "InterviewSignal"("interviewId", "createdAt");
CREATE INDEX "InterviewSignal_expiresAt_idx" ON "InterviewSignal"("expiresAt");
