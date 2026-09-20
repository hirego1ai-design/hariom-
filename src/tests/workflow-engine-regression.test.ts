import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { prisma } from '../lib/prisma';
import { WorkflowEngine } from '../lib/workflows/WorkflowEngine';

function stubMethod(t: TestContext, target: any, name: string, implementation: (...args: any[]) => unknown) {
  const original = target[name];
  target[name] = implementation;
  t.after(() => { target[name] = original; });
}

function stubWorkflow(t: TestContext, failCompletionWrite = false) {
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', status: 'RUNNING', failureCount: 0 }));
  let step: any = null;
  let workflow: any = { id: 'workflow-test', status: 'RUNNING', currentStep: 'initial', correlationId: 'test-correlation' };
  let claims = 0;
  const deadLetters: unknown[] = [];
  stubMethod(t, prisma.workflowStepLog, 'findUnique', async () => step ? { ...step } : null);
  stubMethod(t, prisma.workflowStepLog, 'create', async ({ data }: any) => {
    if (step) throw new Error('execution key already claimed');
    claims++;
    step = { ...data, sideEffectDone: false, outputPayload: null };
    return step;
  });
  stubMethod(t, prisma.workflowStepLog, 'update', async ({ data }: any) => {
    step = { ...step, ...data };
    return step;
  });
  stubMethod(t, prisma.workflowInstance, 'update', async ({ data }: any) => {
    if (failCompletionWrite && data.currentStep) throw new Error('checkpoint write failed');
    workflow = { ...workflow, ...data };
    return workflow;
  });
  stubMethod(t, prisma.deadLetterJob, 'create', async ({ data }: any) => { deadLetters.push(data); return data; });
  stubMethod(t, prisma.deadLetterJob, 'upsert', async ({ create, update }: any) => { const data = { ...(deadLetters[0] as any ?? {}), ...create, ...update }; if (deadLetters.length) deadLetters[0] = data; else deadLetters.push(data); return data; });
  stubMethod(t, prisma, '$transaction', async (run: any) => {
    const oldStep = step ? { ...step } : null;
    const oldWorkflow = { ...workflow };
    const oldDeadLetterLength = deadLetters.length;
    try { return await run(prisma); } catch (error) {
      step = oldStep;
      workflow = oldWorkflow;
      deadLetters.length = oldDeadLetterLength;
      throw error;
    }
  });
  return {
    get step() { return step; }, get workflow() { return workflow; }, get claims() { return claims; }, deadLetters,
  };
}

test('workflow creation failure is propagated without a fake workflow', async (t) => {
  stubMethod(t, prisma.jobListing, 'findUnique', async () => ({ companyId: 'company-a' }));
  stubMethod(t, prisma.workflowInstance, 'create', async () => { throw new Error('database offline'); });
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  await assert.rejects(WorkflowEngine.startWorkflow({
    workflowType: 'JOB_REQUIREMENT', companyId: 'company-a', jobId: 'job-a',
    initialStep: 'initial', initiatedBy: 'tester', correlationId: 'test', checkpointState: {},
    context: createTenantContext('company-a', 'tester', Role.EMPLOYER),
  }), /database offline/);
});

test('step claim persistence failure prevents the side effect', async (t) => {
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', status: 'RUNNING', failureCount: 0 }));
  stubMethod(t, prisma.workflowStepLog, 'findUnique', async () => null);
  stubMethod(t, prisma.workflowStepLog, 'create', async () => { throw new Error('claim database offline'); });
  let sideEffects = 0;
  await assert.rejects(WorkflowEngine.executeStep('workflow-test', 'send', 1, {}, async () => { sideEffects++; }), /claim database offline/);
  assert.equal(sideEffects, 0);
});

