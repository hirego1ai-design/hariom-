import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

test("runtime persistence contains no mock identities, passwords, or jobs", () => {
  const prisma = read("src/lib/prisma.ts");
  for (const marker of ["mockUsers", "mockJobs", "Admin123", "Employer123", "Candidate123", "createMockPrisma"]) {
    assert.ok(!prisma.includes(marker), `runtime persistence still contains forbidden mock marker: ${marker}`);
  }
  assert.equal(existsSync("src/lib/dev-employer-store.ts"), false, "development identity store must not exist in runtime source");
  assert.equal(existsSync("src/mocks/candidateProfileData.ts"), false, "obsolete mock candidate fixture must not exist in production source");
  assert.equal(existsSync("src/lib/document-verification-store.ts"), false, "document verification must not use a process-local runtime store");
});

test("production runtime has no environment-switched mock database fallbacks", () => {
  const runtimeFiles = filesUnder("src").filter((path) =>
    path !== "src/lib/prisma.ts" &&
    !path.startsWith("src/tests/") &&
    /\.(?:ts|tsx|js|jsx)$/.test(path)
  );

  for (const path of runtimeFiles) {
    const source = read(path);
    assert.doesNotMatch(
      source,
      /process\.env\.MOCK_DB/,
      `${path} contains a production runtime MOCK_DB branch`,
    );
  }

  const prismaSource = read("src/lib/prisma.ts");
  assert.match(prismaSource, /FATAL: MOCK_DB is not supported by the application runtime/);
});

