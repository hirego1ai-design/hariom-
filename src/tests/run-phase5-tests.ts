import { assertDisposableTestEnvironment } from './test-safety';

type Phase5FixtureMode = 'database' | 'synthetic-offline';

function selectFixtureMode(): Phase5FixtureMode {
  if (process.env.HIREGO_TEST_DATABASE === '1') {
    if (process.env.MOCK_DB === 'true') {
      throw new Error('Phase 5 database verification cannot run with MOCK_DB=true.');
    }
    assertDisposableTestEnvironment();
    process.env.MOCK_DB = 'false';
    return 'database';
  }

  process.env.MOCK_DB = 'true';
  return 'synthetic-offline';
}

async function main() {
  // Fixture selection must precede this import because the suite imports the
  // Prisma singleton, whose real/mock client is selected during evaluation.
  const fixtureMode = selectFixtureMode();
  const { runPhase5AgentSecurityTests } = await import('./phase5-agent-security.test');
  const { results } = await runPhase5AgentSecurityTests(fixtureMode);
  const failed = results.filter((result) => !result.passed);
  console.log(`Phase 5 fixture mode: ${fixtureMode}`);
  for (const result of results) {
    console.log(`[${result.passed ? 'PASS' : 'FAIL'}] [${result.category}] ${result.name}${result.message ? ` - ${result.message}` : ''}`);
  }
  console.log(`Phase 5 focused tests: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error('Phase 5 focused test runner failed:', error);
  process.exit(1);
});
