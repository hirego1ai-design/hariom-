-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

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
