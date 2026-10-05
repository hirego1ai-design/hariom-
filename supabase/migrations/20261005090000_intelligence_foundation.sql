CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
SET search_path = public, extensions;

DO $$ BEGIN
  CREATE TYPE "AiArtifactStage" AS ENUM ('DRAFT','SHADOW','EVALUATED','APPROVED','CANARY','PRODUCTION','ROLLED_BACK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "UserAiPreference" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "preferredLanguage" TEXT, "autoDetectLanguage" BOOLEAN NOT NULL DEFAULT true,
  "allowCodeSwitching" BOOLEAN NOT NULL DEFAULT true, "preferredVoiceKey" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UserAiPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserAiPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserAiPreference_userId_key" ON "UserAiPreference"("userId");
CREATE INDEX IF NOT EXISTS "UserAiPreference_preferredLanguage_idx" ON "UserAiPreference"("preferredLanguage");

CREATE TABLE IF NOT EXISTS "SemanticMemoryRecord" (
  "id" TEXT NOT NULL, "dedupeKey" TEXT NOT NULL, "userId" TEXT, "companyId" TEXT, "scopeLevel" "MemoryScopeLevel" NOT NULL,
  "scopeId" TEXT NOT NULL, "agentId" TEXT NOT NULL, "memoryType" "MemoryType" NOT NULL DEFAULT 'KNOWLEDGE', "sourceType" TEXT NOT NULL,
  "sourceId" TEXT, "content" TEXT NOT NULL, "metadata" JSONB, "embeddingModel" TEXT NOT NULL, "embeddingDimensions" INTEGER NOT NULL,
  "embedding" vector, "expiresAt" TIMESTAMP(3), "isAnonymized" BOOLEAN NOT NULL DEFAULT false, "consentState" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SemanticMemoryRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SemanticMemoryRecord_dedupeKey_key" ON "SemanticMemoryRecord"("dedupeKey");
CREATE INDEX IF NOT EXISTS "SemanticMemoryRecord_companyId_scopeLevel_scopeId_idx" ON "SemanticMemoryRecord"("companyId","scopeLevel","scopeId");
CREATE INDEX IF NOT EXISTS "SemanticMemoryRecord_userId_scopeLevel_scopeId_idx" ON "SemanticMemoryRecord"("userId","scopeLevel","scopeId");
CREATE INDEX IF NOT EXISTS "SemanticMemoryRecord_embeddingModel_embeddingDimensions_idx" ON "SemanticMemoryRecord"("embeddingModel","embeddingDimensions");
CREATE INDEX IF NOT EXISTS "SemanticMemoryRecord_expiresAt_idx" ON "SemanticMemoryRecord"("expiresAt");

CREATE TABLE IF NOT EXISTS "LearningEvent" (
  "id" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "correlationId" TEXT NOT NULL, "actorUserId" TEXT, "actorRole" "Role", "companyId" TEXT,
  "channel" TEXT NOT NULL, "feature" TEXT NOT NULL, "task" TEXT NOT NULL, "modelProvider" TEXT, "modelId" TEXT, "promptVersion" TEXT,
  "evidenceRefs" JSONB, "aiOutput" JSONB, "correction" JSONB, "acceptedResult" JSONB, "outcome" JSONB, "explicitRating" INTEGER,
  "consentState" TEXT NOT NULL DEFAULT 'NOT_REQUIRED', "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LearningEvent_idempotencyKey_key" ON "LearningEvent"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "LearningEvent_companyId_feature_createdAt_idx" ON "LearningEvent"("companyId","feature","createdAt");
CREATE INDEX IF NOT EXISTS "LearningEvent_actorUserId_createdAt_idx" ON "LearningEvent"("actorUserId","createdAt");
CREATE INDEX IF NOT EXISTS "LearningEvent_correlationId_idx" ON "LearningEvent"("correlationId");
CREATE INDEX IF NOT EXISTS "LearningEvent_task_createdAt_idx" ON "LearningEvent"("task","createdAt");

CREATE TABLE IF NOT EXISTS "AiArtifactVersion" (
  "id" TEXT NOT NULL, "artifactType" TEXT NOT NULL, "artifactKey" TEXT NOT NULL, "version" TEXT NOT NULL, "stage" "AiArtifactStage" NOT NULL DEFAULT 'DRAFT',
  "config" JSONB NOT NULL, "createdBy" TEXT NOT NULL, "approvedBy" TEXT, "rollbackOf" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AiArtifactVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiArtifactVersion_artifactType_artifactKey_version_key" ON "AiArtifactVersion"("artifactType","artifactKey","version");
CREATE INDEX IF NOT EXISTS "AiArtifactVersion_artifactType_artifactKey_stage_idx" ON "AiArtifactVersion"("artifactType","artifactKey","stage");

CREATE TABLE IF NOT EXISTS "AiEvaluationRun" (
  "id" TEXT NOT NULL, "artifactVersionId" TEXT NOT NULL, "suite" TEXT NOT NULL, "scores" JSONB NOT NULL, "passed" BOOLEAN NOT NULL, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AiEvaluationRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiEvaluationRun_artifactVersionId_fkey" FOREIGN KEY ("artifactVersionId") REFERENCES "AiArtifactVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AiEvaluationRun_artifactVersionId_createdAt_idx" ON "AiEvaluationRun"("artifactVersionId","createdAt");
CREATE INDEX IF NOT EXISTS "AiEvaluationRun_suite_passed_createdAt_idx" ON "AiEvaluationRun"("suite","passed","createdAt");

-- Dimension intentionally remains provider-configured. No vector(1536) or fake embeddings are introduced.
