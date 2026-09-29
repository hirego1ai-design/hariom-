import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

test("admin communications keep template state changes versioned audited and test sends controlled", () => {
  const page = fs.readFileSync(new URL("../app/admin/communications/page.tsx", import.meta.url), "utf8");
  const createRoute = fs.readFileSync(new URL("../app/api/admin/communications/templates/route.ts", import.meta.url), "utf8");
  const patchRoute = fs.readFileSync(new URL("../app/api/admin/communications/templates/[id]/route.ts", import.meta.url), "utf8");
  const deliveries = fs.readFileSync(new URL("../app/api/admin/communications/deliveries/route.ts", import.meta.url), "utf8");
  const testRoute = fs.readFileSync(new URL("../app/api/admin/communications/test/route.ts", import.meta.url), "utf8");
  const emailConfig = fs.readFileSync(new URL("../app/api/admin/email-delivery/config/route.ts", import.meta.url), "utf8");
  const emailTest = fs.readFileSync(new URL("../app/api/admin/email-delivery/test/route.ts", import.meta.url), "utf8");
  const emailHelper = fs.readFileSync(new URL("../lib/email-delivery-config.ts", import.meta.url), "utf8");
  const smtpUi = fs.readFileSync(new URL("../app/settings/smtp/page.tsx", import.meta.url), "utf8");
  const smtpWrapper = fs.readFileSync(new URL("../app/admin/settings/smtp/page.tsx", import.meta.url), "utf8");
  const whatsappWrapper = fs.readFileSync(new URL("../app/admin/settings/whatsapp/page.tsx", import.meta.url), "utf8");

  assert(createRoute.includes("z.literal(false).default(false)"));
  assert(createRoute.includes("pg_advisory_xact_lock"));
  assert(createRoute.includes("COMMUNICATION_TEMPLATE_CREATED"));
  assert(createRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, user.id)"));
  assert(createRoute.includes("truncated: total > templates.length"));

  assert(patchRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(patchRoute.includes("reason: z.string().trim().min(3).max(500)"));
  assert(patchRoute.includes("Communication template changed; reload before saving."));
  assert(patchRoute.includes("COMMUNICATION_TEMPLATE_ACTIVATED"));
  assert(patchRoute.includes("COMMUNICATION_TEMPLATE_DEACTIVATED"));
  assert(patchRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, user.id)"));

  assert(deliveries.includes("querySchema"));
  assert(deliveries.includes('orderBy: [{ createdAt: "desc" }, { id: "desc" }]'));
  assert(deliveries.includes("skip: (query.page - 1) * query.limit"));
  assert(deliveries.includes("total,"));

  assert(page.includes('role="dialog"'));
  assert(page.includes("expectedUpdatedAt: toggleTarget.template.updatedAt"));
  assert(page.includes('fetch("/api/admin/communications/test"'));
  assert(page.includes("Provider acceptance ≠ delivered/read"));
  assert(page.includes("Page {deliveryPage} of {deliveryTotalPages}"));

  assert(testRoute.includes("COMMUNICATION_TEMPLATE_TEST_REQUESTED"));
  assert(testRoute.includes("Production test sends are restricted to the configured recipient allowlist."));
  assert(testRoute.indexOf('action: "COMMUNICATION_TEMPLATE_TEST_REQUESTED"') < testRoute.indexOf("const delivery = await dispatchAdminTestCommunication"));

  assert(emailHelper.includes("getEmailDeliverySettingsStrict"));
  assert(emailConfig.includes("expectedUpdatedAt: z.string().datetime().nullable()"));
  assert(emailConfig.includes("Email delivery configuration changed; reload before saving."));
  assert(emailConfig.includes("EMAIL_DELIVERY_CONFIG_UPDATED"));
  assert(emailConfig.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));
  assert(smtpUi.includes("expectedUpdatedAt: config.updatedAt"));

  assert(emailTest.includes("COMMUNICATION_TEST_RECIPIENT_ALLOWLIST"));
  assert(emailTest.includes("EMAIL_PROVIDER_TEST_REQUESTED"));
  assert(emailTest.includes("Delivery/read confirmation is separate."));
  assert(emailTest.indexOf("EMAIL_PROVIDER_TEST_REQUESTED") < emailTest.indexOf("sendEmail("));

  assert(smtpWrapper.includes("md:ml-[116px]"));
  assert(whatsappWrapper.includes("md:ml-[116px]"));
});


