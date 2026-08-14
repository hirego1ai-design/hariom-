import { WorkflowEngine } from './WorkflowEngine';
import { ExecutionLoop } from '../agents/ExecutionLoop';
import { TenantContext } from '../security/TenantContext';
import { RbacGuard } from '../security/RbacGuard';
import { OutboxPublisher } from '../events/Outbox';
import { TraceRecorder } from '../telemetry/TraceRecorder';

export interface HiringPipelineInput {
  tenantContext: TenantContext;
  correlationId: string;
  companyId: string;
  jobTitle: string;
  candidateProfileId: string;
  initiatedBy: string;
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
   * Runs the complete 6-agent end-to-end recruitment pipeline under infrastructure control.
   */
  static async runPipeline(input: HiringPipelineInput): Promise<HiringPipelineResult> {
    // 1. RBAC & Security assertions
    RbacGuard.assertOwnership(input.tenantContext, { companyId: input.companyId });

    // 2. Initialize Workflow Instance
    const workflow = await WorkflowEngine.startWorkflow({
      workflowType: 'END_TO_END_HIRING',
      companyId: input.companyId,
      candidateId: input.candidateProfileId,
      correlationId: input.correlationId,
      initiatedBy: input.initiatedBy,
      initialStep: 'JD_GENERATION',
      checkpointState: { phase: 'INIT' },
    });

    const executionContext = {
      tenantContext: input.tenantContext,
      correlationId: input.correlationId,
      executionId: `exec-jd-${Date.now()}`,
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
          taskInput: { jobTitle: input.jobTitle },
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
          context: { ...executionContext, agentId: 'candidate-matchmaker', executionId: `exec-match-${Date.now()}` },
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
          taskInput: { candidateProfileId: input.candidateProfileId },
          context: { ...executionContext, agentId: 'resume-evaluator', executionId: `exec-resume-${Date.now()}` },
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
          context: { ...executionContext, agentId: 'mock-interview-copilot', executionId: `exec-interview-${Date.now()}` },
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
          taskInput: { candidateProfileId: input.candidateProfileId },
          context: { ...executionContext, agentId: 'communication-coach', executionId: `exec-comm-${Date.now()}` },
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
          taskInput: { candidateProfileId: input.candidateProfileId },
          context: { ...executionContext, agentId: 'security-judge', executionId: `exec-sec-${Date.now()}` },
          companyId: input.companyId,
          estimatedSpendMinor: BigInt(1000),
        });
      }
    );

    // Publish Pipeline Completed System Event via Outbox
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
    });

    // Record Telemetry Trace
    await TraceRecorder.record({
      traceId: `trace-pipeline-${workflow.id}`,
      correlationId: input.correlationId,
      companyId: input.companyId,
      candidateId: input.candidateProfileId,
      workflowId: workflow.id,
      status: 'COMPLETED',
      promptTokens: 1500,
      completionTokens: 800,
      costMinorUnits: BigInt(24000),
      latencyMs: 1200,
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
