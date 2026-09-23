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
});

test("audited production UI surfaces do not present fabricated people or metrics", () => {
  const expectations: Array<[string, RegExp[]]> = [
    ["src/app/employer/dashboard/page.tsx", [/Acme Corporation Recruiting/i, /Sarah Jenkins/i, /Alex Rivera/i, /23 qualified candidates/i]],
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
  ];
  for (const path of employerPages) {
    const source = read(path);
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${path} contains legacy prototype/demo marker: ${pattern}`);
    }
  }
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
