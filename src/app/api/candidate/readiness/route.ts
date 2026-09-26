import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { validateKnowledgeScreeningAssessment } from "@/lib/assessmentPolicyValidation";
import { assignUniversalAssessment, getCandidateTargetRole, UNIVERSAL_VALIDATION_SENIORITY } from "@/lib/universalSkillValidation";

const selectReadinessSchema = z.object({
  roleTitle: z.string().trim().min(1).max(120),
  seniority: z.string().trim().min(1).max(80),
}).strict();

const readinessRequestSchema = z.union([
  selectReadinessSchema,
  z.object({ autoAssign: z.literal(true) }).strict(),
]);

async function candidateProfile(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return profile;
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_readiness", 60, 60_000);
    const profile = await candidateProfile(request);
    const [rawTemplates, records] = await Promise.all([
      prisma.mcqAssessment.findMany({
        where: { scope: "PLATFORM_READINESS", isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          roleTitle: true,
          seniority: true,
          durationMinutes: true,
          passingPercentage: true,
          questions: { select: { category: true, skillTags: true } },
        },
        orderBy: [{ roleTitle: "asc" }, { seniority: "asc" }],
      }),
      prisma.candidateReadiness.findMany({
        where: { candidateProfileId: profile.id },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const templates = rawTemplates
      .filter((template) => {
        if (!template.roleTitle || !template.seniority) return false;
        return validateKnowledgeScreeningAssessment({
          roleTitle: template.roleTitle,
          questions: template.questions,
        }).valid;
      })
      .map(({ questions: _questions, ...template }) => template);

    return NextResponse.json({ success: true, templates, records });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_readiness", 60, 60_000);
    const profile = await candidateProfile(request);
    const payload = await readValidatedJson(request, readinessRequestSchema, 4 * 1024);

    if ("autoAssign" in payload) {
      const targetRole = getCandidateTargetRole(profile.preferences);
      if (!targetRole) {
        throw new ApiError("Choose a target role before generating HireGo Skill Validation.", 409);
      }
      const assignment = await assignUniversalAssessment(profile.id, targetRole);
      return NextResponse.json({
        success: true,
        readiness: assignment.readiness,
        assessmentId: assignment.assessment.id,
        roleTitle: targetRole,
        seniority: UNIVERSAL_VALIDATION_SENIORITY,
        generatedOrAssigned: true,
      });
    }

    const { roleTitle, seniority } = payload;
    const candidates = await prisma.mcqAssessment.findMany({
      where: { scope: "PLATFORM_READINESS", isActive: true, roleTitle, seniority },
      select: {
        id: true,
        roleTitle: true,
        seniority: true,
        questions: { select: { category: true, skillTags: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const template = candidates.find((candidate) =>
      validateKnowledgeScreeningAssessment({
        roleTitle: candidate.roleTitle,
        questions: candidate.questions,
      }).valid
    );

    if (!template) {
      throw new ApiError(
        "No production-valid HireGo Skill Validation is available for this role and seniority.",
        409,
      );
    }

    const record = await prisma.candidateReadiness.upsert({
      where: { candidateProfileId_roleTitle_seniority: { candidateProfileId: profile.id, roleTitle, seniority } },
      create: { candidateProfileId: profile.id, roleTitle, seniority, assessmentId: template.id },
      update: { assessmentId: template.id },
    });

    return NextResponse.json({ success: true, readiness: record, assessmentId: template.id });
  } catch (error) {
    return handleApiError(error);
  }
}
