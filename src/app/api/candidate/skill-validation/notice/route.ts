import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { validateKnowledgeScreeningAssessment } from "@/lib/assessmentPolicyValidation";
import { UNIVERSAL_VALIDATION_SENIORITY } from "@/lib/universalSkillValidation";
import { ApplicationGateType } from "@prisma/client";

const NOTICE_VERSION = "universal-skill-validation-v1";

const acknowledgeSchema = z.object({
  assessmentId: z.string().uuid(),
  applicationId: z.string().uuid().nullable().optional(),
  acknowledged: z.literal(true),
}).strict();

async function requireCandidate(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") {
    throw new ApiError("Candidate access required", 403);
  }
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return { session, profile };
}

async function loadAssessmentForCandidate(
  candidateProfileId: string,
  assessmentId: string,
  applicationId?: string | null,
) {
  const assessment = await prisma.mcqAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        select: { category: true, skillTags: true },
      },
    },
  });
  if (
    !assessment ||
    !assessment.isActive ||
    assessment.scope !== "PLATFORM_READINESS" ||
    assessment.seniority !== UNIVERSAL_VALIDATION_SENIORITY
  ) {
    throw new ApiError("Universal Skill Validation is unavailable.", 404);
  }

  const validation = validateKnowledgeScreeningAssessment({
    roleTitle: assessment.roleTitle,
    questions: assessment.questions,
  });
  if (!validation.valid) {
    throw new ApiError("This Skill Validation does not meet current HireGo policy.", 409);
  }

  if (applicationId) {
    const gate = await prisma.applicationGate.findFirst({
      where: {
        applicationId,
        type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION,
        assessmentId,
        application: { candidateProfileId },
      },
      select: { id: true, status: true },
    });
    if (!gate) {
      throw new ApiError("This assessment is not assigned to the requested application.", 403);
    }
  }

  return assessment;
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_skill_validation_notice", 60, 60_000);
    const { profile } = await requireCandidate(request);
    const assessmentId = request.nextUrl.searchParams.get("assessmentId");
    const applicationId = request.nextUrl.searchParams.get("applicationId");

    if (!assessmentId || !z.string().uuid().safeParse(assessmentId).success) {
      throw new ApiError("Valid assessmentId is required.", 400);
    }
    if (applicationId && !z.string().uuid().safeParse(applicationId).success) {
      throw new ApiError("Invalid applicationId.", 400);
    }

    const assessment = await loadAssessmentForCandidate(profile.id, assessmentId, applicationId);
    const acknowledged = await prisma.assessmentNoticeAcknowledgement.findUnique({
      where: {
        candidateProfileId_assessmentId: {
          candidateProfileId: profile.id,
          assessmentId,
        },
      },
      select: { acknowledgedAt: true, noticeVersion: true },
    });

    const skills = Array.from(new Set(
      assessment.questions.flatMap((question) =>
        question.skillTags.length
          ? question.skillTags
          : question.category?.trim()
            ? [question.category.trim()]
            : [],
      ),
    )).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      noticeVersion: NOTICE_VERSION,
      acknowledged: acknowledged?.noticeVersion === NOTICE_VERSION,
      acknowledgedAt: acknowledged?.acknowledgedAt ?? null,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        roleTitle: assessment.roleTitle,
        questionCount: assessment.questions.length,
        durationMinutes: assessment.durationMinutes,
        passingPercentage: assessment.passingPercentage,
        validityDays: assessment.validityDays,
        retakeCooldownHours: assessment.retakeCooldownHours,
        skills,
      },
      applicationId: applicationId || null,
      integrity: {
        serverTimed: true,
        candidateOwnershipChecked: true,
        answerKeysHidden: true,
        duplicateSubmissionProtected: true,
        webcamMonitoring: false,
        microphoneMonitoring: false,
        screenRecording: false,
        tabSwitchMonitoring: false,
      },
      privacy: {
        employerCanSeeRawAnswers: false,
        employerCanSeeCorrectAnswerKeys: false,
        employerCanSeeSkillEvidence: true,
        privateCoachingSharedByDefault: false,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_skill_validation_notice_ack", 20, 60_000);
    const { profile } = await requireCandidate(request);
    const body = await readValidatedJson(request, acknowledgeSchema, 8 * 1024);

    await loadAssessmentForCandidate(profile.id, body.assessmentId, body.applicationId);

    const acknowledgement = await prisma.assessmentNoticeAcknowledgement.upsert({
      where: {
        candidateProfileId_assessmentId: {
          candidateProfileId: profile.id,
          assessmentId: body.assessmentId,
        },
      },
      create: {
        candidateProfileId: profile.id,
        assessmentId: body.assessmentId,
        applicationId: body.applicationId ?? null,
        noticeVersion: NOTICE_VERSION,
      },
      update: {
        applicationId: body.applicationId ?? null,
        acknowledgedAt: new Date(),
        noticeVersion: NOTICE_VERSION,
      },
    });

    return NextResponse.json({
      success: true,
      acknowledgedAt: acknowledgement.acknowledgedAt,
      noticeVersion: acknowledgement.noticeVersion,
      startUrl: `/assessment/mcq/active?id=${encodeURIComponent(body.assessmentId)}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
