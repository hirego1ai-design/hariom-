import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";

const decisionSchema = z.object({
  offerId: z.string().uuid(),
  action: z.enum(["ACCEPT", "DECLINE"]),
  note: z.string().trim().max(1000).optional(),
}).strict();

async function candidateProfile(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id }, select: { id: true } });
  if (!profile) throw new ApiError("Candidate profile not found.", 404);
  return { session, profile };
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_offers_read", 60, 60_000);
    const { profile } = await candidateProfile(request);
    const offers = await prisma.offer.findMany({
      where: {
        application: { candidateProfileId: profile.id },
        status: { in: ["SENT", "ACCEPTED", "DECLINED", "WITHDRAWN", "EXPIRED"] },
      },
      include: {
        company: { select: { name: true } },
        application: { select: { job: { select: { title: true } } } },
        documentFile: { select: { id: true, originalName: true, mimeType: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, offers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_offer_decision", 10, 60_000);
    const { session, profile } = await candidateProfile(request);
    const body = await readValidatedJson(request, decisionSchema, 8 * 1024);

    const offer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Offer" WHERE id = ${body.offerId} FOR UPDATE`;
      const current = await tx.offer.findFirst({
        where: { id: body.offerId, application: { candidateProfileId: profile.id } },
        include: { application: { select: { status: true } } },
      });
      if (!current) throw new ApiError("Offer not found.", 404);
      if (current.status !== "SENT") throw new ApiError("This offer is no longer awaiting your response.", 409);
      if (["HIRED", "REJECTED", "WITHDRAWN"].includes(current.application.status)) {
        throw new ApiError("The application is no longer eligible for an offer response.", 409);
      }

      return tx.offer.update({
        where: { id: current.id },
        data: {
          status: body.action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
          respondedAt: new Date(),
          responseNote: body.note || null,
        },
      });
    });

    await prisma.notification.create({
      data: {
        userId: offer.createdById,
        title: body.action === "ACCEPT" ? "Offer accepted" : "Offer declined",
        message: `Candidate response recorded for offer ${offer.id}.`,
        type: "OFFER",
      },
    }).catch(() => undefined);

    await logAuditEvent({
      userId: session.id,
      companyId: offer.companyId,
      action: body.action === "ACCEPT" ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
      resource: `Offer:${offer.id}`,
      details: body.note || null,
    });

    return NextResponse.json({ success: true, offer });
  } catch (error) {
    return handleApiError(error);
  }
}
