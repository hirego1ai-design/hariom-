-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

CREATE UNIQUE INDEX "DeadLetterJob_sourceType_sourceId_key" ON "DeadLetterJob"("sourceType", "sourceId");
