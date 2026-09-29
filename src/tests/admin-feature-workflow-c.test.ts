import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

test("admin login stays role-bound audited and evidence-based", () => {
  const page = fs.readFileSync(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/auth/login/route.ts", import.meta.url), "utf8");

  assert(page.includes('portal: "admin"'));
  assert(page.includes('autoComplete="username"'));
  assert(page.includes('autoComplete="current-password"'));
  assert(page.includes('aria-label={showPassword ? "Hide administrator password" : "Show administrator password"}'));
  assert(page.includes("Administrator sign-in activity is security monitored."));
  assert(!page.includes("All session logs recorded."));

  assert(route.includes('(body.portal === "admin" && user.role === "ADMIN")'));
  assert(route.includes("PORTAL_LOGIN_DENIED"));
  assert(route.includes("USER_LOGIN_SUCCESS"));
  assert(route.includes("USER_LOGIN_FAILED"));
  assert(route.includes("httpOnly: true"));
  assert(route.includes('sameSite: "lax"'));
});


test("admin pricing engine uses explicit server-calculated non-persistent scenarios", () => {
  const page = fs.readFileSync(new URL("../app/admin/pricing-engine/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/pricing/calculate/route.ts", import.meta.url), "utf8");

  assert(page.includes('fetch("/api/admin/pricing/calculate"'));
  assert(page.includes("No production commercial defaults are prefilled."));
  assert(page.includes("A calculation is not a quote, invoice, or signed agreement."));
  assert(page.includes("Final slab is always open-ended."));
  assert(page.includes("No result is inferred before server validation."));
  assert(!page.includes("useState(2400000)"));
  assert(!page.includes("useState(8.33)"));
  assert(!page.includes("useState(18)"));
  assert(!page.includes("useState(90)"));
  assert(!page.includes("calculateCommercialFee({"));

  assert(route.includes('admin_pricing_calculate:${admin.id}'));
  assert(route.includes('currency: z.string().regex(/^[A-Z]{3}$/).optional()'));
  assert(route.includes("pricingRequestSchema"));
  assert(route.includes('pricingModel: z.literal("SLAB")'));
  assert(route.includes("calculation"));
});


test("admin recorded-assessment governance is deliberate versioned and audited", () => {
  const questionPage = fs.readFileSync(new URL("../app/admin/recorded-assessment/questions/page.tsx", import.meta.url), "utf8");
  const questionRoute = fs.readFileSync(new URL("../app/api/admin/recorded-assessment/questions/route.ts", import.meta.url), "utf8");
  const retireRoute = fs.readFileSync(new URL("../app/api/admin/recorded-assessment/questions/[id]/route.ts", import.meta.url), "utf8");
  const restrictionPage = fs.readFileSync(new URL("../app/admin/recorded-assessment/restrictions/page.tsx", import.meta.url), "utf8");
  const restrictionsRoute = fs.readFileSync(new URL("../app/api/admin/recorded-assessment/restrictions/route.ts", import.meta.url), "utf8");
  const reviewRoute = fs.readFileSync(new URL("../app/api/admin/recorded-assessment/restrictions/[id]/route.ts", import.meta.url), "utf8");

  assert(questionPage.includes("<AdminSidebar"));
  assert(questionPage.includes("<AdminHeader"));
  assert(questionPage.includes("Publication reason"));
  assert(questionPage.includes("expectedUpdatedAt: retireTarget.updatedAt"));
  assert(questionPage.includes('role="dialog"'));

  assert(questionRoute.includes("requireAdminSession(request)"));
  assert(questionRoute.includes('admin_recorded_question_bank_read:${admin.id}'));
  assert(questionRoute.includes('admin_recorded_question_bank_write:${admin.id}'));
  assert(questionRoute.includes("reason: z.string().trim().min(3).max(500)"));
  assert(questionRoute.includes("RECORDED_ASSESSMENT_QUESTION_PUBLISHED"));
  assert(questionRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));

  assert(retireRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(retireRoute.includes("Question changed; reload the role bank before retiring it."));
  assert(retireRoute.includes("RECORDED_ASSESSMENT_QUESTION_RETIRED"));
  assert(retireRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));

  assert(restrictionPage.includes("<AdminSidebar"));
  assert(restrictionPage.includes("<AdminHeader"));
  assert(restrictionPage.includes("Page {page} of {totalPages}"));
  assert(restrictionPage.includes("expectedUpdatedAt: reviewTarget.item.updatedAt"));
  assert(restrictionPage.includes('role="dialog"'));
  assert(!restrictionPage.includes("window.prompt"));

  assert(restrictionsRoute.includes('admin_assessment_restrictions_read:${admin.id}'));
  assert(restrictionsRoute.includes('admin_assessment_restrictions_write:${admin.id}'));
  assert(restrictionsRoute.includes("prisma.$transaction"));
  assert(restrictionsRoute.includes("ASSESSMENT_RESTRICTION_PROPOSED"));
  assert(restrictionsRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));

  assert(reviewRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(reviewRoute.includes("Restriction changed; reload the review queue."));
  assert(reviewRoute.includes("prisma.$transaction"));
  assert(reviewRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));
});


