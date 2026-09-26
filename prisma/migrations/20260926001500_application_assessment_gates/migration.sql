-- Explicit application gates keep compulsory universal validation separate
-- from normal pipeline ASSESSMENT states and future job-specific assessments.
-- Server-side Prisma is authoritative; browser roles receive no direct access.

DO $$ BEGIN
  CREATE TYPE "ApplicationGateType" AS ENUM ('UNIVERSAL_SKILL_VALIDATION', 'JOB_SPECIFIC_ASSESSMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationGateStatus" AS ENUM ('REQUIRED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ApplicationGate" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "type" "ApplicationGateType" NOT NULL,
  "status" "ApplicationGateStatus" NOT NULL DEFAULT 'REQUIRED',
  "assessmentId" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationGate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationGate_applicationId_type_key"
  ON "ApplicationGate"("applicationId", "type");
CREATE INDEX IF NOT EXISTS "ApplicationGate_type_status_idx"
  ON "ApplicationGate"("type", "status");
CREATE INDEX IF NOT EXISTS "ApplicationGate_assessmentId_idx"
  ON "ApplicationGate"("assessmentId");

DO $$ BEGIN
  ALTER TABLE "ApplicationGate" ADD CONSTRAINT "ApplicationGate_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ApplicationGate" ADD CONSTRAINT "ApplicationGate_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "McqAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public."ApplicationGate" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."ApplicationGate" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."ApplicationGate" FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."ApplicationGate" FROM authenticated';
  END IF;
END
$$;
