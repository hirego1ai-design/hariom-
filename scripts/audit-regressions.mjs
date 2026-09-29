// Run the offline production regression allowlist in isolated child processes.
// Isolation prevents one test file's handles or database state from blocking the
// entire release gate. The large feature-wiring file is additionally executed
// one named test at a time so a single unresolved test is attributable instead
// of stalling the whole audit without evidence. The split Admin workflow shards
// use the same mode because each shard contains many source-wiring assertions.
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const tests = [
  "admin-worker-liveness", "agent-evidence-regression", "ai-worker-safety", "async-worker-hardening", "candidate-evidence", "plan-contracts", "pph-billing",
  "checkout-csp", "feature-workflow-regressions", "admin-feature-workflow-a", "admin-subscription-controls-regression", "admin-feature-workflow-b", "admin-feature-workflow-c", "invoice-receipt-state", "logout-regression",
  "outbox-regression", "payment-architecture-regression", "recovery-worker-regression",
  "referral-cron-auth",
  "subscription-checkout-route", "test-safety-regression",
  "workflow-engine-regression", "hiring-pipeline-contract", "production-consumers",
  "mock-interview-regression",
  "security-attack-surface",
  "production-truthfulness",
];

const fileTimeoutMs = 60_000;
const namedTestTimeoutMs = 30_000;

function escapeRegex(value) {
  return value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
}

function runNodeTest(file, label, extraArgs = [], timeout = fileTimeoutMs) {
  console.log(`[audit-regression] START ${label}`);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--test", "--test-force-exit", ...extraArgs, file],
    {
      stdio: "inherit",
      timeout,
      env: process.env,
    },
  );

  if (result.error) {
    const timedOut = result.error.code === "ETIMEDOUT";
    console.error(
      timedOut
        ? `[audit-regression] TIMEOUT ${label} exceeded ${timeout}ms`
        : `[audit-regression] ERROR ${label}: ${result.error.message}`,
    );
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[audit-regression] FAIL ${label} exited with ${result.status ?? "unknown status"}`);
    process.exit(result.status ?? 1);
  }

  console.log(`[audit-regression] PASS ${label}`);
}

for (const name of tests) {
  const file = `src/tests/${name}.test.ts`;

  if (name === "feature-workflow-regressions" || name.startsWith("admin-feature-workflow-")) {
    const source = fs.readFileSync(file, "utf8");
    const names = [...source.matchAll(/test\("([^"]+)"/g)].map((match) => match[1]);
    if (!names.length) {
      console.error(`[audit-regression] FAIL ${file} exposes no named tests`);
      process.exit(1);
    }
    for (const testName of names) {
      const exactPattern = `^${escapeRegex(testName)}$`;
      runNodeTest(
        file,
        `${file} :: ${testName}`,
        [`--test-name-pattern=${exactPattern}`],
        namedTestTimeoutMs,
      );
    }
    continue;
  }

  runNodeTest(file, file);
}

console.log(`[audit-regression] PASS all ${tests.length} offline production regression files`);
