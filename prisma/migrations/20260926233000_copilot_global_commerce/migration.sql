-- Standalone HireGo Copilot product, worldwide regional pricing, and hidden capacity metering.
-- Job-posting subscriptions remain in the legacy SubscriptionPlan/CompanySubscription tables.

CREATE TYPE "CopilotSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAYMENT_PENDING');
CREATE TYPE "CopilotBillingCycleStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'CLOSED');
CREATE TYPE "CopilotUsageReservationStatus" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED', 'EXPIRED');
CREATE TYPE "CopilotUsageLedgerStatus" AS ENUM ('CONSUMED', 'RELEASED', 'FAILED');
CREATE TYPE "CopilotTaxMode" AS ENUM ('TAX_EXCLUSIVE', 'TAX_INCLUSIVE', 'MERCHANT_OF_RECORD');
CREATE TYPE "CopilotPaymentRoute" AS ENUM ('PAYU', 'STRIPE', 'MERCHANT_OF_RECORD');

ALTER TABLE "PaymentOrder"
  ADD COLUMN "productType" TEXT NOT NULL DEFAULT 'LEGACY_SUBSCRIPTION',
  ADD COLUMN "billingCountry" TEXT;

ALTER TABLE "PaymentTransaction"
  ADD COLUMN "productType" TEXT NOT NULL DEFAULT 'LEGACY_SUBSCRIPTION';

CREATE TABLE "CopilotPlan" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "monthlyCapacityUnits" INTEGER NOT NULL,
  "softWarningPct" INTEGER NOT NULL DEFAULT 80,
  "hardWarningPct" INTEGER NOT NULL DEFAULT 90,
  "featuresAllowed" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "validityMonths" INTEGER NOT NULL DEFAULT 1,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CopilotPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CopilotPlan_code_key" ON "CopilotPlan"("code");
CREATE INDEX "CopilotPlan_isArchived_idx" ON "CopilotPlan"("isArchived");

CREATE TABLE "CopilotRegionalPrice" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "regionCode" TEXT NOT NULL,
  "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "currency" TEXT NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "taxMode" "CopilotTaxMode" NOT NULL DEFAULT 'TAX_EXCLUSIVE',
  "paymentRoute" "CopilotPaymentRoute" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CopilotRegionalPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CopilotRegionalPrice_planId_regionCode_key" ON "CopilotRegionalPrice"("planId", "regionCode");
CREATE INDEX "CopilotRegionalPrice_regionCode_isActive_idx" ON "CopilotRegionalPrice"("regionCode", "isActive");

CREATE TABLE "CopilotSubscription" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" "CopilotSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "billingCountry" TEXT NOT NULL,
  "priceSnapshot" JSONB NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3) NOT NULL,
  "paymentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CopilotSubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CopilotSubscription_companyId_status_endDate_idx" ON "CopilotSubscription"("companyId", "status", "endDate");
CREATE INDEX "CopilotSubscription_planId_idx" ON "CopilotSubscription"("planId");

CREATE TABLE "CopilotBillingCycle" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "baseCapacityUnits" INTEGER NOT NULL,
  "addonCapacityUnits" INTEGER NOT NULL DEFAULT 0,
  "consumedCapacityUnits" INTEGER NOT NULL DEFAULT 0,
  "reservedCapacityUnits" INTEGER NOT NULL DEFAULT 0,
  "status" "CopilotBillingCycleStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CopilotBillingCycle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CopilotBillingCycle_subscriptionId_startsAt_key" ON "CopilotBillingCycle"("subscriptionId", "startsAt");
CREATE INDEX "CopilotBillingCycle_subscriptionId_status_endsAt_idx" ON "CopilotBillingCycle"("subscriptionId", "status", "endsAt");

