import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Legacy runners now execute isolated contracts rather than inventing
 * staging or deployment evidence from partial mocks and hardcoded output. */
export function runOfflineHiringPipelineValidation() {
  console.log('Running offline hiring-pipeline contracts. This does not validate staging, providers, production, or deployment.');
  execFileSync(process.execPath, [
    resolve('node_modules/tsx/dist/cli.mjs'), '--test', resolve('src/tests/hiring-pipeline-contract.test.ts'),
  ], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
}