test("agreement repository contains no fabricated seed companies or contacts", () => {
  const source = read("src/lib/agreements-db.ts");
  for (const pattern of [
    /Sarah Jenkins/i,
    /sarah\.j@enterprise\.com/i,
    /HireGo Enterprise Partner/i,
    /REQ-2026-001/,
    /tpl-default-1/,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("subscription persistence has no in-memory commercial datasets or fallbacks", () => {
  const source = read("src/lib/subscriptions-db.ts");
  for (const pattern of [
    /defaultPlans/,
    /defaultPromoCodes/,
    /defaultAiServices/,
    /inMemoryPlans/,
    /inMemoryCredits/,
    /inMemorySubs/,
    /inMemoryPromos/,
    /inMemoryAiServices/,
    /process\.env\.MOCK_DB/,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("admin configuration surfaces do not fabricate persisted commercial state", () => {
  const platformRoute = read("src/app/api/admin/config/route.ts");
  assert.doesNotMatch(platformRoute, /process\.env\.MOCK_DB/);
  assert.doesNotMatch(platformRoute, /defaultPlacementFeePct:\s*8\.33/);
  assert.doesNotMatch(platformRoute, /defaultReplacementDays:\s*60/);

  const managedRoute = read("src/app/api/admin/managed-hiring/config/route.ts");
  for (const pattern of [
    /process\.env\.MOCK_DB/,
    /managedHiringGlobalConfig/,
    /managedHiringAuditLogs/,
    /LOG-MH-901/,
    /superadmin@hirego\.ai/i,
    /finance\.director@hirego\.ai/i,
    /Fortune 500 campus hiring ramp/i,
  ]) {
    assert.doesNotMatch(managedRoute, pattern);
  }

  const settingsPage = read("src/app/admin/settings/managed-hiring/page.tsx");
  for (const pattern of [
    /defaultPlacementFeePct:\s*8\.33/,
    /defaultReplacementDays:\s*60/,
    /defaultCreditDays:\s*15/,
    /taxRatePct:\s*18(?:\.0)?/,
  ]) {
    assert.doesNotMatch(settingsPage, pattern);
  }
});

test("audited production UI surfaces do not present fabricated people or metrics", () => {
  const expectations: Array<[string, RegExp[]]> = [
    ["src/app/employer/dashboard/page.tsx", [/Acme Corporation Recruiting/i, /Sarah Jenkins/i, /Alex Rivera/i, /23 qualified candidates/i]],
    ["src/app/employer/hiring-pipeline/page.tsx", [/Hiring Health Score/i, /Jordan S\./i, /Aarav Sharma/i, /Excellent \(\+3\.4%\)/i]],
    ["src/app/employer/candidate-user-management/page.tsx", [/initialCandidates/, /Math\.random\(/, /aarav\.sharma@example\.com/i, /\*\s*1560/]],
    ["src/app/employer/employer-analytics-dashboard/page.tsx", [/value:\s*"1,240"/, /Cost per Hire.*7,200/i, /LinkedIn.*45%/]],
    ["src/app/applications/pipeline/page.tsx", [/Marcus Chen/, /Elena Rodriguez/, /Samir Kulkarni/, /images\.unsplash\.com/]],
    ["src/app/employer/job-performance-analytics/page.tsx", [/auto-generated component/i, /JOB-88291/, /2,840/, /Sr\. Product Designer - AI Suite/]],
    ["src/app/admin/ai-command-centre-dashboard/page.tsx", [/Virtual CEO/, /Master Brain/, /Strategic Thinking/, /aida-public/]],
    ["src/components/admin/AdminHeader.tsx", [/Rahul S\./, /TechCorp Global/, /₹12L\/yr/, /unreadCount/]],
    ["src/components/admin/AdminSidebar.tsx", [/12\.4k/, /2\.4k/, /badge:\s*"Review"/, /badge:\s*"Live"/]],
  ];

  for (const [path, patterns] of expectations) {
    const source = read(path);
    for (const pattern of patterns) {
      assert.doesNotMatch(source, pattern, `${path} contains a fabricated production marker: ${pattern}`);
    }
  }
});


test("employer production routes contain no legacy prototype markers or demo datasets", () => {
  const employerPages = filesUnder("src/app/employer").filter((path) => path.endsWith("/page.tsx"));
  const forbidden = [
    /This is an auto-generated component/i,
    /In Phase 4, we will manually hook up/i,
    /MOCK_PARSED_JOBS/,
    /Acme Technologies/,
    /rahul@acme\.example\.com/i,
    /GlobalTech Solutions/,
    /Apex Cybernetics/,
    /aida-public/,
  ];
  for (const path of employerPages) {
    const source = read(path);
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${path} contains legacy prototype/demo marker: ${pattern}`);
    }
  }
});

test("legacy admin settings do not simulate authoritative configuration", () => {
  const checks: Array<[string, RegExp[]]> = [
    ["src/app/settings/ai-agents/page.tsx", [/GPT-4o/i, /Claude 3\.5/i, /CodeLlama/i, /tasks completed today/i, /toggleAgent/]],
    ["src/app/settings/domain/page.tsx", [/portal\.hirego\.ai/i, /Let's Encrypt/i, /Auto-renews in/i, /Verify & Bind Domain/i]],
    ["src/app/settings/integrations/page.tsx", [/connected:\s*true/i, /toggleIntegration/i, /Greenhouse ATS/i]],
    ["src/app/settings/plan-management/page.tsx", [/Starter Tier/i, /₹14,999/i, /Configured tier/i]],
    ["src/app/settings/hub/page.tsx", [/maintenanceMode/i, /Platform settings saved successfully/i, /Save Configuration/i]],
    ["src/app/settings/terms-privacy/page.tsx", [/Legal documents published successfully/i, /Publish Legal Document/i]],
    ["src/app/admin/settings/whatsapp/page.tsx", [/G05Component/, /@\/app\/settings\/whatsapp\/page/]],
  ];

  for (const [path, patterns] of checks) {
    const source = read(path);
    for (const pattern of patterns) {
      assert.doesNotMatch(source, pattern, `${path} still simulates authoritative configuration: ${pattern}`);
    }
  }

  assert.match(read("src/app/settings/plan-management/page.tsx"), /\/admin\/subscriptions/);
});

test("managed hiring and employer access UI contain no synthetic operational records", () => {
  const managedHiring = read("src/app/employer/managed-hiring/page.tsx");
  for (const pattern of [/mockCandidates/i, /Matched Candidates Pool/i, /Aravind Swamy/i, /Neha Deshmukh/i, /Vikram Aditya/i, /calendar invite has been dispatched/i]) {
    assert.doesNotMatch(managedHiring, pattern);
  }
  assert.match(managedHiring, /\/api\/agreements\/requirements/);
  assert.match(managedHiring, /\/api\/agreements\/contracts/);

  const roles = read("src/app/employer/roles-and-permissions/page.tsx");
  assert.match(roles, /redirect\("\/employer\/team-members-management"\)/);
  assert.doesNotMatch(roles, /initialRoles|Super Admin|Compliance Officer|savePermissions/);
});

test("registration flow does not hardcode commercial, compliance, or activation status claims", () => {
  const business = read("src/app/employer/employer-registration-business-model/page.tsx");
  for (const pattern of [/\$499/, /14-Day Free Trial/i, /SOC2 Certified/i, /256-Bit SSL/i, /8\.33% to 15%/]) {
    assert.doesNotMatch(business, pattern);
  }

  const complete = read("src/app/employer/employer-registration-complete/page.tsx");
  for (const pattern of [/fully configured and ready/i, /typically within 2–4 hours/i, /AI Proctoring Enabled/i, /trial includes full access/i]) {
    assert.doesNotMatch(complete, pattern);
  }
  assert.match(complete, /\/api\/auth\/me/);
});

test("production navigation excludes intentionally unconnected admin tools", () => {
  const sidebar = read("src/components/admin/AdminSidebar.tsx");
  const dashboard = read("src/app/admin/dashboard/page.tsx");
  const hidden = [
    "/admin/proctoring-control-panel",
    "/admin/roles",
    "/admin/system/db-pool",
    "/admin/system/backup-recovery",
    "/admin/sla/monitor",
    "/admin/security/vulnerability-inspector",
    "/admin/models/playground",
    "/admin/licenses/allocator",
    "/admin/logs/stream",
    "/admin/settings/ai-agents",
  ];

  for (const route of hidden) {
    assert.ok(!sidebar.includes(route), `Admin sidebar exposes unconnected tool: ${route}`);
  }
  for (const route of ["/admin/proctoring-control-panel", "/admin/roles", "/admin/system/backup-recovery", "/admin/security/vulnerability-inspector"]) {
    assert.ok(!dashboard.includes(route), `Admin dashboard exposes unconnected tool: ${route}`);
  }

  assert.match(sidebar, /\/admin\/models\/registry/);
  const registry = read("src/app/admin/models/registry/page.tsx");
  const routingApi = read("src/app/api/admin/ai-routing/route.ts");
  assert.match(registry, /\/api\/admin\/ai-routing/);
  assert.match(routingApi, /requireAdminSession/);
  assert.match(routingApi, /getAiRoutingConfig/);
});

test("job creation follows the authoritative persisted workflow", () => {
  const basic = read("src/app/employer/create-job-basic-info/page.tsx");
  const requirements = read("src/app/employer/create-job-requirements/page.tsx");
  const matching = read("src/app/employer/create-job-matching-config/page.tsx");
  const route = read("src/app/api/employer/jobs/route.ts");
  const ros = read("src/lib/ros/RosGateway.ts");

  assert.match(basic, /\/employer\/create-job-requirements/);
  assert.doesNotMatch(basic, /\/employer\/create-job-ai-jd-writing/);
  assert.match(requirements, /\/employer\/create-job-matching-config/);
  assert.match(matching, /idempotency-key/i);
  assert.match(matching, /\/api\/employer\/jobs/);
  assert.doesNotMatch(matching, /company:\s*["']/);
  assert.doesNotMatch(route, /company:\s*z\.string/);
  assert.match(route, /skillRequirements/);
  assert.match(route, /screeningQuestions/);
  assert.match(ros, /agentId:\s*['"]jd-generator['"]/);
  assert.match(ros, /department:\s*params\.department/);
});

test("production UI uses authoritative APIs and working destinations", () => {
  assert.match(read("src/app/employer/employer-analytics-dashboard/page.tsx"), /\/api\/employer\/analytics/);
  assert.match(read("src/app/employer/candidate-user-management/page.tsx"), /\/api\/employer\/candidates/);
  assert.match(read("src/app/applications/pipeline/page.tsx"), /\/api\/applications/);
  assert.match(read("src/app/employer/job-performance-analytics/page.tsx"), /\/api\/employer\/analytics/);
  assert.match(read("src/app/admin/ai-command-centre-dashboard/page.tsx"), /\/api\/admin\/system-health/);
  const pipeline = read("src/app/employer/hiring-pipeline/page.tsx");
  assert.doesNotMatch(pipeline, /Coming Soon/);
  assert.match(pipeline, /\/employer\/candidate-user-management/);
  assert.match(pipeline, /\/employer\/employer-analytics-dashboard/);
});

test("subscription onboarding and referral UI do not invent commercial state", () => {
  const planSelection = read("src/app/employer/employer-registration-plan-selection/page.tsx");
  assert.match(planSelection, /\/api\/employer\/subscribe/);
  assert.doesNotMatch(planSelection, /method:\s*["']POST["']/);
  assert.doesNotMatch(planSelection, /handleSelectPlan/);
  assert.match(planSelection, /does not activate a plan or bypass payment/i);

  const subscriptions = read("src/app/employer/subscriptions/page.tsx");
  assert.doesNotMatch(subscriptions, /handleActivateTrial/);
  assert.doesNotMatch(subscriptions, /Mock Payment Checkout Modal/);
  assert.doesNotMatch(subscriptions, /quotas\?\.jobPosts\?\.total \?\? 10/);
  assert.doesNotMatch(subscriptions, /quotas\?\.resumeUnlocks\?\.total \?\? 100/);
  assert.doesNotMatch(subscriptions, /quotas\?\.aiInterviews\?\.total \?\? 40/);

  const referrals = read("src/app/employer/referrals/page.tsx");
  for (const pattern of [/ENTERPRISE2026/, /Earn up to ₹7,000/i, /Unlimited Referral Cap Active/i, /Instant Withdrawal via UPI/i, /₹1,000 on Job Posts/i, /₹5,000 on First Managed Hiring/i]) {
    assert.doesNotMatch(referrals, pattern);
  }
});

test("shared employer state does not invent an authenticated identity", () => {
  const context = read("src/context/EmployerContext.tsx");
  assert.doesNotMatch(context, /name:\s*["']Employer["'],\s*role:\s*["']Admin["']/);
  assert.match(context, /name:\s*["']["'],\s*role:\s*["']["']/);
});

test("privileged page guard, OTP hashing, and security headers remain enabled", () => {
  const proxy = read("proxy.ts");
  for (const marker of ["/admin/:path*", "/employer/:path*", "/candidate/:path*", "/dashboard"]) {
    assert.ok(proxy.includes(marker), `proxy route guard missing: ${marker}`);
  }
  assert.match(proxy, /jwt\.verify/);

  const otp = read("src/lib/otp.ts");
  assert.match(otp, /otpDigest/);
  assert.match(otp, /createHmac\("sha256"/);
  assert.match(otp, /timingSafeEqual/);
  assert.doesNotMatch(otp, /data:\s*\{\s*email:\s*normalizedEmail,\s*otp,\s*type/);
  assert.doesNotMatch(otp, /record\.otp\s*!==\s*otp\.trim\(\)/);

  const nextConfig = read("next.config.ts");
  assert.match(nextConfig, /configuredSecurityHeaders/);
  assert.doesNotMatch(nextConfig, /Referrer-Policy.*origin-when-cross-origin/);
});

test("seed script cannot silently target localhost or add sample companies", () => {
  const seed = read("prisma/seed.ts");
  assert.doesNotMatch(seed, /postgresql:\/\/postgres:postgres@localhost/);
  assert.doesNotMatch(seed, /Seed sample company/i);
  assert.doesNotMatch(seed, /company-hirego/);
  assert.match(seed, /DATABASE_URL is required for seeding/);
});


test("public candidate sharing and unavailable AI surfaces cannot be falsely certified", () => {
  const publicProfile = read("src/app/profile/public/page.tsx");
  for (const pattern of [/Alex Chen/i, /Top 5% Candidate/i, /HireGo Score.*88/i, /localhost:3000\/profile\/public/i]) {
    assert.doesNotMatch(publicProfile, pattern);
  }

  const inventory = JSON.parse(read("production-wiring-inventory.json"));
  const unavailableRoutes = new Set([
    "/employer/ai-hiring-copilot-hub",
    "/employer/ai-evaluation-scores",
    "/employer/ai-candidate-ranking-explanation",
  ]);
  const records = Array.isArray(inventory.records) ? inventory.records : [];
  for (const route of unavailableRoutes) {
    const screen = records.find((record: any) => record.record_type === "screen" && record.route === route);
    assert.ok(screen, `wiring inventory is missing unavailable screen ${route}`);
    assert.notEqual(screen.status, "GREEN", `unavailable screen was falsely certified GREEN: ${route}`);
  }
});

test("offer, proctoring and approval remediation surfaces are connected to authoritative APIs", () => {
  const offerCreate = read("src/app/employer/offer-letter-create-and-send/page.tsx");
  const offerManage = read("src/app/employer/offer-management-dashboard/page.tsx");
  const candidateOffers = read("src/app/offers/page.tsx");
  const proctorAdmin = read("src/app/admin/proctoring-control-panel/page.tsx");
  const room = read("src/app/interviews/room/[roomId]/page.tsx");
  const workflow = read("src/lib/workflows/WorkflowEngine.ts");

  assert.match(offerCreate, /\/api\/employer\/offers/);
  assert.match(offerManage, /\/api\/employer\/offers/);
  assert.match(candidateOffers, /\/api\/candidate\/offers/);
  assert.doesNotMatch(offerCreate, /currently in development/i);
  assert.doesNotMatch(offerManage, /currently in development/i);

  assert.match(proctorAdmin, /\/api\/admin\/proctoring-policy/);
  assert.match(room, /\/api\/proctoring\/consent/);
  assert.match(room, /ProctoringEngine/);
  assert.doesNotMatch(proctorAdmin, /PROCTORING CONFIGURATION NOT CONNECTED/);

  for (const token of ["expiresAt", "revokedAt", "revokeApproval", "consumeApprovedActionInTransaction"]) {
    assert.ok(workflow.includes(token), `approval lifecycle guard missing: ${token}`);
  }
});
