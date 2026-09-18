// An explicit allowlist avoids the legacy database-mutating test suite.
import { spawn } from 'node:child_process';

const tests = [
  'admin-worker-liveness', 'agent-evidence-regression', 'ai-worker-safety', 'async-worker-hardening', 'candidate-evidence', 'plan-contracts', 'pph-billing',
  'checkout-csp', 'feature-workflow-regressions', 'invoice-receipt-state', 'logout-regression',
  'outbox-regression', 'payment-webhook-replay', 'recovery-worker-regression',
  'referral-cron-auth',
  'subscription-checkout-route', 'subscription-readiness', 'test-safety-regression',
  'workflow-engine-regression', 'hiring-pipeline-contract', 'production-consumers',
];
const child = spawn(process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=2',
  ...tests.map(name => `src/tests/${name}.test.ts`)], { stdio: 'inherit' });
child.on('error', () => { console.error('Could not launch offline regressions.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
