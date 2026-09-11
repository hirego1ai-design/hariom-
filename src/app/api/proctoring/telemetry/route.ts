import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, jsonError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const violationTypeSchema = z.enum([
  "TAB_SWITCH",
  "FACE_NOT_DETECTED",
  "MULTIPLE_FACES",
  "AUDIO_ANOMALY",
  "SCREEN_SHARE_STOPPED",
  "BROWSER_UNFOCUSED",
  "COPY_PASTE_DETECTED",
]);

const telemetrySchema = z.object({
  interviewId: z.string().uuid("Invalid interview ID."),
  // The browser reports a raw event only. Severity is an authoritative server
  // policy decision, never a candidate-controlled input.
  violationType: violationTypeSchema,
}).strict();

type ViolationType = z.infer<typeof violationTypeSchema>;
type Severity = "low" | "medium" | "high";

const SERVER_SEVERITY: Record<ViolationType, Severity> = {
  TAB_SWITCH: "medium",
  FACE_NOT_DETECTED: "high",
  MULTIPLE_FACES: "high",
  AUDIO_ANOMALY: "low",
  SCREEN_SHARE_STOPPED: "high",
  BROWSER_UNFOCUSED: "low",
  COPY_PASTE_DETECTED: "medium",
};

const SEVERITY_WEIGHT: Record<Severity, number> = { low: 5, medium: 15, high: 25 };

export function severityForProctoringEvent(violationType: ViolationType): Severity {
  return SERVER_SEVERITY[violationType];
}

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
  session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>,
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
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);

    await enforceRateLimit(request, "proctoring_telemetry_read", 60, 60_000);
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

    const totalSeverityScore = events.reduce((score, event) => {
      const severity = event.severity as Severity;
      return score + (SEVERITY_WEIGHT[severity] ?? 0);
    }, 0);
    const cheatingRiskScore = Math.min(100, totalSeverityScore);

    return NextResponse.json({
      success: true,
      metrics: {
        totalViolations: events.length,
        cheatingRiskScore,
        // Browser telemetry is evidence, not an adverse hiring decision. A
        // trained reviewer must evaluate it alongside independent signals.
        status: cheatingRiskScore > 40 ? "REVIEW_REQUIRED" : "NO_REVIEW_REQUIRED",
        evidenceSource: "CLIENT_REPORTED_UNVERIFIED",
        requiresHumanReview: cheatingRiskScore > 40,
        events: events.slice(0, 20).map((event) => ({ ...event, timestamp: event.createdAt.toISOString() })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") {
      return jsonError("Only candidates may submit proctoring telemetry.", 403);
    }

    await enforceRateLimit(request, "proctoring_telemetry_write", 120, 60_000);
    const body = await readValidatedJson(request, telemetrySchema);
    await assertInterviewAccess(session, body.interviewId, "write");
    const severity = severityForProctoringEvent(body.violationType);

    // Do not let a client inflate the advisory score by replaying the same
    // browser event in a tight loop. This is deliberately per event type so
    // distinct raw observations remain available to the reviewer.
    const duplicateSince = new Date(Date.now() - 3_000);
    const duplicate = await prisma.proctoringTelemetry.findFirst({
      where: {
        interviewId: body.interviewId,
        candidateId: session.id,
        violationType: body.violationType,
        createdAt: { gte: duplicateSince },
      },
      select: { id: true },
    });
    if (duplicate) throw new ApiError("Duplicate proctoring event ignored.", 429, 3);

    const event = await prisma.proctoringTelemetry.create({
      data: {
        interviewId: body.interviewId,
        candidateId: session.id,
        violationType: body.violationType,
        severity,
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
        details: JSON.stringify({
          violationType: event.violationType,
          severity: event.severity,
          evidenceSource: "CLIENT_REPORTED_UNVERIFIED",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      event: { ...event, timestamp: event.createdAt.toISOString() },
      message: "Client-reported proctoring event recorded for human review.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
