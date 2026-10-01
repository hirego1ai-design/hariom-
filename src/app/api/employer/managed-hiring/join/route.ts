import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { authorizeBilling, confirmPphJoining, joiningSchema } from "@/lib/pph-billing";
import { dispatchCommunication } from "@/lib/communications/dispatcher";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

async function actorFor(request: Request) {
  const session = await requireAuthenticatedSession(request);
  if (!["ADMIN", "EMPLOYER"].includes(session.role)) throw new ApiError("Billing approval requires employer or HireGo administrator access.", 403);
  const profile = session.role === "EMPLOYER" ? await prisma.employerProfile.findUnique({ where: { userId: session.id } }) : null;
  if (session.role === "EMPLOYER" && !profile?.companyId) throw new ApiError("Company profile is required.", 403);
  return { id: session.id, role: session.role, companyId: profile?.companyId };
}

export async function POST(request: Request) {
  try {
    const actor = await actorFor(request);
    await enforceRateLimit(request, "employer_managed_hiring_join", 10, 60000);
    const input = await readValidatedJson(request, joiningSchema);
    const result = await confirmPphJoining(input, actor);
    if (!result.duplicate) {
      const application = await prisma.application.findUnique({ where: { id: input.applicationId }, include: { job: { include: { company: true } }, candidateProfile: { include: { user: true } } } });
      const candidate = application?.candidateProfile.user;
      if (application && candidate) {
        const variables = { candidate_name: candidate.name || "Candidate", company_name: application.job.company.name, job_title: application.job.title, joining_date: new Date(input.joinedAt).toLocaleDateString() };
        if (candidate.email) await dispatchCommunication({ eventKey: "JOINING_COMPLETED", channel: "EMAIL", audience: "CANDIDATE", recipient: candidate.email, variables, idempotencyKey: `placement:${result.placement.id}:joining:candidate:email`, correlationId: result.placement.id, recipientRef: candidate.id }).catch(() => null);
        if (candidate.phoneNumber) await dispatchCommunication({ eventKey: "JOINING_COMPLETED", channel: "WHATSAPP", audience: "CANDIDATE", recipient: candidate.phoneNumber, variables, idempotencyKey: `placement:${result.placement.id}:joining:candidate:whatsapp`, correlationId: result.placement.id, recipientRef: candidate.id }).catch(() => null);
      }
    }
    return NextResponse.json({ success: true, ...result,
      message: "Joining recorded. Invoice is scheduled for 25 days after joining, subject to holds and accepted terms." },
      { status: result.duplicate ? 200 : 201 });
  } catch (error) { return handleApiError(error); }
}

export async function GET(request: Request) {
  try {
    const actor = await actorFor(request);
    await enforceRateLimit(request, "employer_managed_hiring_join_get", 60, 60000);
    const applicationId = new URL(request.url).searchParams.get("applicationId");
    let requiredAgreementId: string | null = null;
    let acceptedOffer: {
      id: string;
      compensationAmount: string | null;
      currency: string;
      acceptedAt: string;
      startDate: string | null;
    } | null = null;
    if (applicationId) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
          status: true,
          job: {
            select: {
              companyId: true,
              managedAgreementId: true,
            },
          },
          offers: {
            where: { status: "ACCEPTED" },
            orderBy: { acceptedAt: "desc" },
            take: 1,
            select: {
              id: true,
              compensationAmount: true,
              currency: true,
              acceptedAt: true,
              startDate: true,
            },
          },
        },
      });
      if (!application) throw new ApiError("Application not found.", 404);
      authorizeBilling(actor, application.job.companyId);
      requiredAgreementId = application.job.managedAgreementId;
      const offer = application.offers[0];
      acceptedOffer = offer?.acceptedAt
        ? {
            id: offer.id,
            compensationAmount: offer.compensationAmount?.toString() ?? null,
            currency: offer.currency,
            acceptedAt: offer.acceptedAt.toISOString(),
            startDate: offer.startDate?.toISOString() ?? null,
          }
        : null;
    }
    const placements = await prisma.pphPlacement.findMany({
      where: { ...(actor.role === "ADMIN" ? {} : { companyId: actor.companyId }), ...(applicationId ? { applicationId } : {}) },
      orderBy: { createdAt: "desc" }, take: 50,
      include: { invoice: { select: { invoiceNumber: true, status: true } } },
    });
    return NextResponse.json(
      { success: true, placements, requiredAgreementId, acceptedOffer },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) { return handleApiError(error); }
}

const actionSchema = z.object({ placementId: z.string().uuid(), action: z.enum(["HOLD", "RESUME", "CANCEL"]), reason: z.string().trim().min(5).max(1000) }).strict();

export async function PATCH(request: Request) {
  try {
    const actor = await actorFor(request);
    await enforceRateLimit(request, "employer_managed_hiring_join_action", 10, 60000);
    const body = await readValidatedJson(request, actionSchema, 8 * 1024);
    const placement = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "PphPlacement" WHERE id = ${body.placementId} FOR UPDATE`;
      const row = await tx.pphPlacement.findUnique({ where: { id: body.placementId } });
      if (!row) throw new ApiError("Placement not found.", 404);
      authorizeBilling(actor, row.companyId);
      if (["INVOICED", "CANCELLED"].includes(row.status)) throw new ApiError("This placement is final; use invoice reconciliation if needed.", 409);
      if (body.action === "RESUME" && (actor.role !== "ADMIN" || row.status !== "HOLD")) throw new ApiError("Only HireGo can resume a held placement after reconciliation.", 403);
      const updated = await tx.pphPlacement.update({ where: { id: row.id }, data: {
        status: body.action === "RESUME" ? "SCHEDULED" : body.action === "CANCEL" ? "CANCELLED" : "HOLD",
        holdReason: body.action === "RESUME" ? null : body.reason,
      } });
      await tx.agreementEvent.create({ data: { agreementId: row.agreementId, performedBy: actor.id,
        eventType: `PPH_${body.action}`, notes: `Placement ${row.id}: ${body.reason}` } });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: actor.id,
          companyId: row.companyId,
          action: `PPH_PLACEMENT_${body.action}`,
          resource: `PphPlacement:${row.id}`,
          details: JSON.stringify({
            action: body.action,
            reason: body.reason,
            previousStatus: row.status,
            nextStatus: updated.status,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, actor.id);
      return updated;
    });
    return NextResponse.json({ success: true, placement });
  } catch (error) { return handleApiError(error); }
}
