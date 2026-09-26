import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

test("Copilot managed hiring flow meters the major cost-producing stages", () => {
  const screening = source("src/app/api/employer/copilot/jobs/[id]/screen/route.ts");
  const scheduling = source("src/app/api/employer/interviews/schedule/route.ts");
  const room = source("src/app/api/interviews/room/route.ts");
  const evaluation = source("src/app/api/employer/interviews/[id]/ai-evaluation/route.ts");
  const communications = source("src/lib/communications/dispatcher.ts");

  assert.match(screening, /actionKey:\s*"PROFILE_MATCH"/);
  assert.match(screening, /reconcileCopilotReservation/);
  assert.match(scheduling, /actionKey:\s*"INTERVIEW_SCHEDULING"/);
  assert.match(scheduling, /copilotMetering:/);
  assert.match(room, /actionKey:\s*"VIDEO_INTERVIEW_MINUTE"/);
  assert.match(room, /actionKey:\s*"PROCTORING_SESSION"/);
  assert.match(room, /allowOverage:\s*true/);
  assert.match(evaluation, /actionKey:\s*"INTERVIEW_REPORT"/);
  assert.match(communications, /EMAIL_NOTIFICATION/);
  assert.match(communications, /WHATSAPP_NOTIFICATION/);
});

test("Copilot keeps consequential hiring decisions human-controlled", () => {
  const screening = source("src/app/api/employer/copilot/jobs/[id]/screen/route.ts");
  const evaluation = source("src/app/api/employer/interviews/[id]/ai-evaluation/route.ts");

  assert.match(screening, /automaticRejections:\s*false/);
  assert.match(screening, /humanDecisionRequired:\s*true/);
  assert.match(evaluation, /automaticSelection:\s*false/);
  assert.match(evaluation, /automaticRejection:\s*false/);
  assert.match(evaluation, /humanDecisionRequired:\s*true/);
});

test("Expired Copilot reservations are reconciled instead of permanently consuming capacity", () => {
  const reconciliation = source("src/lib/copilot/reservationReconciliation.ts");
  const capacityRoute = source("src/app/api/employer/copilot/capacity/route.ts");
  const cronRoute = source("src/app/api/cron/copilot-capacity-reconciliation/route.ts");

  assert.match(reconciliation, /status:\s*"EXPIRED"/);
  assert.match(reconciliation, /reservedCapacityUnits:\s*\{\s*decrement:/);
  assert.match(reconciliation, /COPILOT_CAPACITY_RESERVATION_EXPIRED/);
  assert.match(capacityRoute, /reconcileExpiredCopilotReservations/);
  assert.match(cronRoute, /CRON_SECRET/);
});

test("Current commerce policy is India-tax-only and international-no-tax", () => {
  const policy = source("src/lib/copilot/taxPolicy.ts");
  assert.match(policy, /India Copilot pricing must collect configured GST/);
  assert.match(policy, /Non-India regions must use no-tax collection with a zero tax rate/);
});
