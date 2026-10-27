-- Reconciles a production hotfix without resetting existing sessions.
ALTER TABLE public."MockInterviewSession" ADD COLUMN IF NOT EXISTS "idempotencyKey" text;
CREATE UNIQUE INDEX IF NOT EXISTS "MockInterviewSession_idempotencyKey_key"
  ON public."MockInterviewSession" ("idempotencyKey");
