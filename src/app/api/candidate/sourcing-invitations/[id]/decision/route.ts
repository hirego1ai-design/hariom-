import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import {
  assignUniversalAssessment,
  getCandidateTargetRole,
  getUniversalValidationState,
} from "@/lib/universalSkillValidation";
import {
  DuplicateApplicationError,
  RosGateway,
} from "@/lib/ros/RosGateway";
import { dispatchApplicationReceivedConfirmation } from "@/lib/communications/applicationNotifications";

const schema = z
  .object({ decision: z.enum(["ACCEPT", "DECLINE"]) })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await enforceRateLimit(request, "candidate_sourcing_decision", 20);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Candidate access required.", 403);
    }

    const { id } = await params;
    const body = await readValidatedJson(request, schema);

    const relationship = await prisma.$transaction(async (tx) => {
      const current = await tx.candidateSourcingRelationship.findFirst({
        where: { id, candidateProfile: { userId: session.id } },
        include: {
          job: {
            select: {
              id: true,
              status: true,
              companyId: true,
              title: true,
            },
          },
          candidateProfile: {
            select: {
              id: true,
              userId: true,
              preferences: true,
            },
          },
        },
      });
      if (!current) throw new ApiError("Invitation not found.", 404);

      const target = body.decision === "ACCEPT" ? "ACCEPTED" : "DECLINED";
      if (current.status === target) {
        return { ...current, idempotent: true };
      }
      if (current.status !== "INVITED") {
        throw new ApiError("Invitation decision has already been recorded.", 409);
      }
      if (target === "ACCEPTED" && current.job.status !== "ACTIVE") {
        throw new ApiError("This job is no longer accepting applications.", 409);
      }

      const now = new Date();
      const changed = await tx.candidateSourcingRelationship.updateMany({
        where: { id, status: "INVITED" },
        data: {
          status: target,
          ...(target === "ACCEPTED"
            ? { acceptedAt: now }
            : { declinedAt: now }),
        },
      });
      if (changed.count !== 1) {
        throw new ApiError("Invitation state changed. Refresh and try again.", 409);
      }
      return { ...current, status: target, idempotent: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (relationship.status === "DECLINED") {
      return NextResponse.json({
        success: true,
        relationshipId: relationship.id,
        status: "DECLINED",
        application: null,
        idempotent: relationship.idempotent,
      });
    }

    const candidateProfileId = relationship.candidateProfile.id;
    const jobId = relationship.job.id;
    const companyId = relationship.job.companyId;
    const targetRole =
      getCandidateTargetRole(relationship.candidateProfile.preferences) ||
      relationship.job.title;
    const validationState = await getUniversalValidationState(
      candidateProfileId,
      targetRole,
    );

    if (!validationState.completedAndCurrent) {
      try {
        const pending = await RosGateway.handleApplicationValidationIntent({
          userId: session.id,
          jobId,
          candidateProfileId,
          companyId,
        });
        const assignment = await assignUniversalAssessment(
          candidateProfileId,
          targetRole,
        );
        await RosGateway.attachUniversalAssessment({
          applicationId: pending.application.id,
          candidateProfileId,
          assessmentId: assignment.assessment.id,
        });

        return NextResponse.json(
          {
            success: true,
            relationshipId: relationship.id,
            status: "ACCEPTED",
            idempotent: relationship.idempotent,
            application: pending.application,
            assessmentRequired: true,
            assessmentType: "UNIVERSAL_SKILL_VALIDATION",
            assessmentId: assignment.assessment.id,
            noticeUrl: `/assessment/skill-validation/notice?assessmentId=${encodeURIComponent(assignment.assessment.id)}&applicationId=${encodeURIComponent(pending.application.id)}`,
            message:
              "Invitation accepted. Complete HireGo Skill Validation to continue this application.",
          },
          { status: 202 },
        );
      } catch (error) {
        if (
          error instanceof DuplicateApplicationError ||
          (error &&
            typeof error === "object" &&
            "code" in error &&
            (error as { code?: string }).code === "P2002")
        ) {
          const existing = await prisma.application.findUnique({
            where: {
              candidateProfileId_jobId: {
                candidateProfileId,
                jobId,
              },
            },
            include: {
              gates: {
                select: {
                  type: true,
                  status: true,
                  assessmentId: true,
                },
              },
            },
          });
          if (existing) {
            return NextResponse.json({
              success: true,
              relationshipId: relationship.id,
              status: "ACCEPTED",
              idempotent: true,
              application: existing,
              message:
                "Invitation is already connected to your existing application.",
            });
          }
        }
        throw error;
      }
    }

    try {
      const submission = await RosGateway.handleApplicationSubmission({
        userId: session.id,
        jobId,
        candidateProfileId,
        companyId,
      });

      await dispatchApplicationReceivedConfirmation({
        applicationId: submission.application.id,
        userId: session.id,
        jobId,
      });

      return NextResponse.json(
        {
          success: true,
          relationshipId: relationship.id,
          status: "ACCEPTED",
          idempotent: relationship.idempotent,
          application: submission.application,
          screening: submission.screening,
          assessmentRequired: Boolean(submission.jobSpecificAssessmentId),
          assessmentType: submission.jobSpecificAssessmentId
            ? "JOB_SPECIFIC_ASSESSMENT"
            : null,
          assessmentId: submission.jobSpecificAssessmentId,
          assessmentUrl: submission.jobSpecificAssessmentId
            ? `/assessment/mcq/active?id=${encodeURIComponent(submission.jobSpecificAssessmentId)}`
            : null,
          message: submission.jobSpecificAssessmentId
            ? "Invitation accepted. Complete the additional job-specific assessment."
            : "Invitation accepted and application entered evidence-first screening.",
        },
        { status: 201 },
      );
    } catch (error) {
      if (
        error instanceof DuplicateApplicationError ||
        (error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code?: string }).code === "P2002")
      ) {
        const existing = await prisma.application.findUnique({
          where: {
            candidateProfileId_jobId: {
              candidateProfileId,
              jobId,
            },
          },
          include: {
            gates: {
              select: {
                type: true,
                status: true,
                assessmentId: true,
              },
            },
          },
        });
        if (existing) {
          return NextResponse.json({
            success: true,
            relationshipId: relationship.id,
            status: "ACCEPTED",
            idempotent: true,
            application: existing,
            message:
              "Invitation is already connected to your existing application.",
          });
        }
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
