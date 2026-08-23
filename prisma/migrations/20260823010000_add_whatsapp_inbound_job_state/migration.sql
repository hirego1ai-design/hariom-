ALTER TABLE "WhatsAppInboundEvent"
  ADD COLUMN "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "messageText" TEXT;

CREATE INDEX "WhatsAppInboundEvent_processingStatus_nextAttemptAt_idx"
  ON "WhatsAppInboundEvent"("processingStatus", "nextAttemptAt");
