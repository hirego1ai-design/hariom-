import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { CandidateMatchmakerAgent, SecurityJudgeAgent, JdGeneratorAgent } from '../lib/agents/OperationalAgents';
import { prisma } from '../lib/prisma';
import type { ToolExecutionContext } from '../lib/tools/ToolRegistry';

const context: ToolExecutionContext = {
  tenantContext: { companyId: 'company-test', userId: 'user-test', userRole: 'EMPLOYER' },
  correlationId: 'test', executionId: 'test', agentId: 'candidate-matchmaker',
};

function stubCandidates(t: TestContext, implementation: (...args: any[]) => Promise<any>) {
  const delegate = prisma.candidateProfile as any;
  const original = delegate.findMany;
  delegate.findMany = implementation;
  t.after(() => { delegate.findMany = original; });
}

test('candidate matching rejects global context before database access', async () => {
  await assert.rejects(new CandidateMatchmakerAgent().execute({}, {
    ...context, tenantContext: { ...context.tenantContext, companyId: null },
  }), /Company context is required/);
});

test('candidate matching scopes records and does not invent rankings', async (t) => {
  stubCandidates(t, async (args: any) => {
    assert.equal(args.where.applications.some.job.companyId, 'company-test');
    return [{ id: 'candidate-test', user: { name: 'Test' } }];
  });
  const result = await new CandidateMatchmakerAgent().execute({}, context);
  assert.equal(result.rankingStatus, 'NOT_MEASURED');
  assert.deepEqual(result.topMatches, [{ candidateProfileId: 'candidate-test', candidateName: 'Test', compatibilityScore: null, scoreStatus: 'NOT_MEASURED' }]);
});

test('candidate database failure is not reported as a successful empty search', async (t) => {
  stubCandidates(t, async () => { throw new Error('offline database'); });
  await assert.rejects(new CandidateMatchmakerAgent().execute({}, context), /offline database/);
});

test('security judge requires actual evidence instead of assuming a clean session', async () => {
  await assert.rejects(new SecurityJudgeAgent().execute({}, context));
  await assert.rejects(new SecurityJudgeAgent().execute({ tabSwitchCount: -1, faceCount: 1 }, context));
  const result = await new SecurityJudgeAgent().execute({ tabSwitchCount: 0, faceCount: 1 }, context);
  assert.equal(result.evidenceType, 'ADVISORY_INPUT');
});

test('JD generator rejects missing title before dispatching to a provider', async () => {
  await assert.rejects(new JdGeneratorAgent().execute({}, context));
});
