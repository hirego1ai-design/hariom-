import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { authorizeBilling, confirmPphJoining, joiningSchema } from "@/lib/pph-billing";

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
    const result = await confirmPphJoining(await readValidatedJson(request, joiningSchema), actor);
    return NextResponse.json({ success: true, ...result,
      message: "Joining recorded. Invoice is scheduled for 25 days after joining, subject to holds and accepted terms." },
      { status: result.duplicate ? 200 : 201 });
  } catch (error) { return handleApiError(error); }
}

export async function GET(request: Request) {
  try {
    const actor = await actorFor(request);
    const applicationId = new URL(request.url).searchParams.get("applicationId");
    const placements = await prisma.pphPlacement.findMany({
      where: { ...(actor.role === "ADMIN" ? {} : { companyId: actor.companyId }), ...(applicationId ? { applicationId } : {}) },
      orderBy: { createdAt: "desc" }, take: 50,
      include: { invoice: { select: { invoiceNumber: true, status: true } } },
    });
    return NextResponse.json({ success: true, placements }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return handleApiError(error); }
}

const actionSchema = z.object({ placementId: z.string().uuid(), action: z.enum(["HOLD", "RESUME", "CANCEL"]), reason: z.string().trim().min(5).max(1000) }).strict();

export async function PATCH(request: Request) {
  try {
    const actor = await actorFor(request);
    const body = await readValidatedJson(request, actionSchema);
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
      return updated;
    });
    return NextResponse.json({ success: true, placement });
  } catch (error) { return handleApiError(error); }
}
