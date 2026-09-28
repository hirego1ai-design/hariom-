-- Persist referral-fraud governance so risk holds and administrator review
-- survive deploys/restarts and retain immutable transition history.

CREATE TYPE "ReferralFraudStatus" AS ENUM (
  'NORMAL',
  'FLAGGED',
  'FRAUD_HOLD',
  'ADMIN_REVIEW'
);

CREATE TABLE "ReferralFraudProfile" (
  "userId" TEXT NOT NULL,
  "status" "ReferralFraudStatus" NOT NULL DEFAULT 'NORMAL',
  "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "riskFactors" JSONB NOT NULL DEFAULT '[]',
  "lastEvaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReferralFraudProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "ReferralFraudAudit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "previousStatus" "ReferralFraudStatus" NOT NULL,
  "newStatus" "ReferralFraudStatus" NOT NULL,
  "reason" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL,
  "riskFactors" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReferralFraudAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferralFraudProfile_status_idx"
  ON "ReferralFraudProfile"("status");

CREATE INDEX "ReferralFraudProfile_riskScore_idx"
  ON "ReferralFraudProfile"("riskScore");

CREATE INDEX "ReferralFraudProfile_updatedAt_idx"
  ON "ReferralFraudProfile"("updatedAt");

CREATE INDEX "ReferralFraudAudit_userId_createdAt_idx"
  ON "ReferralFraudAudit"("userId", "createdAt");

CREATE INDEX "ReferralFraudAudit_newStatus_createdAt_idx"
  ON "ReferralFraudAudit"("newStatus", "createdAt");

ALTER TABLE "ReferralFraudAudit"
  ADD CONSTRAINT "ReferralFraudAudit_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "ReferralFraudProfile"("userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;


-- Materialize the historical referral rules as authoritative configuration.
-- Runtime production code fails closed if this row is later missing.
INSERT INTO "ReferralProgramConfig" (
  "id",
  "isEnabled",
  "candidateRewardAmount",
  "candidateMaxQualifyingTransactions",
  "employerJobRewardAmount",
  "employerMaxQualifyingTransactions",
  "managedHiringRewardAmount",
  "managedHiringMaxRewards",
  "managedHiringDefaultLockDays",
  "pphRewardAmount",
  "pphMaxQualifyingHires",
  "pphDefaultLockingPeriodDays",
  "minPayoutAmount",
  "attributionWindowDays",
  "updatedAt"
)
VALUES (
  'global-referral-config',
  TRUE,
  250.0,
  2,
  1000.0,
  2,
  5000.0,
  1,
  90,
  5000.0,
  1,
  90,
  500.0,
  30,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;


-- Referral fraud governance is server-only. No anon/authenticated Data API
-- access is intentionally granted.
ALTER TABLE public."ReferralFraudProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReferralFraudAudit" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."ReferralFraudProfile" FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public."ReferralFraudAudit" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."ReferralFraudProfile" FROM anon';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."ReferralFraudAudit" FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."ReferralFraudProfile" FROM authenticated';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public."ReferralFraudAudit" FROM authenticated';
  END IF;
END
$$;
