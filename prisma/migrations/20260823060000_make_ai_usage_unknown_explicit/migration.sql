-- Provider usage is nullable because absent provider telemetry is unknown, not
-- zero.  This prevents reporting invented token or cost values as actual AI
-- spend.
ALTER TABLE "AiExecutionLog"
  ALTER COLUMN "promptTokens" DROP NOT NULL,
  ALTER COLUMN "completionTokens" DROP NOT NULL,
  ALTER COLUMN "totalTokens" DROP NOT NULL,
  ALTER COLUMN "costEstUsd" DROP NOT NULL;
