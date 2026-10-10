CREATE TABLE IF NOT EXISTS "AiProviderCredential" (
    "provider" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT,
    "baseUrl" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiProviderCredential_pkey" PRIMARY KEY ("provider")
);

-- Stored API keys must never be accessible to Supabase client roles.
ALTER TABLE "AiProviderCredential" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "AiProviderCredential" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "AiProviderCredential" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "AiProviderCredential" FROM authenticated;
  END IF;
END $$;
