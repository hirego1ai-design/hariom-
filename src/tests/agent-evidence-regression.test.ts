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

function stubJob(t: TestContext, implementation: (...args: any[]) => Promise<any>) {
  const delegate = prisma.jobListing as any;
  const original = delegate.findFirst;
  delegate.findFirst = implementation;
  t.after(() => { delegate.findFirst = original; });
}

test('candidate matching rejects global context before database access', async () => {
  await assert.rejects(new CandidateMatchmakerAgent().execute({}, {
    ...context, tenantContext: { ...context.tenantContext, companyId: null },
  }), /Company context is required/);
});

test('candidate matching scopes records and returns deterministic evidence-first ranking', async (t) => {
  stubJob(t, async (args: any) => {
    assert.equal(args.where.id, 'job-test');
    assert.equal(args.where.companyId, 'company-test');
    return {
      id: 'job-test',
      companyId: 'company-test',
      title: 'TypeScript Engineer',
      description: 'Minimum 2 years experience.',
      requirements: [],
      skillRequirements: [{ name: 'TypeScript', priority: 'required' }],
      matchingConfig: null,
    };
  });
  stubCandidates(t, async (args: any) => {
    assert.equal(args.where.applications.some.jobId, 'job-test');
    assert.equal(args.where.applications.some.job.companyId, 'company-test');
    return [{
      id: 'candidate-test',
      user: { name: 'Test' },
      skills: ['TypeScript'],
      experienceYears: 3,
      experience: [{ title: 'Engineer' }],
      candidateSkills: [{
        name: 'TypeScript',
        normalizedName: 'typescript',
        verificationStatus: 'VERIFIED',
        validUntil: null,
        isVisible: true,
      }],
    }];
  });
  const result = await new CandidateMatchmakerAgent().execute({ jobId: 'job-test' }, context);
  assert.equal(result.rankingStatus, 'EVIDENCE_FIRST_MEASURED');
  assert.equal(result.policy, 'EVIDENCE_FIRST_NO_AUTO_REJECT');
  const top = (result.topMatches as any[])[0];
  assert.equal(top.candidateProfileId, 'candidate-test');
  assert.equal(top.candidateName, 'Test');
  assert.equal(top.compatibilityScore, 100);
  assert.equal(top.screeningDisposition, 'SHORTLIST_RECOMMENDED');
  assert.equal(top.automaticRejectionAllowed, false);
});

test('candidate database failure is not reported as a successful empty search', async (t) => {
  stubJob(t, async () => ({
    id: 'job-test',
    companyId: 'company-test',
    title: 'Engineer',
    description: '',
    requirements: [],
    skillRequirements: [],
    matchingConfig: null,
  }));
  stubCandidates(t, async () => { throw new Error('offline database'); });
  await assert.rejects(new CandidateMatchmakerAgent().execute({ jobId: 'job-test' }, context), /offline database/);
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
