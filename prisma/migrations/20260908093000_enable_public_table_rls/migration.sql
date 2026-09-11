-- HireGo uses server-side Prisma and custom JWTs rather than the Supabase
-- browser Data API. Keep all application tables inaccessible to anonymous and
-- authenticated Data API roles even if an accidental future grant is added.
-- Do not FORCE RLS: the trusted server-side database role intentionally
-- bypasses it. Prisma's migration ledger is excluded from this protection.
DO $$
DECLARE
  target_table text;
BEGIN
  FOR target_table IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
  END LOOP;
END
$$;
