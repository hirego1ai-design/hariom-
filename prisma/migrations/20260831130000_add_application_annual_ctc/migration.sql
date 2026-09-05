-- Safe additive migration: Add annualCtc to Application
-- Non-destructive, safe for existing data and production databases

ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "annualCtc" DOUBLE PRECISION;
