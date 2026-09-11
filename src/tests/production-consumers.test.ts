import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { z } from 'zod';
import type { SystemEvent } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ConsumerRegistry } from '../lib/events/ConsumerRegistry';
import { applicationSubmitted, jobListingCreated, hiringPipelineCompleted, eventNotificationId, registerProductionConsumers } from '../lib/events/ProductionConsumers';

const event: SystemEvent = { id: 'event', scope: 'TENANT', companyId: 'tenant', eventType: 'APPLICATION_SUBMITTED', eventVersion: 1,
  actorId: null, correlationId: 'correlation', idempotencyKey: 'application:a', payload: { applicationId: 'a', jobId: 'j' }, createdAt: new Date() };

function fixture(t: TestContext, options: { missing?: boolean; recipients?: number; unauthorized?: boolean; writeFailure?: boolean } = {}) {
  const notifications = new Map<string, any>();
  const tx = {
    application: { findFirst: async ({ where }: any) => {
      assert.equal(where.job.companyId, 'tenant'); assert.equal(where.id, 'a'); assert.equal(where.jobId, 'j');
      return options.missing ? null : { candidateProfile: { userId: 'candidate' }, job: { title: 'Engineer' } };
    } },
    jobListing: { findFirst: async ({ where }: any) => { assert.equal(where.companyId, 'tenant'); return options.missing ? null : { title: 'Engineer' }; } },
    employerProfile: { findMany: async ({ where, take }: any) => {
      assert.equal(where.companyId, 'tenant'); assert.equal(take, 101);
      return Array.from({ length: options.recipients ?? 2 }, (_, n) => ({ userId: `employer-${n}` }));
    } },
    workflowInstance: { findFirst: async ({ where }: any) => {
      assert.equal(where.companyId, 'tenant'); assert.equal(where.status, 'COMPLETED'); assert.equal(where.correlationId, event.correlationId);
      return options.missing ? null : { initiatedBy: 'initiator' };
    } },
    user: { findFirst: async ({ where }: any) => { assert.equal(where.OR[1].employerProfile.companyId, 'tenant'); return options.unauthorized ? null : { id: 'initiator' }; } },
    notification: {
      upsert: async ({ where, create, update }: any) => {
        if (options.writeFailure) throw new Error('write failed');
        assert.deepEqual(update, {});
        if (!notifications.has(where.id)) notifications.set(where.id, { ...create, isRead: false });
        return notifications.get(where.id);
      },
      createMany: async ({ data, skipDuplicates }: any) => {
        assert.equal(skipDuplicates, true);
        for (const row of data) if (!notifications.has(row.id)) notifications.set(row.id, row);
        return { count: data.length };
      },
    },
  };
  const original = prisma.$transaction;
  (prisma as any).$transaction = async (run: any) => run(tx);
  t.after(() => { prisma.$transaction = original; });
  return notifications;
}

test('production registration is repeatable and covers all three published domain types', () => {
  registerProductionConsumers(); registerProductionConsumers();
  for (const type of ['APPLICATION_SUBMITTED', 'JOB_LISTING_CREATED', 'HIRING_PIPELINE_COMPLETED']) assert.equal(ConsumerRegistry.getConsumers(type).length, 1);
  assert.equal(ConsumerRegistry.getConsumers('unknown.event').length, 0);
});
test('notification IDs are deterministic valid UUIDs and isolate events and recipients', () => {
  const value = eventNotificationId('event-a', 'user-a');
  assert.equal(z.string().uuid().parse(value), value);
  assert.equal(value, eventNotificationId('event-a', 'user-a'));
  assert.notEqual(value, eventNotificationId('event-b', 'user-a'));
  assert.notEqual(value, eventNotificationId('event-a', 'user-b'));
});
test('concurrent application deliveries create one receipt and replay preserves read status', async t => {
  const rows = fixture(t);
  await Promise.all([applicationSubmitted(event), applicationSubmitted(event)]);
  assert.equal(rows.size, 1);
  const row = [...rows.values()][0]; assert.equal(row.userId, 'candidate'); row.isRead = true;
  await applicationSubmitted(event); assert.equal(row.isRead, true);
});
test('foreign or missing application cannot deliver a notification', async t => {
  const rows = fixture(t, { missing: true });
  await assert.rejects(applicationSubmitted(event), /matching tenant-owned/); assert.equal(rows.size, 0);
});
test('invalid event evidence and persistence errors propagate for retry', async t => {
  fixture(t, { writeFailure: true });
  await assert.rejects(applicationSubmitted({ ...event, payload: {} }));
  await assert.rejects(applicationSubmitted(event), /write failed/);
});
test('job recipients come from company membership and duplicate delivery is harmless', async t => {
  const rows = fixture(t);
  await jobListingCreated(event); await jobListingCreated(event); assert.equal(rows.size, 2);
});
test('oversized job notification fanout is not silently acknowledged', async t => {
  const rows = fixture(t, { recipients: 101 });
  await assert.rejects(jobListingCreated(event), /operator review/); assert.equal(rows.size, 0);
});
test('completed advisory notifies its authorized initiator without claiming a hiring decision', async t => {
  const rows = fixture(t);
  await hiringPipelineCompleted({ ...event, payload: { workflowId: 'w' } });
  const row = [...rows.values()][0]; assert.equal(row.userId, 'initiator'); assert.match(row.message, /no hiring decision/);
});
test('removed company member cannot receive a workflow result', async t => {
  const rows = fixture(t, { unauthorized: true });
  await assert.rejects(hiringPipelineCompleted({ ...event, payload: { workflowId: 'w' } }), /no longer authorized/); assert.equal(rows.size, 0);
});
