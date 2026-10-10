CREATE TABLE "AiProviderCredential" (
    "provider" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT,
    "baseUrl" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiProviderCredential_pkey" PRIMARY KEY ("provider")
);
