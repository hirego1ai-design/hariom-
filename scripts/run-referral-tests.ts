import { runReferralTestSuite } from "../src/tests/referrals.test";

async function main() {
  console.log("===============================================================");
  console.log("   HIREGO REFERRAL ENGINE — PHASE 1 AUTOMATED VERIFICATION   ");
  console.log("===============================================================\n");

  const { passed, failed, results } = await runReferralTestSuite();

  results.forEach((r, idx) => {
    const icon = r.success ? "✅" : "❌";
    console.log(`${icon} [Test ${idx + 1}] ${r.name}`);
    console.log(`   ${r.message}\n`);
  });

  console.log("---------------------------------------------------------------");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("---------------------------------------------------------------");

  if (failed > 0) {
    console.error("\n❌ Some referral engine tests failed!");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL PHASE 1 REFERRAL ENGINE TESTS PASSED (100% SCORE)!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
