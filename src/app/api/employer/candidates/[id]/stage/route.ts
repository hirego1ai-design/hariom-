import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";

const schema = z.object({
  stage: z.literal("SCREENING"),
}).strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession(req.headers);
  if (
    !session ||
    !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await enforceRateLimit(
      req,
      `employer_candidate_stage:${session.id}`,
      40,
      60_000,
    );

    const { id } = await params;
    const { stage } = schema.parse(await req.json());
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        gates: {
          select: { status: true },
        },
      },
    });
    if (!application) {
      return NextResponse.json(
        { success: false, error: "Candidate application not found." },
        { status: 404 },
      );
    }

    if (session.role !== "ADMIN") {
      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
      });
      if (!profile || profile.companyId !== application.job.companyId) {
        return NextResponse.json(
          {
            success: false,
            error: "Candidate is not in your company pipeline.",
          },
          { status: 403 },
        );
      }
    }

    if (["HIRED", "REJECTED", "WITHDRAWN"].includes(application.status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This application is in a terminal state and cannot be changed through the generic pipeline workflow.",
        },
        { status: 409 },
      );
    }

    if (application.gates.some((gate) => ["REQUIRED", "IN_PROGRESS"].includes(gate.status))) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Complete the candidate's required assessment/validation gates before screening.",
        },
        { status: 409 },
      );
    }

    if (!["APPLIED", "SCREENING"].includes(application.status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Assessment, interview and shortlist stages are controlled by their dedicated workflows and cannot be set manually.",
        },
        { status: 409 },
      );
    }

    if (application.status === "SCREENING") {
      return NextResponse.json({
        success: true,
        applicationId: id,
        stage,
        idempotent: true,
      });
    }

    const updated = await prisma.application.updateMany({
      where: { id, status: "APPLIED" },
      data: { status: stage },
    });
    if (updated.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Application state changed while this request was being processed. Refresh and try again.",
        },
        { status: 409 },
      );
    }

    await logAuditEvent({
      userId: session.id,
      companyId: application.job.companyId,
      action: "APPLICATION_STAGE_ADVANCED_TO_SCREENING",
      resource: `Application:${id}`,
      details: "Manual operational transition APPLIED -> SCREENING. Assessment, interview and shortlist remain workflow-owned states.",
    });

    return NextResponse.json({ success: true, applicationId: id, stage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only the Screening operational stage can be moved manually. Assessment, interview, shortlist, rejection and joining use controlled workflows.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Unable to update candidate stage." },
      { status: 500 },
    );
  }
}
