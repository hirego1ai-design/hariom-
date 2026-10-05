import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { prisma } from "../lib/prisma";
import { canApplyVideoAnalysisCallback, isTerminalVideoAnalysisStatus } from "../lib/videoAnalysisState";
import {
  markWhatsAppJobProcessed,
  recoverWhatsAppInboundEvents,
} from "../lib/whatsapp-queue";
import { sendWhatsAppTextMessage } from "../lib/whatsapp";
import { processSecurityAuditDeliveryBatch, SecurityAuditDeliveryNotConfiguredError } from "../lib/securityAuditDelivery";
import { getVideoAnalysisConfig } from "../lib/env";
import { claimVideoAnalysisJob, recoverStaleVideoAnalysisJobs, releaseVideoAnalysisClaimForRetry } from "../lib/videoAnalysisQueue";

function stubMethod(t: TestContext, target: any, name: string, implementation: (...args: any[]) => unknown) {
  const previous = target[name];
  target[name] = implementation;
  t.after(() => { target[name] = previous; });
}

function env(t: TestContext, values: Record<string, string | undefined>) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
}

test("video callbacks cannot overwrite any terminal analysis result", () => {
  for (const status of ["COMPLETED", "FAILED", "BLOCKED_INFRA"]) {
    assert.equal(isTerminalVideoAnalysisStatus(status), true);
    assert.equal(canApplyVideoAnalysisCallback(status), false);
  }
  assert.equal(canApplyVideoAnalysisCallback("PENDING"), true);
  assert.equal(canApplyVideoAnalysisCallback("PROCESSING"), true);
});

test("enabled production video analysis rejects fallback or weak worker configuration", (t) => {
  env(t, {
    NODE_ENV: "production",
    VIDEO_ANALYSIS_ENABLED: "true",
    VIDEO_ANALYSIS_WORKER_URL: undefined,
    VIDEO_ANALYSIS_INTERNAL_TOKEN: undefined,
  });
  assert.throws(() => getVideoAnalysisConfig(), /VIDEO_ANALYSIS_WORKER_URL/);
  process.env.VIDEO_ANALYSIS_WORKER_URL = "https://video-worker.example.test";
  process.env.VIDEO_ANALYSIS_INTERNAL_TOKEN = "too-short";
  assert.throws(() => getVideoAnalysisConfig(), /at least 32/);
  process.env.VIDEO_ANALYSIS_INTERNAL_TOKEN = "offline-video-worker-token-32-chars-minimum";
  process.env.VIDEO_ANALYSIS_MAX_SECONDS = "NaN";
  assert.throws(() => getVideoAnalysisConfig(), /exactly 120/);
});

test("disabled production video analysis remains explicitly blocked without worker secrets", (t) => {
  env(t, {
    NODE_ENV: "production",
    VIDEO_ANALYSIS_ENABLED: "false",
    VIDEO_ANALYSIS_WORKER_URL: undefined,
    VIDEO_ANALYSIS_INTERNAL_TOKEN: undefined,
  });
  const config = getVideoAnalysisConfig();
  assert.equal(config.enabled, false);
});

test("WhatsApp completion is fenced to the exact database claim", async (t) => {
  const claimedAt = new Date("2026-09-18T00:00:00.000Z");
  stubMethod(t, prisma.whatsAppInboundEvent, "updateMany", async ({ where }: any) => {
    assert.equal(where.id, "event-1");
    assert.equal(where.processingStatus, "PROCESSING");
    assert.equal(where.processingStartedAt, claimedAt);
    return { count: 0 };
  });
  assert.equal(await markWhatsAppJobProcessed({ id: "event-1", processingStartedAt: claimedAt }), false);
});

test("WhatsApp recovery republishes only a bounded durable eligible batch", async (t) => {
  env(t, {
    APP_URL: "https://app.example.test",
    INTERNAL_API_KEY: "internal-worker-key-for-offline-test",
    QSTASH_TOKEN: "qstash-offline-test-token",
  });
  stubMethod(t, prisma.whatsAppInboundEvent, "findMany", async ({ where, take, orderBy }: any) => {
    assert.equal(take, 2);
    assert.equal(where.processed, false);
    assert.deepEqual(orderBy, { receivedAt: "asc" });
    return [{ id: "event-1" }, { id: "event-2" }];
  });
  const calls: Array<{ url: string; body: string }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), body: String(init?.body) });
    return new Response(null, { status: 200 });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const report = await recoverWhatsAppInboundEvents(2, Date.now() + 10_000);
  assert.deepEqual(report, { eligible: 2, scheduled: 2, failed: 0, timeBudgetExhausted: false });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /qstash\.upstash\.io/);
  assert.deepEqual(JSON.parse(calls[0].body), { eventId: "event-1" });
});

