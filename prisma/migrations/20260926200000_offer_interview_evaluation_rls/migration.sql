-- Server-side Prisma is authoritative for newly introduced offer and interview-evaluation tables.
-- Keep Supabase browser roles fail-closed just like the rest of the production schema.

ALTER TABLE public."Offer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InterviewEvaluation" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."Offer" FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public."InterviewEvaluation" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."Offer" FROM anon';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."InterviewEvaluation" FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."Offer" FROM authenticated';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."InterviewEvaluation" FROM authenticated';
  END IF;
END
$$;
