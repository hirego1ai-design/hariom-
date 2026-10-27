-- Create unique index for atomic constraint to prevent duplicate applications
-- This index is generated from the Prisma schema's @@unique([candidateProfileId, jobId])
-- and ensures database-level enforcement of one application per candidate per job

CREATE UNIQUE INDEX IF NOT EXISTS "Application_candidateProfileId_jobId_key" ON "Application"("candidateProfileId", "jobId");
