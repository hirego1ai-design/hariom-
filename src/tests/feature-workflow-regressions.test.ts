import fs from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchEmployerCandidates, pipelineStageLabels, pipelineStageStatus } from "../lib/employerCandidates";
import { subscriptionCredits } from "../lib/payments/subscriptionCredits";
import { isGateway, GatewayName } from "../lib/payments/PaymentGatewayInterface";

test("pipeline fetch includes applications beyond the first 100 and preserves duplicate candidate applications", async () => {
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    const page = urls.length;
    return Response.json({ success: true, candidates: [{ id: "same-candidate", applicationId: `app-${page}` }],
      pagination: { nextCursor: page < 3 ? `cursor-${page}` : null } });
  };
  try {
    assert.deepEqual(await fetchEmployerCandidates(), [1, 2, 3].map(n => ({ id: "same-candidate", applicationId: `app-${n}` })));
    assert.equal(urls[0], "/api/employer/candidates?limit=100");
    assert.match(urls[2], /cursor=cursor-2/);
  } finally { globalThis.fetch = original; }
});

test("pipeline rejects failed later pages instead of presenting partial results as complete", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1
    ? Response.json({ success: true, candidates: [{ id: "first" }], pagination: { nextCursor: "second" } })
    : Response.json({ success: false, error: "Database unavailable" }, { status: 503 });
  try { await assert.rejects(fetchEmployerCandidates(), /Database unavailable/); }
  finally { globalThis.fetch = original; }
});

test("pipeline detects repeated cursors instead of an endless fetch loop", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: true, candidates: [], pagination: { nextCursor: "same" } });
  try { await assert.rejects(fetchEmployerCandidates(), /did not advance/); }
  finally { globalThis.fetch = original; }
});

test("persisted hiring stages survive page reload without label loss", () => {
  for (const status of ["SCREENING", "ASSESSMENT", "AI_INTERVIEW", "SHORTLISTED", "HIRED", "REJECTED"]) {
    assert.equal(pipelineStageStatus(pipelineStageLabels[status]), status);
  }
  assert.throws(() => pipelineStageStatus("Documentation"), /Unsupported/);
});

test("paid plan provisions customer quotas without per-AI-action customer credits", () => {
  assert.deepEqual(subscriptionCredits({ jobPostsQuota: 1, resumeUnlocksQuota: 2, aiInterviewsQuota: 3,
    applicationsQuota: 4, resumeDownloadsQuota: 5, backgroundVerificationsQuota: 6 }), {
    jobPostsLeft: 1, resumeUnlocksLeft: 2, aiInterviewsLeft: 3, aiAgentCreditsLeft: 0,
    applicationsLeft: 4, resumeDownloadsLeft: 5, backgroundVerificationsLeft: 6, copilotJobsLeft: 0,
  });
});

test("corrupt negative plan quotas cannot reduce credits on purchase", () => {
  assert.throws(() => subscriptionCredits({ jobPostsQuota: 1, resumeUnlocksQuota: 2, aiInterviewsQuota: -1,
    applicationsQuota: 4, resumeDownloadsQuota: 5, backgroundVerificationsQuota: 6 }), /Subscription plan has invalid quotas/);
});

test("Payment gateway contract strictly enforces STRIPE and PAYU while rejecting RAZORPAY and PHONEPE", () => {
  assert.equal(isGateway("STRIPE"), true);
  assert.equal(isGateway("PAYU"), true);
  assert.equal(isGateway("RAZORPAY"), false);
  assert.equal(isGateway("PHONEPE"), false);
  assert.equal(isGateway("UNKNOWN"), false);
});


test("subscription checkout remains employer-only and rate limited", () => {
  const source = fs.readFileSync(new URL("../app/api/payments/checkout/route.ts", import.meta.url), "utf8");
  assert(source.includes('enforceRateLimit(req, "payment_checkout", 10, 60_000)'));
  assert(source.includes('session.role !== "EMPLOYER"'));
  assert(!source.includes('["EMPLOYER", "RECRUITER"].includes(session.role)'));
});