test('concurrent step attempts admit only one side effect', async (t) => {
  const state = stubWorkflow(t);
  let sideEffects = 0;
  const step = () => WorkflowEngine.executeStep('workflow-test', 'send', 1, {}, async () => { sideEffects++; return { delivered: true }; });
  const results = await Promise.allSettled([step(), step()]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal(state.claims, 1);
  assert.equal(sideEffects, 1);
});

test('completed step replay returns the persisted output without repeating effects', async (t) => {
  const state = stubWorkflow(t);
  let sideEffects = 0;
  const run = () => WorkflowEngine.executeStep('workflow-test', 'send', 1, {}, async () => { sideEffects++; return { receipt: 'receipt-test' }; });
  assert.deepEqual(await run(), { receipt: 'receipt-test' });
  assert.deepEqual(await run(), { receipt: 'receipt-test' });
  assert.equal(sideEffects, 1);
  assert.equal(state.claims, 1);
});

test('successful step persists completion and advances the workflow checkpoint', async (t) => {
  const state = stubWorkflow(t);
  const output = await WorkflowEngine.executeStep('workflow-test', 'score', 1, { input: true }, async () => ({ score: 42 }));
  assert.deepEqual(output, { score: 42 });
  assert.equal(state.step.status, 'COMPLETED');
  assert.equal(state.step.sideEffectDone, true);
  assert.deepEqual(state.step.outputPayload, { score: 42 });
  assert.equal(state.workflow.currentStep, 'score');
});

test('checkpoint persistence failure rejects and never reports a durable success', async (t) => {
  const state = stubWorkflow(t, true);
  let sideEffects = 0;
  await assert.rejects(WorkflowEngine.executeStep('workflow-test', 'send', 1, {}, async () => { sideEffects++; return { sent: true }; }), /checkpoint write failed/);
  assert.equal(sideEffects, 1);
  assert.equal(state.step.status, 'FAILED');
  assert.equal(state.step.sideEffectDone, false);
  assert.equal(state.workflow.status, 'FAILED');
  assert.equal(state.workflow.currentStep, 'initial');
});

test('third failed attempt records durable failure and a dead letter', async (t) => {
  const state = stubWorkflow(t);
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', status: 'RUNNING', failureCount: 2 }));
  await assert.rejects(WorkflowEngine.executeStep('workflow-test', 'send', 3, {}, async () => { throw new Error('provider unavailable'); }), /provider unavailable/);
  assert.equal(state.step.status, 'FAILED');
  assert.equal(state.workflow.status, 'FAILED');
  assert.equal(state.deadLetters.length, 1);
});

test('approval pause propagates persistence failure', async (t) => {
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', companyId: 'company-a', status: 'RUNNING' }));
  stubMethod(t, prisma.workflowApproval, 'count', async () => 0);
  stubMethod(t, prisma, '$transaction', async () => { throw new Error('pause database offline'); });
  await assert.rejects(WorkflowEngine.requestConsequentialAction({
    workflowId: 'workflow-test', stepName: 'approve', actionType: 'CANDIDATE_SELECTION',
    action: { candidateId: 'candidate-a' },
    context: createTenantContext('company-a', 'reviewer', Role.EMPLOYER),
  }), /pause database offline/);
});

test('resume approved workflow rejects pending approvals', async (t) => {
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', companyId: 'company-a', status: 'PAUSED_FOR_APPROVAL' }));
  stubMethod(t, prisma.workflowApproval, 'count', async ({ where }: any) => where.decision === 'PENDING' ? 1 : 0);
  stubMethod(t, prisma.workflowApproval, 'findFirst', async () => null);
  await assert.rejects(WorkflowEngine.resumeApprovedWorkflow({
    workflowId: 'workflow-test',
    context: createTenantContext('company-a', 'reviewer', Role.EMPLOYER),
  }), /pending consequential approvals/);
});

test('rejected consequential approval prevents workflow resume', async (t) => {
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', companyId: 'company-a', status: 'PAUSED_FOR_APPROVAL' }));
  stubMethod(t, prisma.workflowApproval, 'count', async ({ where }: any) => where.decision === 'REJECTED' ? 1 : 0);
  await assert.rejects(WorkflowEngine.resumeApprovedWorkflow({
    workflowId: 'workflow-test',
    context: createTenantContext('company-a', 'reviewer', Role.EMPLOYER),
  }), /rejected consequential action/);
});


test('workflow completion blocks approved but unconsumed consequential actions', async (t) => {
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', companyId: 'company-a', status: 'RUNNING' }));
  stubMethod(t, prisma.workflowStepLog, 'count', async () => 0);
  stubMethod(t, prisma.workflowStepLog, 'findMany', async () => []);
  stubMethod(t, prisma.workflowApproval, 'count', async ({ where }: any) =>
    where.OR ? 1 : 0
  );
  await assert.rejects(WorkflowEngine.completeWorkflow({
    workflowId: 'workflow-test',
    context: createTenantContext('company-a', 'reviewer', Role.EMPLOYER),
  }), /unresolved consequential actions/);
});

test('duplicate decided approval request cannot re-pause workflow', async (t) => {
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  let workflowWrites = 0;
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', companyId: 'company-a', status: 'RUNNING' }));
  stubMethod(t, prisma.workflowApproval, 'count', async () => 0);
  stubMethod(t, prisma.workflowApproval, 'findUnique', async () => ({ id: 'approval-a', decision: 'APPROVED', actionType: 'CANDIDATE_SELECTION' }));
  stubMethod(t, prisma.workflowApproval, 'upsert', async () => ({ id: 'approval-a', decision: 'APPROVED', actionType: 'CANDIDATE_SELECTION' }));
  stubMethod(t, prisma.workflowInstance, 'update', async () => { workflowWrites++; throw new Error('must not write'); });
  stubMethod(t, prisma, '$transaction', async (run: any) => run(prisma));
  const result = await WorkflowEngine.requestConsequentialAction({
    workflowId: 'workflow-test', stepName: 'select', actionType: 'CANDIDATE_SELECTION',
    action: { candidateId: 'candidate-a' },
    context: createTenantContext('company-a', 'reviewer', Role.EMPLOYER),
  });
  assert.equal(result.approvalId, 'approval-a');
  assert.equal(result.status, 'APPROVED');
  assert.equal(workflowWrites, 0);
});

test('repeated identical pending approval request does not duplicate audit evidence', async (t) => {
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  const existing = {
    id: 'approval-a', workflowInstanceId: 'workflow-test', companyId: 'company-a',
    stepName: 'select', actionType: 'CANDIDATE_SELECTION', actionDigest: 'persisted',
    decision: 'PENDING',
  };
  let auditWrites = 0;
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', companyId: 'company-a', status: 'RUNNING' }));
  stubMethod(t, prisma.workflowApproval, 'count', async () => 0);
  stubMethod(t, prisma.workflowApproval, 'findUnique', async () => existing);
  stubMethod(t, prisma.workflowApproval, 'upsert', async () => existing);
  stubMethod(t, prisma.workflowInstance, 'update', async ({ data }: any) => ({ id: 'workflow-test', companyId: 'company-a', ...data }));
  stubMethod(t, prisma.auditLog, 'create', async () => { auditWrites++; return {}; });
  stubMethod(t, prisma.securityAuditOutboxEvent, 'create', async () => { auditWrites++; return {}; });
  stubMethod(t, prisma, '$transaction', async (run: any) => run(prisma));
  const result = await WorkflowEngine.requestConsequentialAction({
    workflowId: 'workflow-test', stepName: 'select', actionType: 'CANDIDATE_SELECTION',
    action: { candidateId: 'candidate-a' },
    context: createTenantContext('company-a', 'reviewer', Role.EMPLOYER),
  });
  assert.equal(result.status, 'PENDING_APPROVAL');
  assert.equal(auditWrites, 0);
});


test('approving one action keeps workflow paused while another approval is pending', async (t) => {
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  const workflow = { id: 'workflow-test', companyId: 'company-a', status: 'PAUSED_FOR_APPROVAL' };
  const approval = {
    id: 'approval-a', workflowInstanceId: workflow.id, companyId: workflow.companyId,
    stepName: 'select', actionType: 'CANDIDATE_SELECTION', actionDigest: 'digest-a',
    decision: 'PENDING', workflowInstance: workflow,
  };
  let persistedStatus = '';
  stubMethod(t, prisma.workflowApproval, 'findUnique', async () => approval);
  stubMethod(t, prisma.workflowApproval, 'updateMany', async () => ({ count: 1 }));
  stubMethod(t, prisma.workflowApproval, 'count', async () => 1);
  stubMethod(t, prisma.workflowInstance, 'update', async ({ data }: any) => {
    persistedStatus = data.status; return { ...workflow, status: data.status };
  });
  stubMethod(t, prisma.auditLog, 'create', async ({ data }: any) => data);
  stubMethod(t, prisma.securityAuditOutboxEvent, 'create', async ({ data }: any) => data);
  stubMethod(t, prisma, '$transaction', async (run: any) => run(prisma));
  await WorkflowEngine.decideApproval({
    approvalId: approval.id, decision: 'APPROVED',
    context: createTenantContext('company-a', 'reviewer', Role.EMPLOYER),
  });
  assert.equal(persistedStatus, 'PAUSED_FOR_APPROVAL');
});

test('approved action consumption is single-use under replay', async (t) => {
  const { createTenantContext } = await import('../lib/security/TenantContext');
  const { Role } = await import('@prisma/client');
  let consumes = 0;
  stubMethod(t, prisma.workflowInstance, 'findUnique', async () => ({ id: 'workflow-test', companyId: 'company-a' }));
  stubMethod(t, prisma.workflowApproval, 'findUnique', async () => ({
    id: 'approval-a', decision: 'APPROVED', decidedBy: 'reviewer', decidedAt: new Date(), decidedByRole: Role.EMPLOYER, actionType: 'CANDIDATE_SELECTION', consumedAt: null,
  }));
  stubMethod(t, prisma.workflowApproval, 'updateMany', async () => ({ count: ++consumes === 1 ? 1 : 0 }));
  stubMethod(t, prisma.workflowApproval, 'count', async () => 0);
  stubMethod(t, prisma.workflowInstance, 'updateMany', async () => ({ count: 1 }));
  stubMethod(t, prisma.auditLog, 'create', async ({ data }: any) => ({ id: 'audit-a', ...data }));
  stubMethod(t, prisma.securityAuditOutboxEvent, 'create', async ({ data }: any) => data);
  stubMethod(t, prisma, '$transaction', async (run: any) => run(prisma));
  const params = {
    workflowId: 'workflow-test', stepName: 'select', action: { candidateId: 'candidate-a' },
    context: createTenantContext('company-a', 'worker', Role.EMPLOYER),
  };
  await WorkflowEngine.consumeApprovedAction(params);
  await assert.rejects(WorkflowEngine.consumeApprovedAction(params), /already been consumed/);
});
