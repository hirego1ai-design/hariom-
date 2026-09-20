import { runPhase5AgentSecurityTests } from './phase5-agent-security.test';

async function main() {
  const { results } = await runPhase5AgentSecurityTests();
  const failed = results.filter((result) => !result.passed);
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
