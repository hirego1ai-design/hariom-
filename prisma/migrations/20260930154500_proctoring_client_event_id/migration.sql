-- Durable client identity for live-interview browser observations.
-- Existing telemetry remains valid with NULL clientEventId; all new API writes
-- provide a UUID and are idempotent per interview/candidate/event.
ALTER TABLE "ProctoringTelemetry"
ADD COLUMN "clientEventId" TEXT;

CREATE UNIQUE INDEX "ProctoringTelemetry_interviewId_candidateId_clientEventId_key"
ON "ProctoringTelemetry"("interviewId", "candidateId", "clientEventId");
