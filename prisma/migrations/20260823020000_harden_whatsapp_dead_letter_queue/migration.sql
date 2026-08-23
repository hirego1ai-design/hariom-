-- Do not silently delete historical operational incidents.  Stop deployment
-- with a clear reconciliation query if pre-existing duplicate deliveries exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "DeadLetterJob"
    GROUP BY "sourceType", "sourceId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add DeadLetterJob(sourceType, sourceId) uniqueness while duplicate rows exist. Reconcile duplicates before deployment.';
  END IF;
END $$;

-- Make terminal WhatsApp DLQ creation idempotent under duplicate worker delivery.
CREATE UNIQUE INDEX "DeadLetterJob_sourceType_sourceId_key"
  ON "DeadLetterJob"("sourceType", "sourceId");
