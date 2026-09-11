import { runAllTests } from "../src/tests/suite.test";

async function main() {
  console.log("==================================================");
  console.log(" HIREGO AI v3.0 — AUTOMATED TEST SUITE RUNNER");
  console.log("==================================================");

  const testReport = await runAllTests();

  testReport.results.forEach((r, idx) => {
    const symbol = r.skipped ? "SKIP" : r.passed ? "✔ PASS" : "✖ FAIL";
    console.log(`[${idx + 1}/${testReport.total}] ${symbol} | [${r.category}] ${r.name}`);
  });

  console.log("==================================================");
  console.log(`SUMMARY: ${testReport.passedCount}/${testReport.total} PASSED (${testReport.failedCount} FAILED)`);
  console.log("==================================================");

  if (testReport.failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test Suite execution error:", err);
  process.exit(1);
});