test("admin system health and queue pages scope status claims to observed evidence", () => {
  const healthPage = fs.readFileSync(new URL("../app/admin/system-health/page.tsx", import.meta.url), "utf8");
  const healthRoute = fs.readFileSync(new URL("../app/api/admin/system-health/route.ts", import.meta.url), "utf8");
  const queuePage = fs.readFileSync(new URL("../app/admin/system/queue-broker/page.tsx", import.meta.url), "utf8");
  const queueRoute = fs.readFileSync(new URL("../app/api/admin/system/queues/route.ts", import.meta.url), "utf8");
  const infraRedirect = fs.readFileSync(new URL("../app/admin/system/infrastructure/page.tsx", import.meta.url), "utf8");
  const dbRedirect = fs.readFileSync(new URL("../app/admin/system/db-pool/page.tsx", import.meta.url), "utf8");
  const slaRedirect = fs.readFileSync(new URL("../app/admin/sla/monitor/page.tsx", import.meta.url), "utf8");

  assert(healthRoute.includes('"CORE_RUNTIME_AVAILABLE"'));
  assert(healthRoute.includes('"CORE_RUNTIME_DEGRADED"'));
  assert(healthRoute.includes('"CURRENT_APP_INSTANCE_DATABASE_AND_CONFIGURATION"'));
  assert(healthRoute.includes('"OBSERVED_ACTIVE"'));
  assert(healthRoute.includes("configurationWarnings"));
  assert(!healthRoute.includes('"APPLICATION_AVAILABLE"'));

  assert(healthPage.includes("configurationWarnings"));
  assert(healthPage.includes("Configuration warnings"));
  assert(healthPage.includes('title="System Diagnostics"'));

  assert(queueRoute.includes('"RECENT_HEARTBEAT"'));
  assert(!queueRoute.includes('? "HEALTHY"'));
  assert(queuePage.includes("workerStatusClass"));
  assert(queuePage.includes("RECENT_HEARTBEAT"));

  for (const source of [infraRedirect, dbRedirect, slaRedirect]) {
    assert(source.includes('redirect("/admin/system-health")'));
  }
});


test("admin integration and email controls fail closed without simulated connection state", () => {
  const integrations = fs.readFileSync(new URL("../app/admin/settings/integrations/page.tsx", import.meta.url), "utf8");
  const smtp = fs.readFileSync(new URL("../app/settings/smtp/page.tsx", import.meta.url), "utf8");
  const emailConfig = fs.readFileSync(new URL("../app/api/admin/email-delivery/config/route.ts", import.meta.url), "utf8");
  const emailHelper = fs.readFileSync(new URL("../lib/email-delivery-config.ts", import.meta.url), "utf8");

  assert(integrations.includes("No general integrations registry is connected"));
  assert(integrations.includes('href="/admin/settings/smtp"'));
  assert(integrations.includes('href="/admin/settings/whatsapp"'));
  assert(integrations.includes('href="/admin/payment-gateways"'));
  assert(integrations.includes('href="/admin/communications"'));
  assert(!integrations.includes("CandidateSidebar"));
  assert(!integrations.includes("G07Component"));

  assert(emailHelper.includes('if (process.env.NODE_ENV === "production") throw error;'));
  assert(emailConfig.includes("effectiveSendgridKey"));
  assert(emailConfig.includes("effectiveZeptoMailKey"));
  assert(emailConfig.includes("effectiveSendgridSender"));
  assert(emailConfig.includes("effectiveZeptoMailSender"));
  assert(emailConfig.includes("SendGrid cannot be enabled until a sender address and API key are configured."));
  assert(emailConfig.includes("ZeptoMail cannot be enabled until a sender address and API key are configured."));

  assert(smtp.includes("Test email provider acceptance"));
  assert(smtp.includes("Acceptance does not prove inbox delivery or reading."));
  assert(smtp.includes("error?: string"));
  assert(smtp.includes("result.error || result.message"));
  assert(smtp.includes("Delivery/read confirmation is separate."));
});


