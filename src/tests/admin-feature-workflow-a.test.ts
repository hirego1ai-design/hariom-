import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

test("admin shell stays responsive and dashboard navigation targets canonical pages", () => {
  const sidebar = fs.readFileSync(new URL("../components/admin/AdminSidebar.tsx", import.meta.url), "utf8");
  const header = fs.readFileSync(new URL("../components/admin/AdminHeader.tsx", import.meta.url), "utf8");
  const dashboard = fs.readFileSync(new URL("../app/admin/dashboard/page.tsx", import.meta.url), "utf8");

  assert(sidebar.includes('id="admin-mobile-navigation"'));
  assert(sidebar.includes("hidden md:flex"));
  assert(sidebar.includes('aria-label="Open admin navigation"'));
  assert(sidebar.includes("aria-current={isActive ? \"page\" : undefined}"));

  assert(header.includes("md:left-[116px]"));
  assert(header.includes('aria-label="Open audit logs"'));
  assert(header.includes('aria-label="Open system health"'));
  assert(header.includes('aria-label="Toggle appearance"'));

  assert(dashboard.includes("md:ml-[116px]"));
  for (const href of [
    "/admin/users",
    "/admin/employers",
    "/admin/jobs",
    "/admin/signups",
    "/admin/document-verification",
    "/admin/managed-hiring/requests",
    "/admin/managed-hiring/pipeline",
    "/admin/managed-hiring/operations",
    "/admin/agreements/templates",
    "/admin/agreements/builder",
    "/admin/settings/managed-hiring",
    "/admin/revenue",
    "/admin/invoices",
    "/admin/subscriptions",
    "/admin/pricing-engine",
    "/admin/payment-gateways",
    "/admin/referrals",
    "/admin/system-health",
    "/admin/ai-command-centre-dashboard",
    "/admin/system/infrastructure",
    "/admin/settings/audit-log",
    "/admin/settings/hub",
  ]) {
    assert(dashboard.includes(href), `dashboard must link to ${href}`);
  }
});


