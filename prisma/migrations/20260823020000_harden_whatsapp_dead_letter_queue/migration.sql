-- Make terminal WhatsApp DLQ creation idempotent under duplicate worker delivery.
CREATE UNIQUE INDEX "DeadLetterJob_sourceType_sourceId_key"
  ON "DeadLetterJob"("sourceType", "sourceId");
