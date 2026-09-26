import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAuthenticatedSession } from "@/lib/routeAuthorization";
import { WorkflowEngine } from "@/lib/workflows/WorkflowEngine";
import { createTenantContext } from "@/lib/security/TenantContext";
import { logAuditEvent } from "@/lib/auditLogger";

const actionSchema = z.object({
  action: z.enum(["SEND", "WITHDRAW"]),
  approvalId: z.string().uuid().optional(),
  workflowId: z.string().uuid().optional(),
  confirmApproval: z.boolean().optional(),
  reason: z.string().trim().max(1000).optional(),
}).strict();

async function actor(request: NextRequest) {
  const session = await requireAuthenticatedSession(request);
  if (!["EMPLOYER", "ADMIN"].includes(session.role)) throw new ApiError("Offer management requires employer or administrator access.", 403);
  const profile = session.role === "EMPLOYER"
    ? await prisma.employerProfile.findUnique({ where: { userId: session.id }, select: { companyId: true } })
    : null;
  if (session.role === "EMPLOYER" && !profile?.companyId) throw new ApiError("Company profile is required.", 403);
  return { session, companyId: profile?.companyId ?? null };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, companyId } = await actor(request);
    await enforceRateLimit(request, "employer_offer_action", 20, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(request, actionSchema, 8 * 1024);

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: { include: { company: true } },
            candidateProfile: { include: { user: true } },
          },
        },
      },
    });
    if (!offer) throw new ApiError("Offer not found.", 404);
    if (session.role !== "ADMIN" && offer.companyId !== companyId) throw new ApiError("Offer access denied.", 403);

    if (body.action === "WITHDRAW") {
      if (!["DRAFT", "SENT"].includes(offer.status)) throw new ApiError("Only a draft or sent offer can be withdrawn.", 409);
      const updated = await prisma.offer.update({
        where: { id: offer.id },
        data: { status: "WITHDRAWN", withdrawnAt: new Date() },
      });
      if (offer.status === "SENT") {
        await prisma.notification.create({
          data: {
            userId: offer.application.candidateProfile.userId,
            title: "Offer withdrawn",
            message: `The offer for ${offer.application.job.title} has been withdrawn by ${offer.application.job.company.name}.`,
            type: "OFFER",
          },
        }).catch(() => undefined);
      }
      await logAuditEvent({
        userId: session.id,
        companyId: offer.companyId,
        action: "OFFER_WITHDRAWN",
        resource: `Offer:${offer.id}`,
        details: body.reason || "Offer withdrawn by authorized employer/admin.",
      });
      return NextResponse.json({ success: true, offer: updated });
    }

    if (offer.status === "SENT") {
      return NextResponse.json({ success: true, offer, idempotent: true });
    }
    if (offer.status !== "DRAFT") throw new ApiError("Only a draft offer can be sent.", 409);
    if (offer.expiresAt.getTime() <= Date.now()) {
      await prisma.offer.updateMany({ where: { id: offer.id, status: "DRAFT" }, data: { status: "EXPIRED" } });
      throw new ApiError("This offer has expired and cannot be sent.", 409);
    }

    const tenantContext = createTenantContext(session.role === "ADMIN" ? null : offer.companyId, session.id, session.role as Role);
    const expectedAction = { offerId: offer.id, applicationId: offer.applicationId, action: "SEND" as const };
    const correlationId = `offer-send:${offer.id}`;
    let workflow = await prisma.workflowInstance.findUnique({ where: { correlationId } });
    if (!workflow) {
      workflow = await WorkflowEngine.startWorkflow({
        workflowType: "JOINING_ONBOARDING",
        companyId: offer.companyId,
        jobId: offer.application.jobId,
        candidateId: offer.application.candidateProfileId,
        applicationId: offer.applicationId,
        correlationId,
        initiatedBy: session.id,
        initialStep: "OFFER_SEND",
        checkpointState: { offerId: offer.id, source: "employer-offer" },
        context: tenantContext,
      });
    }
    if (workflow.applicationId !== offer.applicationId || workflow.companyId !== offer.companyId) {
      throw new ApiError("Existing offer workflow does not match this application.", 409);
    }

    if (!body.approvalId || !body.workflowId) {
      let approval = await prisma.workflowApproval.findFirst({
        where: {
          workflowInstanceId: workflow.id,
          actionType: "OFFER",
          decision: { in: ["PENDING", "APPROVED"] },
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { requestedAt: "desc" },
      });
      if (!approval) {
        if (workflow.status !== "RUNNING") throw new ApiError("Offer workflow requires reconciliation before a new approval.", 409);
        const requested = await WorkflowEngine.requestConsequentialAction({
          workflowId: workflow.id,
          stepName: "OFFER_SEND",
          actionType: "OFFER",
          action: expectedAction,
          context: tenantContext,
        });
        approval = await prisma.workflowApproval.findUnique({ where: { id: requested.approvalId } });
      }
      if (!approval) throw new ApiError("Unable to persist offer approval.", 500);
      return NextResponse.json({
        success: true,
        action: "SEND",
        requiresConfirmation: true,
        approvalId: approval.id,
        workflowId: workflow.id,
        message: "Offer approval is persisted. Confirm once more to send it to the candidate.",
      }, { status: 202 });
    }

    if (body.workflowId !== workflow.id) throw new ApiError("Offer workflow does not match this offer.", 409);
    let approval = await WorkflowEngine.getApprovalDetails({ approvalId: body.approvalId, context: tenantContext });
    if (approval.workflowInstanceId !== workflow.id || approval.actionType !== "OFFER" || approval.consumedAt || approval.revokedAt) {
      throw new ApiError("Valid unconsumed offer approval is required.", 409);
    }
    if (approval.workflowInstance.applicationId !== offer.applicationId) throw new ApiError("Approval does not belong to this application.", 403);
    if (approval.decision === "PENDING") {
      if (!body.confirmApproval) throw new ApiError("Explicit confirmation is required to approve and send the offer.", 409);
      await WorkflowEngine.decideApproval({
        approvalId: approval.id,
        decision: "APPROVED",
        notes: "Confirmed from employer offer management.",
        context: tenantContext,
      });
      approval = await WorkflowEngine.getApprovalDetails({ approvalId: approval.id, context: tenantContext });
    }
    if (approval.decision !== "APPROVED") throw new ApiError("Offer approval is not approved.", 409);

    const sentAt = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Offer" WHERE id = ${offer.id} FOR UPDATE`;
      const locked = await tx.offer.findUnique({ where: { id: offer.id } });
      if (!locked || locked.status !== "DRAFT") throw new ApiError("Offer state changed before send.", 409);
      if (locked.expiresAt <= sentAt) throw new ApiError("Offer expired before send.", 409);
      await WorkflowEngine.consumeApprovedActionInTransaction(tx, {
        workflowId: workflow!.id,
        stepName: approval.stepName,
        action: expectedAction,
        context: tenantContext,
      });
      const row = await tx.offer.update({
        where: { id: offer.id },
        data: { status: "SENT", sentAt },
      });
      await tx.notification.create({
        data: {
          userId: offer.application.candidateProfile.userId,
          title: `Offer received: ${offer.application.job.title}`,
          message: `${offer.application.job.company.name} sent you an offer. Review the terms and respond from your Offers page.`,
          type: "OFFER",
        },
      });
      return row;
    });

    await logAuditEvent({
      userId: session.id,
      companyId: offer.companyId,
      action: "OFFER_SENT",
      resource: `Offer:${offer.id}`,
      details: `Application ${offer.applicationId}; approval ${approval.id}`,
    });
    return NextResponse.json({ success: true, offer: updated, candidateOffersUrl: "/offers" });
  } catch (error) {
    return handleApiError(error);
  }
}