test("admin role governance is versioned audited profile-aware and session-invalidating", () => {
  const page = fs.readFileSync(new URL("../app/admin/roles/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/roles/route.ts", import.meta.url), "utf8");

  assert(page.includes("<AdminSidebar"));
  assert(page.includes("<AdminHeader"));
  assert(page.includes("md:pl-[116px]"));
  assert(page.includes("useDeferredValue(search)"));
  assert(page.includes("Page {page} of {totalPages}"));
  assert(page.includes('role="dialog"'));
  assert(page.includes("expectedUpdatedAt: target.updatedAt"));
  assert(page.includes("Change role & invalidate sessions"));
  assert(page.includes("Employer/recruiter roles require an employer profile"));
  assert(page.includes("The last administrator cannot be demoted."));

  assert(route.includes("requireAdminSession(request)"));
  assert(route.includes('admin_roles_write:${admin.id}'));
  assert(route.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(route.includes("reason: z.string().trim().min(3).max(500)"));
  assert(route.includes("Administrators cannot change their own role from this screen."));
  assert(route.includes("The last administrator cannot be demoted."));
  assert(route.includes("Employer or recruiter role requires an existing employer profile"));
  assert(route.includes("Candidate role requires a candidate profile and no employer profile."));
  assert(route.includes("pg_advisory_xact_lock(hashtext('admin-role-governance'))"));
  assert(route.includes("sessionVersion: { increment: 1 }"));
  assert(route.includes("ADMIN_USER_ROLE_CHANGED"));
  assert(route.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));
  assert(route.includes("revokeAllUserSessions(updated.id, updated.sessionVersion)"));
  assert(route.includes("skip: (query.page - 1) * query.limit"));
  assert(route.includes("take: query.limit"));
});


