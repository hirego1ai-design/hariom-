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

test("paid plan provisions every quota including agent, application, download and verification credits", () => {
  assert.deepEqual(subscriptionCredits({ jobPostsQuota: 1, resumeUnlocksQuota: 2, aiInterviewsQuota: 3,
    applicationsQuota: 4, resumeDownloadsQuota: 5, backgroundVerificationsQuota: 6 }), {
    jobPostsLeft: 1, resumeUnlocksLeft: 2, aiInterviewsLeft: 3, aiAgentCreditsLeft: 3,
    applicationsLeft: 4, resumeDownloadsLeft: 5, backgroundVerificationsLeft: 6,
  });
});

test("corrupt negative plan quotas cannot reduce credits on purchase", () => {
  assert.throws(() => subscriptionCredits({ jobPostsQuota: 1, resumeUnlocksQuota: 2, aiInterviewsQuota: -1,
    applicationsQuota: 4, resumeDownloadsQuota: 5, backgroundVerificationsQuota: 6 }), /invalid credit quotas/);
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
  assert(source.includes("revokeAllUserSessions(member.userId"));
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

  assert.deepEqual(vercel.crons, [{ path: "/api/cron/referrals-reconciliation", schedule: "0 2 * * *" }]);
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
  const proxy = fs.readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");

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
  assert(proxy.includes('"/applications"'));
});

test("production wiring report derives reconciliation counts from the inventory", () => {
  const generator = fs.readFileSync(
    new URL("../../scripts/generate-production-wiring-report.mjs", import.meta.url),
    "utf8"
  );
  assert(generator.includes("records.length.toLocaleString()"));
  assert(generator.includes("parseCsv(csvText)"));
  assert(generator.includes('csvMatchesInventory ? "PASS" : "FAIL"'));
  assert(generator.includes("The complete ${screens.length}-screen registry"));
  assert(!generator.includes("1,531 JSON records"));
  assert(!generator.includes("complete 245-screen registry"));
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
  const llmUsageCall = inventory.records.find(
    (record) =>
      record.record_type === "frontend_api_call" &&
      (record as { api_endpoint?: string }).api_endpoint === "/api/admin/llm-usage"
  ) as { method?: string; user_action?: string } | undefined;
  assert.equal(llmUsageCall?.method, "GET");
  assert.equal(llmUsageCall?.user_action, "fetch GET /api/admin/llm-usage");
});
