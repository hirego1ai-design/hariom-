import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

function read(path: string) {
  return fs.readFileSync(new URL(path, import.meta.url), "utf8");
}

test("public job discovery and details share one eligibility policy", () => {
  const listPage = read("../app/jobs/page.tsx");
  const searchRoute = read("../app/api/jobs/search/route.ts");
  const publicJobs = read("../lib/publicJobs.ts");

  assert.match(listPage, /activePublicJobWhere\(new Date\(\)\)/);
  assert.match(listPage, /public-jobs-initial-v2/);
  assert.match(searchRoute, /activePublicJobWhere\(new Date\(\)\)/);
  assert.match(publicJobs, /NOT:\s*\{\s*aiFocusAreas:\s*"QA_TEST_PUBLIC_JOB"\s*\}/);
});

test("candidate navigation exposes interviews and removes the dead dashboard chat destination", () => {
  const sidebar = read("../components/candidate/CandidateSidebar.tsx");
  const dashboard = read("../app/dashboard/page.tsx");
  const legacyChat = read("../app/messages/chat/page.tsx");

  assert.match(sidebar, /label:\s*"Interviews",\s*href:\s*"\/interviews"/);
  assert.match(dashboard, /fetch\("\/api\/interviews"/);
  assert.match(dashboard, /href="\/interviews"/);
  assert.doesNotMatch(dashboard, /\/messages\/chat/);
  assert.match(legacyChat, /redirect\("\/notifications"\)/);
});

test("employer mobile navigation keeps every primary tool reachable", () => {
  const sidebar = read("../components/employer/EmployerSidebar.tsx");

  assert.match(sidebar, /const mobilePrimaryItems = employerNavItems\.slice\(0, 4\)/);
  assert.match(sidebar, /const mobileMoreItems = employerNavItems\.slice\(4\)/);
  assert.match(sidebar, /aria-label="More employer tools"/);
  assert.match(sidebar, /mobileMoreItems\.map/);
});

test("public post-job funnel sends employers to account or job creation", () => {
  const marketing = read("../components/marketing/MarketingPage.tsx");
  const signIn = read("../app/employer/employer-sign-in/page.tsx");
  const freePosting = read("../app/free-job-posting/page.tsx");

  assert.match(marketing, /function PostJobPublicContent/);
  assert.match(marketing, /Create Employer Account/);
  assert.match(marketing, /create-job-basic-info/);
  assert.match(signIn, /const redirectParam = searchParams\.get\("redirect"\)/);
  assert.match(signIn, /const safeRedirect/);
  assert.match(signIn, /router\.replace\(safeRedirect\)/);
  assert.match(freePosting, /Sign In & Post/);
});
