-- Keep universal skill evidence server-only in Supabase/Postgres.
-- The application accesses these tables through server-side Prisma. No
-- anon/authenticated Data API policy is intentionally provided.

ALTER TABLE public."CandidateSkill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SkillEvidence" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."CandidateSkill" FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public."SkillEvidence" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."CandidateSkill" FROM anon';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."SkillEvidence" FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."CandidateSkill" FROM authenticated';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."SkillEvidence" FROM authenticated';
  END IF;
END
$$;
