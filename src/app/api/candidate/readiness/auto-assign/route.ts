import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import {
  assignUniversalAssessment,
  getCandidateTargetRole,
  UNIVERSAL_VALIDATION_SENIORITY,
} from "@/lib/universalSkillValidation";

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_universal_assessment_auto_assign", 10, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Candidate access required.", 403);
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      select: { id: true, preferences: true },
    });
    if (!candidate) throw new ApiError("Candidate profile not found.", 404);

    const targetRole = getCandidateTargetRole(candidate.preferences);
    if (!targetRole) {
      throw new ApiError("Choose a target role before generating Skill Validation.", 409);
    }

    const assignment = await assignUniversalAssessment(candidate.id, targetRole);
    return NextResponse.json({
      success: true,
      optional: true,
      roleTitle: targetRole,
      seniority: UNIVERSAL_VALIDATION_SENIORITY,
      assessmentId: assignment.assessment.id,
      noticeUrl: `/assessment/skill-validation/notice?assessmentId=${encodeURIComponent(assignment.assessment.id)}`,
      message: "Your optional HireGo Skill Validation is ready. It becomes mandatory only when a job application requires current validation.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
