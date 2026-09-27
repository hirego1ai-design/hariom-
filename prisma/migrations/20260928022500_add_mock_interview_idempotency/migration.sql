ALTER TABLE "MockInterviewSession" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "MockInterviewSession_idempotencyKey_key"
ON "MockInterviewSession"("idempotencyKey");
