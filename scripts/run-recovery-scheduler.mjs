import { setTimeout as delay } from 'node:timers/promises';

const key = process.env.WORKER_RECOVERY_API_KEY?.trim();
const endpoint = new URL('/api/internal/workflows/recover', process.env.APP_URL || '');
if (!key || key.length < 32) throw new Error('Configure a dedicated WORKER_RECOVERY_API_KEY of at least 32 characters.');
if (endpoint.username || endpoint.password) throw new Error('APP_URL must not contain credentials.');
const internalHttp = process.env.ALLOW_INTERNAL_HTTP === '1' && ['app', 'localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && internalHttp)) throw new Error('APP_URL must use HTTPS outside the private local app network.');

let stopping = false;
process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });

while (!stopping) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { Authorization: `Bearer ${key}` },
      redirect: 'error', signal: AbortSignal.timeout(70_000),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(`Recovery tick failed with HTTP ${response.status}`);
    const attention = result.report && (result.report.pphBilling?.held || result.report.outbox.unhandled || result.report.outbox.failed || result.report.outbox.retried || result.report.failedWorkflowsEnqueued || result.report.timeBudgetExhausted);
    console.log(JSON.stringify({ worker: 'workflow-recovery', at: new Date().toISOString(), status: attention ? 'attention' : result.skipped || 'completed', report: result.report }));
  } catch (error) {
    console.error(JSON.stringify({ worker: 'workflow-recovery', at: new Date().toISOString(), status: 'failed', message: error instanceof Error ? error.message : 'Request failed' }));
  }
  // A single process never overlaps its own requests. Cross-process exclusion
  // is implemented by the endpoint's owner-checked Redis lease.
  if (!stopping) await delay(60_000);
}
