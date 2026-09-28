import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireEmployerOrAdminSession,
  getSessionCompany,
} from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { requireActiveCompanySubscription } from "@/lib/subscriptionAccess";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const sourcingActionSchema = z.object({
  candidateProfileId: z.string().uuid(),
  action: z.enum(["SHORTLIST", "INVITE"]),
}).strict();

const AVAILABILITY_WINDOW_DAYS = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, "employer_sourcing_action", 30, 60_000);

    const { id: jobId } = await params;
    const body = await readValidatedJson(req, sourcingActionSchema, 8 * 1024);

    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        companyId: true,
        status: true,
        requiresJobReady: true,
        jobReadyRoleTitle: true,
        jobReadySeniority: true,
      },
    });
    if (!job || job.status !== "ACTIVE") {
      throw new ApiError("Active job not found.", 404);
    }

    let companyId = job.companyId;
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== job.companyId) {
        throw new ApiError("Job access denied.", 403);
      }
      companyId = company.id;
    }

    const cutoff = new Date(
      Date.now() - AVAILABILITY_WINDOW_DAYS * 86_400_000,
    );
    const requestedStatus =
      body.action === "INVITE" ? "INVITED" : "SHORTLISTED";
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Serialize sourcing actions for the same candidate. This prevents
      // concurrent shortlist/invite requests from racing the unique
      // job+candidate relationship or overwriting a terminal transition.
      await tx.$queryRaw`
        SELECT "id"
        FROM "CandidateProfile"
        WHERE "id" = ${body.candidateProfileId}
        FOR UPDATE
      `;

      const lockedJob = await tx.jobListing.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          companyId: true,
          status: true,
          requiresJobReady: true,
          jobReadyRoleTitle: true,
          jobReadySeniority: true,
        },
      });
      if (
        !lockedJob ||
        lockedJob.status !== "ACTIVE" ||
        lockedJob.companyId !== companyId
      ) {
        throw new ApiError("The job is no longer eligible for sourcing.", 409);
      }

      if (session.role !== "ADMIN") {
        await requireActiveCompanySubscription(
          tx,
          companyId,
          "An active subscription is required to shortlist or invite sourced candidates.",
        );
      }

      const candidate = await tx.candidateProfile.findFirst({
        where: {
          id: body.candidateProfileId,
          availabilityStatus: "ACTIVE_CONFIRMED",
          lastAvailabilityConfirmedAt: { gte: cutoff },
          ...(lockedJob.requiresJobReady &&
          lockedJob.jobReadyRoleTitle &&
          lockedJob.jobReadySeniority
            ? {
                readinessRecords: {
                  some: {
                    roleTitle: lockedJob.jobReadyRoleTitle,
                    seniority: lockedJob.jobReadySeniority,
                    status: "JOB_READY",
                    OR: [
                      { validUntil: null },
                      { validUntil: { gt: now } },
                    ],
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
          userId: true,
          user: { select: { name: true } },
          applications: {
            where: { jobId },
            select: { id: true, status: true },
            take: 1,
          },
        },
      });
      if (!candidate) {
        throw new ApiError(
          "Candidate is no longer eligible for proactive sourcing.",
          409,
        );
      }

      // An existing application is authoritative organic/pipeline evidence.
      // Never create a sourcing relationship afterwards because that would
      // rewrite acquisition provenance.
      if (candidate.applications.length > 0) {
        throw new ApiError(
          "This candidate already has an application for the job. Use the hiring pipeline instead of proactive sourcing.",
          409,
        );
      }

      const existing = await tx.candidateSourcingRelationship.findUnique({
        where: {
          jobId_candidateProfileId: {
            jobId,
            candidateProfileId: candidate.id,
          },
        },
      });

      if (existing?.status === "ACCEPTED" || existing?.status === "DECLINED") {
        throw new ApiError(
          `Candidate has already ${existing.status.toLowerCase()} this invitation.`,
          409,
        );
      }

      if (
        (existing?.status === "INVITED" && body.action === "INVITE") ||
        (existing?.status === "INVITED" && body.action === "SHORTLIST") ||
        (existing?.status === "SHORTLISTED" && body.action === "SHORTLIST")
      ) {
        return {
          relationship: existing,
          candidate: { id: candidate.id, name: candidate.user.name },
          idempotent: true,
        };
      }

      const relationship = await tx.candidateSourcingRelationship.upsert({
        where: {
          jobId_candidateProfileId: {
            jobId,
            candidateProfileId: candidate.id,
          },
        },
        create: {
          jobId,
          candidateProfileId: candidate.id,
          companyId,
          sourcedById: session.id,
          status: requestedStatus,
          ...(requestedStatus === "INVITED"
            ? { invitedAt: now }
            : { shortlistedAt: now }),
        },
        update: {
          status: requestedStatus,
          ...(requestedStatus === "INVITED"
            ? { invitedAt: now }
            : { shortlistedAt: now }),
        },
      });

      if (requestedStatus === "INVITED") {
        await tx.notification.create({
          data: {
            userId: candidate.userId,
            title: "Job invitation from HireGo",
            message: `An employer invited you to review the ${lockedJob.title} opportunity. Open HireGo to review the job before applying.`,
            type: "JOB_INVITATION",
          },
        });
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId,
          action:
            requestedStatus === "INVITED"
              ? "SOURCED_CANDIDATE_INVITED"
              : "SOURCED_CANDIDATE_SHORTLISTED",
          resource: `CandidateSourcingRelationship:${relationship.id}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          details: `Job:${jobId} CandidateProfile:${candidate.id}`,
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return {
        relationship,
        candidate: { id: candidate.id, name: candidate.user.name },
        idempotent: false,
      };
    });

    return NextResponse.json({
      success: true,
      relationship: {
        id: result.relationship.id,
        status: result.relationship.status,
      },
      candidate: result.candidate,
      idempotent: result.idempotent,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
