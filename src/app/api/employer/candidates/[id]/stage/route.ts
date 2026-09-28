import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import {
  getSessionCompany,
  requireEmployerOrAdminSession,
} from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const schema = z.object({
  stage: z.enum(["SCREENING", "ASSESSMENT", "AI_INTERVIEW", "SHORTLISTED"]),
}).strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(
      req,
      `employer_candidate_stage:${session.id}`,
      40,
      60_000,
    );

    const { id } = await params;
    const { stage } = await readValidatedJson(req, schema, 4 * 1024);

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: { select: { id: true, companyId: true } } },
    });
    if (!application) {
      throw new ApiError("Candidate application not found.", 404);
    }

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== application.job.companyId) {
        throw new ApiError("Candidate is not in your company pipeline.", 403);
      }
    }

    if (["HIRED", "REJECTED", "WITHDRAWN"].includes(application.status)) {
      throw new ApiError(
        "This application is in a terminal state and cannot be changed through the generic pipeline workflow.",
        409,
      );
    }

    if (stage === "SHORTLISTED") {
      const process = await prisma.jobInterviewProcess.findUnique({
        where: { jobId: application.jobId },
        select: { id: true, isActive: true },
      });

      if (process?.isActive) {
        const finalRound = await prisma.interviewRound.findFirst({
          where: { processId: process.id },
          orderBy: { sequence: "desc" },
          select: { id: true },
        });

        if (finalRound) {
          const finalProgress = await prisma.interviewRoundProgress.findUnique({
            where: {
              applicationId_roundId: {
                applicationId: application.id,
                roundId: finalRound.id,
              },
            },
            select: { status: true },
          });

          if (
            !finalProgress ||
            !["ROUND_COMPLETE", "TRANSFERRED"].includes(finalProgress.status)
          ) {
            throw new ApiError(
              "Complete the configured final interview round before shortlisting this candidate.",
              409,
            );
          }
        }
      }
    }

    const updated = await prisma.application.updateMany({
      where: { id, status: application.status },
      data: { status: stage },
    });
    if (updated.count !== 1) {
      throw new ApiError(
        "Application state changed while this request was being processed. Refresh and try again.",
        409,
      );
    }

    await logAuditEvent({
      userId: session.id,
      companyId: application.job.companyId,
      action: "APPLICATION_STAGE_UPDATED",
      resource: `Application:${id}`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      details: `${application.status} -> ${stage}`,
    });

    return NextResponse.json({
      success: true,
      applicationId: id,
      stage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Use the controlled candidate-decision workflow for rejection. Generic stage updates only support screening, assessment, interview, and shortlist.",
        },
        { status: 400 },
      );
    }
    return handleApiError(error);
  }
}
