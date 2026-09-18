import assert from "node:assert/strict";
import { test } from "node:test";
import { readRecoveryWorkerLiveness } from "../app/api/admin/system/queues/route";
import { RecoveryWorkerState } from "../lib/workflows/RecoveryWorkerState";

test("admin worker liveness reports a fresh completed heartbeat as healthy", async (t) => {
  t.mock.method(RecoveryWorkerState, "read", async () => ({
    stale: false,
    heartbeat: {
      runId: "run-test",
      state: "completed" as const,
      startedAt: "2026-09-18T00:00:00.000Z",
      finishedAt: "2026-09-18T00:00:10.000Z",
    },
  }));
  assert.deepEqual(await readRecoveryWorkerLiveness(), {
    status: "HEALTHY",
    stale: false,
    state: "completed",
    startedAt: "2026-09-18T00:00:00.000Z",
    finishedAt: "2026-09-18T00:00:10.000Z",
  });
});

test("admin worker liveness preserves attention and stale states", async (t) => {
  t.mock.method(RecoveryWorkerState, "read", async () => ({
    stale: true,
    heartbeat: {
      runId: "run-test",
      state: "attention" as const,
      startedAt: "2026-09-18T00:00:00.000Z",
      finishedAt: "2026-09-18T00:00:10.000Z",
    },
  }));
  const result = await readRecoveryWorkerLiveness();
  assert.equal(result.status, "STALE");
  assert.equal(result.state, "attention");
});

test("admin worker liveness sanitizes Redis failures", async (t) => {
  t.mock.method(RecoveryWorkerState, "read", async () => {
    throw new Error("secret-provider-detail");
  });
  const result = await readRecoveryWorkerLiveness();
  assert.deepEqual(result, {
    status: "UNAVAILABLE",
    stale: true,
    state: null,
    startedAt: null,
    finishedAt: null,
  });
  assert.equal(JSON.stringify(result).includes("secret-provider-detail"), false);
});
