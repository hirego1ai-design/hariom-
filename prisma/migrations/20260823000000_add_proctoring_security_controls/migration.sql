ALTER TABLE "OtpVerification"
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3);

CREATE TABLE "ProctoringTelemetry" (
  "id" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "violationType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProctoringTelemetry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProctoringTelemetry_interviewId_createdAt_idx"
  ON "ProctoringTelemetry"("interviewId", "createdAt");

CREATE INDEX "ProctoringTelemetry_candidateId_createdAt_idx"
  ON "ProctoringTelemetry"("candidateId", "createdAt");

ALTER TABLE "ProctoringTelemetry"
  ADD CONSTRAINT "ProctoringTelemetry_interviewId_fkey"
  FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProctoringTelemetry"
  ADD CONSTRAINT "ProctoringTelemetry_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
