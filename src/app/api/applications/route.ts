import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import { dispatchApplicationReceivedConfirmation } from "@/lib/communications/applicationNotifications";
import { assignUniversalAssessment, getCandidateTargetRole, getUniversalValidationState } from "@/lib/universalSkillValidation";
import { ApplicationGateStatus, ApplicationGateType } from "@prisma/client";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const applicationSchema = z.object({
  jobId: z.string().uuid(),
  answers: z.object({
    noticePeriod: z.string().trim().max(200).optional(),
    experienceYears: z.string().trim().max(20).optional(),
    whyJoin: z.string().trim().max(5_000).optional(),
  }).strict().optional(),
}).strict();

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "candidate_applications_get", 60, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "CANDIDATE") {
      return jsonError("Candidate access required", 403);
    }

    const candidate = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
    if (!candidate) return NextResponse.json({ success: true, applications: [] });
    const applications = await prisma.application.findMany({
          where: { candidateProfileId: candidate.id },
          include: {
            job: {
              include: {
                company: true,
              },
            },
            interviews: true,
            gates: {
              select: { id: true, type: true, status: true, assessmentId: true, completedAt: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "candidate_application_submit", 12, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") return jsonError("Candidate access required", 403);

    const { jobId } = await readValidatedJson(req, applicationSchema);
    const [job, candidate] = await Promise.all([
      prisma.jobListing.findUnique({ where: { id: jobId } }),
      prisma.candidateProfile.findUnique({ where: { userId: session.id } }),
    ]);

    if (!job) return jsonError("Job listing not found", 404);
    if (job.status !== "ACTIVE") return jsonError("This job is no longer accepting applications", 409);
    if (!candidate) return jsonError("Complete your candidate profile before applying.", 409);

    const targetRole = getCandidateTargetRole(candidate.preferences) || job.title;
    const { RosGateway } = await import("@/lib/ros/RosGateway");

    const existingApplication = await prisma.application.findUnique({
      where: {
        candidateProfileId_jobId: {
          candidateProfileId: candidate.id,
          jobId,
        },
      },
      include: {
        gates: {
          where: { type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION },
          take: 1,
        },
      },
    });

    const validationState = await getUniversalValidationState(candidate.id, targetRole);

    // A previous Apply click may already have created a durable validation gate.
    // Resume that exact intent rather than creating a duplicate application.
    if (existingApplication) {
      const gate = existingApplication.gates[0];
      if (
        !gate ||
        ![ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS].includes(gate.status)
      ) {
        return jsonError("You have already applied to this job.", 409);
      }

      if (
        validationState.completedAndCurrent &&
        validationState.readiness?.assessmentId
      ) {
        if (gate.assessmentId !== validationState.readiness.assessmentId) {
          await RosGateway.attachUniversalAssessment({
            applicationId: existingApplication.id,
            candidateProfileId: candidate.id,
            assessmentId: validationState.readiness.assessmentId,
          });
        }
        const released = await RosGateway.releaseUniversalValidationApplications({
          userId: session.id,
          candidateProfileId: candidate.id,
          assessmentId: validationState.readiness.assessmentId,
        });
        if (released.includes(existingApplication.id)) {
          const application = await prisma.application.findUniqueOrThrow({
            where: { id: existingApplication.id },
          });
          await dispatchApplicationReceivedConfirmation({
            applicationId: application.id,
            userId: session.id,
            jobId: application.jobId,
          });
          return NextResponse.json({
            success: true,
            application,
            evaluation: "COMPLETED",
            message: "Application submitted successfully",
          }, { status: 201 });
        }
      }

      try {
        const assignment = await assignUniversalAssessment(candidate.id, targetRole);
        await RosGateway.attachUniversalAssessment({
          applicationId: existingApplication.id,
          candidateProfileId: candidate.id,
          assessmentId: assignment.assessment.id,
        });
        return NextResponse.json({
          success: true,
          application: existingApplication,
          assessmentRequired: true,
          assessmentType: "UNIVERSAL_SKILL_VALIDATION",
          assessmentId: assignment.assessment.id,
          noticeUrl: `/assessment/skill-validation/notice?assessmentId=${encodeURIComponent(assignment.assessment.id)}&applicationId=${encodeURIComponent(existingApplication.id)}`,
          message: "Complete HireGo Skill Validation to finish this application.",
        }, { status: 202 });
      } catch {
        return NextResponse.json({
          success: false,
          applicationPendingValidation: true,
          applicationId: existingApplication.id,
          error: "Your application is saved, but HireGo Skill Validation is temporarily unavailable. Please retry shortly.",
        }, { status: 503 });
      }
    }

    if (!validationState.completedAndCurrent) {
      const pending = await RosGateway.handleApplicationValidationIntent({
        userId: session.id,
        jobId,
        candidateProfileId: candidate.id,
        companyId: job.companyId,
      });

      try {
        const assignment = await assignUniversalAssessment(candidate.id, targetRole);
        await RosGateway.attachUniversalAssessment({
          applicationId: pending.application.id,
          candidateProfileId: candidate.id,
          assessmentId: assignment.assessment.id,
        });

        return NextResponse.json({
          success: true,
          application: pending.application,
          assessmentRequired: true,
          assessmentType: "UNIVERSAL_SKILL_VALIDATION",
          assessmentId: assignment.assessment.id,
          noticeUrl: `/assessment/skill-validation/notice?assessmentId=${encodeURIComponent(assignment.assessment.id)}&applicationId=${encodeURIComponent(pending.application.id)}`,
          message: "Complete HireGo Skill Validation to finish this application.",
        }, { status: 202 });
      } catch {
        return NextResponse.json({
          success: false,
          applicationPendingValidation: true,
          applicationId: pending.application.id,
          error: "Your application is saved, but HireGo Skill Validation is temporarily unavailable. Please retry shortly.",
        }, { status: 503 });
      }
    }

    try {
      const submission = await RosGateway.handleApplicationSubmission({
        userId: session.id,
        jobId,
        candidateProfileId: candidate.id,
        companyId: job.companyId,
      });

      await dispatchApplicationReceivedConfirmation({
        applicationId: submission.application.id,
        userId: session.id,
        jobId,
      });

      return NextResponse.json({
        success: true,
        application: submission.application,
        evaluation: submission.evaluation,
        message: "Application submitted successfully",
      }, { status: 201 });
    } catch (error: any) {
      if (error?.code === "P2002" || error?.name === "DuplicateApplicationError") {
        return jsonError("You have already applied to this job.", 409);
      }
      if (error instanceof ApiError) throw error;
      return jsonError("Application could not be submitted. Please try again.", 503);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

const withdrawSchema = z.object({
  applicationId: z.string().uuid(),
}).strict();

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") return jsonError("Candidate access required", 403);
    await enforceRateLimit(req, "candidate_application_withdraw", 12, 60_000);
    const { applicationId } = await readValidatedJson(req, withdrawSchema);
    const candidate = await prisma.candidateProfile.findUnique({ where: { userId: session.id }, select: { id: true } });
    if (!candidate) return jsonError("Candidate profile not found", 404);

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${applicationId} FOR UPDATE`;
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        include: { pphPlacement: { select: { id: true, status: true, invoiceId: true } } },
      });
      if (!application || application.candidateProfileId !== candidate.id) throw new ApiError("Application not found", 404);
      if (application.status === "WITHDRAWN") return { duplicate: true };
      const liveRound = await tx.interviewRoundProgress.findFirst({
        where: { applicationId, status: "LIVE" },
        select: { id: true },
      });
      if (liveRound) {
        throw new ApiError("An interview is currently live. End the active interview before withdrawing this application.", 409);
      }
      if (application.status === "HIRED" || application.pphPlacement) {
        throw new ApiError("This application has entered the joining or placement workflow and cannot be withdrawn here. Contact HireGo support for reconciliation.", 409);
      }
      await tx.application.update({ where: { id: applicationId }, data: { status: "WITHDRAWN" } });
      await tx.interview.updateMany({
        where: { applicationId, status: { in: ["SCHEDULED", "RESCHEDULED"] } },
        data: { status: "CANCELLED" },
      });
      await tx.interviewRoundProgress.updateMany({
        where: { applicationId, status: "SCHEDULED" },
        data: { status: "CANCELLED" },
      });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "APPLICATION_WITHDRAWN",
          resource: `Application:${applicationId}`,
          details: "Candidate withdrew their own application.",
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      return { duplicate: false };
    });
    return NextResponse.json({ success: true, applicationId, status: "WITHDRAWN", duplicate: result.duplicate });
  } catch (error) {
    return handleApiError(error);
  }
}
