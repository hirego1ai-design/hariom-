import assert from 'node:assert/strict';
import test from 'node:test';

// An isolated fake is installed before importing application modules. No
// configured database, Redis instance, or provider is contacted by this file.
test('AI execution accounting and worker safety (isolated contracts)', async (t) => {
  const previousEnv = { ...process.env };
  Object.assign(process.env, { NODE_ENV: 'test', MOCK_DB: 'false' });
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Network prohibited in offline safety tests'); };
  type Reservation = { id: string; executionId: string; companyId: string; reservedMinor: bigint; status: string; expiresAt: Date; actualMinor?: bigint };
  let state = { credits: 3, limit: BigInt(100), spend: BigInt(0), held: BigInt(0), reservations: [] as Reservation[] };
  let kill = false;
  let killDbFailure = false;
  let evaluationFailure = false;
  let lifecycleFailureAt: string | undefined;
  let executeCalls = 0;
  let output: Record<string, unknown> = {};
  let executeFailure = false;
  const fake = {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>): Promise<unknown> => {
      const snapshot = structuredClone(state);
      try { return await fn(fake); } catch (error) { state = snapshot; throw error; }
    },
    $queryRaw: async (sql: TemplateStringsArray, ...values: unknown[]) => sql.join('').includes('"BudgetReservation"')
      ? state.reservations.filter((row) => row.executionId === values[0] && row.status === 'HELD')
      : [{ id: 'budget', companyId: 'tenant-a', currentSpendMinorUnits: state.spend, reservedSpendMinorUnits: state.held, monthlyLimitMinorUnits: state.limit, isHardCapEnabled: true }],
    companySubscription: { findFirst: async () => ({ plan: { featuresAllowed: ['ALL_FEATURES'] } }) },
    companyCredits: {
      updateMany: async () => { if (state.credits < 1) return { count: 0 }; state.credits--; return { count: 1 }; },
      update: async () => { state.credits++; },
    },
    aiCompanyBudget: { update: async ({ data }: { data: { reservedSpendMinorUnits: bigint; currentSpendMinorUnits?: bigint } }) => {
      state.held = data.reservedSpendMinorUnits;
      if (data.currentSpendMinorUnits !== undefined) state.spend = data.currentSpendMinorUnits;
    } },
    budgetReservation: {
      create: async ({ data }: { data: Omit<Reservation, 'id'> }) => {
        if (state.reservations.some((row) => row.executionId === data.executionId)) throw new Error('Duplicate execution');
        const row = { ...data, id: data.executionId }; state.reservations.push(row); return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Reservation> }) => {
        const row = state.reservations.find((entry) => entry.id === where.id)!; Object.assign(row, data); return row;
      },
      findMany: async () => state.reservations.filter((row) => row.status === 'HELD' && row.expiresAt < new Date()),
    },
    killSwitchConfig: {
      findFirst: async () => { if (killDbFailure) throw new Error('Kill switch DB offline'); return kill ? { isActive: true } : null; },
      findUnique: async () => { if (killDbFailure) throw new Error('Kill switch DB offline'); return null; },
    },
    agentLifecycleLog: { create: async ({ data }: { data: { currentState: string } }) => {
      if (lifecycleFailureAt === data.currentState) throw new Error('Lifecycle DB offline'); return {};
    } },
    agentEvaluationLog: { create: async () => { if (evaluationFailure) throw new Error('Evaluation DB offline'); return { id: 'evaluation' }; } },
  };
  const globals = globalThis as unknown as { prisma?: unknown };
  const originalPrisma = globals.prisma;
  globals.prisma = fake;
  try {
    const { ExecutionLoop } = await import('../lib/agents/ExecutionLoop');
    const { AgentRegistry } = await import('../lib/agents/AgentRegistry');
    const { BudgetManager } = await import('../lib/governance/BudgetManager');
    const { KillSwitchManager } = await import('../lib/security/KillSwitchManager');
    const { KillSwitchType } = await import('@prisma/client');
    const { renewSecurityAuditEventLease, leaseSecurityAuditEvents } = await import('../lib/securityAuditOutbox');
    const agent = AgentRegistry.getInstance().get('jd-generator');
    agent.execute = async () => { executeCalls++; if (executeFailure) throw new Error('Provider response lost'); return output; };
    const reset = () => {
      state = { credits: 3, limit: BigInt(100), spend: BigInt(0), held: BigInt(0), reservations: [] };
      kill = killDbFailure = evaluationFailure = executeFailure = false;
      lifecycleFailureAt = undefined; executeCalls = 0;
      output = { jobDescription: 'TypeScript engineer', actualCostMinorUnits: 7 };
    };
    const run = () => ExecutionLoop.runTask({
      agentId: 'jd-generator', taskInput: { title: 'Engineer' }, companyId: 'tenant-a', estimatedSpendMinor: BigInt(20),
      context: { agentId: 'jd-generator', executionId: 'execution-1', correlationId: 'correlation-1', tenantContext: { companyId: 'tenant-a', userId: 'user-a', userRole: 'EMPLOYER' } },
    });
    await t.test('kill switch stops execution without credit or budget debit', async () => {
      reset(); kill = true; await assert.rejects(run); assert.equal(state.credits, 3); assert.equal(state.held, BigInt(0)); assert.equal(executeCalls, 0);
    });
    await t.test('unavailable kill-switch database fails closed', async () => {
      reset(); killDbFailure = true; await assert.rejects(() => new KillSwitchManager().assertNotKilled(KillSwitchType.AGENT, 'jd-generator')); assert.equal(executeCalls, 0);
    });
    await t.test('budget rejection does not consume a credit', async () => {
      reset(); state.limit = BigInt(5); await assert.rejects(run); assert.equal(state.credits, 3); assert.equal(executeCalls, 0);
    });
    await t.test('exhausted credits roll back reservation', async () => {
      reset(); state.credits = 0; await assert.rejects(run); assert.equal(state.held, BigInt(0)); assert.equal(state.reservations.length, 0);
    });
    await t.test('duplicate execution rolls back credit debit and cannot repeat a provider call', async () => {
      reset(); await run(); await assert.rejects(run); assert.equal(state.credits, 2); assert.equal(state.spend, BigInt(7)); assert.equal(executeCalls, 1);
    });
    await t.test('pre-execution persistence failure refunds credit and releases reservation', async () => {
      reset(); lifecycleFailureAt = 'EXECUTING'; await assert.rejects(run); assert.equal(state.credits, 3); assert.equal(state.held, BigInt(0)); assert.equal(executeCalls, 0);
    });
    await t.test('uncertain provider failure is attempted once and keeps conservative spend', async () => {
      reset(); executeFailure = true; await assert.rejects(run); assert.equal(executeCalls, 1); assert.equal(state.spend, BigInt(20)); assert.equal(state.held, BigInt(0));
    });
    await t.test('rejected policy output is withheld but actual provider spend is settled', async () => {
      reset(); output = { jobDescription: 'Only young candidates', actualCostMinorUnits: 9 }; await assert.rejects(run, /not accepted/); assert.equal(state.spend, BigInt(9)); assert.equal(state.held, BigInt(0));
    });
    await t.test('evaluation persistence failure still settles completed provider usage', async () => {
      reset(); evaluationFailure = true; await assert.rejects(run); assert.equal(state.spend, BigInt(7)); assert.equal(state.held, BigInt(0));
    });
    await t.test('stale crashed execution retains potential provider spend', async () => {
      reset(); await BudgetManager.reserveBudget({ companyId: 'tenant-a', executionId: 'stale', correlationId: 'c', estimatedMinor: BigInt(20) });
      state.reservations[0].expiresAt = new Date(0); await BudgetManager.expireStaleReservations(); assert.equal(state.spend, BigInt(20)); assert.equal(state.held, BigInt(0));
    });
    await t.test('negative reservation is rejected before transaction', async () => {
      reset(); await assert.rejects(() => BudgetManager.reserveBudget({ companyId: 'tenant-a', executionId: 'negative', correlationId: 'c', estimatedMinor: BigInt(-1) })); assert.equal(state.held, BigInt(0));
    });
    await t.test('expired or reassigned SIEM lease cannot renew for delivery', async () => {
      const db = { securityAuditOutboxEvent: { updateMany: async ({ where }: { where: Record<string, unknown> }) => {
        assert.equal(where.leaseId, 'old-lease'); assert.ok(where.leasedUntil); return { count: 0 };
      } } } as unknown as Parameters<typeof renewSecurityAuditEventLease>[0];
      assert.equal(await renewSecurityAuditEventLease(db, 'event', 'old-lease'), false);
      await assert.rejects(() => leaseSecurityAuditEvents(db, 0));
    });
  } finally {
    globals.prisma = originalPrisma;
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key];
    Object.assign(process.env, previousEnv);
  }
});
