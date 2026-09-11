import { WorkflowEngine } from './WorkflowEngine';
import { ExecutionLoop } from '../agents/ExecutionLoop';
import { TenantContext } from '../security/TenantContext';
import { RbacGuard } from '../security/RbacGuard';
import { OutboxPublisher } from '../events/Outbox';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { createHash } from 'node:crypto';

export interface HiringPipelineInput {
  tenantContext: TenantContext;
  correlationId: string;
  companyId: string;
  jobTitle: string;
  candidateProfileId: string;
  initiatedBy: string;
  jobId: string;
  transcript: string;
  durationSeconds: number;
  tabSwitchCount: number;
  faceCount: number;
}

export class HiringPipelineConflictError extends Error {
  readonly status = 409;
}

export interface HiringPipelineResult {
  workflowId: string;
  correlationId: string;
  jobDescriptionResult: Record<string, unknown>;
  matchmakerResult: Record<string, unknown>;
  resumeEvalResult: Record<string, unknown>;
  interviewResult: Record<string, unknown>;
  communicationResult: Record<string, unknown>;
  securityResult: Record<string, unknown>;
  status: 'COMPLETED' | 'FAILED';
}

export class HiringPipeline {
  /**
   * Internal six-stage advisory orchestration. This is not a hiring decision
   * engine: matching is unranked, the interview stage drafts a question, and
   * supplied proctoring measurements require independent verification.
   */
  static async runPipeline(input: HiringPipelineInput): Promise<HiringPipelineResult> {
    // 1. RBAC & Security assertions
    RbacGuard.assertOwnership(input.tenantContext, { companyId: input.companyId });
    RbacGuard.assertRole(input.tenantContext, [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN]);
    if (input.initiatedBy !== input.tenantContext.userId) throw new Error('Workflow actor does not match authenticated user.');
    // Validate every later stage before spending credits on earlier stages.
    const evidence = z.object({
      companyId: z.string().trim().min(1).max(128),
      candidateProfileId: z.string().trim().min(1).max(128),
      correlationId: z.string().trim().min(1).max(128),
      jobId: z.string().trim().min(1).max(128),
      jobTitle: z.string().trim().min(1).max(160),
      transcript: z.string().trim().min(1).max(50_000),
      durationSeconds: z.number().finite().positive().max(86_400),
      tabSwitchCount: z.number().int().nonnegative().max(100_000),
      faceCount: z.number().int().nonnegative().max(100),
    }).parse(input);
    input = { ...input, ...evidence };
    const application = await prisma.application.findFirst({
      where: { jobId: evidence.jobId, candidateProfileId: input.candidateProfileId, job: { companyId: input.companyId } },
      select: { id: true },
    });
    if (!application) throw new Error('A candidate application belonging to this company and job is required.');

    // A workflow correlation ID is the durable request key. Do not restart a
    // failed or running paid sequence under the same key. The unique DB
    // constraint below also rejects simultaneous requests that race this read.
    const previous = await prisma.workflowInstance.findUnique({ where: { correlationId: evidence.correlationId }, select: { id: true } });
    if (previous) throw new HiringPipelineConflictError('This workflow request already exists. Inspect its persisted result before starting another.');

    // 2. Initialize Workflow Instance
    const workflow = await WorkflowEngine.startWorkflow({
      workflowType: 'END_TO_END_HIRING',
      companyId: input.companyId,
      candidateId: input.candidateProfileId,
      jobId: evidence.jobId,
      applicationId: application.id,
      correlationId: input.correlationId,
      initiatedBy: input.initiatedBy,
      initialStep: 'JD_GENERATION',
      checkpointState: {
        phase: 'INIT', mode: 'ADVISORY_ONLY',
        evidenceSha256: createHash('sha256').update(JSON.stringify(evidence)).digest('hex'),
      },
    }).catch((error: unknown) => {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new HiringPipelineConflictError('This workflow request is already claimed.');
      }
      throw error;
    });

    const executionContext = {
      tenantContext: input.tenantContext,
      correlationId: input.correlationId,
      executionId: `${workflow.id}:jd-generator:1`,
      agentId: 'jd-generator',
    };

    // Stage 1: JD Generator Agent
    const jobDescriptionResult = await WorkflowEngine.executeStep(
      workflow.id,
      'JD_GENERATION',
      1,
      { jobTitle: input.jobTitle },
      async () => {
        return ExecutionLoop.runTask({
          agentId: 'jd-generator',
          taskInput: { title: evidence.jobTitle },
          context: executionContext,
          companyId: input.companyId,
          estimatedSpendMinor: BigInt(2000),
        });
      }
    );

