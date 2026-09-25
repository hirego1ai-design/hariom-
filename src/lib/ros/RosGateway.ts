import { createTenantContext, TenantContext } from '../security/TenantContext';
import { RbacGuard } from '../security/RbacGuard';
import { KillSwitchManager } from '../security/KillSwitchManager';
import { BudgetManager } from '../governance/BudgetManager';
import { ExecutionLoop } from '../agents/ExecutionLoop';
import { OutboxPublisher } from '../events/Outbox';
import { ApplicationGateType, ApplicationGateStatus, Role, KillSwitchType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { computeMatchScore } from '@/lib/matching/JobMatchingEngine';

export interface DispatchJobCreationParams {
  userId: string;
  userRole: Role;
  companyId: string;
  jobTitle: string;
  salaryRange: string;
  location: string;
  type: string;
  department?: string;
  requirements?: string[];
  screeningQuestions?: string[];
  aiFocusAreas?: string;
  skillRequirements?: Array<{ name: string; priority: 'required' | 'preferred' }>;
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
    RbacGuard.assertRole(tenantContext, [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN]);
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
        department: params.department,
        requirements: params.requirements?.length
          ? params.requirements
          : ((generatedJd.targetKeywords as string[]) || []),
        screeningQuestions: params.screeningQuestions || [],
        aiFocusAreas: params.aiFocusAreas,
        skillRequirements: params.skillRequirements,
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

  private static async authorizedApplicationInputs(params: DispatchApplicationParams) {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: params.candidateProfileId },
      include: {
        candidateSkills: true,
      },
    });
    if (!candidate || candidate.userId !== params.userId) {
      throw new Error("Candidate profile ownership could not be verified.");
    }

    const job = await prisma.jobListing.findUnique({
      where: { id: params.jobId },
    });
    if (!job || job.companyId !== params.companyId || job.status !== "ACTIVE") {
      throw new Error("Job is unavailable for application.");
    }
    return { candidate, job };
  }

  private static deterministicApplicationMatch(candidate: any, job: any) {
    const match = computeMatchScore(candidate, job);
    return {
      matchScore: match.matchScore,
      summary: `Rules-based match score: ${match.matchScore}%. Matched ${match.matchingSkills.length} requirement(s); verified evidence coverage ${match.verificationCoverage}%.`,
    };
  }

  /**
   * Candidate application intent is stored before universal validation. The
   * explicit gate prevents this state from being confused with a normal
   * employer pipeline ASSESSMENT stage.
   */
  static async handleApplicationValidationIntent(params: DispatchApplicationParams): Promise<{
    application: { id: string; jobId: string; candidateProfileId: string; status: string; matchScore: number; aiSummary: string | null };
    gate: { id: string; status: string; assessmentId: string | null };
  }> {
    const { candidate, job } = await this.authorizedApplicationInputs(params);
    const correlationId = crypto.randomUUID();

    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.application.findUnique({
          where: {
            candidateProfileId_jobId: {
              candidateProfileId: candidate.id,
              jobId: job.id,
            },
          },
          include: {
            gates: {
              where: { type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION },
              take: 1,
            },
          },
        });

        if (existing) {
          const existingGate = existing.gates[0];
          if (
            existingGate &&
            [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS].includes(existingGate.status)
          ) {
            return {
              application: {
                id: existing.id,
                jobId: existing.jobId,
                candidateProfileId: existing.candidateProfileId,
                status: existing.status,
                matchScore: existing.matchScore,
                aiSummary: existing.aiSummary,
              },
              gate: {
                id: existingGate.id,
                status: existingGate.status,
                assessmentId: existingGate.assessmentId,
              },
            };
          }
          throw new DuplicateApplicationError();
        }

        const application = await tx.application.create({
          data: {
            jobId: job.id,
            candidateProfileId: candidate.id,
            status: "ASSESSMENT",
            matchScore: 0,
            aiSummary: null,
          },
          select: {
            id: true,
            jobId: true,
            candidateProfileId: true,
            status: true,
            matchScore: true,
            aiSummary: true,
          },
        });

        const gate = await tx.applicationGate.create({
          data: {
            applicationId: application.id,
            type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION,
            status: ApplicationGateStatus.REQUIRED,
          },
          select: { id: true, status: true, assessmentId: true },
        });

        await OutboxPublisher.publish({
          eventType: "APPLICATION_VALIDATION_REQUIRED",
          payload: { applicationId: application.id, jobId: application.jobId, gateId: gate.id },
          correlationId,
          companyId: job.companyId,
          idempotencyKey: `application-validation-required:${application.id}`,
        }, tx);

        return { application, gate };
      });
    } catch (error: any) {
      if (error?.code === "P2002") throw new DuplicateApplicationError();
      throw error;
    }
  }

  static async attachUniversalAssessment(params: {
    applicationId: string;
    candidateProfileId: string;
    assessmentId: string;
  }) {
    const updated = await prisma.applicationGate.updateMany({
      where: {
        applicationId: params.applicationId,
        type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION,
        status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] },
        application: { candidateProfileId: params.candidateProfileId },
      },
      data: {
        assessmentId: params.assessmentId,
        status: ApplicationGateStatus.IN_PROGRESS,
      },
    });
    if (updated.count !== 1) {
      throw new Error("Universal validation application gate could not be updated.");
    }
  }

  /**
   * Complete only gates bound to the assessment that was actually submitted.
   * Matching is deterministic and server-side; no LLM is allowed to author the
   * application match percentage.
   */
  static async releaseUniversalValidationApplications(params: {
    userId: string;
    candidateProfileId: string;
    assessmentId: string;
  }): Promise<string[]> {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: params.candidateProfileId },
      include: { candidateSkills: true },
    });
    if (!candidate || candidate.userId !== params.userId) {
      throw new Error("Candidate profile ownership could not be verified.");
    }

    const gates = await prisma.applicationGate.findMany({
      where: {
        type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION,
        status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] },
        assessmentId: params.assessmentId,
        application: { candidateProfileId: candidate.id },
      },
      include: {
        application: { include: { job: true } },
      },
    });

    const released: string[] = [];
    for (const gate of gates) {
      const application = gate.application;
      if (application.job.status !== "ACTIVE") continue;
      const match = this.deterministicApplicationMatch(candidate, application.job);
      const correlationId = crypto.randomUUID();

      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "ApplicationGate" WHERE id = ${gate.id} FOR UPDATE`;
        const currentGate = await tx.applicationGate.findUnique({ where: { id: gate.id } });
        if (
          !currentGate ||
          ![ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS].includes(currentGate.status)
        ) {
          return;
        }

        await tx.applicationGate.update({
          where: { id: gate.id },
          data: {
            status: ApplicationGateStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        await tx.application.update({
          where: { id: application.id },
          data: {
            status: "APPLIED",
            matchScore: match.matchScore,
            aiSummary: match.summary,
          },
        });
        await OutboxPublisher.publish({
          eventType: "APPLICATION_SUBMITTED",
          payload: { applicationId: application.id, jobId: application.jobId },
          correlationId,
          companyId: application.job.companyId,
          idempotencyKey: `application-submitted:${application.id}`,
        }, tx);
        released.push(application.id);
      });
    }

    return released;
  }

  /**
   * Candidate applies after universal validation is already current.
   * The match score is deterministic. LLMs may explain evidence elsewhere but
   * cannot modify this authoritative application percentage.
   */
  static async handleApplicationSubmission(params: DispatchApplicationParams): Promise<{
    application: { id: string; jobId: string; candidateProfileId: string; status: string; matchScore: number; aiSummary: string | null };
    evaluation: "COMPLETED";
  }> {
    const { candidate, job } = await this.authorizedApplicationInputs(params);
    const match = this.deterministicApplicationMatch(candidate, job);
    const correlationId = crypto.randomUUID();

    try {
      const application = await prisma.$transaction(async (tx) => {
        const created = await tx.application.create({
          data: {
            jobId: job.id,
            candidateProfileId: candidate.id,
            status: "APPLIED",
            matchScore: match.matchScore,
            aiSummary: match.summary,
          },
          select: {
            id: true,
            jobId: true,
            candidateProfileId: true,
            status: true,
            matchScore: true,
            aiSummary: true,
          },
        });

        await OutboxPublisher.publish({
          eventType: "APPLICATION_SUBMITTED",
          payload: { applicationId: created.id, jobId: created.jobId },
          correlationId,
          companyId: job.companyId,
          idempotencyKey: `application-submitted:${created.id}`,
        }, tx);
        return created;
      });
      return { application, evaluation: "COMPLETED" };
    } catch (error: any) {
      if (error?.code === "P2002") throw new DuplicateApplicationError();
      throw error;
    }
  }

}
