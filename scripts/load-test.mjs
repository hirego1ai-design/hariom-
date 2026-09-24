import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.LOAD_TEST_BASE_URL || "https://www.hiregoai.com").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = Number(process.env.LOAD_TEST_TIMEOUT_MS || 10000);

const stages = [
  { name: "health-baseline", rps: 5, durationSec: 15, paths: ["/api/health"] },
  { name: "public-read", rps: 10, durationSec: 30, paths: ["/", "/login", "/about", "/services", "/solutions", "/pricing"] },
  { name: "public-peak", rps: 20, durationSec: 30, paths: ["/", "/login", "/about", "/services", "/solutions", "/pricing", "/api/health"] },
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
      headers: {
        "user-agent": "HireGo-Production-Load-Test/1.0",
        "x-hirego-load-test": "safe-read-only",
      },
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
    name: stage.name, rps: stage.rps, durationSec: stage.durationSec, requests: results.length,
    failed: failed.length, serverErrors: serverErrors.length, networkErrors: networkErrors.length,
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

const report = { generatedAt: new Date().toISOString(), target: BASE_URL, profile: "safe-read-only-production-baseline", stages: [] };
for (const stage of stages) {
  console.log(`Starting ${stage.name}: ${stage.rps} RPS for ${stage.durationSec}s`);
  const result = await runStage(stage);
  report.stages.push(result);
  console.log(JSON.stringify(result));
}

report.totals = report.stages.reduce((acc, stage) => {
  acc.requests += stage.requests;
  acc.failed += stage.failed;
  acc.serverErrors += stage.serverErrors;
  acc.networkErrors += stage.networkErrors;
  return acc;
}, { requests: 0, failed: 0, serverErrors: 0, networkErrors: 0 });

await writeFile("load-test-results.json", JSON.stringify(report, null, 2) + "\n");

const failedThreshold =
  report.stages.some((stage) => stage.errorRate > 0.01) ||
  report.stages.some((stage) => stage.serverErrors > 0) ||
  report.stages.some((stage) => stage.latencyMs.p95 > 2000) ||
  report.stages.some((stage) => stage.latencyMs.p99 > 5000);

console.log("\nLoad test summary");
console.log(JSON.stringify(report, null, 2));
if (failedThreshold) {
  console.error("LOAD TEST FAILED: one or more safety/performance thresholds were exceeded.");
  process.exit(1);
}
console.log("LOAD TEST PASSED: error rate, 5xx rate, p95, and p99 thresholds are within limits.");
