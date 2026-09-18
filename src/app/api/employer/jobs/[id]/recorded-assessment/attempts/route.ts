import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { assertEmployerOwnsJob } from "@/lib/recordedAssessment";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || !["EMPLOYER","RECRUITER","ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const { id } = await params; await assertEmployerOwnsJob(session.id, session.role, id);
    const attempts = await prisma.recordedAssessmentAttempt.findMany({
      where: { jobListingId: id },
      orderBy: { createdAt: "desc" },
      include: {
        candidateProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
        proctoringEvents: { orderBy: { createdAt: "asc" } },
        questions: { orderBy: { orderIndex: "asc" }, include: { response: { include: { storedFile: { select: { id: true, mimeType: true } } } } } },
      },
    });
    return NextResponse.json({ success: true, attempts });
  } catch (error) { return handleApiError(error); }
}
