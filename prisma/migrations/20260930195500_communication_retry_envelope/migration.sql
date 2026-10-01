-- Bounded encrypted replay state for definitive communication-provider failures.
ALTER TABLE "CommunicationDelivery"
  ADD COLUMN "replayEnvelopeEncrypted" TEXT,
  ADD COLUMN "replayEnvelopeVersion" INTEGER,
  ADD COLUMN "replayExpiresAt" TIMESTAMP(3),
  ADD COLUMN "retryLeaseId" TEXT,
  ADD COLUMN "retryLeasedUntil" TIMESTAMP(3);

CREATE INDEX "CommunicationDelivery_status_retryLeasedUntil_idx"
  ON "CommunicationDelivery"("status", "retryLeasedUntil");