test("interview rejection remains a persisted two-step consequential action", () => {
  const route = fs.readFileSync(new URL("../app/api/employer/interviews/[id]/round-decision/route.ts", import.meta.url), "utf8");
  const ui = fs.readFileSync(new URL("../app/employer/final-round-feedback/page.tsx", import.meta.url), "utf8");
  assert(route.includes("requestConsequentialAction"));
  assert(route.includes("decideApproval"));
  assert(route.includes("consumeApprovedAction"));
  assert(route.includes("requiresConfirmation: true"));
  assert(ui.includes("Confirm rejection"));
  assert(ui.includes("confirmApproval: true"));
});


test("employer subscription endpoint stays tenant scoped and rate limited", () => {
  const source = fs.readFileSync(new URL("../app/api/employer/subscribe/route.ts", import.meta.url), "utf8");
  const authentication = source.indexOf("getCurrentSession(request.headers)");
  const rateLimit = source.indexOf('enforceRateLimit(request, "employer_subscription_get", 60, 60_000)');
  assert(authentication >= 0 && rateLimit > authentication, "authentication must reject anonymous requests before Redis-backed rate limiting");
  assert(source.includes('session.role !== "EMPLOYER"'));
  assert(source.includes("getSessionCompany(session)"));
  assert(!source.includes('session.role !== "EMPLOYER" && session.role !== "ADMIN"'));
});

test("managed hiring placement operations stay bounded and rate limited", () => {
  const source = fs.readFileSync(new URL("../app/api/employer/managed-hiring/join/route.ts", import.meta.url), "utf8");
  assert(source.includes('enforceRateLimit(request, "employer_managed_hiring_join_get", 60, 60000)'));
  assert(source.includes('enforceRateLimit(request, "employer_managed_hiring_join_action", 10, 60000)'));
  assert(source.includes("readValidatedJson(request, actionSchema, 8 * 1024)"));
});


test("internal video callback uses bounded input and timing-safe authentication", () => {
  const source = fs.readFileSync(new URL("../app/api/internal/video-analysis/callback/route.ts", import.meta.url), "utf8");
  assert(source.includes("timingSafeEqual"));
  assert(source.includes("readValidatedJson(request, callbackSchema, 128 * 1024)"));
});

test("team invitation acceptance serializes the single-use token", () => {
  const source = fs.readFileSync(new URL("../app/api/employer/team/accept/route.ts", import.meta.url), "utf8");
  assert(source.includes('FOR UPDATE'));
  assert(source.includes('status: "PENDING"'));
  assert(source.includes("enqueueSecurityAuditEvent"));
  assert(source.includes("revokeAllUserSessions(acceptance.userId"));
});


test("password reset commits audit with credential change and bounds OTP/password input", () => {
  const source = fs.readFileSync(new URL("../app/api/auth/reset-password/route.ts", import.meta.url), "utf8");
  assert(source.includes("prisma.$transaction"));
  assert(source.includes("enqueueSecurityAuditEvent"));
  assert(source.includes('/^\\d{6}$/'));
  assert(source.includes('newPassword: z.string().min(8'));
  assert(source.includes("PASSWORD_RESET_SESSION_CACHE_REFRESH_FAILED"));
});

