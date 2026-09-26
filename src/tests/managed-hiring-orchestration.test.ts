import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("managed hiring orchestrator preserves evidence-first and human decision gates", () => {
  const orchestrator = fs.readFileSync(
    new URL("../lib/workflows/ManagedHiringOrchestrator.ts", import.meta.url),
    "utf8",
  );
  const route = fs.readFileSync(
    new URL(
      "../app/api/employer/candidates/[id]/orchestration/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const readiness = fs.readFileSync(
    new URL(
      "../app/api/employer/hiring-pipeline/readiness/route.ts",
      import.meta.url,
    ),
    "utf8",
  );

  for (const token of [
    "WAIT_FOR_REQUIRED_ASSESSMENT",
    "ASSESSMENT_RECOMMENDED",
    "HUMAN_REVIEW_REQUIRED",
    "SHORTLIST_RECOMMENDED",
    "WAIT_FOR_INTERVIEW",
    "WAIT_FOR_FEEDBACK",
    "WAIT_FOR_HUMAN_DECISION",
    "WAIT_FOR_OFFER",
    "WAIT_FOR_CANDIDATE_OFFER_RESPONSE",
    "WAIT_FOR_JOINING_CONFIRMATION",
  ]) {
    assert.ok(orchestrator.includes(token), `missing orchestration state: ${token}`);
  }

  assert.match(orchestrator, /automaticRejectionAllowed:\s*false/);
  assert.match(
    orchestrator,
    /Missing evidence cannot trigger rejection/,
  );
  assert.match(
    orchestrator,
    /controlled human proceed\/hold\/reject decision/,
  );
  assert.match(route, /consequentialActionsRequireHumanApproval:\s*true/);
  assert.match(route, /missingEvidenceCanReject:\s*false/);
  assert.match(readiness, /automaticHiringPipeline:[\s\S]*HUMAN_GATED_BY_DESIGN/);
  assert.match(readiness, /managedHiringAutomation:[\s\S]*HUMAN_GATED_AUTOMATION_AVAILABLE/);
  assert.match(readiness, /safeStateOrchestration:[\s\S]*STATE_ORCHESTRATION_AVAILABLE/);
  assert.match(readiness, /production-like end-to-end runtime proof/i);
  assert.doesNotMatch(orchestrator, /data:\s*\{\s*status:\s*["']REJECTED["']/);
  assert.doesNotMatch(orchestrator, /application\.update/);
});
