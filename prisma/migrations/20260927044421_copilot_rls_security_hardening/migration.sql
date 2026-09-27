-- Keep standalone Copilot commerce private to the server-side Prisma application.
-- HireGo uses custom JWT sessions rather than Supabase Auth, so Data API roles
-- must not receive direct table access.

ALTER TABLE "CopilotPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotRegionalPrice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotCapacityOffer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotCapacityOfferPrice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotBillingCycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotUsageRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotUsageReservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotUsageLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CopilotCapacityAddon" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  "CopilotPlan",
  "CopilotRegionalPrice",
  "CopilotCapacityOffer",
  "CopilotCapacityOfferPrice",
  "CopilotSubscription",
  "CopilotBillingCycle",
  "CopilotUsageRule",
  "CopilotUsageReservation",
  "CopilotUsageLedger",
  "CopilotCapacityAddon"
FROM anon, authenticated;