test("team removal rotates sessions and emits durable security audit", () => {
  const source = fs.readFileSync(new URL("../app/api/employer/team/route.ts", import.meta.url), "utf8");
  assert(source.includes("sessionVersion: { increment: 1 }"));
  assert(source.includes("revokeAllUserSessions(removal.userId, removal.sessionVersion)"));
  assert(source.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
});


test("candidate collaboration endpoints stay bounded and audited", () => {
  const notes = fs.readFileSync(new URL("../app/api/employer/candidates/[id]/notes/route.ts", import.meta.url), "utf8");
  const tags = fs.readFileSync(new URL("../app/api/employer/candidates/[id]/tags/route.ts", import.meta.url), "utf8");
  const collections = fs.readFileSync(new URL("../app/api/employer/candidate-collections/route.ts", import.meta.url), "utf8");
  assert(notes.includes('enforceRateLimit(req,"employer_candidate_notes_post",30,60_000)'));
  assert(notes.includes("readValidatedJson(req,noteSchema,8*1024)"));
  assert(notes.includes("CANDIDATE_NOTE_CREATED"));
  assert(tags.includes('enforceRateLimit(req,"employer_candidate_tags_delete",30,60_000)'));
  assert(tags.includes("readValidatedJson(req,schema,4*1024)"));
  assert(tags.includes("CANDIDATE_TAG_REMOVED"));
  assert(collections.includes("readValidatedJson(req,updateSchema,64*1024)"));
  assert(collections.includes("CANDIDATE_COLLECTION_UPDATED"));
});


test("candidate credit mutations keep durable security audit evidence", () => {
  const grants = fs.readFileSync(new URL("../app/api/admin/candidate-credits/grants/route.ts", import.meta.url), "utf8");
  const service = fs.readFileSync(new URL("../app/api/candidate/services/[serviceKey]/request/route.ts", import.meta.url), "utf8");
  assert(grants.includes("enqueueSecurityAuditEvent"));
  assert(grants.includes("readValidatedJson(request, grantSchema, 8 * 1024)"));
  assert(service.includes("enqueueSecurityAuditEvent"));
  assert(service.includes("readValidatedJson(request, requestSchema, 4 * 1024)"));
});

test("candidate availability endpoints remain bounded and rate limited", () => {
  const source = fs.readFileSync(new URL("../app/api/candidate/availability/route.ts", import.meta.url), "utf8");
  assert(source.includes('enforceRateLimit(req, "candidate_availability_get", 60, 60000)'));
  assert(source.includes("readValidatedJson(req, schema, 4 * 1024)"));
});


test("candidate pipeline and profile endpoints remain explicitly scoped and bounded", () => {
  const pipeline = fs.readFileSync(new URL("../app/api/employer/candidates/route.ts", import.meta.url), "utf8");
  const profile = fs.readFileSync(new URL("../app/api/candidate/profile/route.ts", import.meta.url), "utf8");
  const readiness = fs.readFileSync(new URL("../app/api/candidate/readiness/route.ts", import.meta.url), "utf8");
  const videoStatus = fs.readFileSync(new URL("../app/api/candidate/video-resume/status/route.ts", import.meta.url), "utf8");
  const authentication = pipeline.indexOf("getCurrentSession(req.headers)");
  const rateLimit = pipeline.indexOf('enforceRateLimit(req, "employer_candidates_get", 60, 60_000)');
  assert(authentication >= 0 && rateLimit > authentication, "authentication must reject anonymous requests before Redis-backed rate limiting");
  assert(pipeline.includes('companyId query parameter is required for administrators.'));
  assert(profile.includes("readValidatedJson(request, profileUpdateSchema, 64 * 1024)"));
  assert(readiness.includes("readValidatedJson(request, selectReadinessSchema, 4 * 1024)"));
  assert(videoStatus.includes('enforceRateLimit(request, "video_resume_status", 60, 60_000)'));
});

test("admin candidate service catalog mutations are bounded and atomically audited", () => {
  const create = fs.readFileSync(new URL("../app/api/admin/candidate-services/route.ts", import.meta.url), "utf8");
  const update = fs.readFileSync(new URL("../app/api/admin/candidate-services/[id]/route.ts", import.meta.url), "utf8");
  assert(create.includes("readValidatedJson(request, serviceSchema, 8 * 1024)"));
  assert(create.includes("enqueueSecurityAuditEvent"));
  assert(update.includes("readValidatedJson(request, updateSchema, 8 * 1024)"));
  assert(update.includes("enqueueSecurityAuditEvent"));
});

test("Phase 5 database verification cannot silently fall back to synthetic fixtures", () => {
  const suite = fs.readFileSync(new URL("phase5-agent-security.test.ts", import.meta.url), "utf8");
  const runner = fs.readFileSync(new URL("run-phase5-tests.ts", import.meta.url), "utf8");
  const fixtureSelection = runner.indexOf('const fixtureMode = selectFixtureMode()');
  const suiteImport = runner.indexOf("await import('./phase5-agent-security.test')");
  assert(fixtureSelection >= 0 && suiteImport > fixtureSelection, "fixture mode must be selected before Prisma-backed suite evaluation");
  assert(runner.includes("process.env.HIREGO_TEST_DATABASE === '1'"));
  assert(runner.includes("process.env.MOCK_DB === 'true'"));
  assert(runner.includes("assertDisposableTestEnvironment()"));
  assert(suite.includes("Synthetic fallback is disabled"));
  assert(suite.includes("fixture mode does not match the initialized Prisma client mode"));
  assert(runner.includes("Phase 5 fixture mode:"));
});

test("deployment templates document production-critical runtime settings", () => {
  for (const file of ["../../.env.example", "../../docs/staging.env.example"]) {
    const template = fs.readFileSync(new URL(file, import.meta.url), "utf8");
    for (const key of [
      "COMMUNICATION_HASH_SECRET",
      "COMMUNICATION_TEST_RECIPIENT_ALLOWLIST",
      "MALWARE_SCANNER_URL",
      "MALWARE_SCANNER_TOKEN",
      "PAYU_ENVIRONMENT",
      "RELEASE_SIGNED_OFF",
      "VIDEO_ANALYSIS_CALLBACK_ORIGIN",
    ]) {
      assert.match(template, new RegExp(`^${key}=`, "m"), `${file} must document ${key}`);
    }
  }
});


test("recorded assessment recovery is scheduled outside Vercel with a dedicated least-privilege worker", () => {
  const vercel = JSON.parse(fs.readFileSync(new URL("../../vercel.json", import.meta.url), "utf8")) as { crons?: Array<{ path: string; schedule: string }> };
  const scheduler = fs.readFileSync(new URL("../../scripts/run-recorded-assessment-scheduler.mjs", import.meta.url), "utf8");
  const dockerfile = fs.readFileSync(new URL("../../Dockerfile.recorded-assessment-scheduler", import.meta.url), "utf8");

  assert.deepEqual(
    vercel.crons,
    [
      { path: "/api/cron/referrals-reconciliation", schedule: "0 2 * * *" },
      { path: "/api/cron/events-outbox", schedule: "*/5 * * * *" },
    ],
  );
  assert(!JSON.stringify(vercel).includes("/api/cron/recorded-assessment-analysis"));
  assert(scheduler.includes("'/api/cron/recorded-assessment-analysis'"));
  assert(scheduler.includes("process.env.CRON_SECRET"));
  assert(scheduler.includes("process.env.VERCEL_AUTOMATION_BYPASS_SECRET"));
  assert(scheduler.includes("Authorization"));
  assert(scheduler.includes("Bearer"));
  assert(scheduler.includes("x-vercel-protection-bypass"));
  assert(!scheduler.includes("while ("));
  assert(scheduler.includes("AbortController"));
  assert(!scheduler.includes("DATABASE_URL"));
  assert(!scheduler.includes("VIDEO_ANALYSIS_INTERNAL_TOKEN"));
  assert(dockerfile.includes("USER node"));
});

test("legacy production surfaces no longer render raw HTML prototypes", () => {
  const targetPages = [
    "applications/history",
    "applications/withdraw",
    "assessment/typing/setup",
    "billing",
    "jobs/alerts",
    "jobs/filters",
    "jobs/report",
    "jobs/suggestions",
    "jobs/[id]/ai-insights",
    "messages",
    "pricing/upgrade",
    "profile/certificates",
    "profile/completion",
    "profile/resume/optimize",
    "profile/resume",
    "profile/resume/templates",
    "profile/skills-management",
    "profile/wizard/details",
    "register/complete",
    "settings/notifications",
    "settings/security",
    "subscriptions",
  ];

  for (const page of targetPages) {
    const source = fs.readFileSync(new URL(`../app/${page}/page.tsx`, import.meta.url), "utf8");
    assert(!source.includes("rawHtml"), `${page} must not contain rawHtml`);
    assert(!source.includes("html-react-parser"), `${page} must not use html-react-parser`);
  }
});

test("retired legacy routes redirect only to canonical production surfaces", () => {
  const redirects = new Map([
    ["applications/history", "/applications"],
    ["assessment/typing/setup", "/assessment/typing/active"],
    ["billing", "/employer/revenue-and-billing-management"],
    ["jobs/alerts", "/notifications"],
    ["jobs/filters", "/jobs"],
    ["jobs/report", "/jobs"],
    ["jobs/suggestions", "/jobs"],
    ["messages", "/notifications"],
    ["pricing/upgrade", "/employer/subscriptions"],
    ["profile/certificates", "/profile"],
    ["profile/completion", "/profile"],
    ["profile/resume/optimize", "/profile"],
    ["profile/resume", "/onboarding/resume-upload"],
    ["profile/resume/templates", "/profile"],
    ["profile/skills-management", "/profile"],
    ["profile/wizard/details", "/profile"],
    ["register/complete", "/otp"],
    ["settings/notifications", "/notifications"],
    ["settings/security", "/forgot-password"],
    ["subscriptions", "/employer/subscriptions"],
  ]);

  for (const [page, destination] of redirects) {
    const source = fs.readFileSync(new URL(`../app/${page}/page.tsx`, import.meta.url), "utf8");
    assert(source.includes(`redirect("${destination}")`), `${page} must redirect to ${destination}`);
  }

  const aiInsights = fs.readFileSync(
    new URL("../app/jobs/[id]/ai-insights/page.tsx", import.meta.url),
    "utf8"
  );
  assert(aiInsights.includes("redirect(`/jobs/\${encodeURIComponent(id)}`)"));

  for (const canonicalPage of [
    "../app/applications/page.tsx",
    "../app/assessment/typing/active/page.tsx",
    "../app/employer/revenue-and-billing-management/page.tsx",
    "../app/employer/subscriptions/page.tsx",
    "../app/jobs/page.tsx",
    "../app/notifications/page.tsx",
    "../app/onboarding/resume-upload/page.tsx",
    "../app/otp/page.tsx",
    "../app/profile/page.tsx",
  ]) {
    assert(fs.existsSync(new URL(canonicalPage, import.meta.url)), `${canonicalPage} must exist`);
  }
});

test("candidate withdrawal uses the authoritative owned application transition", () => {
  const ui = fs.readFileSync(new URL("../app/applications/withdraw/page.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/applications/route.ts", import.meta.url), "utf8");
  const middleware = fs.readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");

  assert(ui.includes('fetch("/api/applications"'));
  assert(ui.includes('method: "PATCH"'));
  assert(ui.includes('body.status !== "WITHDRAWN"'));
  assert(ui.includes("Confirm withdrawal"));
  assert(!ui.includes("localStorage"));
  assert(!ui.includes("sessionStorage"));

  const authentication = route.indexOf("getCurrentSession(req.headers)", route.indexOf("export async function PATCH"));
  const rateLimit = route.indexOf(
    'enforceRateLimit(req, "candidate_application_withdraw", 12, 60_000)',
    authentication
  );
  assert(authentication >= 0 && rateLimit > authentication);
  assert(route.includes('session.role !== "CANDIDATE"'));
  assert(route.includes("application.candidateProfileId !== candidate.id"));
  assert(route.includes('SELECT id FROM "Application"'));
  assert(route.includes('application.status === "HIRED" || application.pphPlacement'));
  assert(route.includes('data: { status: "WITHDRAWN" }'));
  assert(route.includes('action: "APPLICATION_WITHDRAWN"'));
  assert(route.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
  assert(middleware.includes('"/applications"'));
});

test("production wiring report is generated from current inventory without stale manual verdicts", () => {
  const generator = fs.readFileSync(
    new URL("../../scripts/generate-production-wiring-report.mjs", import.meta.url),
    "utf8"
  );
  assert(generator.includes("parseCsv(csvText)"));
  assert(generator.includes("statusCounts"));
  assert(generator.includes("issueRows"));
  assert(generator.includes("STATIC WIRING AUDIT: GREEN"));
  assert(generator.includes("Runtime readiness is verified separately"));
  assert(generator.includes("generated wiring inventory contains no RED or YELLOW records"));
  assert(!generator.includes("simulated AI output"));
  assert(!generator.includes("local upload persistence"));
  assert(!generator.includes("complete 245-screen registry"));
  assert(!generator.includes("1,531 JSON records"));
});

test("production wiring inventory preserves router action names", () => {
  const generator = fs.readFileSync(
    new URL("../../scripts/generate-production-wiring-inventory.mjs", import.meta.url),
    "utf8"
  );
  const inventory = JSON.parse(
    fs.readFileSync(new URL("../../production-wiring-inventory.json", import.meta.url), "utf8")
  ) as { records: Array<{ record_type: string; user_action: string }> };
  assert(generator.includes("const eventName = event[1] || event[2]"));
  assert(!inventory.records.some((record) => record.user_action === "undefined handler"));
  assert(inventory.records.some(
    (record) => record.record_type === "user_action" && record.user_action === "router.push handler"
  ));
  const aiRoutingCall = inventory.records.find(
    (record) =>
      record.record_type === "frontend_api_call" &&
      (record as { api_endpoint?: string }).api_endpoint === "/api/admin/ai-routing"
  ) as { method?: string; user_action?: string } | undefined;
  assert.equal(aiRoutingCall?.method, "GET");
  assert.equal(aiRoutingCall?.user_action, "fetch GET /api/admin/ai-routing");
});

test("previously yellow production endpoints are backed by real sources or explicit tombstones", () => {
  const inventory = JSON.parse(
    fs.readFileSync(new URL("../../production-wiring-inventory.json", import.meta.url), "utf8")
  ) as {
    records: Array<{ record_type: string; api_endpoint?: string; method?: string; status: string }>;
    reconciliation?: { yellow_records?: number; red_records?: number };
  };

  const expected = new Map([
    ["GET /api/admin/revenue/audit-logs", "GREEN"],
    ["GET /api/admin/revenue/job-boost", "GREEN"],
    ["GET /api/admin/revenue/mock-interviews", "GREEN"],
    ["GET /api/admin/revenue/subscriptions", "GREEN"],
    ["GET /api/auth/me", "GREEN"],
    ["GET /api/employer/interviews/:id/calendar", "GREEN"],
    ["POST /api/whatsapp/onboard", "GREEN"],
    ["GET /api/whatsapp/onboard", "GREEN"],
  ]);

  for (const [key, status] of expected) {
    const [method, endpoint] = key.split(" ", 2);
    const record = inventory.records.find(
      (item) =>
        item.record_type === "api_endpoint" &&
        item.method === method &&
        item.api_endpoint === endpoint
    );
    assert(record, `Missing inventory record for ${key}`);
    assert.equal(record.status, status, `${key} must be GREEN`);
  }

  assert.equal(inventory.reconciliation?.red_records, 0);
  assert.equal(
    inventory.reconciliation?.yellow_records ?? 0,
    0,
    "Current production inventory must not contain unresolved YELLOW records"
  );

  const jobBoost = fs.readFileSync(
    new URL("../app/api/admin/revenue/job-boost/route.ts", import.meta.url),
    "utf8"
  );
  const mockInterviews = fs.readFileSync(
    new URL("../app/api/admin/revenue/mock-interviews/route.ts", import.meta.url),
    "utf8"
  );
  const subscriptions = fs.readFileSync(
    new URL("../app/api/admin/revenue/subscriptions/route.ts", import.meta.url),
    "utf8"
  );
  const calendar = fs.readFileSync(
    new URL("../app/api/employer/interviews/[id]/calendar/route.ts", import.meta.url),
    "utf8"
  );
  const whatsappTombstone = fs.readFileSync(
    new URL("../app/api/whatsapp/onboard/route.ts", import.meta.url),
    "utf8"
  );

  assert(jobBoost.includes("loadRevenueTransactions"));
  assert(!jobBoost.includes("jobBoostSummary"));
  assert(!jobBoost.includes("allowRevenueFixtures"));

  assert(mockInterviews.includes("prisma.mockInterviewSession.findMany"));
  assert(mockInterviews.includes("loadRevenueTransactions"));
  assert(!mockInterviews.includes("mockInterviewSummary"));
  assert(!mockInterviews.includes("allowRevenueFixtures"));

  assert(subscriptions.includes("prisma.subscriptionPlan.findMany"));
  assert(subscriptions.includes("prisma.paymentTransaction.findMany"));
  assert(!subscriptions.includes("subscriptionPlans:"));

  assert(calendar.includes("escapeIcsText"));
  assert(calendar.includes("Cache-Control"));
  assert(calendar.includes("handleApiError"));

  assert(whatsappTombstone.includes("jsonError"));
  assert(whatsappTombstone.includes("410"));
  assert(whatsappTombstone.includes("/api/whatsapp/webhook"));
});



test("admin invoice creation derives commercial terms from authoritative agreement data", () => {
  const route = fs.readFileSync(new URL("../app/api/admin/invoices/route.ts", import.meta.url), "utf8");
  const ui = fs.readFileSync(new URL("../app/admin/invoices/page.tsx", import.meta.url), "utf8");

  assert(route.includes("commercialTerms.taxRatePct"));
  assert(route.includes("commercialTerms.creditDays"));
  assert(route.includes("commercialTerms.requirement?.currency"));
  assert(route.includes("status: \"UNPAID\""));
  assert(!route.includes("Math.round(amount * 0.18"));
  assert(!route.includes('currency: body.currency || "INR"'));
  assert(!route.includes("15 * 24 * 60 * 60 * 1000"));

  assert(!ui.includes("useState(150000)"));
  assert(!ui.includes("setCompanyName"));
  assert(ui.includes("tax rate, currency and payment due date are derived"));
});

test("recorded assessment question-bank publication and retirement are atomically audited", () => {
  const create = fs.readFileSync(new URL("../app/api/admin/recorded-assessment/questions/route.ts", import.meta.url), "utf8");
  const retire = fs.readFileSync(new URL("../app/api/admin/recorded-assessment/questions/[id]/route.ts", import.meta.url), "utf8");

  assert(create.includes("prisma.$transaction"));
  assert(create.includes("RECORDED_ASSESSMENT_QUESTION_PUBLISHED"));
  assert(create.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));

  assert(retire.includes("prisma.$transaction"));
  assert(retire.includes("RECORDED_ASSESSMENT_QUESTION_RETIRED"));
  assert(retire.includes("updateMany"));
  assert(retire.includes("enqueueSecurityAuditEvent(tx, auditLog, session.id)"));
});


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
  assert(testRoute.indexOf("COMMUNICATION_TEMPLATE_TEST_REQUESTED") < testRoute.indexOf("dispatchAdminTestCommunication"));

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
  assert(db.includes("prisma.referralFraudAudit.create"));
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
  assert(db.includes("availableAfterReservation"));
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
