-- Safe additive migration for persisted global Admin configuration.
-- Existing rows and tables are untouched.
CREATE TABLE IF NOT EXISTS "AdminConfiguration" (
  "id" TEXT NOT NULL DEFAULT 'global-admin-config',
  "platformConfig" JSONB,
  "securityPolicy" JSONB,
  "managedHiringConfig" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminConfiguration_pkey" PRIMARY KEY ("id")
);