CREATE TABLE "CopilotUsageRule" (
  "id" TEXT NOT NULL,
  "actionKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "unitType" TEXT NOT NULL,
  "unitsPerQuantity" INTEGER NOT NULL,
  "estimatedCostMinor" INTEGER NOT NULL DEFAULT 0,
  "estimatedCostCurrency" TEXT NOT NULL DEFAULT 'INR',
  "expensive" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CopilotUsageRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CopilotUsageRule_actionKey_key" ON "CopilotUsageRule"("actionKey");
CREATE INDEX "CopilotUsageRule_active_actionKey_idx" ON "CopilotUsageRule"("active", "actionKey");

CREATE TABLE "CopilotUsageReservation" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "billingCycleId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "actionKey" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reservedUnits" INTEGER NOT NULL,
  "consumedUnits" INTEGER NOT NULL DEFAULT 0,
  "releasedUnits" INTEGER NOT NULL DEFAULT 0,
  "idempotencyKey" TEXT NOT NULL,
  "jobId" TEXT,
  "applicationId" TEXT,
  "candidateId" TEXT,
  "interviewId" TEXT,
  "metadata" JSONB,
  "status" "CopilotUsageReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CopilotUsageReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CopilotUsageReservation_idempotencyKey_key" ON "CopilotUsageReservation"("idempotencyKey");
CREATE INDEX "CopilotUsageReservation_companyId_status_expiresAt_idx" ON "CopilotUsageReservation"("companyId", "status", "expiresAt");
CREATE INDEX "CopilotUsageReservation_billingCycleId_status_idx" ON "CopilotUsageReservation"("billingCycleId", "status");
CREATE INDEX "CopilotUsageReservation_interviewId_idx" ON "CopilotUsageReservation"("interviewId");

CREATE TABLE "CopilotUsageLedger" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "billingCycleId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "actionKey" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "capacityUnits" INTEGER NOT NULL,
  "estimatedCostMinor" INTEGER NOT NULL DEFAULT 0,
  "costCurrency" TEXT NOT NULL DEFAULT 'INR',
  "idempotencyKey" TEXT NOT NULL,
  "jobId" TEXT,
  "applicationId" TEXT,
  "candidateId" TEXT,
  "interviewId" TEXT,
  "provider" TEXT,
  "model" TEXT,
  "metadata" JSONB,
  "status" "CopilotUsageLedgerStatus" NOT NULL DEFAULT 'CONSUMED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CopilotUsageLedger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CopilotUsageLedger_idempotencyKey_key" ON "CopilotUsageLedger"("idempotencyKey");
CREATE INDEX "CopilotUsageLedger_companyId_createdAt_idx" ON "CopilotUsageLedger"("companyId", "createdAt");
CREATE INDEX "CopilotUsageLedger_billingCycleId_createdAt_idx" ON "CopilotUsageLedger"("billingCycleId", "createdAt");
CREATE INDEX "CopilotUsageLedger_actionKey_createdAt_idx" ON "CopilotUsageLedger"("actionKey", "createdAt");
CREATE INDEX "CopilotUsageLedger_interviewId_idx" ON "CopilotUsageLedger"("interviewId");

CREATE TABLE "CopilotCapacityAddon" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "billingCycleId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "capacityUnits" INTEGER NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CopilotCapacityAddon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CopilotCapacityAddon_paymentId_key" ON "CopilotCapacityAddon"("paymentId");
CREATE INDEX "CopilotCapacityAddon_companyId_expiresAt_idx" ON "CopilotCapacityAddon"("companyId", "expiresAt");
CREATE INDEX "CopilotCapacityAddon_billingCycleId_idx" ON "CopilotCapacityAddon"("billingCycleId");

ALTER TABLE "CopilotRegionalPrice" ADD CONSTRAINT "CopilotRegionalPrice_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "CopilotPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotSubscription" ADD CONSTRAINT "CopilotSubscription_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotSubscription" ADD CONSTRAINT "CopilotSubscription_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "CopilotPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CopilotBillingCycle" ADD CONSTRAINT "CopilotBillingCycle_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "CopilotSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotUsageReservation" ADD CONSTRAINT "CopilotUsageReservation_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "CopilotSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotUsageReservation" ADD CONSTRAINT "CopilotUsageReservation_billingCycleId_fkey"
  FOREIGN KEY ("billingCycleId") REFERENCES "CopilotBillingCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotUsageReservation" ADD CONSTRAINT "CopilotUsageReservation_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotUsageLedger" ADD CONSTRAINT "CopilotUsageLedger_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "CopilotSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotUsageLedger" ADD CONSTRAINT "CopilotUsageLedger_billingCycleId_fkey"
  FOREIGN KEY ("billingCycleId") REFERENCES "CopilotBillingCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotUsageLedger" ADD CONSTRAINT "CopilotUsageLedger_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotCapacityAddon" ADD CONSTRAINT "CopilotCapacityAddon_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "CopilotSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotCapacityAddon" ADD CONSTRAINT "CopilotCapacityAddon_billingCycleId_fkey"
  FOREIGN KEY ("billingCycleId") REFERENCES "CopilotBillingCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopilotCapacityAddon" ADD CONSTRAINT "CopilotCapacityAddon_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CopilotPlan"
  ADD CONSTRAINT "CopilotPlan_monthlyCapacityUnits_check" CHECK ("monthlyCapacityUnits" > 0),
  ADD CONSTRAINT "CopilotPlan_warningPct_check" CHECK ("softWarningPct" >= 1 AND "softWarningPct" < "hardWarningPct" AND "hardWarningPct" <= 100);

ALTER TABLE "CopilotRegionalPrice"
  ADD CONSTRAINT "CopilotRegionalPrice_amountMinor_check" CHECK ("amountMinor" > 0);

ALTER TABLE "CopilotBillingCycle"
  ADD CONSTRAINT "CopilotBillingCycle_capacity_check"
  CHECK ("baseCapacityUnits" >= 0 AND "addonCapacityUnits" >= 0 AND "consumedCapacityUnits" >= 0 AND "reservedCapacityUnits" >= 0);

ALTER TABLE "CopilotUsageRule"
  ADD CONSTRAINT "CopilotUsageRule_units_check" CHECK ("unitsPerQuantity" > 0 AND "estimatedCostMinor" >= 0);

ALTER TABLE "CopilotUsageReservation"
  ADD CONSTRAINT "CopilotUsageReservation_units_check"
  CHECK ("quantity" > 0 AND "reservedUnits" > 0 AND "consumedUnits" >= 0 AND "releasedUnits" >= 0);

ALTER TABLE "CopilotUsageLedger"
  ADD CONSTRAINT "CopilotUsageLedger_units_check"
  CHECK ("quantity" > 0 AND "capacityUnits" >= 0 AND "estimatedCostMinor" >= 0);

-- Initial commercial configuration. Admin APIs may change these later without a deploy.
INSERT INTO "CopilotPlan"
  ("id","code","name","description","monthlyCapacityUnits","softWarningPct","hardWarningPct","featuresAllowed","validityMonths","isArchived","updatedAt")
VALUES
  ('copilot-starter','STARTER','Starter','AI-assisted hiring workflow for lighter hiring activity.',120,80,90,ARRAY['PROFILE_MATCHING','SHORTLIST_RECOMMENDATION','ASSESSMENT_SUPPORT','INTERVIEW_SCHEDULING','NOTIFICATIONS','VIDEO_INTERVIEW','PROCTORING','INTERVIEW_REPORTS','MULTI_ROUND'],1,false,CURRENT_TIMESTAMP),
  ('copilot-growth','GROWTH','Growth','Higher Copilot capacity for teams with regular hiring activity.',300,80,90,ARRAY['PROFILE_MATCHING','SHORTLIST_RECOMMENDATION','ASSESSMENT_SUPPORT','INTERVIEW_SCHEDULING','NOTIFICATIONS','VIDEO_INTERVIEW','PROCTORING','INTERVIEW_REPORTS','MULTI_ROUND'],1,false,CURRENT_TIMESTAMP),
  ('copilot-pro','PRO','Pro','High-capacity Copilot workflow for larger hiring teams.',700,80,90,ARRAY['PROFILE_MATCHING','SHORTLIST_RECOMMENDATION','ASSESSMENT_SUPPORT','INTERVIEW_SCHEDULING','NOTIFICATIONS','VIDEO_INTERVIEW','PROCTORING','INTERVIEW_REPORTS','MULTI_ROUND'],1,false,CURRENT_TIMESTAMP);

INSERT INTO "CopilotRegionalPrice"
  ("id","planId","regionCode","countries","currency","amountMinor","taxMode","paymentRoute","isActive","updatedAt")
VALUES
  ('copilot-starter-in','copilot-starter','IN',ARRAY['IN'],'INR',39900,'TAX_EXCLUSIVE','PAYU',true,CURRENT_TIMESTAMP),
  ('copilot-growth-in','copilot-growth','IN',ARRAY['IN'],'INR',79900,'TAX_EXCLUSIVE','PAYU',true,CURRENT_TIMESTAMP),
  ('copilot-pro-in','copilot-pro','IN',ARRAY['IN'],'INR',149900,'TAX_EXCLUSIVE','PAYU',true,CURRENT_TIMESTAMP),

  ('copilot-starter-us','copilot-starter','US',ARRAY['US'],'USD',900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),
  ('copilot-growth-us','copilot-growth','US',ARRAY['US'],'USD',1900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),
  ('copilot-pro-us','copilot-pro','US',ARRAY['US'],'USD',3900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),

  ('copilot-starter-gb','copilot-starter','GB',ARRAY['GB'],'GBP',700,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),
  ('copilot-growth-gb','copilot-growth','GB',ARRAY['GB'],'GBP',1500,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),
  ('copilot-pro-gb','copilot-pro','GB',ARRAY['GB'],'GBP',2900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),

  ('copilot-starter-eu','copilot-starter','EU',ARRAY['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'],'EUR',900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),
  ('copilot-growth-eu','copilot-growth','EU',ARRAY['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'],'EUR',1900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),
  ('copilot-pro-eu','copilot-pro','EU',ARRAY['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'],'EUR',3900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),

  ('copilot-starter-row','copilot-starter','ROW',ARRAY[]::TEXT[],'USD',900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),
  ('copilot-growth-row','copilot-growth','ROW',ARRAY[]::TEXT[],'USD',1900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP),
  ('copilot-pro-row','copilot-pro','ROW',ARRAY[]::TEXT[],'USD',3900,'TAX_EXCLUSIVE','STRIPE',true,CURRENT_TIMESTAMP);

-- Hidden internal weights. These are never returned to employer-facing APIs.
INSERT INTO "CopilotUsageRule"
  ("id","actionKey","displayName","unitType","unitsPerQuantity","estimatedCostMinor","estimatedCostCurrency","expensive","active","updatedAt")
VALUES
  ('copilot-rule-profile-match','PROFILE_MATCH','Candidate profile matching','CANDIDATE',1,200,'INR',false,true,CURRENT_TIMESTAMP),
  ('copilot-rule-assessment','ASSESSMENT_EVALUATION','Assessment AI evaluation','CANDIDATE',2,300,'INR',false,true,CURRENT_TIMESTAMP),
  ('copilot-rule-scheduling','INTERVIEW_SCHEDULING','Interview scheduling automation','INTERVIEW',1,100,'INR',false,true,CURRENT_TIMESTAMP),
  ('copilot-rule-email','EMAIL_NOTIFICATION','Email workflow notification','MESSAGE',1,20,'INR',false,true,CURRENT_TIMESTAMP),
  ('copilot-rule-whatsapp','WHATSAPP_NOTIFICATION','WhatsApp workflow notification','MESSAGE',1,20,'INR',false,true,CURRENT_TIMESTAMP),
  ('copilot-rule-video-minute','VIDEO_INTERVIEW_MINUTE','Virtual interview minute','MINUTE',1,30,'INR',true,true,CURRENT_TIMESTAMP),
  ('copilot-rule-proctoring','PROCTORING_SESSION','Proctoring session','SESSION',8,800,'INR',true,true,CURRENT_TIMESTAMP),
  ('copilot-rule-transcription','TRANSCRIPTION_MINUTE','Interview transcription minute','MINUTE',1,20,'INR',true,true,CURRENT_TIMESTAMP),
  ('copilot-rule-report','INTERVIEW_REPORT','Interview AI report','REPORT',5,300,'INR',true,true,CURRENT_TIMESTAMP);
