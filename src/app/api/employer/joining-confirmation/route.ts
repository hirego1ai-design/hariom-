import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAuthenticatedSession } from "@/lib/routeAuthorization";
import { dispatchCommunication } from "@/lib/communications/dispatcher";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const confirmSchema = z.object({
  applicationId: z.string().uuid(),
  joinedAt: z.string().datetime({ offset: true }),
  confirmJoined: z.literal(true),
  note: z.string().trim().max(1000).optional(),
}).strict();

async function actor(request: NextRequest) {
  const session = await requireAuthenticatedSession(request);
  if (!["EMPLOYER", "ADMIN"].includes(session.role)) {
    throw new ApiError("Joining confirmation requires employer or administrator access.", 403);
  }
  const profile = session.role === "EMPLOYER"
    ? await prisma.employerProfile.findUnique({
        where: { userId: session.id },
        select: { companyId: true },
      })
    : null;
  if (session.role === "EMPLOYER" && !profile?.companyId) {
    throw new ApiError("Company profile is required.", 403);
  }
  return { session, companyId: profile?.companyId ?? null };
}

function checkpointRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function GET(request: NextRequest) {
  try {
    const { session, companyId } = await actor(request);
    await enforceRateLimit(request, "employer_joining_confirmation_read", 60, 60_000);
    const applicationId = new URL(request.url).searchParams.get("applicationId");
    if (!applicationId || !z.string().uuid().safeParse(applicationId).success) {
      throw new ApiError("A valid application identifier is required.", 400);
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
        job: {
          select: {
            id: true,
            title: true,
            companyId: true,
            managedAgreementId: true,
            managedRequirementId: true,
            company: { select: { name: true } },
          },
        },
        candidateProfile: {
          select: { user: { select: { name: true, email: true } } },
        },
        offers: {
          where: { status: "ACCEPTED" },
          orderBy: { acceptedAt: "desc" },
          take: 1,
          select: {
            id: true,
            title: true,
            acceptedAt: true,
            startDate: true,
            compensationAmount: true,
            currency: true,
          },
        },
      },
    });
    if (!application) throw new ApiError("Application not found.", 404);
    if (session.role !== "ADMIN" && application.job.companyId !== companyId) {
      throw new ApiError("Application access denied.", 403);
    }

    const offer = application.offers[0] ?? null;
    const managedHiring = Boolean(
      application.job.managedAgreementId || application.job.managedRequirementId,
    );
    const workflow = offer
      ? await prisma.workflowInstance.findUnique({
          where: { correlationId: `offer-send:${offer.id}` },
          select: { id: true, status: true, currentStep: true, checkpointState: true },
        })
      : null;
    const checkpoint = checkpointRecord(workflow?.checkpointState ?? null);

    return NextResponse.json({
      success: true,
      mode: managedHiring ? "PPH_MANAGED" : "DIRECT_HIRE",
      application: {
        id: application.id,
        status: application.status,
        job: {
          id: application.job.id,
          title: application.job.title,
          companyName: application.job.company.name,
        },
        candidateName: application.candidateProfile.user.name,
        candidateEmail: application.candidateProfile.user.email,
      },
      acceptedOffer: offer,
      joining: {
        confirmed: application.status === "HIRED" && checkpoint.directJoiningConfirmed === true,
        joinedAt: typeof checkpoint.joinedAt === "string" ? checkpoint.joinedAt : null,
        confirmedAt: typeof checkpoint.joiningConfirmedAt === "string" ? checkpoint.joiningConfirmedAt : null,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, companyId } = await actor(request);
    await enforceRateLimit(request, "employer_joining_confirmation_write", 10, 60_000);
    const body = await readValidatedJson(request, confirmSchema, 8 * 1024);
    const joinedAt = new Date(body.joinedAt);
    const now = new Date();
    if (!Number.isFinite(joinedAt.getTime()) || joinedAt > now) {
      throw new ApiError("Joining time must be valid and cannot be in the future.", 422);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${body.applicationId} FOR UPDATE`;
      const application = await tx.application.findUnique({
        where: { id: body.applicationId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              companyId: true,
              managedAgreementId: true,
              managedRequirementId: true,
              company: { select: { name: true } },
            },
          },
          candidateProfile: {
            select: {
              id: true,
              user: { select: { id: true, name: true, email: true, phoneNumber: true } },
            },
          },
          offers: {
            where: { status: "ACCEPTED" },
            orderBy: { acceptedAt: "desc" },
            take: 1,
          },
        },
      });
      if (!application) throw new ApiError("Application not found.", 404);
      if (session.role !== "ADMIN" && application.job.companyId !== companyId) {
        throw new ApiError("Application access denied.", 403);
      }
      if (application.job.managedAgreementId || application.job.managedRequirementId) {
        throw new ApiError(
          "Managed-hiring joining must use the signed PPH agreement workflow.",
          409,
        );
      }

      const offer = application.offers[0];
      if (!offer || !offer.acceptedAt) {
        throw new ApiError("Candidate acceptance of a persisted offer is required.", 409);
      }
      if (joinedAt < offer.acceptedAt) {
        throw new ApiError("Confirmed joining cannot predate candidate offer acceptance.", 422);
      }

      const correlationId = `offer-send:${offer.id}`;
      await tx.$queryRaw`SELECT id FROM "WorkflowInstance" WHERE "correlationId" = ${correlationId} FOR UPDATE`;
      const workflow = await tx.workflowInstance.findUnique({ where: { correlationId } });
      if (
        !workflow ||
        workflow.workflowType !== "JOINING_ONBOARDING" ||
        workflow.applicationId !== application.id ||
        workflow.companyId !== application.job.companyId
      ) {
        throw new ApiError("Joining workflow requires reconciliation before confirmation.", 409);
      }

      const existingCheckpoint = checkpointRecord(workflow.checkpointState);
      if (application.status === "HIRED") {
        if (
          workflow.status === "COMPLETED" &&
          existingCheckpoint.directJoiningConfirmed === true &&
          existingCheckpoint.joinedAt === joinedAt.toISOString()
        ) {
          return {
            duplicate: true,
            applicationId: application.id,
            joinedAt: joinedAt.toISOString(),
            candidate: application.candidateProfile.user,
            jobTitle: application.job.title,
            companyName: application.job.company.name,
          };
        }
        throw new ApiError(
          "Joining is already recorded with different evidence. Reconciliation is required.",
          409,
        );
      }
      if (application.status !== "SHORTLISTED") {
        throw new ApiError(
          `Only a shortlisted application with an accepted offer can be confirmed joined; current status is ${application.status}.`,
          409,
        );
      }
      if (workflow.status !== "RUNNING" || workflow.currentStep !== "OFFER_ACCEPTED") {
        throw new ApiError(
          "Joining workflow is not at the accepted-offer confirmation step.",
          409,
        );
      }

      const confirmedAt = new Date();
      await tx.application.update({
        where: { id: application.id },
        data: {
          status: "HIRED",
          ...(offer.compensationAmount
            ? { annualCtc: Number(offer.compensationAmount) }
            : {}),
        },
      });
      await tx.candidateProfile.update({
        where: { id: application.candidateProfile.id },
        data: {
          availabilityStatus: "JOINED",
          lastAvailabilityConfirmedAt: joinedAt,
          availabilitySource: "EMPLOYER_JOINING_CONFIRMATION",
          availabilityNote: "Actual joining confirmed by the employer.",
        },
      });
      await tx.workflowInstance.update({
        where: { id: workflow.id },
        data: {
          status: "COMPLETED",
          currentStep: "JOINING_CONFIRMED",
          checkpointState: {
            ...existingCheckpoint,
            directJoiningConfirmed: true,
            offerId: offer.id,
            joinedAt: joinedAt.toISOString(),
            joiningConfirmedAt: confirmedAt.toISOString(),
            joiningConfirmedBy: session.id,
            joiningConfirmedByRole: session.role,
            note: body.note || null,
          } as Prisma.InputJsonValue,
        },
      });
      await tx.notification.create({
        data: {
          userId: application.candidateProfile.user.id,
          title: `Joining confirmed: ${application.job.title}`,
          message: `${application.job.company.name} confirmed your joining for ${application.job.title}.`,
          type: "APPLICATION",
        },
      });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: application.job.companyId,
          action: "DIRECT_HIRE_JOINING_CONFIRMED",
          resource: `Application:${application.id}`,
          details: JSON.stringify({
            offerId: offer.id,
            joinedAt: joinedAt.toISOString(),
            workflowId: workflow.id,
            note: body.note || null,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return {
        duplicate: false,
        applicationId: application.id,
        joinedAt: joinedAt.toISOString(),
        candidate: application.candidateProfile.user,
        jobTitle: application.job.title,
        companyName: application.job.company.name,
      };
    }, { maxWait: 5_000, timeout: 10_000 });

    if (!result.duplicate) {
      const variables = {
        candidate_name: result.candidate.name || "Candidate",
        company_name: result.companyName,
        job_title: result.jobTitle,
        joining_date: new Date(result.joinedAt).toLocaleDateString(),
      };
      if (result.candidate.email) {
        await dispatchCommunication({
          eventKey: "JOINING_COMPLETED",
          channel: "EMAIL",
          audience: "CANDIDATE",
          recipient: result.candidate.email,
          variables,
          idempotencyKey: `direct-joining:${result.applicationId}:candidate:email`,
          correlationId: result.applicationId,
          recipientRef: result.candidate.id,
        }).catch(() => null);
      }
      if (result.candidate.phoneNumber) {
        await dispatchCommunication({
          eventKey: "JOINING_COMPLETED",
          channel: "WHATSAPP",
          audience: "CANDIDATE",
          recipient: result.candidate.phoneNumber,
          variables,
          idempotencyKey: `direct-joining:${result.applicationId}:candidate:whatsapp`,
          correlationId: result.applicationId,
          recipientRef: result.candidate.id,
        }).catch(() => null);
      }
    }

    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      applicationId: result.applicationId,
      status: "HIRED",
      joinedAt: result.joinedAt,
      message: result.duplicate
        ? "Joining was already confirmed with the same evidence."
        : "Joining confirmed. The direct-hire workflow is complete.",
    }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
