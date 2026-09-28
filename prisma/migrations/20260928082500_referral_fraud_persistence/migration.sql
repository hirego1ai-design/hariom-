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