test("admin backup and recovery screen remains evidence-only without fabricated provider status", () => {
  const page = fs.readFileSync(new URL("../app/admin/system/backup-recovery/page.tsx", import.meta.url), "utf8");

  assert(page.includes("No live backup-provider integration is connected"));
  assert(page.includes("does not start backups or restores"));
  assert(page.includes("does not display fabricated"));
  assert(page.includes('href="/admin/system-health"'));
  assert(page.includes('href="/admin/settings/audit-log"'));
  assert(page.includes("immutable operator evidence"));
  assert(!page.includes("Last backup:"));
  assert(!page.includes("PITR healthy"));
  assert(!page.includes("Restore successful"));
});


test("admin candidate service and credit APIs use centralized bounded authorization controls", () => {
  const grants = fs.readFileSync(new URL("../app/api/admin/candidate-credits/grants/route.ts", import.meta.url), "utf8");
  const services = fs.readFileSync(new URL("../app/api/admin/candidate-services/route.ts", import.meta.url), "utf8");
  const service = fs.readFileSync(new URL("../app/api/admin/candidate-services/[id]/route.ts", import.meta.url), "utf8");
  const copilot = fs.readFileSync(new URL("../app/api/admin/copilot/commerce/route.ts", import.meta.url), "utf8");
  const offers = fs.readFileSync(new URL("../app/api/admin/copilot/capacity-offers/route.ts", import.meta.url), "utf8");

  for (const source of [grants, services, service]) {
    assert(source.includes("requireAdminSession(request)"));
    assert(!source.includes("getCurrentSession(request.headers)"));
  }

  assert(grants.includes('admin_candidate_credit_grants:${session.id}'));
  assert(services.includes('admin_candidate_services_read:${admin.id}'));
  assert(services.includes('admin_candidate_services_write:${session.id}'));
  assert(services.includes("candidateServiceCatalog.count()"));
  assert(services.includes("take: 250"));
  assert(service.includes('admin_candidate_services_write:${session.id}'));

  assert(copilot.includes("take: 100"));
  assert(copilot.includes("take: 500"));
  assert(offers.includes("take: 100"));
  assert(offers.includes("take: 250"));
});


