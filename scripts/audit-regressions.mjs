// An explicit allowlist avoids the legacy database-mutating test suite.
// Run each file in its own process so a leaked handle or stalled test is
// attributable to one file instead of hanging the entire CI job indefinitely.
import { spawn } from "node:child_process";

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

const perFileTimeoutMs = 60_000;

function runOne(name) {
  return new Promise((resolve, reject) => {
    const file = `src/tests/${name}.test.ts`;
    console.log(`\n[AUDIT] START ${file}`);
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "--test", "--test-concurrency=1", file],
      { stdio: "inherit" },
    );

    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2_000).unref();
      reject(new Error(`Offline audit timed out after ${perFileTimeoutMs / 1000}s: ${file}`));
    }, perFileTimeoutMs);

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`Could not launch offline regression ${file}: ${error.message}`));
    });

    child.on("exit", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0) {
        console.log(`[AUDIT] PASS ${file}`);
        resolve();
        return;
      }
      reject(new Error(`Offline audit failed: ${file} (code=${code ?? "null"}, signal=${signal ?? "none"})`));
    });
  });
}

try {
  for (const name of tests) {
    await runOne(name);
  }
  console.log(`\n[AUDIT] PASS all ${tests.length} offline regression files`);
} catch (error) {
  console.error(`\n[AUDIT] FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
