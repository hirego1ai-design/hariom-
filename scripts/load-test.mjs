import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.LOAD_TEST_BASE_URL || "https://www.hiregoai.com").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = Number(process.env.LOAD_TEST_TIMEOUT_MS || 10000);
const COOLDOWN_MS = 10000;

const stages = [
  { name: "ramp-50", rps: 50, durationSec: 20, paths: ["/", "/login", "/about", "/services", "/solutions", "/pricing", "/api/health"] },
  { name: "ramp-100", rps: 100, durationSec: 20, paths: ["/", "/login", "/about", "/services", "/solutions", "/pricing", "/api/health"] },
  { name: "ramp-250", rps: 250, durationSec: 20, paths: ["/", "/login", "/about", "/services", "/solutions", "/pricing", "/api/health"] },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function oneRequest(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = performance.now();
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "HireGo-Production-Load-Test/2.0", "x-hirego-load-test": "safe-read-only" },
      signal: controller.signal,
      cache: "no-store",
    });
    return { path, status: response.status, ok: response.status >= 200 && response.status < 400, latencyMs: performance.now() - started, error: null };
  } catch (error) {
    return { path, status: 0, ok: false, latencyMs: performance.now() - started, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForStableHealth() {
  console.log("Waiting for stable production health before load begins...");
  for (let attempt = 1; attempt <= 12; attempt++) {
    const result = await oneRequest("/api/health");
    if (result.status === 200) {
      console.log(`Health ready on attempt ${attempt} (${Math.round(result.latencyMs)}ms)`);
      return;
    }
    await sleep(5000);
  }
  throw new Error("Production health did not become ready before load test.");
}

async function runStage(stage) {
  const results = [];
  const inFlight = new Set();
  const intervalMs = 100;
  const ticks = Math.ceil((stage.durationSec * 1000) / intervalMs);
  let budget = 0;
  let requestIndex = 0;
  const stageStarted = performance.now();

  for (let tick = 0; tick < ticks; tick++) {
    const targetTickAt = stageStarted + tick * intervalMs;
    const waitMs = targetTickAt - performance.now();
    if (waitMs > 0) await sleep(waitMs);
    budget += stage.rps * (intervalMs / 1000);
    while (budget >= 1) {
      budget -= 1;
      const path = stage.paths[requestIndex++ % stage.paths.length];
      const promise = oneRequest(path).then((result) => results.push(result)).finally(() => inFlight.delete(promise));
      inFlight.add(promise);
    }
  }

  await Promise.all(inFlight);
  const latencies = results.map((r) => r.latencyMs);
  const failed = results.filter((r) => !r.ok);
  const serverErrors = results.filter((r) => r.status >= 500);
  const networkErrors = results.filter((r) => r.status === 0);
  const statusCounts = {};
  for (const result of results) statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;

  return {
    name: stage.name,
    rps: stage.rps,
    durationSec: stage.durationSec,
    requests: results.length,
    failed: failed.length,
    serverErrors: serverErrors.length,
    networkErrors: networkErrors.length,
    errorRate: results.length ? failed.length / results.length : 1,
    latencyMs: {
      min: Math.round(Math.min(...latencies)),
      avg: Math.round(latencies.reduce((sum, value) => sum + value, 0) / Math.max(1, latencies.length)),
      p50: Math.round(percentile(latencies, 50)),
      p95: Math.round(percentile(latencies, 95)),
      p99: Math.round(percentile(latencies, 99)),
      max: Math.round(Math.max(...latencies)),
    },
    statusCounts,
  };
}

function exceedsSafetyThreshold(stage) {
  return stage.errorRate > 0.01 || stage.serverErrors > 0 || stage.latencyMs.p95 > 2000 || stage.latencyMs.p99 > 5000;
}

await waitForStableHealth();

const report = {
  generatedAt: new Date().toISOString(),
  target: BASE_URL,
  profile: "safe-read-only-production-ramp-50-100-250-rps",
  stages: [],
};

for (let index = 0; index < stages.length; index++) {
  const stage = stages[index];
  console.log(`Starting ${stage.name}: ${stage.rps} RPS for ${stage.durationSec}s`);
  const result = await runStage(stage);
  report.stages.push(result);
  console.log(JSON.stringify(result));

  if (exceedsSafetyThreshold(result)) {
    console.error(`SAFETY STOP after ${stage.name}: threshold exceeded; higher stage will not run.`);
    break;
  }

  if (index < stages.length - 1) {
    console.log(`Cooldown ${COOLDOWN_MS / 1000}s before next stage...`);
    await sleep(COOLDOWN_MS);
  }
}

report.totals = report.stages.reduce((acc, stage) => {
  acc.requests += stage.requests;
  acc.failed += stage.failed;
  acc.serverErrors += stage.serverErrors;
  acc.networkErrors += stage.networkErrors;
  return acc;
}, { requests: 0, failed: 0, serverErrors: 0, networkErrors: 0 });

await writeFile("load-test-results.json", JSON.stringify(report, null, 2) + "
");

const allStagesRan = report.stages.length === stages.length;
const failedThreshold = report.stages.some(exceedsSafetyThreshold) || !allStagesRan;

console.log("
Load test summary");
console.log(JSON.stringify(report, null, 2));
if (failedThreshold) {
  console.error("LOAD TEST FAILED OR SAFETY-STOPPED: one or more thresholds were exceeded.");
  process.exit(1);
}
console.log("LOAD TEST PASSED: 50/100/250 RPS stages completed within thresholds.");
