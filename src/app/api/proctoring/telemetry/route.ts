import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, jsonError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const telemetrySchema = z.object({
  interviewId: z.string().uuid("Invalid interview ID."),
  violationType: z.enum([
    "TAB_SWITCH",
    "FACE_NOT_DETECTED",
    "MULTIPLE_FACES",
    "AUDIO_ANOMALY",
    "SCREEN_SHARE_STOPPED",
    "BROWSER_UNFOCUSED",
    "COPY_PASTE_DETECTED",
  ]),
  severity: z.enum(["low", "medium", "high"]),
});

async function getInterviewWithOwner(interviewId: string) {
  return prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          candidateProfile: { select: { userId: true } },
          job: { select: { companyId: true } },
        },
      },
    },
  });
}

type InterviewWithOwner = Awaited<ReturnType<typeof getInterviewWithOwner>>;

async function assertInterviewAccess(
  session: NonNullable<ReturnType<typeof getCurrentSession>>,
  interviewId: string,
  purpose: "read" | "write",
): Promise<NonNullable<InterviewWithOwner>> {
  const interview = await getInterviewWithOwner(interviewId);
  if (!interview) throw new ApiError("Interview not found.", 404);

  if (session.role === "ADMIN") return interview;

  const candidateUserId = interview.application.candidateProfile?.userId;
  if (session.role === "CANDIDATE") {
    if (candidateUserId !== session.id) {
      throw new ApiError("You do not have access to this interview.", 403);
    }
    return interview;
  }

  if (purpose === "write") {
    throw new ApiError("Only the assigned candidate may submit proctoring telemetry.", 403);
  }

  if (session.role === "EMPLOYER" || session.role === "RECRUITER") {
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
      select: { companyId: true },
    });
    if (!profile || profile.companyId !== interview.application.job.companyId) {
      throw new ApiError("You do not have access to this interview.", 403);
    }
    return interview;
  }

  throw new ApiError("You do not have access to this interview.", 403);
}

export async function GET(request: NextRequest) {
  try {
    const session = getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);

    enforceRateLimit(request, "proctoring_telemetry_read", 60, 60_000);
    const interviewId = new URL(request.url).searchParams.get("interviewId");
    if (!interviewId) return jsonError("interviewId is required.", 400);

    await assertInterviewAccess(session, interviewId, "read");
    const events = await prisma.proctoringTelemetry.findMany({
      where: { interviewId },
      select: {
        id: true,
        interviewId: true,
        candidateId: true,
        violationType: true,
        severity: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totalSeverityScore = events.reduce(
      (score, event) => score + (event.severity === "high" ? 25 : event.severity === "medium" ? 15 : 5),
      0,
    );
    const cheatingRiskScore = Math.min(100, totalSeverityScore);

    return NextResponse.json({
      success: true,
      metrics: {
        totalViolations: events.length,
        cheatingRiskScore,
        status: cheatingRiskScore > 40 ? "FLAGGED" : "CLEAN",
        events: events.slice(0, 20).map((event) => ({ ...event, timestamp: event.createdAt.toISOString() })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") {
      return jsonError("Only candidates may submit proctoring telemetry.", 403);
    }

    enforceRateLimit(request, "proctoring_telemetry_write", 120, 60_000);
    const body = await readValidatedJson(request, telemetrySchema);
    await assertInterviewAccess(session, body.interviewId, "write");

    const event = await prisma.proctoringTelemetry.create({
      data: {
        interviewId: body.interviewId,
        candidateId: session.id,
        violationType: body.violationType,
        severity: body.severity,
      },
      select: {
        id: true,
        interviewId: true,
        candidateId: true,
        violationType: true,
        severity: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "PROCTORING_VIOLATION",
        resource: `interview:${event.interviewId}`,
        details: JSON.stringify({ violationType: event.violationType, severity: event.severity }),
      },
    });

    return NextResponse.json({
      success: true,
      event: { ...event, timestamp: event.createdAt.toISOString() },
      message: "Proctoring violation telemetry recorded.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
