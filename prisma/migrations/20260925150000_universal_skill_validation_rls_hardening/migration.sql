-- Keep universal skill evidence server-only in Supabase/Postgres.
-- The application accesses these tables through server-side Prisma. No
-- anon/authenticated Data API policy is intentionally provided.

ALTER TABLE public."CandidateSkill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SkillEvidence" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."CandidateSkill" FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."SkillEvidence" FROM PUBLIC, anon, authenticated;
