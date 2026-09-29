import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { z } from "zod";
import { logAuditEvent } from "@/lib/auditLogger";
import { validateKnowledgeScreeningAssessment } from "@/lib/assessmentPolicyValidation";

const updateAssessmentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().min(1).optional(),
  passingPercentage: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_update_assessment", 20, 60000);
    const session = await requireEmployerOrAdminSession(request);
    if (session.role !== "ADMIN") {
      throw new ApiError(
        "Employer job assessment policy is managed automatically. Manual assessment edits are not available to employer or recruiter accounts.",
        403,
      );
    }
    const data = await readValidatedJson(request, updateAssessmentSchema);
    const { id } = await params;

    const assessment = await prisma.mcqAssessment.findUnique({
      where: { id },
      include: { jobListing: true },
    });

    if (!assessment) {
      throw new ApiError("Assessment not found", 404);
    }

    let companyId: string | undefined;
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      companyId = company.id;

      if (assessment.jobListing && assessment.jobListing.companyId !== companyId) {
        throw new ApiError("Forbidden: You do not own this assessment", 403);
      } else if (!assessment.jobListing) {
        throw new ApiError("Forbidden: Cannot edit unlinked assessments", 403);
      }
    }

    // Publication Safety: publish and runtime start use the exact same
    // fail-closed policy so a legacy or malformed assessment cannot become
    // candidate validation evidence.
    if (data.isActive === true) {
      const questions = await prisma.mcqQuestion.findMany({
        where: { assessmentId: id },
        select: { category: true, skillTags: true },
      });
      const validation = validateKnowledgeScreeningAssessment({
        roleTitle: assessment.roleTitle ?? assessment.jobListing?.title,
        department: assessment.jobListing?.department,
        questions,
      });
      if (!validation.valid) {
        throw new ApiError(
          `Cannot publish this HireGo Skill Validation: ${validation.reasons.join(" ")}`,
          400,
        );
      }
    }

    // Historical Integrity: freeze scoring rules once assigned or attempted.
    const [attemptCount, assignmentCount] = await Promise.all([
      prisma.mcqAttempt.count({ where: { assessmentId: id } }),
      prisma.applicationGate.count({ where: { assessmentId: id } }),
    ]);
    if ((attemptCount > 0 || assignmentCount > 0) && (data.durationMinutes !== undefined || data.passingPercentage !== undefined)) {
      throw new ApiError("Cannot modify duration or passing percentage after this assessment has been assigned to a candidate.", 409);
    }

    const updatedAssessment = await prisma.mcqAssessment.update({
      where: { id },
      data,
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "UPDATE_ASSESSMENT",
      resource: `Assessment:${id}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, assessment: updatedAssessment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_delete_assessment", 20, 60000);
    const session = await requireEmployerOrAdminSession(request);
    if (session.role !== "ADMIN") {
      throw new ApiError(
        "Employer job assessments are retained as generated hiring evidence and cannot be manually deleted.",
        403,
      );
    }
    const { id } = await params;

    const assessment = await prisma.mcqAssessment.findUnique({
      where: { id },
      include: { jobListing: true },
    });

    if (!assessment) {
      throw new ApiError("Assessment not found", 404);
    }

    let companyId: string | undefined;
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      companyId = company.id;

      if (assessment.jobListing && assessment.jobListing.companyId !== companyId) {
        throw new ApiError("Forbidden: You do not own this assessment", 403);
      } else if (!assessment.jobListing) {
        throw new ApiError("Forbidden: Cannot delete unlinked assessments", 403);
      }
    }

    // Historical Integrity: assigned, acknowledged, or attempted assessments are immutable history.
    const [attemptCount, assignmentCount, acknowledgementCount] = await Promise.all([
      prisma.mcqAttempt.count({ where: { assessmentId: id } }),
      prisma.applicationGate.count({ where: { assessmentId: id } }),
      prisma.assessmentNoticeAcknowledgement.count({ where: { assessmentId: id } }),
    ]);
    if (attemptCount > 0 || assignmentCount > 0 || acknowledgementCount > 0) {
      throw new ApiError("Cannot delete an assessment after it has been assigned, acknowledged, or attempted. Archive it by setting isActive to false.", 409);
    }

    await prisma.mcqAssessment.delete({
      where: { id },
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "DELETE_ASSESSMENT",
      resource: `Assessment:${id}`,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
