-- Reconciles encrypted server-only AI provider credentials in production.
CREATE TABLE IF NOT EXISTS public."AiProviderCredential" (
  "provider" text NOT NULL PRIMARY KEY,
  "apiKeyEncrypted" text,
  "baseUrl" text,
  "updatedBy" text,
  "updatedAt" timestamp(3) NOT NULL
);
ALTER TABLE public."AiProviderCredential" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."AiProviderCredential" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON TABLE public."AiProviderCredential" FROM anon;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON TABLE public."AiProviderCredential" FROM authenticated;
  END IF;
END $$;
