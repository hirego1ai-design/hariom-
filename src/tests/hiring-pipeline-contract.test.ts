import assert from 'node:assert/strict';
import test from 'node:test';

test('six-stage advisory contracts and readiness API (offline only)', async (t) => {
  const savedEnv = { ...process.env };
  Object.assign(process.env, { NODE_ENV: 'test', MOCK_DB: 'false' });
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const savedFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('No network allowed in pipeline contracts'); };
  const globals = globalThis as unknown as { prisma?: unknown };
  const savedPrisma = globals.prisma;
  type Row = Record<string, unknown>;
  const workflows = new Map<string, Row>();
  const steps = new Map<string, Row>();
  const calls: Array<{ agentId: string; taskInput: Row; context: { executionId: string } }> = [];
  let owned = true;
  let failAgent = '';
  let published = 0;
  const fake = {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(fake),
    application: { findFirst: async ({ where }: { where: { job: { companyId: string } } }) => {
      assert.equal(where.job.companyId, 'tenant-a'); return owned ? { id: 'application-a' } : null;
    } },
    employerProfile: { findUnique: async () => ({ companyId: 'tenant-a' }) },
    workflowInstance: {
      findUnique: async ({ where }: { where: Row }) => [...workflows.values()].find((row) => where.correlationId ? row.correlationId === where.correlationId : row.id === where.id) ?? null,
      create: async ({ data }: { data: Row }) => {
        if ([...workflows.values()].some((row) => row.correlationId === data.correlationId)) throw Object.assign(new Error('duplicate'), { code: 'P2002' });
        const row = { ...data, id: `workflow-${workflows.size + 1}` }; workflows.set(row.id, row); return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Row }) => { const row = workflows.get(where.id)!; Object.assign(row, data); return row; },
    },
    workflowStepLog: {
      findUnique: async ({ where }: { where: { executionKey: string } }) => steps.get(where.executionKey) ?? null,
      create: async ({ data }: { data: Row }) => { const key = String(data.executionKey); if (steps.has(key)) throw new Error('duplicate step'); steps.set(key, { ...data }); return data; },
      update: async ({ where, data }: { where: { executionKey: string }; data: Row }) => { const row = steps.get(where.executionKey)!; Object.assign(row, data); return row; },
    },
    outboxEntry: { create: async ({ data }: { data: Row }) => { published++; return data; } },
  };
  globals.prisma = fake;
  try {
    const { HiringPipeline } = await import('../lib/workflows/HiringPipeline');
    const { ExecutionLoop } = await import('../lib/agents/ExecutionLoop');
    const { GET } = await import('../app/api/employer/hiring-pipeline/readiness/route');
    const { createSessionToken } = await import('../lib/auth');
    const originalRun = ExecutionLoop.runTask;
    ExecutionLoop.runTask = async (params) => {
      calls.push(params);
      if (params.agentId === failAgent) throw new Error('Controlled agent failure');
      return { agentId: params.agentId, advisory: true };
    };
    const input = {
      tenantContext: { companyId: 'tenant-a', userId: 'employer-a', userRole: 'EMPLOYER' as const },
      companyId: 'tenant-a', initiatedBy: 'employer-a', correlationId: 'request-a',
      jobId: 'job-a', jobTitle: 'TypeScript engineer', candidateProfileId: 'candidate-a',
      transcript: 'I build TypeScript applications.', durationSeconds: 8, tabSwitchCount: 0, faceCount: 1,
    };
    const reset = () => { workflows.clear(); steps.clear(); calls.length = 0; owned = true; failAgent = ''; published = 0; };
    const request = (role: 'EMPLOYER' | 'CANDIDATE', query = '') => new Request(`https://hirego.test/api/employer/hiring-pipeline/readiness${query}`, {
      headers: { authorization: `Bearer ${createSessionToken({ id: 'employer-a', email: 'test@example.test', name: 'Contract user', role })}` },
    });
    try {
      await t.test('missing later-stage evidence fails before any workflow or paid call', async () => {
        reset(); await assert.rejects(() => HiringPipeline.runPipeline({ ...input, transcript: '' })); assert.equal(calls.length, 0); assert.equal(workflows.size, 0);
      });
      await t.test('candidate role and mismatched actor are denied before execution', async () => {
        reset(); await assert.rejects(() => HiringPipeline.runPipeline({ ...input, tenantContext: { ...input.tenantContext, userRole: 'CANDIDATE' } }));
        await assert.rejects(() => HiringPipeline.runPipeline({ ...input, initiatedBy: 'another-user' })); assert.equal(calls.length, 0);
      });
      await t.test('foreign tenant or absent candidate application is denied before execution', async () => {
        reset(); await assert.rejects(() => HiringPipeline.runPipeline({ ...input, companyId: 'tenant-b' }));
        owned = false; await assert.rejects(() => HiringPipeline.runPipeline(input)); assert.equal(calls.length, 0);
      });
      await t.test('all six stages receive actual required input and persist completion once', async () => {
        reset(); const result = await HiringPipeline.runPipeline(input);
        assert.equal(result.status, 'COMPLETED'); assert.equal(calls.length, 6); assert.equal(published, 1);
        assert.equal(calls[0].taskInput.title, input.jobTitle); assert.equal(calls[2].taskInput.jobId, input.jobId);
        assert.equal(calls[4].taskInput.transcript, input.transcript); assert.equal(calls[4].taskInput.durationSeconds, 8);
        assert.equal(calls[5].taskInput.faceCount, 1);
        for (const call of calls) assert.equal(call.context.executionId, `${result.workflowId}:${call.agentId}:1`);
        assert.equal(workflows.get(result.workflowId)?.status, 'COMPLETED'); assert.equal(steps.size, 6);
      });
      await t.test('completed request replay cannot spend again', async () => {
        reset(); await HiringPipeline.runPipeline(input); await assert.rejects(() => HiringPipeline.runPipeline(input), /already exists/); assert.equal(calls.length, 6); assert.equal(published, 1);
      });
      await t.test('simultaneous requests share one durable claim', async () => {
        reset(); const outcomes = await Promise.allSettled([HiringPipeline.runPipeline(input), HiringPipeline.runPipeline(input)]);
        assert.equal(outcomes.filter((item) => item.status === 'fulfilled').length, 1); assert.equal(calls.length, 6); assert.equal(workflows.size, 1);
      });
      await t.test('failed stage stops downstream processing and is not silently replayed', async () => {
        reset(); failAgent = 'resume-evaluator'; await assert.rejects(() => HiringPipeline.runPipeline(input));
        assert.equal(calls.length, 3); assert.equal(published, 0); assert.equal([...workflows.values()][0].status, 'FAILED');
        await assert.rejects(() => HiringPipeline.runPipeline(input), /already exists/); assert.equal(calls.length, 3);
      });
      await t.test('readiness requires authentication and employer role', async () => {
        reset(); assert.equal((await GET(new Request('https://hirego.test/api/employer/hiring-pipeline/readiness'))).status, 401);
        assert.equal((await GET(request('CANDIDATE'))).status, 403); assert.equal(calls.length, 0);
      });
      await t.test('readiness validates application input and tenant ownership', async () => {
        reset(); assert.equal((await GET(request('EMPLOYER', '?applicationId=invalid'))).status, 422);
        owned = false; assert.equal((await GET(request('EMPLOYER', '?applicationId=12345678-1234-4234-8234-123456789abc'))).status, 404); assert.equal(calls.length, 0);
      });
      await t.test('readiness honestly reports missing automatic hiring integration without executing agents', async () => {
        reset(); const response = await GET(request('EMPLOYER')); assert.equal(response.status, 200);
        const body = await response.json(); assert.equal(body.automaticHiringPipeline.status, 'NOT_IMPLEMENTED');
        assert.deepEqual(body.supportedAgentDispatch.agentIds, ['jd-generator', 'resume-evaluator']); assert.equal(calls.length, 0);
        assert.equal(response.headers.get('cache-control'), 'no-store');
      });
    } finally { ExecutionLoop.runTask = originalRun; }
  } finally {
    globals.prisma = savedPrisma; globalThis.fetch = savedFetch;
    for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
    Object.assign(process.env, savedEnv);
  }
});
