import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import type { OutboxEntry } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { OutboxPublisher, OutboxPoller } from '../lib/events/Outbox';
import { EventDispatcher } from '../lib/events/EventDispatcher';
import { ConsumerRegistry } from '../lib/events/ConsumerRegistry';

// Prisma delegates use proxy-backed properties, which node:test's method
// descriptor replacement cannot intercept. Assign and restore the proxy value.
function stubMethod(t: TestContext, target: any, name: string, implementation: (...args: any[]) => unknown) {
  const original = target[name];
  target[name] = implementation;
  t.after(() => { target[name] = original; });
}

function stubOutbox(t: TestContext) {
  t.mock.method(ConsumerRegistry, 'getConsumers', () => [{ consumerId: 'test-consumer', handler: async () => undefined }]);
  const row: OutboxEntry = {
    id: 'outbox-test', eventType: 'test.created', payload: {}, companyId: null,
    correlationId: 'test-correlation', idempotencyKey: 'test-key', status: 'PENDING',
    retryCount: 0, maxRetries: 2, claimedAt: null, createdAt: new Date(0), dispatchedAt: null, failedAt: null,
  };
  const deadLetters: unknown[] = [];
  stubMethod(t, prisma.outboxEntry, 'findMany', async () => [{ ...row }]);
  stubMethod(t, prisma.outboxEntry, 'updateMany', async ({ where, data }: any) => {
    const matches = row.id === where.id && row.status === where.status && row.retryCount === where.retryCount
      && row.claimedAt?.getTime() === where.claimedAt?.getTime();
    if (!matches) return { count: 0 };
    const retryCount = data.retryCount ? row.retryCount + data.retryCount.increment : row.retryCount;
    Object.assign(row, data, { retryCount });
    return { count: 1 };
  });
  stubMethod(t, prisma.deadLetterJob, 'create', async ({ data }: any) => { deadLetters.push(data); return data; });
  stubMethod(t, prisma, '$transaction', async (run: any) => {
    const before = { ...row };
    try { return await run(prisma); } catch (error) { Object.assign(row, before); throw error; }
  });
  return { row, deadLetters };
}

test('publish propagates persistence failure instead of inventing a durable event', async (t) => {
  stubMethod(t, prisma.outboxEntry, 'create', async () => { throw new Error('database offline'); });
  await assert.rejects(OutboxPublisher.publish({
    eventType: 'test.created', payload: {}, correlationId: 'test', idempotencyKey: 'test',
  }), /database offline/);
});

test('two pollers that read the same pending event dispatch it only once', async (t) => {
  const { row } = stubOutbox(t);
  let dispatches = 0;
  t.mock.method(EventDispatcher, 'dispatchOutboxEntry', async () => { dispatches++; });
  await Promise.all([OutboxPoller.pollAndProcess(), OutboxPoller.pollAndProcess()]);
  assert.equal(dispatches, 1);
  assert.equal(row.status, 'DISPATCHED');
});

test('unregistered business event remains pending and is reported as unhandled', async (t) => {
  const { row } = stubOutbox(t);
  t.mock.method(ConsumerRegistry, 'getConsumers', () => []);
  let dispatched = false;
  t.mock.method(EventDispatcher, 'dispatchOutboxEntry', async () => { dispatched = true; });
  const report = await OutboxPoller.pollAndProcess();
  assert.equal(row.status, 'PENDING');
  assert.equal(dispatched, false);
  assert.equal(report.unhandled, 1);
  assert.equal(report.claimed, 0);
});

test('expired processing lease is counted accurately when reclaimed', async (t) => {
  const { row } = stubOutbox(t);
  row.status = 'PROCESSING';
  row.claimedAt = new Date(0);
  t.mock.method(EventDispatcher, 'dispatchOutboxEntry', async () => undefined);
  const report = await OutboxPoller.pollAndProcess();
  assert.equal(report.reclaimed, 1);
  assert.equal(report.dispatched, 1);
});

test('deadline exhaustion does not start another event handler', async (t) => {
  const { row } = stubOutbox(t);
  const report = await OutboxPoller.pollAndProcess(10, 60_000, Date.now() - 1);
  assert.equal(report.claimed, 0);
  assert.equal(row.status, 'PENDING');
});

test('expired owner cannot mark a newly claimed lease dispatched', async (t) => {
  const { row } = stubOutbox(t);
  let newerLease: Date | null = null;
  t.mock.method(EventDispatcher, 'dispatchOutboxEntry', async () => {
    newerLease = new Date(row.claimedAt!.getTime() + 1000);
    row.claimedAt = newerLease;
  });
  await OutboxPoller.pollAndProcess();
  assert.equal(row.status, 'PROCESSING');
  assert.equal(row.claimedAt, newerLease);
});

test('expired owner failure cannot overwrite or dead-letter a newer lease', async (t) => {
  const { row, deadLetters } = stubOutbox(t);
  row.retryCount = 1;
  t.mock.method(EventDispatcher, 'dispatchOutboxEntry', async () => {
    row.claimedAt = new Date(row.claimedAt!.getTime() + 1000);
    throw new Error('old worker timed out');
  });
  await OutboxPoller.pollAndProcess();
  assert.equal(row.status, 'PROCESSING');
  assert.equal(row.retryCount, 1);
  assert.equal(deadLetters.length, 0);
});

test('respects configured retry limit and atomically records terminal failure', async (t) => {
  const { row, deadLetters } = stubOutbox(t);
  t.mock.method(EventDispatcher, 'dispatchOutboxEntry', async () => { throw new Error('consumer unavailable'); });
  await OutboxPoller.pollAndProcess();
  assert.equal(row.status, 'PENDING');
  assert.equal(row.retryCount, 1);
  await OutboxPoller.pollAndProcess();
  assert.equal(row.status, 'FAILED');
  assert.equal(row.retryCount, 2);
  assert.equal(deadLetters.length, 1);
});

test('DLQ persistence failure leaves the lease recoverable instead of losing work', async (t) => {
  const { row } = stubOutbox(t);
  row.retryCount = 1;
  t.mock.method(EventDispatcher, 'dispatchOutboxEntry', async () => { throw new Error('consumer unavailable'); });
  stubMethod(t, prisma.deadLetterJob, 'create', async () => { throw new Error('DLQ unavailable'); });
  await assert.rejects(OutboxPoller.pollAndProcess(), /DLQ unavailable/);
  assert.equal(row.status, 'PROCESSING');
  assert.equal(row.retryCount, 1);
});
