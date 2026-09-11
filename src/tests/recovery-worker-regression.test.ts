import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { prisma } from '../lib/prisma';
import { FailureRecoveryRunner, type RecoveryReport } from '../lib/workflows/FailureRecoveryRunner';
import { RecoveryWorkerState } from '../lib/workflows/RecoveryWorkerState';
import { OutboxPoller } from '../lib/events/Outbox';
import { BudgetManager } from '../lib/governance/BudgetManager';
import { GET, POST } from '../app/api/internal/workflows/recover/route';

const workerKey = 'offline-test-worker-key-32-characters-long';
const report: RecoveryReport = {
  reclaimedOutboxEntries: 1, expiredReservations: 2, failedWorkflowsEnqueued: 0, timeBudgetExhausted: false,
  outbox: { claimed: 1, reclaimed: 1, dispatched: 1, retried: 0, failed: 0, unhandled: 0 },
};
const heartbeat = { runId: 'test-worker', startedAt: new Date().toISOString(), state: 'running' as const };

function envKey(t: TestContext, key: string | undefined = workerKey) {
  const previous = process.env.WORKER_RECOVERY_API_KEY;
  if (key === undefined) delete process.env.WORKER_RECOVERY_API_KEY;
  else process.env.WORKER_RECOVERY_API_KEY = key;
  t.after(() => { if (previous === undefined) delete process.env.WORKER_RECOVERY_API_KEY; else process.env.WORKER_RECOVERY_API_KEY = previous; });
}
function request(key = workerKey) {
  return new Request('http://localhost/api/internal/workflows/recover', { method: 'POST', headers: { authorization: `Bearer ${key}` } });
}
function stubMethod(t: TestContext, target: any, name: string, implementation: (...args: any[]) => unknown) {
  const previous = target[name]; target[name] = implementation;
  t.after(() => { target[name] = previous; });
}

test('unconfigured worker key fails closed before coordination or side effects', async (t) => {
  envKey(t, '');
  t.mock.method(RecoveryWorkerState, 'claim', async () => { throw new Error('must not coordinate'); });
  assert.equal((await POST(request())).status, 503);
});

test('invalid dedicated key is rejected before invoking the worker', async (t) => {
  envKey(t);
  t.mock.method(FailureRecoveryRunner, 'runRecoveryPass', async () => { throw new Error('must not run'); });
  assert.equal((await POST(request('wrong-key'))).status, 401);
});

test('overlapping scheduler tick does not invoke another recovery pass', async (t) => {
  envKey(t);
  t.mock.method(RecoveryWorkerState, 'claim', async () => null);
  let runs = 0;
  t.mock.method(FailureRecoveryRunner, 'runRecoveryPass', async () => { runs++; return report; });
  const response = await POST(request());
  assert.equal(response.status, 202);
  assert.equal(runs, 0);
  assert.equal((await response.json()).skipped, 'already_running');
});

test('authorized run persists completion heartbeat with actual counters', async (t) => {
  envKey(t);
  t.mock.method(RecoveryWorkerState, 'claim', async () => heartbeat);
  t.mock.method(FailureRecoveryRunner, 'runRecoveryPass', async () => report);
  const completions: unknown[] = [];
  t.mock.method(RecoveryWorkerState, 'finish', async (state: unknown, result: unknown) => { completions.push({ state, result }); return true; });
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).report, report);
  assert.deepEqual(completions, [{ state: heartbeat, result: report }]);
});

test('lost worker lease cannot report healthy completion', async (t) => {
  envKey(t);
  t.mock.method(RecoveryWorkerState, 'claim', async () => heartbeat);
  t.mock.method(FailureRecoveryRunner, 'runRecoveryPass', async () => report);
  t.mock.method(RecoveryWorkerState, 'finish', async () => false);
  assert.equal((await POST(request())).status, 503);
});

test('stale or unhandled-event heartbeat is unhealthy for monitoring', async (t) => {
  envKey(t);
  t.mock.method(RecoveryWorkerState, 'read', async () => ({ heartbeat: { ...heartbeat, state: 'attention' as const }, stale: false }));
  assert.equal((await GET(request())).status, 503);
});

test('recovery scans are bounded and a concurrently advanced workflow is not failed', async (t) => {
  t.mock.method(OutboxPoller, 'pollAndProcess', async (batch: number, lease: number, stopAt: number) => {
    assert.equal(batch, 20); assert.equal(lease, 90_000); assert.ok(stopAt > Date.now());
    return report.outbox;
  });
  t.mock.method(BudgetManager, 'expireStaleReservations', async (batch: number) => { assert.equal(batch, 20); return 2; });
  const updatedAt = new Date(Date.now() - 11 * 60_000);
  stubMethod(t, prisma.workflowInstance, 'findMany', async (args: any) => {
    assert.equal(args.take, 20);
    return [{ id: 'workflow-test', correlationId: 'test-correlation', updatedAt }];
  });
  stubMethod(t, prisma.workflowInstance, 'updateMany', async (args: any) => {
    assert.deepEqual(args.where, { id: 'workflow-test', status: 'RUNNING', updatedAt });
    return { count: 0 };
  });
  stubMethod(t, prisma.deadLetterJob, 'create', async () => { throw new Error('must not dead-letter a changed workflow'); });
  stubMethod(t, prisma, '$transaction', async (run: any) => run(prisma));
  const result = await FailureRecoveryRunner.runRecoveryPass();
  assert.equal(result.failedWorkflowsEnqueued, 0);
  assert.equal(result.reclaimedOutboxEntries, 1);
});

test('reservation recovery is bounded and conservatively accounts for uncertain provider spend', async (t) => {
  stubMethod(t, prisma.budgetReservation, 'findMany', async (args: any) => {
    assert.equal(args.take, 7);
    return [{ executionId: 'execution-test', reservedMinor: BigInt(200) }];
  });
  const settled: unknown[] = [];
  t.mock.method(BudgetManager, 'reconcileBudget', async (params: unknown) => { settled.push(params); });
  assert.equal(await BudgetManager.expireStaleReservations(7), 1);
  assert.deepEqual(settled, [{ executionId: 'execution-test', actualMinor: BigInt(200) }]);
});
