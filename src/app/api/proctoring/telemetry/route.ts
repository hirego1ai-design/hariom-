import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, jsonError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { getLiveInterviewProctoringPolicy } from "@/lib/proctoringPolicy";
import { hasCurrentLiveProctoringConsent } from "@/lib/proctoringConsent";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

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
  clientEventId: z.string().uuid("Invalid proctoring event ID."),
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
        clientEventId: true,
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
    const advisoryReviewScore = Math.min(100, totalSeverityScore);

    return NextResponse.json({
      success: true,
      metrics: {
        totalViolations: events.length,
        advisoryReviewScore,
        // Browser telemetry is evidence, not an adverse hiring decision. A
        // trained reviewer must evaluate it alongside independent signals.
        status: advisoryReviewScore > 40 ? "REVIEW_REQUIRED" : "NO_REVIEW_REQUIRED",
        evidenceSource: "CLIENT_REPORTED_UNVERIFIED",
        scoreMeaning: "RULE_BASED_REVIEW_PRIORITY_NOT_CHEATING_PROBABILITY",
        requiresHumanReview: advisoryReviewScore > 40,
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
    const interview = await assertInterviewAccess(session, body.interviewId, "write");
    if (
      interview.status !== "LIVE" ||
      !interview.startedAt ||
      interview.completedAt
    ) {
      throw new ApiError(
        "Proctoring telemetry is accepted only while the interview is live and has actually started.",
        409,
      );
    }

    const policy = await getLiveInterviewProctoringPolicy();
    if (!policy.enabled) {
      throw new ApiError("Live interview browser monitoring is not enabled.", 409);
    }
    const consented = await hasCurrentLiveProctoringConsent({
      candidateUserId: session.id,
      interviewId: body.interviewId,
      policyVersion: policy.policyVersion,
    });
    if (!consented) {
      throw new ApiError(
        "Current interview monitoring consent is required before telemetry can be recorded.",
        409,
      );
    }

    const signalEnabled =
      (body.violationType === "TAB_SWITCH" && policy.trackTabSwitch) ||
      (body.violationType === "COPY_PASTE_DETECTED" && policy.trackClipboard) ||
      (body.violationType === "BROWSER_UNFOCUSED" && policy.trackContextMenu);
    if (!signalEnabled) {
      throw new ApiError(
        "This browser observation is not enabled by the current monitoring policy.",
        422,
      );
    }

    const severity = severityForProctoringEvent(body.violationType);

    let recorded:
      | {
          event: {
            id: string;
            interviewId: string;
            candidateId: string;
            clientEventId: string | null;
            violationType: string;
            severity: string;
            createdAt: Date;
          };
          duplicate: boolean;
        }
      | null = null;

    try {
      recorded = await prisma.$transaction(async (tx) => {
        const existing = await tx.proctoringTelemetry.findFirst({
          where: {
            interviewId: body.interviewId,
            candidateId: session.id,
            clientEventId: body.clientEventId,
          },
          select: {
            id: true,
            interviewId: true,
            candidateId: true,
            clientEventId: true,
            violationType: true,
            severity: true,
            createdAt: true,
          },
        });
        if (existing) return { event: existing, duplicate: true };

        // Separate observations of the same type are rate-limited briefly, but
        // retries of the exact same browser observation are handled by the
        // durable clientEventId uniqueness above and return the stored event.
        const duplicateSince = new Date(Date.now() - 3_000);
        const tooFrequent = await tx.proctoringTelemetry.findFirst({
          where: {
            interviewId: body.interviewId,
            candidateId: session.id,
            violationType: body.violationType,
            createdAt: { gte: duplicateSince },
          },
          select: { id: true },
        });
        if (tooFrequent) {
          throw new ApiError("Proctoring event frequency limit.", 429, 3);
        }

        const event = await tx.proctoringTelemetry.create({
          data: {
            interviewId: body.interviewId,
            candidateId: session.id,
            clientEventId: body.clientEventId,
            violationType: body.violationType,
            severity,
          },
          select: {
            id: true,
            interviewId: true,
            candidateId: true,
            clientEventId: true,
            violationType: true,
            severity: true,
            createdAt: true,
          },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            userId: session.id,
            companyId: interview.application.job.companyId,
            action: "PROCTORING_VIOLATION",
            resource: `Interview:${event.interviewId}`,
            details: JSON.stringify({
              telemetryEventId: event.id,
              clientEventId: body.clientEventId,
              violationType: event.violationType,
              severity: event.severity,
              evidenceSource: "CLIENT_REPORTED_UNVERIFIED",
              policyVersion: policy.policyVersion,
              interviewStartedAt: interview.startedAt.toISOString(),
            }),
          },
        });
        await enqueueSecurityAuditEvent(tx, auditLog, session.id);

        return { event, duplicate: false };
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const existing = await prisma.proctoringTelemetry.findFirst({
          where: {
            interviewId: body.interviewId,
            candidateId: session.id,
            clientEventId: body.clientEventId,
          },
          select: {
            id: true,
            interviewId: true,
            candidateId: true,
            clientEventId: true,
            violationType: true,
            severity: true,
            createdAt: true,
          },
        });
        if (existing) recorded = { event: existing, duplicate: true };
        else throw error;
      } else {
        throw error;
      }
    }

    if (!recorded) {
      throw new ApiError("Proctoring event could not be persisted.", 500);
    }

    return NextResponse.json({
      success: true,
      duplicate: recorded.duplicate,
      event: {
        ...recorded.event,
        timestamp: recorded.event.createdAt.toISOString(),
      },
      message: recorded.duplicate
        ? "Client-reported proctoring event was already recorded."
        : "Client-reported proctoring event recorded for human review.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
