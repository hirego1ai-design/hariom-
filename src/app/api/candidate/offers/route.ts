import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";

const actionSchema = z.object({
  offerId: z.string().uuid(),
  action: z.enum(["ACCEPT", "DECLINE"]),
  note: z.string().trim().max(2000).optional(),
}).strict();

async function candidateIdForSession(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id }, select: { id: true } });
  if (!profile) throw new ApiError("Candidate profile not found.", 404);
  return { session, candidateProfileId: profile.id };
}

export async function GET(request: NextRequest) {
  try {
    const { candidateProfileId } = await candidateIdForSession(request);
    await enforceRateLimit(request, "candidate_offers_read", 60, 60_000);
    const offers = await prisma.offer.findMany({
      where: {
        application: { candidateProfileId },
        status: { in: ["SENT", "ACCEPTED", "DECLINED"] },
      },
      include: {
        application: {
          include: {
            job: { include: { company: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, offers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { session, candidateProfileId } = await candidateIdForSession(request);
    await enforceRateLimit(request, "candidate_offer_response", 12, 60_000);
    const body = await readValidatedJson(request, actionSchema, 8 * 1024);

    const offer = await prisma.offer.findFirst({
      where: {
        id: body.offerId,
        status: "SENT",
        application: { candidateProfileId },
      },
      include: { application: { include: { job: true } } },
    });
    if (!offer) throw new ApiError("Active offer not found.", 404);

    const now = new Date();
    const accepted = body.action === "ACCEPT";
    const updated = await prisma.offer.update({
      where: { id: offer.id },
      data: {
        status: accepted ? "ACCEPTED" : "DECLINED",
        acceptedAt: accepted ? now : null,
        declinedAt: accepted ? null : now,
        responseNote: body.note || null,
      },
    });

    await logAuditEvent({
      userId: session.id,
      companyId: offer.companyId,
      action: accepted ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
      resource: `Offer:${offer.id}`,
      details: JSON.stringify({ applicationId: offer.applicationId }),
    });

    return NextResponse.json({
      success: true,
      offer: updated,
      joiningRequired: accepted,
      message: accepted
        ? "Offer accepted. Joining remains a separate employer-confirmed step."
        : "Offer declined.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
