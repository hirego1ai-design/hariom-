import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, getCurrentSession, handleApiError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await enforceRateLimit(request, "candidate_application_detail", 60, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session) throw new ApiError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);

    const { id } = await params;
    if (!id) throw new ApiError("Application ID is required", 400);

    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });
    if (!candidate) throw new ApiError("Candidate profile not found", 404);

    const application = await prisma.application.findFirst({
      where: { id, candidateProfileId: candidate.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            type: true,
            status: true,
            company: { select: { name: true, logoUrl: true } },
          },
        },
        interviews: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            roomId: true,
          },
          orderBy: { scheduledAt: "desc" },
        },
        gates: {
          select: {
            id: true,
            type: true,
            status: true,
            assessmentId: true,
            completedAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        offers: {
          select: {
            id: true,
            status: true,
            expiresAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!application) throw new ApiError("Application not found", 404);
    return NextResponse.json({
      success: true,
      application: {
        ...application,
        matchScore: application.aiSummary ? application.matchScore : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
