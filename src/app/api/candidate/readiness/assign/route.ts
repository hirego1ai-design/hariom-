import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { assignUniversalAssessment, getCandidateTargetRole, getUniversalValidationState } from "@/lib/universalSkillValidation";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    await enforceRateLimit(request, "candidate_readiness_assign", 6, 60_000);

    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      select: { id: true, preferences: true },
    });
    if (!candidate) throw new ApiError("Complete your candidate profile before starting skill validation.", 409);

    const roleTitle = getCandidateTargetRole(candidate.preferences);
    if (!roleTitle) throw new ApiError("Choose a target role before starting HireGo Skill Validation.", 409);

    const state = await getUniversalValidationState(candidate.id, roleTitle);
    if (state.completedAndCurrent && state.readiness?.assessmentId) {
      return NextResponse.json({
        success: true,
        roleTitle,
        assessmentId: state.readiness.assessmentId,
        alreadyCurrent: true,
        status: state.readiness.status,
      });
    }

    const assigned = await assignUniversalAssessment(candidate.id, roleTitle);
    return NextResponse.json({
      success: true,
      roleTitle,
      assessmentId: assigned.assessment.id,
      alreadyCurrent: false,
      status: assigned.readiness.status,
      noticeUrl: `/assessment/skill-validation/notice?assessmentId=${encodeURIComponent(assigned.assessment.id)}`,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
