import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getCandidateTargetRole, UNIVERSAL_VALIDATION_SENIORITY } from "@/lib/universalSkillValidation";
import { ApplicationGateStatus, ApplicationGateType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_skill_validation_status", 60, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Candidate access required", 403);
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      select: {
        id: true,
        preferences: true,
        readinessRecords: {
          where: { seniority: UNIVERSAL_VALIDATION_SENIORITY },
          orderBy: { updatedAt: "desc" },
          take: 10,
        },
        candidateSkills: {
          where: { isVisible: true },
          select: {
            name: true,
            verificationStatus: true,
            latestScore: true,
            verifiedAt: true,
            validUntil: true,
          },
          orderBy: { name: "asc" },
        },
        applications: {
          where: {
            gates: {
              some: {
                type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION,
                status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] },
              },
            },
          },
          select: {
            id: true,
            jobId: true,
            job: { select: { title: true } },
            gates: {
              where: { type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION },
              select: { status: true, assessmentId: true },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) throw new ApiError("Candidate profile not found", 404);

    const targetRole = getCandidateTargetRole(profile.preferences);
    const readiness = targetRole
      ? profile.readinessRecords.find((record) => record.roleTitle.toLowerCase() === targetRole.toLowerCase()) ?? null
      : profile.readinessRecords[0] ?? null;

    const now = new Date();
    const evidence = profile.candidateSkills.map((skill) => {
      const expired = Boolean(skill.validUntil && skill.validUntil <= now);
      return {
        name: skill.name,
        status: expired ? "EXPIRED" : skill.verificationStatus,
        score: expired ? null : skill.latestScore,
        verifiedAt: expired ? null : skill.verifiedAt,
        validUntil: expired ? skill.validUntil : skill.validUntil,
      };
    });
    const validatedEvidence = evidence.filter((skill) =>
      ["ASSESSMENT_VALIDATED", "VERIFIED"].includes(skill.status)
    );

    const pendingApplications = profile.applications.map((application) => {
      const gate = application.gates[0];
      const assessmentId = gate?.assessmentId ?? null;
      return {
        applicationId: application.id,
        jobId: application.jobId,
        jobTitle: application.job.title,
        gateStatus: gate?.status ?? null,
        assessmentId,
        noticeUrl: assessmentId
          ? `/assessment/skill-validation/notice?assessmentId=${encodeURIComponent(assessmentId)}&applicationId=${encodeURIComponent(application.id)}`
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      targetRole,
      validation: readiness
        ? {
            roleTitle: readiness.roleTitle,
            status: readiness.assessedAt ? "COMPLETED" : "NOT_STARTED",
            readinessStatus: readiness.status,
            score: readiness.score,
            assessedAt: readiness.assessedAt,
            validUntil: readiness.validUntil,
            assessmentId: readiness.assessmentId,
          }
        : null,
      validatedSkillCount: validatedEvidence.length,
      evidence,
      pendingApplications,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
