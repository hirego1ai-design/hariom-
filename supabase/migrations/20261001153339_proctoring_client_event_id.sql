ALTER TABLE "ProctoringTelemetry"
ADD COLUMN "clientEventId" TEXT;

CREATE UNIQUE INDEX "ProctoringTelemetry_interviewId_candidateId_clientEventId_key"
ON "ProctoringTelemetry"("interviewId", "candidateId", "clientEventId");
