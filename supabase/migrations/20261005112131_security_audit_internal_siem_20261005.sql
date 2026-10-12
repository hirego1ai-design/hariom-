-- Reconciles a previously applied production-only Supabase migration.
-- No SIEM credentials or token digests are stored in source control.
CREATE TABLE IF NOT EXISTS public."SecurityAuditSiemConfig" (
  id text PRIMARY KEY,
  "tokenSha256" text NOT NULL CHECK ("tokenSha256" ~ '^[0-9a-f]{64}$'),
  active boolean NOT NULL DEFAULT true,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public."SecurityAuditSiemEvent" (
  id text PRIMARY KEY,
  "payloadSha256" text NOT NULL CHECK ("payloadSha256" ~ '^[0-9a-f]{64}$'),
  payload jsonb NOT NULL,
  "receivedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "SecurityAuditSiemEvent_receivedAt_idx"
  ON public."SecurityAuditSiemEvent" ("receivedAt" DESC);
ALTER TABLE public."SecurityAuditSiemConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SecurityAuditSiemEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."SecurityAuditSiemConfig" FROM PUBLIC;
REVOKE ALL ON TABLE public."SecurityAuditSiemEvent" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON TABLE public."SecurityAuditSiemConfig" FROM anon;
    REVOKE ALL ON TABLE public."SecurityAuditSiemEvent" FROM anon;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON TABLE public."SecurityAuditSiemConfig" FROM authenticated;
    REVOKE ALL ON TABLE public."SecurityAuditSiemEvent" FROM authenticated;
  END IF;
END $$;
-- Configure a SIEM token securely via Admin/secret handling; never seed a static secret.
