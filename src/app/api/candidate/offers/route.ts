import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit, handleApiError, jsonError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") return jsonError("Candidate access required", 403);
    await enforceRateLimit(request, "candidate_offers_read", 60, 60_000);
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id }, select: { id: true } });
    if (!profile) return NextResponse.json({ success: true, offers: [] });

    await prisma.offer.updateMany({
      where: { application: { candidateProfileId: profile.id }, status: "SENT", expiresAt: { lte: new Date() } },
      data: { status: "EXPIRED" },
    });

    const offers = await prisma.offer.findMany({
      where: {
        application: { candidateProfileId: profile.id },
        status: { in: ["SENT", "ACCEPTED", "DECLINED", "WITHDRAWN", "EXPIRED"] },
      },
      include: {
        application: {
          select: {
            job: { select: { title: true, company: { select: { name: true } } } },
          },
        },
        documentFile: { select: { id: true, originalName: true, mimeType: true, scanStatus: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, offers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
