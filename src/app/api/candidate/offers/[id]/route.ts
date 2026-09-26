import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

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
    const offer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Offer" WHERE id = ${id} FOR UPDATE`;
      const current = await tx.offer.findUnique({
        where: { id },
        include: { application: { select: { candidateProfileId: true, status: true } } },
      });
      if (!current || current.application.candidateProfileId !== profile.id) throw new ApiError("Offer not found.", 404);
      if (current.status === "ACCEPTED" && body.action === "ACCEPT") return current;
      if (current.status === "DECLINED" && body.action === "DECLINE") return current;
      if (current.status !== "SENT") throw new ApiError(`This offer cannot be ${body.action.toLowerCase()}ed from status ${current.status}.`, 409);
      if (current.expiresAt <= now) {
        await tx.offer.update({ where: { id }, data: { status: "EXPIRED" } });
        throw new ApiError("This offer has expired.", 409);
      }
      if (["HIRED", "REJECTED", "WITHDRAWN"].includes(current.application.status)) {
        throw new ApiError("This application is no longer eligible for an offer response.", 409);
      }
      return tx.offer.update({
        where: { id },
        data: body.action === "ACCEPT"
          ? { status: "ACCEPTED", acceptedAt: now, candidateResponseNote: body.note || null }
          : { status: "DECLINED", declinedAt: now, candidateResponseNote: body.note || null },
        include: { application: { select: { job: { select: { title: true, company: { select: { name: true } } } } } } },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        companyId: offer.companyId,
        action: body.action === "ACCEPT" ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
        resource: `Offer:${offer.id}`,
        details: body.note || null,
      },
    });
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    return handleApiError(error);
  }
}
