-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