test("admin referral governance persists fraud state and keeps payout ledger balances authoritative", () => {
  const schema = fs.readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
  const migration = fs.readFileSync(new URL("../../prisma/migrations/20260928082500_referral_fraud_persistence/migration.sql", import.meta.url), "utf8");
  const db = fs.readFileSync(new URL("../lib/referral-db.ts", import.meta.url), "utf8");
  const fraudRoute = fs.readFileSync(new URL("../app/api/admin/referrals/fraud/route.ts", import.meta.url), "utf8");
  const payoutsRoute = fs.readFileSync(new URL("../app/api/admin/referrals/payouts/route.ts", import.meta.url), "utf8");
  const configRoute = fs.readFileSync(new URL("../app/api/admin/referrals/config/route.ts", import.meta.url), "utf8");
  const analyticsRoute = fs.readFileSync(new URL("../app/api/admin/referrals/analytics/route.ts", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/admin/referrals/page.tsx", import.meta.url), "utf8");

  assert(schema.includes("model ReferralFraudProfile"));
  assert(schema.includes("model ReferralFraudAudit"));
  assert(schema.includes("enum ReferralFraudStatus"));
  assert(migration.includes('CREATE TABLE "ReferralFraudProfile"'));
  assert(migration.includes('CREATE TABLE "ReferralFraudAudit"'));

  assert(db.includes("prisma.referralFraudProfile"));
  assert(db.includes("tx.referralFraudAudit.create"));
  assert(db.includes("REFERRAL_FRAUD_STATUS_UPDATED"));
  assert(db.includes("enqueueSecurityAuditEvent(tx, auditLog, actorId)"));
  assert(db.includes("getAdminFraudQueuePage"));
  assert(db.includes('orderBy: [{ riskScore: "desc" }, { updatedAt: "desc" }, { userId: "asc" }]'));

  assert(fraudRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(fraudRoute.includes('admin_referral_fraud_read:${admin.id}'));
  assert(fraudRoute.includes('admin_referral_fraud_update:${admin.id}'));
  assert(fraudRoute.includes("getAdminFraudQueuePage"));

  assert(payoutsRoute.includes("Approval rationale is required."));
  assert(payoutsRoute.includes("Settlement transaction reference is required."));
  assert(payoutsRoute.includes("Rejection reason is required."));
  assert(payoutsRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(payoutsRoute.includes('admin_referral_payouts_read:${admin.id}'));
  assert(payoutsRoute.includes('admin_referral_payouts_update:${admin.id}'));

  assert(configRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(configRoute.includes("reason: z.string().trim().min(3).max(500)"));
  assert(configRoute.includes('admin_referral_config_write:${admin.id}'));

  assert(analyticsRoute.includes('by: ["currency", "status"]'));
  assert(analyticsRoute.includes("currencyMode"));
  assert(analyticsRoute.includes('status: "NOT_MEASURED"'));

  assert(db.includes("remainingAvailable._sum.rewardAmount ?? 0"));
  assert(db.includes("availableAfterRelease._sum.rewardAmount ?? 0"));
  assert(db.includes("balanceAfter: transactionalAvailable - input.amount"));
  assert(db.includes("balanceAfter: unreservedAvailable - input.amount"));
  assert(db.includes("availableAfterSettlement"));
  assert(db.includes("availableAfterRejection"));
  assert(!db.includes("entryType: ReferralLedgerEntryType.PAYOUT_SETTLED,\n      amount: payout.amount,\n      balanceAfter: 0"));
  assert(!db.includes("entryType: ReferralLedgerEntryType.PAYOUT_REFUNDED,\n      amount: payout.amount,\n      balanceAfter: payout.amount"));

  assert(page.includes("expectedUpdatedAt: new Date(config.updatedAt).toISOString()"));
  assert(page.includes("expectedUpdatedAt: new Date(payout.updatedAt).toISOString()"));
  assert(page.includes("expectedUpdatedAt: new Date(fraudTarget.profile.updatedAt"));
  assert(page.includes('role="dialog"'));
  assert(page.includes("Page {payoutPage} of {payoutPages}"));
  assert(page.includes("Page {fraudPage} of {fraudPages}"));
  assert(page.includes("analytics.summary.currencyMode"));
});


test("admin managed-hiring operations wire persisted placements and versioned commercial lifecycle", () => {
  const operations = fs.readFileSync(new URL("../app/admin/managed-hiring/operations/page.tsx", import.meta.url), "utf8");
  const requests = fs.readFileSync(new URL("../app/api/admin/managed-hiring/requirements/route.ts", import.meta.url), "utf8");
  const placements = fs.readFileSync(new URL("../app/api/admin/managed-hiring/placements/route.ts", import.meta.url), "utf8");
  const agreementDetail = fs.readFileSync(new URL("../app/admin/agreements/[id]/page.tsx", import.meta.url), "utf8");
  const agreementBuilder = fs.readFileSync(new URL("../app/admin/agreements/builder/page.tsx", import.meta.url), "utf8");
  const agreementTemplates = fs.readFileSync(new URL("../app/admin/agreements/templates/page.tsx", import.meta.url), "utf8");
  const contractRoute = fs.readFileSync(new URL("../app/api/agreements/contracts/[id]/route.ts", import.meta.url), "utf8");
  const reqDetailRoute = fs.readFileSync(new URL("../app/api/agreements/requirements/[id]/route.ts", import.meta.url), "utf8");
  const legacyBuilder = fs.readFileSync(new URL("../app/admin/managed-hiring/agreements/builder/page.tsx", import.meta.url), "utf8");
  const legacyTemplates = fs.readFileSync(new URL("../app/admin/managed-hiring/templates/page.tsx", import.meta.url), "utf8");

  assert(placements.includes('status: z.enum(placementStatuses).optional()'));
  assert(placements.includes('action: z.enum(["HOLD", "RESUME", "CANCEL"])'));
  assert(placements.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(placements.includes("admin_managed_hiring_placements_read:"));
  assert(placements.includes("admin_managed_hiring_placements_write:"));
  assert(placements.includes("Placement changed; reload before saving."));
  assert(placements.includes("PPH_PLACEMENT_"));
  assert(placements.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));

  assert(operations.includes("/api/admin/managed-hiring/placements?"));
  assert(operations.includes('method: "PATCH"'));
  assert(operations.includes("expectedUpdatedAt: placementActionTarget.placement.updatedAt"));
  assert(operations.includes("HOLD pauses invoice scheduling"));
  assert(operations.includes("does not automatically change the candidate application's HIRED status"));
  assert(operations.includes("Page {placementPage} of {placementPages}"));
  assert(operations.includes('role="dialog"'));

  assert(requests.includes('agreement.status === "ACTIVE"'));
  assert(!requests.includes('["ACTIVE", "SENT_TO_EMPLOYER", "AMENDMENT_REQUESTED"].includes(agreement.status)'));

  assert(agreementBuilder.includes("expectedTemplateUpdatedAt"));
  assert(agreementBuilder.includes("expectedRequirementUpdatedAt"));
  assert(agreementBuilder.includes("reason: draftReason.trim()"));

  assert(agreementDetail.includes("expectedUpdatedAt: new Date(agreement.updatedAt).toISOString()"));
  assert(agreementDetail.includes('action: "send_to_employer"'));
  assert(agreementDetail.includes('status: "ACTIVE"'));
  assert(agreementDetail.includes("activeAgreementId: agreement.id"));

  assert(agreementTemplates.includes("expectedUpdatedAt: editingTemplate.expectedUpdatedAt"));
  assert(agreementTemplates.includes("reason: editingTemplate.changeReason.trim()"));

  assert(contractRoute.includes("COMMERCIAL_AGREEMENT_SENT"));
  assert(contractRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
  assert(contractRoute.includes("idempotencyKey:"));
  assert(reqDetailRoute.includes("activateManagedHiringRequirement"));
  assert(reqDetailRoute.includes("MANAGED_HIRING_REQUIREMENT_UPDATED"));

  assert(legacyBuilder.includes("/admin/agreements/builder?reqId="));
  assert(legacyTemplates.includes('redirect("/admin/agreements/templates")'));
});


test("admin Copilot commerce exposes only supported checkout routing and complete versioned controls", () => {
  const page = fs.readFileSync(new URL("../app/admin/copilot-commerce/page.tsx", import.meta.url), "utf8");
  const pricingPage = fs.readFileSync(new URL("../app/admin/pricing-engine/page.tsx", import.meta.url), "utf8");
  const contracts = fs.readFileSync(new URL("../lib/copilot/contracts.ts", import.meta.url), "utf8");
  const commerceRoute = fs.readFileSync(new URL("../app/api/admin/copilot/commerce/route.ts", import.meta.url), "utf8");
  const offersRoute = fs.readFileSync(new URL("../app/api/admin/copilot/capacity-offers/route.ts", import.meta.url), "utf8");
  const commerce = fs.readFileSync(new URL("../lib/copilot/commerce.ts", import.meta.url), "utf8");
  const offers = fs.readFileSync(new URL("../lib/copilot/capacityOffers.ts", import.meta.url), "utf8");
  const taxPolicy = fs.readFileSync(new URL("../lib/copilot/taxPolicy.ts", import.meta.url), "utf8");

  assert(!contracts.includes("MERCHANT_OF_RECORD"));
  assert(contracts.includes('paymentMethod: z.enum(["STRIPE", "PAYU"]).optional()'));
  assert(contracts.includes('paymentRoute: z.enum(["PAYU", "STRIPE"])'));
  assert(contracts.includes('taxMode: z.enum(["NO_TAX_COLLECTION", "TAX_EXCLUSIVE", "TAX_INCLUSIVE"])'));

  assert(page.includes("Legacy Merchant-of-Record pricing exists in persisted data."));
  assert(page.includes("Legacy MoR — replace"));
  assert(!page.includes('<option value="MERCHANT_OF_RECORD">Merchant of Record</option>'));
  assert(page.includes("Catalogue display is bounded"));
  assert(page.includes("featuresAllowed"));
  assert(page.includes("Save entitlements"));
  assert(page.includes("Archive plan"));
  assert(page.includes("Archive offer"));
  assert(page.includes("price.isActive ? \"Disable\" : \"Enable\""));
  assert(page.includes("estimatedCostCurrency"));
  assert(page.includes("rule.expensive ? \"Expensive\" : \"Standard\""));
  assert(page.includes("rule.active ? \"Enabled\" : \"Disabled\""));
  assert(page.includes('role="dialog"'));

  assert(commerceRoute.includes("planTotal"));
  assert(commerceRoute.includes("usageRuleTotal"));
  assert(commerceRoute.includes("priceTruncatedPlanIds"));
  assert(offersRoute.includes("offerTotal"));
  assert(offersRoute.includes("priceTruncatedOfferIds"));
  assert(commerceRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
  assert(offersRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));

  assert(commerce.includes("Copilot pricing configuration is unavailable for this billing country."));
  assert(commerce.includes("return [];"));
  assert(offers.includes("Copilot capacity pricing configuration is unavailable for this billing country."));
  assert(offers.includes("return [];"));

  assert(taxPolicy.includes("India Copilot pricing must collect configured GST."));
  assert(taxPolicy.includes("Non-India regions must use no-tax collection with a zero tax rate."));

  assert(pricingPage.includes("Non-persistent scenario calculator"));
  assert(pricingPage.includes("This screen does not load or save commercial terms."));
  assert(pricingPage.includes("A calculation is not a quote, invoice, or signed agreement."));
  assert(pricingPage.includes("Scenario only. Nothing on this page is persisted."));
});


test("admin role governance uses fixed portal roles with serialized audited session invalidation", () => {
  const page = fs.readFileSync(new URL("../app/admin/roles/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/roles/route.ts", import.meta.url), "utf8");
  const licenseRedirect = fs.readFileSync(new URL("../app/admin/licenses/allocator/page.tsx", import.meta.url), "utf8");

  assert(licenseRedirect.includes('redirect("/admin/subscriptions")'));

  assert(page.includes('title="Roles & Portal Access"'));
  assert(page.includes("fixed application roles"));
  assert(page.includes("this screen does not imply a custom permission matrix"));
  assert(page.includes("expectedUpdatedAt: target.updatedAt"));
  assert(page.includes("Change role & invalidate sessions"));
  assert(page.includes("Last administrator protected"));
  assert(page.includes('role="dialog"'));

  assert(route.includes("requireAdminSession(request)"));
  assert(route.includes('admin_roles_read:${admin.id}'));
  assert(route.includes('admin_roles_write:${admin.id}'));
  assert(route.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(route.includes("Administrators cannot change their own role from this screen."));
  assert(route.includes("The last administrator cannot be demoted."));
  assert(route.includes("Employer or recruiter role requires an existing employer profile and company assignment."));
  assert(route.includes("Candidate role requires a candidate profile and no employer profile."));
  assert(route.includes("pg_advisory_xact_lock"));
  assert(route.includes("sessionVersion: { increment: 1 }"));
  assert(route.includes("ADMIN_USER_ROLE_CHANGED"));
  assert(route.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));
  assert(route.includes("revokeAllUserSessions(updated.id, updated.sessionVersion)"));
});


test("admin audit and security posture pages expose persisted and application-scoped evidence only", () => {
  const auditPage = fs.readFileSync(new URL("../app/admin/settings/audit-log/page.tsx", import.meta.url), "utf8");
  const auditRoute = fs.readFileSync(new URL("../app/api/admin/audit-logs/route.ts", import.meta.url), "utf8");
  const securityPage = fs.readFileSync(new URL("../app/admin/settings/security/page.tsx", import.meta.url), "utf8");
  const securityRoute = fs.readFileSync(new URL("../app/api/admin/security/status/route.ts", import.meta.url), "utf8");
  const securityHeaders = fs.readFileSync(new URL("../lib/securityHeaders.ts", import.meta.url), "utf8");
  const nextConfig = fs.readFileSync(new URL("../../next.config.ts", import.meta.url), "utf8");
  const middleware = fs.readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  const logsRedirect = fs.readFileSync(new URL("../app/admin/logs/stream/page.tsx", import.meta.url), "utf8");
  const vulnerabilityRedirect = fs.readFileSync(new URL("../app/admin/security/vulnerability-inspector/page.tsx", import.meta.url), "utf8");

  assert(logsRedirect.includes('redirect("/admin/settings/audit-log")'));
  assert(vulnerabilityRedirect.includes('redirect("/admin/settings/security")'));

  assert(auditRoute.includes("requireAdminSession(req)"));
  assert(auditRoute.includes("prisma.auditLog.count"));
  assert(auditRoute.includes('orderBy: [{ createdAt: "desc" }, { id: "desc" }]'));
  assert(auditRoute.includes("skip: (query.page - 1) * query.limit"));
  assert(auditRoute.includes('source: "persisted_audit_log"'));
  assert(auditPage.includes("Results are paginated"));
  assert(auditPage.includes("Page {page} of {totalPages}"));
  assert(auditPage.includes('role="alert"'));

  assert(securityRoute.includes("configuredSecurityHeaders"));
  assert(securityRoute.includes('"APPLICATION_CONFIGURATION_EVIDENCE_ONLY"'));
  assert(securityRoute.includes('status: "NOT_MEASURED"'));
  assert(securityRoute.includes("Security posture is read-only."));
  assert(securityPage.includes("CONFIGURED IN APP"));
  assert(securityPage.includes("No simulated security score, live-WAF claim, vulnerability count, or compliance certification"));
  assert(securityPage.includes("Measurements awaiting external evidence"));

  assert(nextConfig.includes("configuredSecurityHeaders"));
  assert(middleware.includes("configuredSecurityHeaders"));
  assert(securityHeaders.includes('"X-Frame-Options": "DENY"'));
  assert(securityHeaders.includes('"X-Content-Type-Options": "nosniff"'));
  assert(securityHeaders.includes('"Strict-Transport-Security"'));
  assert(securityHeaders.includes('"object-src \'none\'"'));
  assert(securityHeaders.includes('"frame-ancestors \'none\'"'));
});
