import { OutboxPublisher, OutboxPoller } from '@/lib/events/Outbox';
import { ConsumerRegistry } from '@/lib/events/ConsumerRegistry';
import { DlqManager } from '@/lib/reliability/DlqManager';
import { BudgetManager } from '@/lib/governance/BudgetManager';
import { WorkflowEngine } from '@/lib/workflows/WorkflowEngine';
import { prisma } from '@/lib/prisma';
import { DeadLetterJob } from '@prisma/client';

// In-Memory Stubs for Worker Crash & Outbox Recovery Testing
const dbOutbox = new Map<string, any>();
const dbDlq = new Map<string, any>();
const dbBudgets = new Map<string, any>();
const dbReservations = new Map<string, any>();
const dbCheckpoints = new Set<string>();
const dbSystemEvents = new Map<string, any>();
const dbStepLogs = new Map<string, any>();
const dbWorkflows = new Map<string, any>();

function setupWorkerCrashPrismaStubs() {
  (prisma as any).outboxEntry = {
    create: async ({ data }: any) => {
      const id = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const record = { id, ...data, status: data.status || 'PENDING', retryCount: 0, createdAt: new Date() };
      dbOutbox.set(id, record);
      return record;
    },
    findMany: async ({ where, take }: any) => {
      const results: any[] = [];
      const leaseCutoff = where.OR?.[1]?.claimedAt?.lt;

      for (const entry of dbOutbox.values()) {
        if (entry.status === 'PENDING') {
          results.push(entry);
        } else if (entry.status === 'PROCESSING' && leaseCutoff && entry.claimedAt && entry.claimedAt < leaseCutoff) {
          results.push(entry);
        }
        if (take && results.length >= take) break;
      }
      return results;
    },
    update: async ({ where, data }: any) => {
      const entry = dbOutbox.get(where.id);
      if (!entry) throw new Error('Outbox entry not found');

      if (data.status) entry.status = data.status;
      if (data.claimedAt) entry.claimedAt = data.claimedAt;
      if (data.dispatchedAt) entry.dispatchedAt = data.dispatchedAt;
      if (data.failedAt) entry.failedAt = data.failedAt;
      if (data.retryCount) {
        if (data.retryCount.increment) entry.retryCount += data.retryCount.increment;
        else entry.retryCount = data.retryCount;
      }

      dbOutbox.set(where.id, entry);
      return entry;
    },
  };

  (prisma as any).systemEvent = {
    upsert: async ({ where, create }: any) => {
      const key = where.idempotencyKey;
      if (dbSystemEvents.has(key)) return dbSystemEvents.get(key);
      const record = { id: `event-${Date.now()}`, ...create };
      dbSystemEvents.set(key, record);
      return record;
    },
  };

  (prisma as any).eventConsumerCheckpoint = {
    findFirst: async ({ where }: any) => {
      const key = `${where.idempotencyKey}:${where.consumerId}`;
      return dbCheckpoints.has(key) ? { id: key, status: 'PROCESSED' } : null;
    },
    create: async ({ data }: any) => {
      const key = `${data.idempotencyKey}:${data.consumerId}`;
      dbCheckpoints.add(key);
      return { id: key, ...data };
    },
  };

  (prisma as any).deadLetterJob = {
    create: async ({ data }: any) => {
      const id = `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const record: DeadLetterJob = {
        id,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        correlationId: data.correlationId,
        errorType: data.errorType,
        errorMessage: data.errorMessage,
        payload: data.payload || null,
        status: data.status || 'OPEN',
        retryCount: data.retryCount || 0,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: new Date(),
      };
      dbDlq.set(id, record);
      return record;
    },
    findMany: async ({ where }: any) => {
      const results: any[] = [];
      for (const job of dbDlq.values()) {
        if (!where?.status || job.status === where.status) {
          if (!where?.correlationId || job.correlationId === where.correlationId) {
            results.push(job);
          }
        }
      }
      return results;
    },
    update: async ({ where, data }: any) => {
      const job = dbDlq.get(where.id);
      if (!job) throw new Error('DLQ job not found');
      if (data.status) job.status = data.status;
      if (data.resolvedAt) job.resolvedAt = data.resolvedAt;
      if (data.resolvedBy) job.resolvedBy = data.resolvedBy;
      if (data.retryCount) {
        if (data.retryCount.increment) job.retryCount += data.retryCount.increment;
        else job.retryCount = data.retryCount;
      }
      dbDlq.set(where.id, job);
      return job;
    },
  };

  (prisma as any).$transaction = async (cb: any) => {
    const txMock = {
      $queryRaw: async (query: any, ...values: any[]) => {
        const queryStr = String(query[0] || query);
        if (queryStr.includes('AiCompanyBudget')) {
          const companyId = values[0];
          const b = dbBudgets.get(companyId);
          if (!b) return [];
          return [b];
        }
        if (queryStr.includes('BudgetReservation')) {
          const execId = values[0];
          let r: any;
          for (const res of dbReservations.values()) {
            if (res.executionId === execId && res.status === 'HELD') {
              r = res;
              break;
            }
          }
          if (!r) return [];
          return [r];
        }
        return [];
      },
      budgetReservation: {
        update: async ({ where, data }: any) => {
          for (const [key, res] of dbReservations.entries()) {
            if (res.id === where.id) {
              if (data.status) res.status = data.status;
              dbReservations.set(key, res);
              return res;
            }
          }
          return null;
        },
      },
      aiCompanyBudget: {
        update: async ({ where, data }: any) => {
          for (const [compId, b] of dbBudgets.entries()) {
            if (b.id === where.id) {
              if (data.reservedSpendMinorUnits !== undefined) b.reservedSpendMinorUnits = BigInt(data.reservedSpendMinorUnits);
              if (data.currentSpendMinorUnits !== undefined) b.currentSpendMinorUnits = BigInt(data.currentSpendMinorUnits);
              dbBudgets.set(compId, b);
              return b;
            }
          }
          return null;
        },
      },
    };
    return cb(txMock);
  };

  (prisma as any).budgetReservation = {
    findMany: async ({ where }: any) => {
      const results: any[] = [];
      const now = new Date();
      for (const r of dbReservations.values()) {
        if (r.status === 'HELD' && r.expiresAt < now) {
          results.push(r);
        }
      }
      return results;
    },
  };

  (prisma as any).workflowStepLog = {
    findUnique: async ({ where }: any) => dbStepLogs.get(where.executionKey) || null,
    create: async ({ data }: any) => {
      const record = { id: `step-${Date.now()}`, ...data };
      dbStepLogs.set(data.executionKey, record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const existing = dbStepLogs.get(where.executionKey);
      if (!existing) throw new Error('Step log not found');
      const updated = { ...existing, ...data };
      dbStepLogs.set(where.executionKey, updated);
      return updated;
    },
  };

  (prisma as any).workflowInstance = {
    create: async ({ data }: any) => {
      const id = `wf-${Date.now()}`;
      const record = { id, ...data, updatedAt: new Date() };
      dbWorkflows.set(id, record);
      return record;
    },
    update: async ({ where, data }: any) => {
      const wf = dbWorkflows.get(where.id);
      if (!wf) throw new Error('Workflow not found');
      const updated = { ...wf, ...data, updatedAt: new Date() };
      dbWorkflows.set(where.id, updated);
      return updated;
    },
  };
}

async function runWorkerCrashTests() {
  console.log('================================================================');
  console.log('  PHASE 8.5 — WORKER CRASH & ABANDONED OUTBOX RECOVERY SUITE    ');
  console.log('================================================================');

  setupWorkerCrashPrismaStubs();
  let passedScenarios = 0;

  // ----------------------------------------------------------------
  // Scenario 1: Abandoned Outbox Lease Reclaim after Worker Crash
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 1: Abandoned Outbox Lease Reclaim ---');

  // Simulate Worker A claiming entry and crashing 10 minutes ago
  const staleEntryId = 'outbox-stale-1';
  dbOutbox.set(staleEntryId, {
    id: staleEntryId,
    eventType: 'WORKER_CRASH_EVENT',
    payload: { task: 'stale-reclaim' },
    correlationId: 'corr-crash-1',
    companyId: 'comp-crash-1',
    idempotencyKey: 'idem-crash-1',
    status: 'PROCESSING',
    claimedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago (past 60s leaseCutoff)
    retryCount: 0,
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  });

  let reclaimedDispatched = false;
  ConsumerRegistry.register('WORKER_CRASH_EVENT', 'crash-consumer-1', async () => {
    reclaimedDispatched = true;
  });

  // Secondary worker runs pollAndProcess
  await OutboxPoller.pollAndProcess(10, 60000);

  const reclaimedEntry = dbOutbox.get(staleEntryId);
  if (reclaimedEntry.status === 'DISPATCHED' && reclaimedDispatched) {
    console.log('PASS: Scenario 1 - Stale outbox entry reclaimed after worker crash and dispatched to DISPATCHED status.');
    passedScenarios++;
  } else {
    console.error(`FAIL: Scenario 1 - Reclaim failed, status=${reclaimedEntry?.status}`);
  }

  // ----------------------------------------------------------------
  // Scenario 2: At-Least-Once Redelivery Protection (Idempotent Consumers)
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 2: At-Least-Once Redelivery Protection ---');

  let consumerExecutions = 0;
  ConsumerRegistry.register('REDELIVERY_EVENT', 'idem-consumer-2', async () => {
    consumerExecutions++;
  });

  // Publish event and process once
  const redeliveryEntry = await OutboxPublisher.publish({
    eventType: 'REDELIVERY_EVENT',
    payload: { data: 'test' },
    correlationId: 'corr-crash-2',
    companyId: 'comp-crash-2',
    idempotencyKey: 'idem-crash-2',
  });

  await OutboxPoller.pollAndProcess(10);

  // Force entry back to PENDING to simulate worker crash & redelivery
  dbOutbox.get(redeliveryEntry.id).status = 'PENDING';

  // Process again
  await OutboxPoller.pollAndProcess(10);

  if (consumerExecutions === 1) {
    console.log('PASS: Scenario 2 - Redelivered event was processed idempotently (Consumer executed exactly ONCE).');
    passedScenarios++;
  } else {
    console.error(`FAIL: Scenario 2 - Consumer executed ${consumerExecutions} times on redelivery`);
  }

  // ----------------------------------------------------------------
  // Scenario 3: Outbox DLQ Escalation on Max Retries
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 3: Outbox DLQ Escalation on Max Retries ---');

  // Register consumer that throws an error
  ConsumerRegistry.register('FAILING_EVENT', 'failing-consumer-3', async () => {
    throw new Error('Simulated Consumer Crash');
  });

  const failingEntry = await OutboxPublisher.publish({
    eventType: 'FAILING_EVENT',
    payload: { error: true },
    correlationId: 'corr-crash-3',
    companyId: 'comp-crash-3',
    idempotencyKey: 'idem-crash-3',
  });

  // Poll 3 times to exhaust retries
  await OutboxPoller.pollAndProcess(10);
  await OutboxPoller.pollAndProcess(10);
  await OutboxPoller.pollAndProcess(10);

  const failedOutbox = dbOutbox.get(failingEntry.id);
  const openJobs = await DlqManager.getOpenJobs('corr-crash-3');

  if (failedOutbox.status === 'FAILED' && openJobs.length === 1 && openJobs[0].errorType === 'DispatchFailed') {
    console.log('PASS: Scenario 3 - Outbox entry transitioned to FAILED after 3 retries and escalated to DLQ.');
    passedScenarios++;
  } else {
    console.error(`FAIL: Scenario 3 - Outbox status=${failedOutbox?.status}, DLQ jobs=${openJobs.length}`);
  }

  // ----------------------------------------------------------------
  // Scenario 4: Stale Budget Reservation Expiry & Release
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 4: Stale Budget Reservation Expiry & Release ---');

  const comp4 = 'comp-crash-4';
  dbBudgets.set(comp4, {
    id: `b-${comp4}`,
    companyId: comp4,
    monthlyLimitMinorUnits: BigInt(50000),
    currentSpendMinorUnits: BigInt(0),
    reservedSpendMinorUnits: BigInt(5000),
  });

  const staleResId = 'res-stale-4';
  dbReservations.set(staleResId, {
    id: staleResId,
    executionId: 'exec-crash-4',
    correlationId: 'corr-crash-4',
    companyId: comp4,
    reservedMinor: BigInt(5000),
    status: 'HELD',
    expiresAt: new Date(Date.now() - 60000), // Expired 1 min ago
  });

  const expiredCount = await BudgetManager.expireStaleReservations();
  const b4 = dbBudgets.get(comp4)!;

  if (expiredCount === 1 && b4.reservedSpendMinorUnits === BigInt(0) && b4.currentSpendMinorUnits === BigInt(0)) {
    console.log('PASS: Scenario 4 - Stale budget reservation identified and released. Reserved balance reset to 0.');
    passedScenarios++;
  } else {
    console.error(`FAIL: Scenario 4 - Expired count=${expiredCount}, reservedSpend=${b4.reservedSpendMinorUnits}`);
  }

  // ----------------------------------------------------------------
  // Scenario 5: Workflow Step Crash Recovery & Resume
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 5: Workflow Step Crash Recovery & Resume ---');

  const wf5 = await WorkflowEngine.startWorkflow({
    workflowType: 'END_TO_END_HIRING',
    companyId: 'comp-crash-5',
    correlationId: 'corr-crash-5',
    initiatedBy: 'user-5',
    initialStep: 'PARSE_RESUME',
    checkpointState: {},
  });

  let stepCallCount = 0;
  const executeStepHelper = () => {
    return WorkflowEngine.executeStep(wf5.id, 'PARSE_RESUME', 1, { file: 'resume.pdf' }, async () => {
      stepCallCount++;
      return { parsed: true, skills: ['TypeScript', 'Node.js'] };
    });
  };

  // First run completes step
  const res1 = await executeStepHelper();

  // Simulate crash and resume — call executeStep again with SAME key
  const res2 = await executeStepHelper();

  if (res1.parsed && res2.parsed && stepCallCount === 1) {
    console.log('PASS: Scenario 5 - Workflow step resumed after crash using cached output (Step function called exactly ONCE).');
    passedScenarios++;
  } else {
    console.error(`FAIL: Scenario 5 - Step called ${stepCallCount} times`);
  }

  // ----------------------------------------------------------------
  // Scenario 6: DLQ Resolution Workflow
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 6: DLQ Job Resolution ---');

  const openDlqJobs = await DlqManager.getOpenJobs('corr-crash-3');
  if (openDlqJobs.length === 1) {
    const resolved = await DlqManager.resolveJob(openDlqJobs[0].id, 'admin-qa');
    if (resolved.status === 'RESOLVED' && resolved.resolvedBy === 'admin-qa') {
      console.log('PASS: Scenario 6 - DLQ job inspected and successfully resolved by admin.');
      passedScenarios++;
    } else {
      console.error('FAIL: Scenario 6 - Resolution failed');
    }
  } else {
    console.error('FAIL: Scenario 6 - No open DLQ job found');
  }

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log('\n================================================================');
  console.log('  PHASE 8.5 WORKER CRASH & OUTBOX RECOVERY SUMMARY              ');
  console.log('================================================================');
  console.log(`  Scenarios Passed: ${passedScenarios} / 6`);
  console.log('================================================================');

  if (passedScenarios === 6) {
    console.log('🎉 PHASE 8.5: ALL 6 WORKER CRASH & OUTBOX RECOVERY SCENARIOS PASSED CLEANLY');
  } else {
    console.error(`💀 PHASE 8.5: ${6 - passedScenarios} SCENARIOS FAILED`);
    process.exit(1);
  }
}

runWorkerCrashTests().catch((e) => {
  console.error('Phase 8.5 Test Suite Crashed:', e);
  process.exit(1);
});
