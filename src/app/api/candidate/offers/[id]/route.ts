import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { expireOfferIfDue } from "@/lib/offerLifecycle";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const schema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
  note: z.string().trim().max(1000).optional(),
}).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    await enforceRateLimit(request, "candidate_offer_response", 10, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(request, schema, 8 * 1024);
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id }, select: { id: true } });
    if (!profile) throw new ApiError("Candidate profile not found.", 404);

    const now = new Date();
    const ownedOffer = await prisma.offer.findFirst({
      where: {
        id,
        application: { candidateProfileId: profile.id },
      },
      select: { id: true, applicationId: true, status: true, expiresAt: true },
    });
    if (!ownedOffer) throw new ApiError("Offer not found.", 404);

    if (ownedOffer.status === "SENT" && ownedOffer.expiresAt <= now) {
      const expired = await expireOfferIfDue(ownedOffer.id, now);
      if (expired) throw new ApiError("This offer has expired.", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Canonical lifecycle lock order is Application -> Offer. This matches
      // employer rejection/withdraw/send flows and prevents offer responses
      // from racing an application into a contradictory state.
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${ownedOffer.applicationId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "Offer" WHERE id = ${id} FOR UPDATE`;
      const current = await tx.offer.findUnique({
        where: { id },
        include: { application: { select: { candidateProfileId: true, status: true, jobId: true } } },
      });
      if (!current || current.application.candidateProfileId !== profile.id) throw new ApiError("Offer not found.", 404);

      if (current.status === "ACCEPTED" && body.action === "ACCEPT") {
        const joiningWorkflow = await tx.workflowInstance.findUnique({
          where: { correlationId: `offer-send:${current.id}` },
          select: { id: true, status: true, currentStep: true },
        });
        return { offer: current, expired: false, joiningWorkflow };
      }
      if (current.status === "DECLINED" && body.action === "DECLINE") {
        return { offer: current, expired: false, joiningWorkflow: null };
      }
      if (current.status !== "SENT") throw new ApiError(`This offer cannot be ${body.action.toLowerCase()}ed from status ${current.status}.`, 409);

      if (current.expiresAt <= now) {
        throw new ApiError("This offer has expired.", 409);
      }
      if (current.application.status !== "SHORTLISTED") {
        throw new ApiError(
          `Offer response requires a shortlisted application; current application status is ${current.application.status}.`,
          409,
        );
      }

      const updatedOffer = await tx.offer.update({
        where: { id },
        data: body.action === "ACCEPT"
          ? { status: "ACCEPTED", acceptedAt: now, candidateResponseNote: body.note || null }
          : { status: "DECLINED", declinedAt: now, candidateResponseNote: body.note || null },
        include: { application: { select: { job: { select: { title: true, company: { select: { name: true } } } } } } },
      });

      const correlationId = `offer-send:${current.id}`;
      const workflow = await tx.workflowInstance.findUnique({ where: { correlationId } });
      let joiningWorkflow: { id: string; status: string; currentStep: string } | null = null;

      if (body.action === "ACCEPT") {
        if (workflow) {
          if (
            workflow.workflowType !== "JOINING_ONBOARDING" ||
            workflow.applicationId !== current.applicationId ||
            workflow.companyId !== current.companyId
          ) {
            throw new ApiError("Offer joining workflow does not match this application.", 409);
          }
          if (!["RUNNING", "PAUSED_FOR_APPROVAL"].includes(workflow.status)) {
            throw new ApiError("Offer joining workflow requires operator reconciliation before acceptance can continue.", 409);
          }
          const checkpoint = workflow.checkpointState && typeof workflow.checkpointState === "object" && !Array.isArray(workflow.checkpointState)
            ? workflow.checkpointState as Record<string, unknown>
            : {};
          joiningWorkflow = await tx.workflowInstance.update({
            where: { id: workflow.id },
            data: {
              status: "RUNNING",
              currentStep: "OFFER_ACCEPTED",
              checkpointState: {
                ...checkpoint,
                offerId: current.id,
                candidateAccepted: true,
                acceptedAt: now.toISOString(),
                acceptedByCandidateUserId: session.id,
              },
            },
            select: { id: true, status: true, currentStep: true },
          });
        } else {
          joiningWorkflow = await tx.workflowInstance.create({
            data: {
              companyId: current.companyId,
              jobId: current.application.jobId,
              candidateId: current.application.candidateProfileId,
              applicationId: current.applicationId,
              workflowType: "JOINING_ONBOARDING",
              status: "RUNNING",
              currentStep: "OFFER_ACCEPTED",
              correlationId,
              initiatedBy: current.createdById,
              checkpointState: {
                offerId: current.id,
                source: "candidate-offer-acceptance-recovery",
                candidateAccepted: true,
                acceptedAt: now.toISOString(),
                acceptedByCandidateUserId: session.id,
              },
            },
            select: { id: true, status: true, currentStep: true },
          });
        }
      } else if (workflow && ["RUNNING", "PAUSED_FOR_APPROVAL", "FAILED"].includes(workflow.status)) {
        const checkpoint = workflow.checkpointState && typeof workflow.checkpointState === "object" && !Array.isArray(workflow.checkpointState)
          ? workflow.checkpointState as Record<string, unknown>
          : {};
        await tx.workflowInstance.update({
          where: { id: workflow.id },
          data: {
            status: "CANCELLED",
            currentStep: "OFFER_DECLINED",
            checkpointState: {
              ...checkpoint,
              offerId: current.id,
              candidateAccepted: false,
              declinedAt: now.toISOString(),
              declinedByCandidateUserId: session.id,
            },
          },
        });
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: updatedOffer.companyId,
          action: body.action === "ACCEPT" ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
          resource: `Offer:${updatedOffer.id}`,
          details: JSON.stringify({
            applicationId: current.applicationId,
            candidateUserId: session.id,
            response: body.action,
            note: body.note || null,
            respondedAt: now.toISOString(),
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);

      return {
        offer: updatedOffer,
        expired: false,
        joiningWorkflow,
        notifyUserId: current.createdById,
      };
    });


    if (result.notifyUserId !== session.id) {
      await prisma.notification.create({
        data: {
          userId: result.notifyUserId,
          title: body.action === "ACCEPT" ? "Offer accepted" : "Offer declined",
          message:
            body.action === "ACCEPT"
              ? "The candidate accepted the offer. Review the joining workflow for the next required confirmation."
              : "The candidate declined the offer. Review the candidate application before issuing another offer.",
          type: "OFFER",
        },
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      offer: result.offer,
      joiningWorkflowStarted: body.action === "ACCEPT" && result.joiningWorkflow?.currentStep === "OFFER_ACCEPTED",
      joiningWorkflow: result.joiningWorkflow,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
