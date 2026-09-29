// Run the offline production regression allowlist in isolated child processes.
// Isolation prevents one test file's handles or database state from blocking the
// entire release gate, while the per-file timeout fails closed instead of
// allowing CI to hang indefinitely.
import { spawnSync } from "node:child_process";

const tests = [
  "admin-worker-liveness", "agent-evidence-regression", "ai-worker-safety", "async-worker-hardening", "candidate-evidence", "plan-contracts", "pph-billing",
  "checkout-csp", "feature-workflow-regressions", "invoice-receipt-state", "logout-regression",
  "outbox-regression", "payment-architecture-regression", "recovery-worker-regression",
  "referral-cron-auth",
  "subscription-checkout-route", "test-safety-regression",
  "workflow-engine-regression", "hiring-pipeline-contract", "production-consumers",
  "mock-interview-regression",
  "security-attack-surface",
  "production-truthfulness",
];

const timeoutMs = 30_000;

for (const name of tests) {
  const file = `src/tests/${name}.test.ts`;
  console.log(`[audit-regression] START ${file}`);

  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--test", file],
    {
      stdio: "inherit",
      timeout: timeoutMs,
      env: process.env,
    },
  );

  if (result.error) {
    const timedOut = result.error.code === "ETIMEDOUT";
    console.error(
      timedOut
        ? `[audit-regression] TIMEOUT ${file} exceeded ${timeoutMs}ms`
        : `[audit-regression] ERROR ${file}: ${result.error.message}`,
    );
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[audit-regression] FAIL ${file} exited with ${result.status ?? "unknown status"}`);
    process.exit(result.status ?? 1);
  }

  console.log(`[audit-regression] PASS ${file}`);
}

console.log(`[audit-regression] PASS all ${tests.length} offline production regressions`);
