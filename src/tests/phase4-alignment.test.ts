/**
 * Phase 4: Alignment Fixes — Verification Tests
 *
 * P1.2: Interview reschedule field name (status→action) alignment
 * P1.4: Proctoring monitor hidden from nav, placeholder shown
 * P1.5: No /api/admin calls in employer pages; offer management uses employer-scoped API
 *
 * These are static-analysis tests (node:test + readFileSync) that verify
 * source structure and API/UI contract alignment without requiring a database.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

/** Recursively collect all file paths under a directory. */
function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

// ---------------------------------------------------------------------------
// P1.2 — Interview Reschedule Field Mismatch
// Frontend must send { action: "CANCEL" | "RESCHEDULE" } not { status: ... }
// ---------------------------------------------------------------------------

test("P1.2: reschedule page sends 'action' field in PATCH request body", () => {
  const page = read("src/app/employer/interview-reschedule-employer-view/page.tsx");

  // The update() function must build a JSON body containing `action`
  assert.match(
    page,
    /body:\s*JSON\.stringify\(\{[\s\S]*?action/,
    "PATCH body must include an 'action' field",
  );
});

test("P1.2: reschedule page uses RESCHEDULE and CANCEL as action values", () => {
  const page = read("src/app/employer/interview-reschedule-employer-view/page.tsx");

  // The update function parameter must accept both action values
  assert.match(
    page,
    /async\s+function\s+update\(action:\s*["']RESCHEDULE["']\s*\|\s*["']CANCEL["']\)/,
    "update() must accept 'RESCHEDULE' | 'CANCEL' action parameter",
  );
});

test("P1.2: reschedule page does not send 'status' as a request field in PATCH body", () => {
  const page = read("src/app/employer/interview-reschedule-employer-view/page.tsx");

  // Extract the JSON.stringify call inside the PATCH handler
  const patchBodyMatch = page.match(/body:\s*JSON\.stringify\(\{[\s\S]*?\}\s*\)/);
  assert.ok(patchBodyMatch, "PATCH request body must exist");

  // The body must NOT use `status` as the action discriminator
  // (status is fine only as a response field from the API, not as a request field)
  const body = patchBodyMatch[0];
  assert.doesNotMatch(
    body,
    /status:\s*action/,
    "PATCH body must not map 'status' to the action value",
  );
});

test("P1.2: interview PATCH API validates 'action' field with zod enum", () => {
  const route = read("src/app/api/employer/interviews/[id]/route.ts");

  assert.match(
    route,
    /action:\s*z\.enum\(\["CANCEL",\s*"RESCHEDULE"\]\)/,
    "PATCH schema must validate action as z.enum(['CANCEL', 'RESCHEDULE'])",
  );
});

test("P1.2: interview PATCH API returns interview.status in response (lifecycle state)", () => {
  const route = read("src/app/api/employer/interviews/[id]/route.ts");

  // The response should return `status` (the interview's lifecycle state)
  // — this is correct: `action` is the request, `status` is the result
  assert.match(route, /status:\s*(?:updated\.status|interview\.status)/);
});

// ---------------------------------------------------------------------------
// P1.4 — Proctoring Monitor Hidden from Nav, Placeholder Shown
// ---------------------------------------------------------------------------

test("P1.4: proctoring monitor is absent from employer navigation items", () => {
  const sidebar = read("src/components/employer/EmployerSidebar.tsx");

  // The nav items array must not reference proctoring routes
  assert.doesNotMatch(
    sidebar,
    /active-proctoring-monitor/,
    "EmployerSidebar must not link to active-proctoring-monitor",
  );
  assert.doesNotMatch(
    sidebar,
    /employer\/proctoring/,
    "EmployerSidebar must not link to /employer/proctoring",
  );

  // Extract the nav items array and verify no proctoring entry
  const navMatch = sidebar.match(/employerNavItems[^;]+;/);
  if (navMatch) {
    assert.doesNotMatch(navMatch[0], /proctoring/i, "nav items array must not contain proctoring");
  }
});

test("P1.4: proctoring page displays 'not yet available' placeholder", () => {
  const page = read("src/app/employer/proctoring/page.tsx");

  assert.match(
    page,
    /not yet available/i,
    "proctoring page must show 'not yet available' placeholder",
  );
});

test("P1.4: active proctoring monitor fetches real telemetry (not hardcoded)", () => {
  const page = read("src/app/employer/active-proctoring-monitor/page.tsx");

  // Must call the real API endpoint
  assert.match(page, /\/api\/proctoring\/telemetry/);

  // Must resolve interviewId from URL search params
  assert.match(page, /useSearchParams/);

  // Must NOT hardcode metrics values
  assert.doesNotMatch(page, /totalViolations:\s*\d+/, "must not hardcode violation counts");
  assert.doesNotMatch(page, /advisoryReviewScore:\s*\d+/, "must not hardcode review scores");
});

// ---------------------------------------------------------------------------
// P1.5 — No /api/admin Calls in Employer Pages
// P1.1 — Offer Management Uses Employer-Scoped API
// ---------------------------------------------------------------------------

test("P1.5: no employer page component calls /api/admin endpoints", () => {
  const employerPages = filesUnder("src/app/employer").filter(
    (path) => path.endsWith(".tsx") || path.endsWith(".ts"),
  );

  assert.ok(employerPages.length > 10, "should find employer page files");

  for (const path of employerPages) {
    const source = read(path);
    assert.doesNotMatch(
      source,
      /\/api\/admin\//,
      `${path} must not call /api/admin endpoints — employer pages must use employer-scoped APIs`,
    );
  }
});

test("P1.5: offer management dashboard uses employer-scoped offers API", () => {
  const page = read("src/app/employer/offer-management-dashboard/page.tsx");

  assert.match(page, /\/api\/employer\/offers/);
  assert.doesNotMatch(page, /\/api\/admin\//);
});

test("P1.1: offer management dashboard is functional (not a redirect or placeholder)", () => {
  const page = read("src/app/employer/offer-management-dashboard/page.tsx");

  // Must fetch real offers from the API
  assert.match(page, /\/api\/employer\/offers/);

  // Must NOT show "being upgraded" or redirect-to-dashboard messages
  // (the offer workflow was implemented, so the page should remain functional)
  assert.doesNotMatch(page, /being upgraded/i);
  assert.doesNotMatch(page, /redirecting to dashboard/i);
  assert.doesNotMatch(page, /not yet available/i);
});

test("P1.1: offer-letter-create page uses employer-scoped offers API", () => {
  const page = read("src/app/employer/offer-letter-create-and-send/page.tsx");

  assert.match(page, /\/api\/employer\/offers/);
  assert.doesNotMatch(page, /\/api\/admin\//);
});
