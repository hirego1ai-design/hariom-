import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const schema = z.object({
  action: z.enum(["SEND", "REVOKE"]),
}).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireEmployerOrAdminSession(request);
    if (session.role === "ADMIN") throw new ApiError("Manage offers from a tenant employer account.", 400);
    const company = await getSessionCompany(session);
    await enforceRateLimit(request, "employer_offer_action", 30, 60_000);
    const { id } = await params;
    const { action } = await readValidatedJson(request, schema, 4 * 1024);

    const offer = await prisma.offer.findFirst({
      where: { id, companyId: company.id },
      include: { application: { include: { candidateProfile: { include: { user: true } }, job: true } } },
    });
    if (!offer) throw new ApiError("Offer not found.", 404);

    if (action === "SEND") {
      if (offer.status !== "DRAFT") throw new ApiError("Only a draft offer can be sent.", 409);
      if (!offer.documentFileId) throw new ApiError("Attach a clean private offer document before sending.", 422);
      const file = await prisma.storedFile.findFirst({
        where: { id: offer.documentFileId, companyId: company.id, category: "offer-docs", deletedAt: null, scanStatus: "CLEAN" },
        select: { id: true },
      });
      if (!file) throw new ApiError("Linked offer document is unavailable or not clean.", 422);

      const updated = await prisma.offer.update({
        where: { id: offer.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      await logAuditEvent({
        userId: session.id,
        companyId: company.id,
        action: "OFFER_SENT",
        resource: `Offer:${offer.id}`,
        details: JSON.stringify({ applicationId: offer.applicationId, candidateId: offer.application.candidateProfileId }),
      });
      return NextResponse.json({ success: true, offer: updated });
    }

    if (!["DRAFT", "SENT"].includes(offer.status)) {
      throw new ApiError("Accepted or declined offers cannot be revoked.", 409);
    }
    const updated = await prisma.offer.update({
      where: { id: offer.id },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    await logAuditEvent({
      userId: session.id,
      companyId: company.id,
      action: "OFFER_REVOKED",
      resource: `Offer:${offer.id}`,
      details: JSON.stringify({ applicationId: offer.applicationId }),
    });
    return NextResponse.json({ success: true, offer: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