    // Stage 2: Candidate Matchmaker Agent
    const matchmakerResult = await WorkflowEngine.executeStep(
      workflow.id,
      'CANDIDATE_MATCHING',
      1,
      { candidateProfileId: input.candidateProfileId },
      async () => {
        return ExecutionLoop.runTask({
          agentId: 'candidate-matchmaker',
          taskInput: { candidateProfileId: input.candidateProfileId },
          context: { ...executionContext, agentId: 'candidate-matchmaker', executionId: `${workflow.id}:candidate-matchmaker:1` },
          companyId: input.companyId,
          estimatedSpendMinor: BigInt(3000),
        });
      }
    );

    // Stage 3: Resume Evaluator Agent
    const resumeEvalResult = await WorkflowEngine.executeStep(
      workflow.id,
      'RESUME_EVALUATION',
      1,
      { candidateProfileId: input.candidateProfileId },
      async () => {
        return ExecutionLoop.runTask({
          agentId: 'resume-evaluator',
          taskInput: { candidateProfileId: input.candidateProfileId, jobId: evidence.jobId },
          context: { ...executionContext, agentId: 'resume-evaluator', executionId: `${workflow.id}:resume-evaluator:1` },
          companyId: input.companyId,
          estimatedSpendMinor: BigInt(5000),
        });
      }
    );

    // Stage 4: Mock Interview Copilot Agent
    const interviewResult = await WorkflowEngine.executeStep(
      workflow.id,
      'MOCK_INTERVIEW',
      1,
      { candidateProfileId: input.candidateProfileId },
      async () => {
        return ExecutionLoop.runTask({
          agentId: 'mock-interview-copilot',
          taskInput: { candidateProfileId: input.candidateProfileId },
          context: { ...executionContext, agentId: 'mock-interview-copilot', executionId: `${workflow.id}:mock-interview-copilot:1` },
          companyId: input.companyId,
          estimatedSpendMinor: BigInt(10000),
        });
      }
    );

    // Stage 5: Communication Coach Agent
    const communicationResult = await WorkflowEngine.executeStep(
      workflow.id,
      'COMMUNICATION_ANALYSIS',
      1,
      { candidateProfileId: input.candidateProfileId },
      async () => {
        return ExecutionLoop.runTask({
          agentId: 'communication-coach',
          taskInput: { candidateProfileId: input.candidateProfileId, transcript: evidence.transcript, durationSeconds: evidence.durationSeconds },
          context: { ...executionContext, agentId: 'communication-coach', executionId: `${workflow.id}:communication-coach:1` },
          companyId: input.companyId,
          estimatedSpendMinor: BigInt(3000),
        });
      }
    );

    // Stage 6: Security Judge Agent
    const securityResult = await WorkflowEngine.executeStep(
      workflow.id,
      'SECURITY_INTEGRITY_CHECK',
      1,
      { candidateProfileId: input.candidateProfileId },
      async () => {
        return ExecutionLoop.runTask({
          agentId: 'security-judge',
          taskInput: { candidateProfileId: input.candidateProfileId, tabSwitchCount: evidence.tabSwitchCount, faceCount: evidence.faceCount },
          context: { ...executionContext, agentId: 'security-judge', executionId: `${workflow.id}:security-judge:1` },
          companyId: input.companyId,
          estimatedSpendMinor: BigInt(1000),
        });
      }
    );

    // Publish Pipeline Completed System Event via Outbox
    await prisma.$transaction(async (tx) => {
    await OutboxPublisher.publish({
      eventType: 'HIRING_PIPELINE_COMPLETED',
      payload: {
        workflowId: workflow.id,
        correlationId: input.correlationId,
        companyId: input.companyId,
        candidateProfileId: input.candidateProfileId,
      },
      correlationId: input.correlationId,
      companyId: input.companyId,
      idempotencyKey: `pipeline-completed-${workflow.id}`,
    }, tx);
    await tx.workflowInstance.update({ where: { id: workflow.id }, data: { status: 'COMPLETED' } });
    });

    return {
      workflowId: workflow.id,
      correlationId: input.correlationId,
      jobDescriptionResult,
      matchmakerResult,
      resumeEvalResult,
      interviewResult,
      communicationResult,
      securityResult,
      status: 'COMPLETED',
    };
  }
}
