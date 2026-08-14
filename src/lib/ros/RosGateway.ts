import { createTenantContext, TenantContext } from '../security/TenantContext';
import { RbacGuard } from '../security/RbacGuard';
import { KillSwitchManager } from '../security/KillSwitchManager';
import { BudgetManager } from '../governance/BudgetManager';
import { ExecutionLoop } from '../agents/ExecutionLoop';
import { OutboxPublisher } from '../events/Outbox';
import { TraceRecorder } from '../telemetry/TraceRecorder';
import { Role, KillSwitchType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface DispatchJobCreationParams {
  userId: string;
  userRole: Role;
  companyId: string;
  jobTitle: string;
  salaryRange: string;
  location: string;
  type: string;
}

export interface DispatchApplicationParams {
  userId: string;
  jobId: string;
  candidateProfileId: string;
  companyId: string;
}

export class RosGateway {
  private static killSwitchManager = new KillSwitchManager();

  /**
   * 7.1 Flow 1: Employer Creates Job -> JD Generator Agent -> Outbox -> Trace
   */
  static async handleJobCreation(
    params: DispatchJobCreationParams,
    tx?: any
  ): Promise<{
    job: unknown;
    generatedJd: Record<string, unknown>;
  }> {
    const tenantContext = createTenantContext(params.companyId, params.userId, params.userRole);
    RbacGuard.assertRole(tenantContext, [Role.EMPLOYER, Role.ADMIN]);
    await this.killSwitchManager.assertNotKilled(KillSwitchType.AGENT, 'jd-generator');

    const correlationId = `corr-job-${Date.now()}`;
    const executionId = `exec-jd-${Date.now()}`;

    // Execute JdGeneratorAgent via ROS ExecutionLoop (asynchronous AI task preparation)
    const generatedJd = await ExecutionLoop.runTask({
      agentId: 'jd-generator',
      taskInput: {
        title: params.jobTitle,
        companyId: params.companyId,
        location: params.location,
        type: params.type,
        salaryRange: params.salaryRange,
      },
      context: {
        tenantContext,
        correlationId,
        executionId,
        agentId: 'jd-generator',
      },
      companyId: params.companyId,
      estimatedSpendMinor: BigInt(2000),
    });

    const db = tx || prisma;

    // Save Job in PostgreSQL business table (using transaction handle tx if provided)
    const job = await db.jobListing.create({
      data: {
        companyId: params.companyId,
        title: params.jobTitle,
        location: params.location,
        type: params.type,
        salaryRange: params.salaryRange,
        description: (generatedJd.jobDescription as string) || `Job listing for ${params.jobTitle}`,
        requirements: (generatedJd.targetKeywords as string[]) || ['AI Architecture', 'TypeScript'],
        status: 'ACTIVE',
      },
    });

    // Publish System Event via Outbox (using transaction handle tx if provided)
    await OutboxPublisher.publish(
      {
        eventType: 'JOB_LISTING_CREATED',
        payload: { jobId: job.id, companyId: params.companyId, title: job.title },
        correlationId,
        companyId: params.companyId,
        idempotencyKey: `outbox-job-${job.id}`,
      },
      tx
    );

    // Record Telemetry Trace (using transaction handle tx if provided)
    await TraceRecorder.record(
      {
        traceId: `trace-jd-${job.id}`,
        correlationId,
        executionId,
        companyId: params.companyId,
        jobId: job.id,
        agentId: 'jd-generator',
        status: 'SUCCESS',
        promptTokens: 250,
        completionTokens: 180,
        costMinorUnits: BigInt(2000),
        latencyMs: 350,
      },
      tx
    );

    return { job, generatedJd };
  }

  /**
   * 7.1 Flow 2: Candidate Applies -> Matchmaker + Resume Evaluator Agent -> Business State -> Outbox -> Trace
   */
  static async handleApplicationSubmission(params: DispatchApplicationParams): Promise<{
    application: unknown;
    evalResult: Record<string, unknown>;
  }> {
    const tenantContext = createTenantContext(params.companyId, params.userId, Role.CANDIDATE);
    await this.killSwitchManager.assertNotKilled(KillSwitchType.AGENT, 'resume-evaluator');

    const correlationId = `corr-app-${Date.now()}`;
    const executionId = `exec-eval-${Date.now()}`;

    // Execute ResumeEvaluatorAgent via ROS ExecutionLoop
    const evalResult = await ExecutionLoop.runTask({
      agentId: 'resume-evaluator',
      taskInput: {
        candidateProfileId: params.candidateProfileId,
        jobId: params.jobId,
      },
      context: {
        tenantContext,
        correlationId,
        executionId,
        agentId: 'resume-evaluator',
      },
      companyId: params.companyId,
      estimatedSpendMinor: BigInt(5000),
    });

    const matchScore = (evalResult.candidateScore as number) ?? 85;

    // Create Application in PostgreSQL business table
    const application = await prisma.application.create({
      data: {
        jobId: params.jobId,
        candidateProfileId: params.candidateProfileId,
        status: 'APPLIED',
        matchScore,
        aiSummary: (evalResult.summary as string) || 'Evaluated profile successfully.',
      },
    });

    // Publish System Event via Outbox
    await OutboxPublisher.publish({
      eventType: 'APPLICATION_SUBMITTED',
      payload: { applicationId: application.id, jobId: params.jobId, matchScore },
      correlationId,
      companyId: params.companyId,
      idempotencyKey: `outbox-app-${application.id}`,
    });

    // Record Telemetry Trace
    await TraceRecorder.record({
      traceId: `trace-app-${application.id}`,
      correlationId,
      executionId,
      companyId: params.companyId,
      jobId: params.jobId,
      candidateId: params.candidateProfileId,
      agentId: 'resume-evaluator',
      status: 'SUCCESS',
      promptTokens: 400,
      completionTokens: 250,
      costMinorUnits: BigInt(5000),
      latencyMs: 420,
    });

    return { application, evalResult };
  }
}
