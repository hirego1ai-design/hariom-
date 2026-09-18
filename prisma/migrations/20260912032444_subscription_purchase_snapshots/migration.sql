-- Freeze the purchased commercial terms so later plan edits cannot change an
-- already-paid employer's duration, quotas, currency, or feature access.
ALTER TABLE "PaymentOrder"
  ADD COLUMN IF NOT EXISTS "planSnapshot" JSONB;

ALTER TABLE "CompanySubscription"
  ADD COLUMN IF NOT EXISTS "entitlementSnapshot" JSONB;
