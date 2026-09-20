ALTER TABLE "CommunicationDelivery"
ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "retryable" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "CommunicationDelivery_status_retryable_nextAttemptAt_idx"
ON "CommunicationDelivery"("status", "retryable", "nextAttemptAt");
