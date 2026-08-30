import { createTenantContext, TenantContext } from '../security/TenantContext';
import { RbacGuard } from '../security/RbacGuard';
import { KillSwitchManager } from '../security/KillSwitchManager';
import { BudgetManager } from '../governance/BudgetManager';
import { ExecutionLoop } from '../agents/ExecutionLoop';
import { OutboxPublisher } from '../events/Outbox';
import { Role, KillSwitchType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface DispatchJobCreationParams {
  userId: string;
  userRole: Role;
  companyId: string;
  jobTitle: string;
  salaryRange: string;
  location: string;
  type: string;
  matchingConfig?: {
    weightExperience: number;
    weightEducation: number;
    weightSkills: number;
    autoArchiveScore: number;
    autoInterviewLimit: number;
    proctoringLevel?: string;
  };
}

export interface DispatchApplicationParams {
  userId: string;
  jobId: string;
  candidateProfileId: string;
  companyId: string;
}

export class DuplicateApplicationError extends Error {
  constructor() {
    super("You have already applied to this job.");
    this.name = "DuplicateApplicationError";
  }
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

    const correlationId = crypto.randomUUID();
    const executionId = crypto.randomUUID();

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
        matchingConfig: params.matchingConfig,
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

    return { job, generatedJd };
  }

  /**
   * 7.1 Flow 2: Candidate Applies -> Matchmaker + Resume Evaluator Agent -> Business State -> Outbox -> Trace
   */
  static async handleApplicationSubmission(params: DispatchApplicationParams): Promise<{
    application: { id: string; jobId: string; candidateProfileId: string; status: string; matchScore: number; aiSummary: string | null };
    evaluation: "COMPLETED" | "PENDING";
  }> {
    const tenantContext = createTenantContext(params.companyId, params.userId, Role.CANDIDATE);
    await this.killSwitchManager.assertNotKilled(KillSwitchType.AGENT, 'resume-evaluator');

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: params.candidateProfileId },
      select: { id: true, userId: true },
    });
    if (!candidate || candidate.userId !== params.userId) {
      throw new Error("Candidate profile ownership could not be verified.");
    }

    const job = await prisma.jobListing.findUnique({
      where: { id: params.jobId },
      select: { id: true, companyId: true, status: true },
    });
    if (!job || job.companyId !== params.companyId || job.status !== "ACTIVE") {
      throw new Error("Job is unavailable for application.");
    }

    const correlationId = crypto.randomUUID();
    let application: { id: string; jobId: string; candidateProfileId: string; status: string; matchScore: number; aiSummary: string | null };
    try {
      application = await prisma.$transaction(async (tx) => {
        const created = await tx.application.create({
          data: {
            jobId: job.id,
            candidateProfileId: candidate.id,
            status: 'APPLIED',
            matchScore: 0,
            aiSummary: null,
          },
          select: { id: true, jobId: true, candidateProfileId: true, status: true, matchScore: true, aiSummary: true },
        });

        await OutboxPublisher.publish({
          eventType: 'APPLICATION_SUBMITTED',
          payload: { applicationId: created.id, jobId: created.jobId },
          correlationId,
          companyId: job.companyId,
          idempotencyKey: `application-submitted:${created.id}`,
        }, tx);
        return created;
      });
    } catch (error: any) {
      if (error?.code === "P2002") throw new DuplicateApplicationError();
      throw error;
    }

    // The durable business record and its outbox event are committed before an
    // external model call.  A disconnected response cannot create a second
    // application or charge the candidate twice on retry.
    const executionId = `application-evaluation:${application.id}`;

    try {
      const evalResult = await ExecutionLoop.runTask({
        agentId: 'resume-evaluator',
        taskInput: {
          candidateProfileId: candidate.id,
          jobId: job.id,
          authorizationContext: 'APPLICATION_SUBMISSION',
        },
        context: { tenantContext, correlationId, executionId, agentId: 'resume-evaluator' },
        companyId: job.companyId,
        estimatedSpendMinor: BigInt(5000),
      });

      const matchScore = evalResult.candidateScore;
      const summary = evalResult.summary;
      if (typeof matchScore !== "number" || !Number.isInteger(matchScore) || matchScore < 0 || matchScore > 100 || typeof summary !== "string") {
        throw new Error("Resume evaluation returned an invalid result.");
      }

      application = await prisma.application.update({
        where: { id: application.id },
        data: { matchScore, aiSummary: summary },
        select: { id: true, jobId: true, candidateProfileId: true, status: true, matchScore: true, aiSummary: true },
      });
      return { application, evaluation: "COMPLETED" };
    } catch {
      // The application remains durably submitted and the outbox event allows
      // controlled retry/operations follow-up.  Do not invent an AI score or
      // turn a completed user action into a duplicate application.
      return { application, evaluation: "PENDING" };
    }
  }
}