test("ambiguous WhatsApp provider response is not automatically replayed", async (t) => {
  env(t, {
    NODE_ENV: "test",
    WHATSAPP_API_TOKEN: "offline-token",
    WHATSAPP_PHONE_NUMBER_ID: "12345",
  });
  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { calls++; return new Response(null, { status: 503 }); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const result = await sendWhatsAppTextMessage("919999999999", "offline test");
  assert.equal(result.sent, false);
  assert.equal(calls, 1);
});

test("unconfigured external SIEM drains through the durable internal audit sink", async (t) => {
  env(t, { SIEM_WEBHOOK_URL: undefined, SIEM_WEBHOOK_TOKEN: undefined });

  await assert.rejects(
    () => processSecurityAuditDeliveryBatch(4, { requireConfiguration: true }),
    SecurityAuditDeliveryNotConfiguredError,
  );

  const events = Array.from({ length: 4 }, (_, index) => ({
    id: `audit-event-${index + 1}`,
    attempts: 1,
    payload: { schemaVersion: 1, index },
    payloadSha256: `sha-${index + 1}`,
  }));
  let findManyCalls = 0;
  const delivered = new Set<string>();

  stubMethod(t, prisma.securityAuditOutboxEvent, "findMany", async ({ where }: any) => {
    findManyCalls += 1;
    if (findManyCalls === 1) {
      assert.ok(Array.isArray(where.OR));
      return events.map(({ id }) => ({ id }));
    }
    assert.equal(where.status, "PROCESSING");
    assert.equal(typeof where.leaseId, "string");
    return events;
  });

  stubMethod(t, prisma.securityAuditOutboxEvent, "updateMany", async ({ where, data }: any) => {
    if (data.status === "PROCESSING" && data.leaseId) {
      return { count: events.length };
    }
    if (data.status === "DELIVERED") {
      delivered.add(where.id);
      return { count: 1 };
    }
    if (data.leasedUntil && where.status === "PROCESSING") {
      return { count: 1 };
    }
    throw new Error("Unexpected security-audit outbox update in internal sink test.");
  });

  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("Internal audit sink must not call an external SIEM.");
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  assert.deepEqual(await processSecurityAuditDeliveryBatch(4), {
    configured: false,
    pending: 0,
    delivered: 4,
    retried: 0,
    failed: 0,
    unclaimed: 0,
  });
  assert.equal(fetchCalls, 0);
  assert.equal(delivered.size, 4);
});

test("video analysis claim is atomic and fenced against concurrent ownership", async (t) => {
  const updatedAt = new Date("2026-09-18T00:00:00.000Z");
  stubMethod(t, prisma.videoAnalysisJob, "findUnique", async () => ({
    id: "job-1", status: "PENDING", attempts: 0, maxAttempts: 3,
    nextAttemptAt: null, updatedAt,
  }));
  let claims = 0;
  stubMethod(t, prisma.videoAnalysisJob, "updateMany", async ({ where, data }: any) => {
    assert.equal(where.id, "job-1");
    assert.equal(where.status, "PENDING");
    assert.equal(where.attempts, 0);
    assert.equal(where.updatedAt, updatedAt);
    assert.equal(data.status, "PROCESSING");
    claims++;
    return { count: claims === 1 ? 1 : 0 };
  });
  const [first, second] = await Promise.all([
    claimVideoAnalysisJob("job-1"), claimVideoAnalysisJob("job-1"),
  ]);
  assert.equal([first, second].filter(Boolean).length, 1);
});

test("stale video lease is requeued with bounded backoff", async (t) => {
  const claimToken = "stale-owner";
  stubMethod(t, prisma.videoAnalysisJob, "findMany", async () => [{
    id: "job-2", videoResumeId: "video-2", status: "PROCESSING",
    attempts: 1, maxAttempts: 3, claimToken, leaseExpiresAt: new Date(0),
  }]);
  stubMethod(t, prisma.videoAnalysisJob, "updateMany", async ({ where, data }: any) => {
    assert.equal(where.claimToken, claimToken);
    assert.equal(data.status, "PENDING");
    assert.ok(data.nextAttemptAt instanceof Date);
    return { count: 1 };
  });
  stubMethod(t, prisma.videoResume, "updateMany", async () => ({ count: 1 }));
  assert.deepEqual(await recoverStaleVideoAnalysisJobs(10), { scanned: 1, retried: 1, exhausted: 0 });
});

test("video retry release rejects stale claim owner", async (t) => {
  stubMethod(t, prisma.videoAnalysisJob, "findUnique", async () => ({
    id: "job-3", videoResumeId: "video-3", status: "PROCESSING",
    attempts: 1, maxAttempts: 3, claimToken: "new-owner",
  }));
  let writes = 0;
  stubMethod(t, prisma.videoAnalysisJob, "updateMany", async () => { writes++; return { count: 1 }; });
  const result = await releaseVideoAnalysisClaimForRetry({
    jobId: "job-3", claimToken: "old-owner", reason: "network failure",
  });
  assert.deepEqual(result, { released: false, exhausted: false });
  assert.equal(writes, 0);
});

test("video retry exhaustion becomes terminal only at max attempts", async (t) => {
  stubMethod(t, prisma.videoAnalysisJob, "findUnique", async () => ({
    id: "job-4", videoResumeId: "video-4", status: "PROCESSING",
    attempts: 3, maxAttempts: 3, claimToken: "owner-4",
  }));
  stubMethod(t, prisma.videoAnalysisJob, "updateMany", async ({ data }: any) => {
    assert.equal(data.status, "BLOCKED_INFRA");
    return { count: 1 };
  });
  stubMethod(t, prisma.videoResume, "updateMany", async ({ data }: any) => {
    assert.equal(data.analysisStatus, "BLOCKED_INFRA");
    return { count: 1 };
  });
  assert.deepEqual(await releaseVideoAnalysisClaimForRetry({
    jobId: "job-4", claimToken: "owner-4", reason: "worker unavailable",
  }), { released: false, exhausted: true });
});

