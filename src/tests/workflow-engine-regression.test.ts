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
  stubMethod(t, prisma.workflowInstance, 'create', async () => { throw new Error('database offline'); });
  await assert.rejects(WorkflowEngine.startWorkflow({
    workflowType: 'test', initialStep: 'initial', initiatedBy: 'tester', correlationId: 'test', checkpointState: {},
  }), /database offline/);
});

test('step claim persistence failure prevents the side effect', async (t) => {
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
  await assert.rejects(WorkflowEngine.executeStep('workflow-test', 'send', 3, {}, async () => { throw new Error('provider unavailable'); }), /provider unavailable/);
  assert.equal(state.step.status, 'FAILED');
  assert.equal(state.workflow.status, 'FAILED');
  assert.equal(state.deadLetters.length, 1);
});

test('approval pause propagates persistence failure', async (t) => {
  stubMethod(t, prisma.workflowInstance, 'update', async () => { throw new Error('pause database offline'); });
  await assert.rejects(WorkflowEngine.pauseForApproval('workflow-test', 'approve'), /pause database offline/);
});

test('resume requires an approver and propagates conditional update failure', async (t) => {
  let writes = 0;
  stubMethod(t, prisma.workflowInstance, 'update', async ({ where }: any) => {
    writes++;
    assert.deepEqual(where, { id: 'workflow-test', status: 'PAUSED_FOR_APPROVAL' });
    throw new Error('paused workflow not found');
  });
  await assert.rejects(WorkflowEngine.resumeWorkflow('workflow-test', '   '), /approver is required/);
  assert.equal(writes, 0);
  await assert.rejects(WorkflowEngine.resumeWorkflow('workflow-test', 'reviewer'), /paused workflow not found/);
  assert.equal(writes, 1);
});