test("admin candidate users search and pagination stay wired end to end", () => {
  const header = fs.readFileSync(new URL("../components/admin/AdminHeader.tsx", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/admin/users/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/users/route.ts", import.meta.url), "utf8");

  assert(header.includes("{onSearch && ("));
  assert(!header.includes('placeholder="Search this admin view…"'));

  assert(page.includes("useDeferredValue(search)"));
  assert(page.includes("page: String(page)"));
  assert(page.includes("limit: String(PAGE_SIZE)"));
  assert(page.includes("setTotal(typeof payload.total === \"number\" ? payload.total : 0)"));
  assert(page.includes("Page {page} of {totalPages}"));
  assert(page.includes('role="alert"'));

  assert(route.includes("requireAdminSession(req)"));
  assert(route.includes("querySchema.parse"));
  assert(route.includes('orderBy: [{ createdAt: "desc" }, { id: "desc" }]'));
  assert(route.includes("skip: (query.page - 1) * query.limit"));
  assert(route.includes("take: query.limit"));
});


test("admin employer directory excludes recruiter profiles and keeps search pagination authoritative", () => {
  const page = fs.readFileSync(new URL("../app/admin/employers/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/employers/route.ts", import.meta.url), "utf8");

  assert(route.includes('user: { is: { role: "EMPLOYER" } }'));
  assert(route.includes('company: { name: { contains: query.search'));
  assert(route.includes('user: { is: { name: { contains: query.search'));
  assert(route.includes('user: { is: { email: { contains: query.search'));
  assert(route.includes('admin_employers:${admin.id}'));
  assert(route.includes('orderBy: [{ createdAt: "desc" }, { id: "desc" }]'));

  assert(page.includes("useDeferredValue(search)"));
  assert(page.includes("setTotal(typeof payload.total === \"number\" ? payload.total : 0)"));
  assert(page.includes("Employer-owner profiles"));
  assert(page.includes("Page {page} of {totalPages}"));
  assert(page.includes('role="alert"'));
});


test("admin job listings keep status filtering pagination and UI semantics truthful", () => {
  const page = fs.readFileSync(new URL("../app/admin/jobs/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/jobs/route.ts", import.meta.url), "utf8");

  assert(route.includes('status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "CLOSED"]).optional()'));
  assert(route.includes('admin_jobs:${admin.id}'));
  assert(route.includes('department: { contains: query.search'));
  assert(route.includes('location: { contains: query.search'));
  assert(route.includes('orderBy: [{ createdAt: "desc" }, { id: "desc" }]'));

  assert(page.includes('const statusClasses: Record<JobStatus, string>'));
  assert(page.includes('value={status}'));
  assert(page.includes('params.set("status", status)'));
  assert(page.includes("Page {page} of {totalPages}"));
  assert(!page.includes('<p className="text-emerald-400">{job.status}</p>'));
});


test("admin new-signups view defines explicit time windows over authoritative candidate users", () => {
  const page = fs.readFileSync(new URL("../app/admin/signups/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/users/route.ts", import.meta.url), "utf8");

  assert(route.includes('windowDays: z.enum(["7", "30", "90"]).optional()'));
  assert(route.includes("createdAfter"));
  assert(route.includes('role: "CANDIDATE"'));

  assert(page.includes('type SignupWindow = "" | "7" | "30" | "90"'));
  assert(page.includes('params.set("windowDays", windowDays)'));
  assert(page.includes("Last 7 days"));
  assert(page.includes("Last 30 days"));
  assert(page.includes("Last 90 days"));
  assert(page.includes("Page {page} of {totalPages}"));
  assert(!page.includes("&limit=100"));
});


test("admin assessment policy governance distinguishes missing config and audits writes atomically", () => {
  const universal = fs.readFileSync(new URL("../app/api/admin/skill-validation-policy/route.ts", import.meta.url), "utf8");
  const jobSpecific = fs.readFileSync(new URL("../app/api/admin/job-specific-assessment-policy/route.ts", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/admin/assessment/skill-validation/page.tsx", import.meta.url), "utf8");

  for (const source of [universal, jobSpecific]) {
    assert(source.includes("prisma.$transaction"));
    assert(source.includes('FOR UPDATE'));
    assert(source.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
    assert(source.includes("previousStoredValueValid"));
    assert(!source.includes("catch {\n      policy = null;"));
  }

  assert(universal.includes('admin_skill_validation_policy_read:${session.id}'));
  assert(jobSpecific.includes('admin_job_specific_assessment_policy_read:${session.id}'));
  assert(universal.includes("requires administrator repair"));
  assert(jobSpecific.includes("requires administrator repair"));

  assert(page.includes("universalReason"));
  assert(page.includes("jobSpecificReason"));
  assert(page.includes("Why are you changing the job-specific policy?"));
  assert(!page.includes("const [reason, setReason]"));
});


test("admin KYC review requires deliberate rationale and durable audit evidence", () => {
  const page = fs.readFileSync(new URL("../app/admin/document-verification/page.tsx", import.meta.url), "utf8");
  const listRoute = fs.readFileSync(new URL("../app/api/admin/document-verification/route.ts", import.meta.url), "utf8");
  const actionRoute = fs.readFileSync(new URL("../app/api/admin/document-verification/[id]/route.ts", import.meta.url), "utf8");

  assert(listRoute.includes('admin_document_verification_read:${session.id}'));
  assert(listRoute.includes('orderBy: [{ submittedAt: "desc" }, { id: "desc" }]'));

  assert(actionRoute.includes('admin_document_verification_write:${session.id}'));
  assert(actionRoute.includes("A rejection reason is required for KYC review."));
  assert(actionRoute.includes("KYC_DOCUMENT_VERIFIED"));
  assert(actionRoute.includes("KYC_DOCUMENT_REJECTED"));
  assert(actionRoute.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
  assert(actionRoute.includes("prisma.$transaction"));

  assert(page.includes('role="dialog"'));
  assert(page.includes("Reviewer note"));
  assert(page.includes("Page {page} of {totalPages}"));
  assert(page.includes("md:pl-[116px]"));
  assert(!page.includes('pl-[116px] flex-1'));
});


test("admin revenue dashboard is wired and keeps money separated by currency", () => {
  const page = fs.readFileSync(new URL("../app/admin/revenue/page.tsx", import.meta.url), "utf8");
  const shared = fs.readFileSync(new URL("../app/api/admin/revenue/_shared.ts", import.meta.url), "utf8");
  const summary = fs.readFileSync(new URL("../app/api/admin/revenue/summary/route.ts", import.meta.url), "utf8");
  const transactions = fs.readFileSync(new URL("../app/api/admin/revenue/transactions/route.ts", import.meta.url), "utf8");
  const subscriptions = fs.readFileSync(new URL("../app/api/admin/revenue/subscriptions/route.ts", import.meta.url), "utf8");
  const mockInterviews = fs.readFileSync(new URL("../app/api/admin/revenue/mock-interviews/route.ts", import.meta.url), "utf8");
  const jobBoost = fs.readFileSync(new URL("../app/api/admin/revenue/job-boost/route.ts", import.meta.url), "utf8");
  const financeAudit = fs.readFileSync(new URL("../app/api/admin/revenue/audit-logs/route.ts", import.meta.url), "utf8");

  assert(!page.includes('redirect("/admin/invoices")'));
  assert(page.includes('fetch("/api/admin/revenue/summary"'));
  assert(page.includes('/api/admin/revenue/transactions?'));
  assert(page.includes("Multiple currencies are reported separately"));
  assert(page.includes('href="/api/admin/revenue/export?format=csv"'));
  assert(page.includes('<option value="Overdue">Overdue</option>'));

  assert(shared.includes('case "COPILOT":'));
  assert(shared.includes('case "COPILOT_ADDON":'));
  assert(shared.includes('case "JOB_BOOST":'));
  assert(shared.includes('case "MOCK_INTERVIEW":'));
  assert(shared.includes('revenueSource: invoice.placement ? "Managed Hiring" : "Manual Invoice"'));
  assert(shared.includes('where: { placement: { isNot: null } }'));
  assert(shared.includes('invoice.status === "OVERDUE" ? "Overdue"'));
  assert(shared.includes("cancelledOrReplaced: null"));
  assert(shared.includes("replacementWarrantyCost: null"));
  assert(shared.includes("netProfit: null"));
  assert(!shared.includes('cancelledOrReplaced: 0'));
  assert(!shared.includes('replacementWarrantyCost: 0'));

  assert(summary.includes('currencyMode: currencies.length <= 1 ? "single" : "multiple"'));
  assert(summary.includes("byCurrency"));
  assert(!summary.includes("totalRevenueFormatted: formatMoney(totalRevenue),"));

  assert(transactions.includes('currency: z.string().regex(/^[A-Z]{3}$/).optional()'));
  assert(transactions.includes('"Overdue"'));
  assert(transactions.includes("filtered.slice(offset, offset + query.limit)"));

  assert(subscriptions.includes("take: 50"));
  assert(subscriptions.includes("companySubscription.groupBy"));
  assert(subscriptions.includes("revenueByCurrency"));

  assert(mockInterviews.includes("mockInterviewSession.count()"));
  assert(mockInterviews.includes("mockInterviewSession.aggregate"));
  assert(mockInterviews.includes("recentSessionPreviewLimit: 200"));

  assert(jobBoost.includes("byCurrency"));
  assert(financeAudit.includes("getAuditLogsStrict"));
  assert(financeAudit.includes('admin_revenue_audit_logs:${admin.id}'));
});

test("admin revenue error handling preserves API authorization status", () => {
  const shared = fs.readFileSync(new URL("../app/api/admin/revenue/_shared.ts", import.meta.url), "utf8");
  assert(shared.includes('"status" in error'));
  assert(shared.includes("Number.isInteger"));
  assert(shared.includes("return NextResponse.json({ success: false, error: message }, { status });"));
});


test("admin invoice operations stay currency-safe paginated and deliberately reviewed", () => {
  const page = fs.readFileSync(new URL("../app/admin/invoices/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/invoices/route.ts", import.meta.url), "utf8");
  const db = fs.readFileSync(new URL("../lib/invoices-db.ts", import.meta.url), "utf8");

  assert(route.includes('status: z.enum(["PAID", "UNPAID", "OVERDUE", "PENDING_VERIFICATION"]).optional()'));
  assert(route.includes('admin_invoices_read:${session.id}'));
  assert(route.includes('admin_invoice_review:${session.id}'));
  assert(route.includes("prisma.invoice.groupBy"));
  assert(route.includes('by: ["currency", "status"]'));
  assert(route.includes("totalOutstanding"));
  assert(route.includes("pendingVerification"));
  assert(route.includes('if (!body.reason?.trim()) throw new ApiError("A rejection reason is required."'));

  assert(db.includes("reason: reason?.trim() || null"));
  assert(db.includes("reviewer reason recorded="));

  assert(page.includes("Multiple currencies are reported separately"));
  assert(page.includes("useDeferredValue(search)"));
  assert(page.includes('params.set("status", status)'));
  assert(page.includes("Page {page} of {totalPages}"));
  assert(page.includes("Enter a rejection reason before rejecting the receipt."));
  assert(page.includes("Receipt file is unavailable; do not approve this payment."));
  assert(page.includes("Enter amount in the agreement currency"));
  assert(!page.includes("Base Placement Fee (₹)"));
  assert(!page.includes("formatCurrency(summary.totalBilled)"));
});


test("admin subscription controls use one canonical screen and reject stale commercial writes", () => {
  const page = fs.readFileSync(new URL("../app/admin/subscriptions/page.tsx", import.meta.url), "utf8");
  const legacyPage = fs.readFileSync(new URL("../app/admin/settings/plan-management/page.tsx", import.meta.url), "utf8");
  const plansRoute = fs.readFileSync(new URL("../app/api/admin/subscription-plans/route.ts", import.meta.url), "utf8");
  const settingsRoute = fs.readFileSync(new URL("../app/api/admin/subscriptions/settings/route.ts", import.meta.url), "utf8");
  const planContracts = fs.readFileSync(new URL("../lib/payments/planContracts.ts", import.meta.url), "utf8");
  const planMutations = fs.readFileSync(new URL("../lib/adminSubscriptionPlanMutations.ts", import.meta.url), "utf8");
  const settingsMutations = fs.readFileSync(new URL("../lib/adminSubscriptionSettingsMutations.ts", import.meta.url), "utf8");

  assert(legacyPage.includes('redirect("/admin/subscriptions")'));

  assert(plansRoute.includes("requireAdminSession(request)"));
  assert(plansRoute.includes('admin_subscription_plans_read:${session.id}'));
  assert(plansRoute.includes('admin_subscription_plans_write:${session.id}'));
  assert(!plansRoute.includes("getCurrentSession"));
  assert(plansRoute.includes("Invalid expectedUpdatedAt timestamp."));

  assert(settingsRoute.includes("requireAdminSession(request)"));
  assert(settingsRoute.includes('admin_subscription_settings_read:${admin.id}'));
  assert(settingsRoute.includes('admin_subscription_settings_write:${admin.id}'));
  assert(settingsRoute.includes("expectedUpdatedAt: z.string().datetime()"));

  assert(planContracts.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(planMutations.includes("existing.updatedAt.toISOString() !== expectedUpdatedAt"));
  assert(settingsMutations.includes("existing.updatedAt.toISOString() !== payload.expectedUpdatedAt"));

  assert(page.includes("md:pl-[116px]"));
  assert(page.includes("<AdminHeader"));
  assert(page.includes('role="dialog"'));
  assert(page.includes("expectedUpdatedAt: plan.updatedAt"));
  assert(page.includes("target.expectedUpdatedAt"));
  assert(page.includes('cost.trim() !== ""'));
  assert(page.includes("disabled={saving || !costValid}"));
  assert(!page.includes('onClick={() => void archivePlan(item.id)}'));
});


test("admin payment routing uses versioned database snapshots and deliberate emergency controls", () => {
  const page = fs.readFileSync(new URL("../app/admin/payment-gateways/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/payment-gateway/config/route.ts", import.meta.url), "utf8");
  const controller = fs.readFileSync(new URL("../lib/payments/PaymentGatewayController.ts", import.meta.url), "utf8");
  const settingsRedirect = fs.readFileSync(new URL("../app/admin/settings/payment-gateway/page.tsx", import.meta.url), "utf8");
  const legacyRedirect = fs.readFileSync(new URL("../app/settings/payment-gateway/page.tsx", import.meta.url), "utf8");

  assert(settingsRedirect.includes('redirect("/admin/payment-gateways")'));
  assert(legacyRedirect.includes('redirect("/admin/payment-gateways")'));

  assert(route.includes("PaymentGatewayController.getAdminConfigSnapshot()"));
  assert(route.includes("expectedUpdatedAt: z.string().datetime().nullable().optional()"));
  assert(route.includes(".length(2)"));
  assert(route.includes('key!=="expectedUpdatedAt"'));

  assert(controller.includes("static async getAdminConfigSnapshot()"));
  assert(controller.includes("const currentSnapshot = await this.getAdminConfigSnapshot()"));
  assert(controller.includes("existing.updatedAt.toISOString() !== expectedUpdatedAt"));
  assert(controller.includes("Payment gateway configuration changed; reload before saving."));
  assert(controller.includes("enqueueSecurityAuditEvent(tx, auditLog, auditContext.actorId)"));

  assert(page.includes("<AdminSidebar"));
  assert(page.includes("<AdminHeader"));
  assert(page.includes("md:pl-[116px]"));
  assert(page.includes("expectedUpdatedAt: configUpdatedAt"));
  assert(page.includes("setConfigUpdatedAt"));
  assert(page.includes("movePriority"));
  assert(page.includes('HEALTHY: "ENABLED"'));
  assert(page.includes('DEGRADED: "LIMITED"'));
  assert(page.includes("Disable all payment gateways?"));
  assert(page.includes("Confirm maintenance state"));
  assert(page.includes("No live provider-health assertion is made here."));
});


test("admin AI control centre uses exact telemetry and audited versioned controls", () => {
  const page = fs.readFileSync(new URL("../app/admin/ai-command-centre-dashboard/page.tsx", import.meta.url), "utf8");
  const agents = fs.readFileSync(new URL("../app/api/admin/ai-agents/route.ts", import.meta.url), "utf8");
  const routing = fs.readFileSync(new URL("../app/api/admin/ai-routing/route.ts", import.meta.url), "utf8");
  const control = fs.readFileSync(new URL("../app/api/admin/ai-agents/[id]/control/route.ts", import.meta.url), "utf8");

  assert(agents.includes('admin_ai_agent_control_read:${admin.id}'));
  assert(agents.includes("aiExecutionLog.groupBy"));
  assert(agents.includes('_count: { _all: true }'));
  assert(agents.includes("_max: { timestamp: true }"));
  assert(!agents.includes("take: 5_000"));
  assert(agents.includes("observedCostUsd: requests ?"));
  assert(agents.includes("controlUpdatedAt: kill?.updatedAt.toISOString() ?? null"));

  assert(routing.includes("prisma.$transaction"));
  assert(routing.includes('FOR UPDATE'));
  assert(routing.includes("nextConfig.version !== previous.version + 1"));
  assert(routing.includes("AI_ROUTING_CONFIG_UPDATED"));
  assert(routing.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
  assert(routing.includes('admin_ai_routing_read:${admin.id}'));

  assert(control.includes('action: z.enum(["PAUSE", "RESUME"])'));
  assert(control.includes("expectedUpdatedAt: z.string().datetime().nullable()"));
  assert(control.includes("Agent control state changed; reload before saving."));
  assert(control.includes("AI_AGENT_PAUSED"));
  assert(control.includes("AI_AGENT_RESUMED"));
  assert(control.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));

  assert(page.includes('observedCostUsd: number | null'));
  assert(page.includes("expectedUpdatedAt: controlTarget.agent.controlUpdatedAt"));
  assert(page.includes("Pause agent"));
  assert(page.includes("Resume agent"));
  assert(page.includes('role="dialog"'));
  assert(page.includes("No infrastructure health records were returned."));
});


test("admin model registry and LLM usage preserve telemetry coverage and canonical endpoint wiring", () => {
  const registry = fs.readFileSync(new URL("../app/admin/models/registry/page.tsx", import.meta.url), "utf8");
  const usagePage = fs.readFileSync(new URL("../app/admin/settings/llm-usage/page.tsx", import.meta.url), "utf8");
  const usageRoute = fs.readFileSync(new URL("../app/api/admin/llm-usage/route.ts", import.meta.url), "utf8");
  const benchmark = fs.readFileSync(new URL("../app/api/admin/model-benchmark/route.ts", import.meta.url), "utf8");

  assert(usagePage.includes('fetch("/api/admin/llm-usage"'));
  assert(!usagePage.includes('fetch("/api/admin/ai-routing"'));
  assert(usagePage.includes("totalTokens: number | null"));
  assert(usagePage.includes("totalCostUsd: number | null"));
  assert(usagePage.includes("avgLatencyMs: number | null"));
  assert(usagePage.includes("Not fully measured"));
  assert(usagePage.includes("Known priced spend"));

  assert(usageRoute.includes("getAiRoutingConfig()"));
  assert(usageRoute.includes("getAiUsageStats()"));
  assert(usageRoute.includes("knownTokens: stats.knownTokens"));
  assert(usageRoute.includes("tokenCoverageRate: stats.tokenCoverageRate"));
  assert(usageRoute.includes("knownCostUsd: stats.knownCostUsd"));
  assert(usageRoute.includes("costCoverageRate: stats.costCoverageRate"));
  assert(usageRoute.includes('admin_llm_usage:${admin.id}'));

  assert(registry.includes("totalTokens: number | null"));
  assert(registry.includes("totalCostUsd: number | null"));
  assert(registry.includes("avgLatencyMs: number | null"));
  assert(registry.includes('"Not fully measured"'));
  assert(registry.includes('money(telemetry?.totalCostUsd ?? null)'));

  assert(benchmark.includes("SYNTHETIC_PROMPT"));
  assert(benchmark.includes("containsRealUserData: false"));
  assert(benchmark.includes('admin_model_benchmark:${admin.id}'));
  assert(benchmark.includes("bypassCache: true"));
});


test("admin model registry separates benchmarks and preserves incomplete telemetry", () => {
  const registry = fs.readFileSync(new URL("../app/admin/models/registry/page.tsx", import.meta.url), "utf8");
  const usage = fs.readFileSync(new URL("../app/admin/settings/llm-usage/page.tsx", import.meta.url), "utf8");
  const routing = fs.readFileSync(new URL("../app/api/admin/ai-routing/route.ts", import.meta.url), "utf8");
  const benchmark = fs.readFileSync(new URL("../app/api/admin/model-benchmark/route.ts", import.meta.url), "utf8");
  const router = fs.readFileSync(new URL("../utils/aiRouter.ts", import.meta.url), "utf8");

  assert(router.includes('task: { not: "admin-synthetic-benchmark" }'));
  assert(router.includes('log.task !== "admin-synthetic-benchmark"'));

  assert(routing.includes("knownTokens: usage.knownTokens"));
  assert(routing.includes("tokenCoverageRate: usage.tokenCoverageRate"));
  assert(routing.includes("knownCostUsd: usage.knownCostUsd"));
  assert(routing.includes("costCoverageRate: usage.costCoverageRate"));
  assert(routing.includes('reason: z.string().trim().min(3).max(500)'));

  assert(benchmark.includes("Benchmark model keys must be unique."));
  assert(benchmark.includes("excludedFromOperationalUsageTelemetry: true"));

  assert(registry.includes("totalTokens: number | null"));
  assert(registry.includes("totalCostUsd: number | null"));
  assert(registry.includes("Not fully measured"));
  assert(registry.includes("Change reason (required)"));
  assert(registry.includes("disabled={saving || reason.trim().length < 3}"));
  assert(!registry.includes("money(telemetry?.totalCostUsd ?? 0)"));

  assert(usage.includes("totalTokens: number | null"));
  assert(usage.includes("totalCostUsd: number | null"));
  assert(usage.includes("Not fully measured"));
  assert(usage.includes("Benchmark runs are excluded from operational request, token and spend totals."));
});


test("admin operational evidence screens stay scoped persisted and non-simulated", () => {
  const securityPage = fs.readFileSync(new URL("../app/admin/settings/security/page.tsx", import.meta.url), "utf8");
  const securityRoute = fs.readFileSync(new URL("../app/api/admin/security/status/route.ts", import.meta.url), "utf8");
  const healthPage = fs.readFileSync(new URL("../app/admin/system-health/page.tsx", import.meta.url), "utf8");
  const healthRoute = fs.readFileSync(new URL("../app/api/admin/system-health/route.ts", import.meta.url), "utf8");
  const auditPage = fs.readFileSync(new URL("../app/admin/settings/audit-log/page.tsx", import.meta.url), "utf8");
  const auditRoute = fs.readFileSync(new URL("../app/api/admin/audit-logs/route.ts", import.meta.url), "utf8");
  const infrastructure = fs.readFileSync(new URL("../app/admin/system/infrastructure/page.tsx", import.meta.url), "utf8");
  const queuePage = fs.readFileSync(new URL("../app/admin/system/queue-broker/page.tsx", import.meta.url), "utf8");
  const vulnerability = fs.readFileSync(new URL("../app/admin/security/vulnerability-inspector/page.tsx", import.meta.url), "utf8");
  const backup = fs.readFileSync(new URL("../app/admin/system/backup-recovery/page.tsx", import.meta.url), "utf8");

  assert(securityRoute.includes('admin_security_status:${admin.id}'));
  assert(securityRoute.includes('Boolean(headers["Strict-Transport-Security"])'));
  assert(securityRoute.includes('headers["Strict-Transport-Security"] || ""'));
  assert(securityPage.includes("Unable to load security evidence."));
  assert(securityPage.includes('cache: "no-store"'));

  assert(healthRoute.includes("getProviderStatusSummary"));
  assert(healthRoute.includes("process.env.S3_REGION"));
  assert(healthRoute.includes('overallStatus: dbStatus === "HEALTHY" ? "APPLICATION_AVAILABLE" : "DEGRADED"'));
  assert(healthRoute.includes('observedScope: "APPLICATION_RUNTIME_AND_CONFIGURATION"'));
  assert(healthPage.includes("Credential presence is never presented as provider uptime."));
  assert(healthPage.includes("No service observations were returned."));

  assert(auditRoute.includes("prisma.auditLog.count"));
  assert(auditRoute.includes("prisma.auditLog.findMany"));
  assert(auditRoute.includes("skip: (query.page - 1) * query.limit"));
  assert(auditRoute.includes("take: query.limit"));
  assert(auditPage.includes("useDeferredValue(searchQuery)"));
  assert(auditPage.includes("Results are paginated"));
  assert(!auditPage.includes("Complete audit log"));

  assert(infrastructure.includes('redirect("/admin/system-health")'));
  assert(queuePage.includes("Workflow recovery worker"));
  assert(queuePage.includes("workerLiveness?.workflowRecovery"));
  assert(queuePage.includes("md:pl-[116px]"));

  assert(vulnerability.includes("does not claim zero vulnerabilities"));
  assert(backup.includes("EXTERNAL EVIDENCE REQUIRED"));
});