test("admin referral governance persists fraud evidence and keeps payouts and analytics deliberate", () => {
  const page = fs.readFileSync(new URL("../app/admin/referrals/page.tsx", import.meta.url), "utf8");
  const configRoute = fs.readFileSync(new URL("../app/api/admin/referrals/config/route.ts", import.meta.url), "utf8");
  const payoutRoute = fs.readFileSync(new URL("../app/api/admin/referrals/payouts/route.ts", import.meta.url), "utf8");
  const fraudRoute = fs.readFileSync(new URL("../app/api/admin/referrals/fraud/route.ts", import.meta.url), "utf8");
  const analyticsRoute = fs.readFileSync(new URL("../app/api/admin/referrals/analytics/route.ts", import.meta.url), "utf8");
  const rules = fs.readFileSync(new URL("../lib/referral-rules.ts", import.meta.url), "utf8");
  const db = fs.readFileSync(new URL("../lib/referral-db.ts", import.meta.url), "utf8");
  const schema = fs.readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
  const migration = fs.readFileSync(
    new URL("../../prisma/migrations/20260928082500_referral_fraud_persistence/migration.sql", import.meta.url),
    "utf8",
  );

  assert(schema.includes("model ReferralFraudProfile"));
  assert(schema.includes("model ReferralFraudAudit"));
  assert(schema.includes("enum ReferralFraudStatus"));
  assert(migration.includes('CREATE TABLE "ReferralFraudProfile"'));
  assert(migration.includes('CREATE TABLE "ReferralFraudAudit"'));
  assert(migration.includes('ALTER TABLE public."ReferralFraudProfile" ENABLE ROW LEVEL SECURITY'));
  assert(migration.includes('ALTER TABLE public."ReferralFraudAudit" ENABLE ROW LEVEL SECURITY'));
  assert(migration.includes('REVOKE ALL PRIVILEGES ON TABLE public."ReferralFraudProfile" FROM PUBLIC'));

  assert(configRoute.includes("requireAdminSession(request)"));
  assert(configRoute.includes('admin_referral_config_write:${admin.id}'));
  assert(configRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(configRoute.includes("reason: z.string().trim().min(3).max(500)"));
  assert(rules.includes("REFERRAL_CONFIG_UPDATED"));
  assert(rules.includes("enqueueSecurityAuditEvent(tx, auditLog, auditContext.actorId)"));

  assert(payoutRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(payoutRoute.includes("Approval rationale is required."));
  assert(payoutRoute.includes("Settlement transaction reference is required."));
  assert(payoutRoute.includes("Rejection reason is required."));
  assert(payoutRoute.includes('admin_referral_payouts_update:${admin.id}'));
  assert(db.includes("REFERRAL_PAYOUT_APPROVED"));
  assert(db.includes("REFERRAL_PAYOUT_MARKED_PAID"));
  assert(db.includes("REFERRAL_PAYOUT_REJECTED"));
  assert(db.includes("enqueueSecurityAuditEvent(tx, auditLog, adminUserId)"));

  assert(fraudRoute.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(fraudRoute.includes('admin_referral_fraud_update:${admin.id}'));
  assert(!fraudRoute.includes("expectedLastEvaluatedAt"));
  assert(db.includes("prisma.referralFraudProfile.upsert"));
  assert(db.includes("prisma.referralFraudProfile.findMany"));
  assert(db.includes("referralFraudAudit.create"));
  assert(db.includes("REFERRAL_FRAUD_STATUS_UPDATED"));
  assert(db.includes("Referral fraud profile changed; reload before saving."));
  assert(db.includes("evidenceChanged"));
  assert(db.includes("Automated Risk Engine Evaluation"));
  assert(!db.includes("expectedLastEvaluatedAt"));

  assert(analyticsRoute.includes("referralReward.groupBy"));
  assert(analyticsRoute.includes("referralPayout.groupBy"));
  assert(analyticsRoute.includes("currencyMode"));
  assert(analyticsRoute.includes("byCurrency"));
  assert(!analyticsRoute.includes('currency: "INR"'));
  assert(!analyticsRoute.includes("referralReward.findMany"));

  assert(page.includes("<AdminSidebar"));
  assert(page.includes("<AdminHeader"));
  assert(page.includes("md:pl-[116px]"));
  assert(page.includes("configReason"));
  assert(page.includes("reason: configReason.trim()"));
  assert(page.includes("Record payout settlement?"));
  assert(page.includes("Confirm settlement"));
  assert(page.includes("Multiple currencies are reported separately"));
  assert(page.includes("expectedUpdatedAt: new Date(fraudTarget.profile.updatedAt || fraudTarget.profile.lastEvaluatedAt).toISOString()"));
  assert(!page.includes("expectedLastEvaluatedAt"));
  assert(page.includes("Page {payoutPage} of {payoutPages}"));
  assert(page.includes("Page {fraudPage} of {fraudPages}"));
  assert(page.includes('role="dialog"'));
});



test("managed-hiring agreements keep commercial terms versioned immutable and audit-bound", () => {
  const builder = fs.readFileSync(new URL("../app/admin/agreements/builder/page.tsx", import.meta.url), "utf8");
  const templates = fs.readFileSync(new URL("../app/admin/agreements/templates/page.tsx", import.meta.url), "utf8");
  const contractCreate = fs.readFileSync(new URL("../app/api/agreements/contracts/route.ts", import.meta.url), "utf8");
  const contractDetail = fs.readFileSync(new URL("../app/api/agreements/contracts/[id]/route.ts", import.meta.url), "utf8");
  const employerReview = fs.readFileSync(new URL("../app/employer/managed-hiring/agreements/[id]/page.tsx", import.meta.url), "utf8");

  assert(!fs.existsSync(new URL("../app/api/admin/managed-hiring/config/route.ts", import.meta.url)));

  assert(builder.includes("expectedRequirementUpdatedAt"));
  assert(builder.includes("expectedTemplateUpdatedAt"));
  assert(builder.includes("reason: draftReason.trim()"));
  assert(builder.includes('fetch("/api/agreements/contracts"'));

  assert(templates.includes("expectedUpdatedAt"));
  assert(templates.includes("changeReason"));
  assert(templates.includes("Save audited template"));
  assert(templates.includes("Archive reviewed version"));

  assert(contractCreate.includes('requireAdminSession(req)'));
  assert(contractCreate.includes('FOR UPDATE'));
  assert(contractCreate.includes("Agreement template changed; reload before drafting the contract."));
  assert(contractCreate.includes("Hiring requirement changed; reload before drafting the contract."));
  assert(contractCreate.includes("COMMERCIAL_AGREEMENT_DRAFTED"));
  assert(contractCreate.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));

  assert(contractDetail.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(contractDetail.includes("reason: z.string().trim().min(3).max(2_000)"));
  assert(contractDetail.includes('["DRAFT", "INTERNAL_REVIEW", "AMENDMENT_REQUESTED"]'));
  assert(contractDetail.includes("Only draft or amendment-requested agreements can be revised."));
  assert(contractDetail.includes("current.updatedAt.toISOString() !== body.expectedUpdatedAt"));
  assert(contractDetail.includes("COMMERCIAL_AGREEMENT_UPDATED"));
  assert(contractDetail.includes("COMMERCIAL_AGREEMENT_ACCEPTED"));
  assert(contractDetail.includes("COMMERCIAL_AGREEMENT_AMENDMENT_REQUESTED"));
  assert(contractDetail.includes("COMMERCIAL_AGREEMENT_SENT"));
  assert(contractDetail.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
  assert(contractDetail.includes('getClientIp(req) || "unknown"'));
  assert(!contractDetail.includes('"127.0.0.1"'));
  assert(contractDetail.includes("Notification outcomes are recorded separately."));

  assert(employerReview.includes("expectedUpdatedAt: new Date(agreement.updatedAt).toISOString()"));
  assert(employerReview.includes('action: "accept"'));
  assert(employerReview.includes('action: "request_amendment"'));

  const requirementsRoute = fs.readFileSync(new URL("../app/api/agreements/requirements/route.ts", import.meta.url), "utf8");
  const requirementDetail = fs.readFileSync(new URL("../app/api/agreements/requirements/[id]/route.ts", import.meta.url), "utf8");
  const activation = fs.readFileSync(new URL("../lib/managedHiring/RequirementActivation.ts", import.meta.url), "utf8");

  assert(requirementsRoute.includes('agreements_requirements_get:${session.id}'));
  assert(requirementsRoute.includes('agreements_requirements_post:${session.id}'));

  assert(requirementDetail.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(requirementDetail.includes("reason: z.string().trim().min(3).max(1000)"));
  assert(requirementDetail.includes('agreement_requirement_detail_read:${session.id}'));
  assert(requirementDetail.includes("MANAGED_HIRING_REQUIREMENT_UPDATED"));
  assert(requirementDetail.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
  assert(requirementDetail.includes("Managed hiring requirement changed; reload before saving."));

  assert(activation.includes("expectedUpdatedAt: string"));
  assert(activation.includes("reason: string"));
  assert(activation.includes("MANAGED_HIRING_REQUIREMENT_ACTIVATED"));
  assert(activation.includes("enqueueSecurityAuditEvent(tx, auditLog, params.activatedById)"));
});


test("admin security pages report only evidence-backed posture and use canonical routes", () => {
  const page = fs.readFileSync(new URL("../app/admin/settings/security/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/security/status/route.ts", import.meta.url), "utf8");
  const inspector = fs.readFileSync(new URL("../app/admin/security/vulnerability-inspector/page.tsx", import.meta.url), "utf8");
  const legacyAudit = fs.readFileSync(new URL("../app/settings/audit-log/page.tsx", import.meta.url), "utf8");
  const auditPage = fs.readFileSync(new URL("../app/admin/settings/audit-log/page.tsx", import.meta.url), "utf8");
  const auditRoute = fs.readFileSync(new URL("../app/api/admin/audit-logs/route.ts", import.meta.url), "utf8");

  assert(route.includes('"APPLICATION_CONFIGURATION_EVIDENCE_ONLY"'));
  assert(route.includes("edgeProxyOrWaf"));
  assert(route.includes('"NOT_MEASURED"'));
  assert(route.includes("browserCrossOriginIsolation"));
  assert(route.includes('headers["Cross-Origin-Embedder-Policy"]'));
  assert(!route.includes("edgeProxy: true"));
  assert(!route.includes("crossOriginIsolation: headers"));

  assert(page.includes("No simulated security score"));
  assert(page.includes("Measurements awaiting external evidence"));
  assert(page.includes("COEP:"));
  assert(page.includes("NOT CLAIMED"));
  assert(page.includes('title="Security Posture"'));

  assert(inspector.includes('redirect("/admin/settings/security")'));
  assert(legacyAudit.includes('redirect("/admin/settings/audit-log")'));

  assert(auditPage.includes("/api/admin/audit-logs?"));
  assert(auditPage.includes("Page {page} of {totalPages}"));
  assert(auditRoute.includes('admin_audit_logs:${admin.id}'));
  assert(auditRoute.includes('orderBy: [{ createdAt: "desc" }, { id: "desc" }]'));
  assert(auditRoute.includes("skip: (query.page - 1) * query.limit"));
  assert(auditRoute.includes("take: query.limit"));
});


test("managed hiring agreement lifecycle is versioned reviewed and activates jobs only through admin activation", () => {
  const builder = fs.readFileSync(new URL("../app/admin/agreements/builder/page.tsx", import.meta.url), "utf8");
  const review = fs.readFileSync(new URL("../app/admin/agreements/[id]/page.tsx", import.meta.url), "utf8");
  const lifecycle = fs.readFileSync(new URL("../app/api/agreements/contracts/[id]/route.ts", import.meta.url), "utf8");
  const activationRoute = fs.readFileSync(new URL("../app/api/agreements/requirements/[id]/route.ts", import.meta.url), "utf8");
  const activationEngine = fs.readFileSync(new URL("../lib/managedHiring/RequirementActivation.ts", import.meta.url), "utf8");
  const managedRequirements = fs.readFileSync(new URL("../app/api/admin/managed-hiring/requirements/route.ts", import.meta.url), "utf8");
  const requestPage = fs.readFileSync(new URL("../app/admin/managed-hiring/requests/page.tsx", import.meta.url), "utf8");
  const pipelinePage = fs.readFileSync(new URL("../app/admin/managed-hiring/pipeline/page.tsx", import.meta.url), "utf8");
  const employerReview = fs.readFileSync(new URL("../app/employer/managed-hiring/agreements/[id]/page.tsx", import.meta.url), "utf8");

  assert(builder.includes("useSearchParams"));
  assert(builder.includes('searchParams.get("reqId")'));
  assert(builder.includes("expectedTemplateUpdatedAt"));
  assert(builder.includes("expectedRequirementUpdatedAt"));
  assert(builder.includes("reason: draftReason.trim()"));
  assert(builder.includes("draftReason.trim().length < 3"));
  assert(!builder.includes('Fixed Amount per Hire (INR)'));

  assert(lifecycle.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(lifecycle.includes('agreement_contract_update:${session.id}'));
  assert(lifecycle.includes('agreement_contract_action:${session.id}'));
  assert(lifecycle.includes("COMMERCIAL_AGREEMENT_UPDATED"));
  assert(lifecycle.includes("COMMERCIAL_AGREEMENT_SENT"));
  assert(lifecycle.includes("COMMERCIAL_AGREEMENT_ACCEPTED"));
  assert(lifecycle.includes("COMMERCIAL_AGREEMENT_AMENDMENT_REQUESTED"));
  assert(lifecycle.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
  assert(lifecycle.includes('getClientIp(req) || "unknown"'));
  assert(!lifecycle.includes('|| "127.0.0.1"'));
  assert(lifecycle.includes("Managed hiring agreements must keep the DAY_25 invoice rule"));
  assert(lifecycle.includes("operational activation remains an administrator action"));
  assert(!lifecycle.includes('data: { status: "ACTIVE" }'));

  assert(employerReview.includes("expectedUpdatedAt: new Date(agreement.updatedAt).toISOString()"));
  assert(employerReview.includes("Agreement unavailable"));
  assert(employerReview.includes("res.ok && data.success"));

  assert(review.includes("Commercial Agreement Review"));
  assert(review.includes("Edit reviewed terms"));
  assert(review.includes("Send to employer"));
  assert(review.includes("Activate Managed Hiring"));
  assert(review.includes('status: "ACTIVE"'));
  assert(review.includes("activeAgreementId: agreement.id"));
  assert(review.includes("expectedUpdatedAt: new Date(requirement.updatedAt).toISOString()"));
  assert(review.includes("Provider acceptance is not delivery/read confirmation."));

  assert(activationRoute.includes("activateManagedHiringRequirement"));
  assert(activationRoute.includes("expectedUpdatedAt: body.expectedUpdatedAt"));
  assert(activationRoute.includes("reason: body.reason"));
  assert(activationEngine.includes("JOB_LISTING_CREATED"));
  assert(activationEngine.includes("MANAGED_JOB_ACTIVATED"));
  assert(activationEngine.includes("MANAGED_HIRING_REQUIREMENT_ACTIVATED"));

  assert(managedRequirements.includes("latestAgreementId"));
  assert(managedRequirements.includes("latestAgreementStatus"));
  assert(requestPage.includes("Review agreement"));
  assert(requestPage.includes("latestAgreementId"));
  assert(pipelinePage.includes("Review agreement"));
  assert(pipelinePage.includes("latestAgreementId"));
});

test("managed hiring duplicate admin routes remain canonical redirects", () => {
  const builderRedirect = fs.readFileSync(new URL("../app/admin/managed-hiring/agreements/builder/page.tsx", import.meta.url), "utf8");
  const templatesRedirect = fs.readFileSync(new URL("../app/admin/managed-hiring/templates/page.tsx", import.meta.url), "utf8");

  assert(builderRedirect.includes('redirect(reqId ? `/admin/agreements/builder?reqId='));
  assert(templatesRedirect.includes('redirect("/admin/agreements/templates")'));
});


test("admin Copilot commerce keeps commercial changes versioned audited and fail closed", () => {
  const page = fs.readFileSync(new URL("../app/admin/copilot-commerce/page.tsx", import.meta.url), "utf8");
  const contracts = fs.readFileSync(new URL("../lib/copilot/contracts.ts", import.meta.url), "utf8");
  const commerce = fs.readFileSync(new URL("../app/api/admin/copilot/commerce/route.ts", import.meta.url), "utf8");
  const offers = fs.readFileSync(new URL("../app/api/admin/copilot/capacity-offers/route.ts", import.meta.url), "utf8");

  assert(page.includes("<AdminSidebar"));
  assert(page.includes("<AdminHeader"));
  assert(page.includes("md:pl-[116px]"));
  assert(page.includes("changeReason"));
  assert(page.includes("expectedUpdatedAt"));
  assert(page.includes("Creation reason (required)"));
  assert(page.includes("No Copilot plans are configured."));
  assert(page.includes("No Copilot usage rules are configured."));

  assert(contracts.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(contracts.includes("reason: z.string().trim().min(3).max(500)"));

  assert(commerce.includes('admin_copilot_commerce_read:${admin.id}'));
  assert(commerce.includes('admin_copilot_commerce_write:${session.id}'));
  assert(commerce.includes("Copilot plan changed; reload before saving."));
  assert(commerce.includes("Copilot regional price changed; reload before saving."));
  assert(commerce.includes("Copilot usage rule changed; reload before saving."));
  assert(commerce.includes("updateMany"));
  assert(commerce.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));

  assert(offers.includes('admin_copilot_capacity_offers_read:${admin.id}'));
  assert(offers.includes('admin_copilot_capacity_offers_write:${session.id}'));
  assert(offers.includes("Copilot capacity offer changed; reload before saving."));
  assert(offers.includes("Copilot capacity price changed; reload before saving."));
  assert(offers.includes("COPILOT_CAPACITY_OFFER_CREATED"));
  assert(offers.includes("COPILOT_CAPACITY_OFFER_UPDATED"));
  assert(offers.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
});


test("admin proctoring control panel stays aligned with versioned policy governance", () => {
  const page = fs.readFileSync(new URL("../app/admin/proctoring-control-panel/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/proctoring-policy/route.ts", import.meta.url), "utf8");

  assert(route.includes("expectedPolicyVersion: z.string().trim().min(1).max(64)"));
  assert(route.includes("reason: z.string().trim().min(3).max(500)"));
  assert(route.includes("Proctoring policy changed; reload before saving."));
  assert(route.includes("LIVE_INTERVIEW_PROCTORING_POLICY_UPDATED"));
  assert(route.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));

  assert(page.includes("expectedPolicyVersion: policy.policyVersion"));
  assert(page.includes("reason: reason.trim()"));
  assert(page.includes("Current policy version:"));
  assert(page.includes("Save audited policy"));
  assert(!page.includes('value={policy.policyVersion} onChange='));
  assert(page.includes("No persisted policy exists yet."));
});


test("admin Copilot commerce UI matches versioned audited backend contracts", () => {
  const page = fs.readFileSync(new URL("../app/admin/copilot-commerce/page.tsx", import.meta.url), "utf8");
  const commerce = fs.readFileSync(new URL("../app/api/admin/copilot/commerce/route.ts", import.meta.url), "utf8");
  const offers = fs.readFileSync(new URL("../app/api/admin/copilot/capacity-offers/route.ts", import.meta.url), "utf8");

  assert(page.includes("<AdminSidebar"));
  assert(page.includes("<AdminHeader"));
  assert(page.includes("md:pl-[116px]"));
  assert(page.includes("expectedUpdatedAt"));
  assert(page.includes("reason: changeReason.trim()"));
  assert(page.includes("Hard warning %"));
  assert(page.includes("patchCapacityOffer"));
  assert(page.includes("Archive offer"));
  assert(page.includes("Restore offer"));
  assert(page.includes("Save price"));
  assert(page.includes('name="reason"'));
  assert(!page.includes("expectedUpdatedAt,\n          reason: changeReason.trim(),\n        }),\n      });\n      const data = await res.json();\n      if (!res.ok || !data.success) throw new Error(data.error || \"Unable to create capacity offer.\")"));

  assert(commerce.includes("current.updatedAt.toISOString() !== body.expectedUpdatedAt"));
  assert(commerce.includes("COPILOT_COMMERCE_CONFIGURATION_UPDATED"));
  assert(commerce.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));

  assert(offers.includes("current.updatedAt.toISOString() !== body.expectedUpdatedAt"));
  assert(offers.includes("COPILOT_CAPACITY_OFFER_UPDATED"));
  assert(offers.includes("COPILOT_CAPACITY_OFFER_CREATED"));
  assert(offers.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
});
