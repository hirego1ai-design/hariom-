import { AcceptanceTestSuite } from './AcceptanceTestSuite';

async function run() {
  console.log('================================================================');
  console.log('      HireGo AI ROS — Running All 18 Acceptance Test Categories  ');
  console.log('================================================================\n');

  const results = await AcceptanceTestSuite.runAll18Categories();

  let passedCount = 0;
  let failedCount = 0;

  for (const res of results) {
    if (res.passed) {
      passedCount++;
      console.log(`[PASS] Category ${res.categoryNumber}: ${res.categoryName}`);
    } else {
      failedCount++;
      console.log(`[FAIL] Category ${res.categoryNumber}: ${res.categoryName}`);
      console.log(`       Details: ${res.errorDetails}`);
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`SUMMARY: ${passedCount} / 18 Passed | ${failedCount} Failed`);
  console.log('----------------------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Acceptance Test Suite execution error:', err);
  process.exit(1);
});
