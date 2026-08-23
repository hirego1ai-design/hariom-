import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

interface ProctoringEvent {
  id: string;
  interviewId: string;
  candidateId: string;
  violationType: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

const ALLOWED_VIOLATION_TYPES = new Set([
  "TAB_SWITCH",
  "FACE_NOT_DETECTED",
  "MULTIPLE_FACES",
  "AUDIO_ANOMALY",
  "SCREEN_SHARE_STOPPED",
  "BROWSER_UNFOCUSED",
  "COPY_PASTE_DETECTED",
]);

const ALLOWED_SEVERITIES = new Set(["low", "medium", "high"]);

const proctoringEventsStore: ProctoringEvent[] = [];

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get("interviewId") || "";

    // Authorize employer/recruiter reads to interviews belonging to their company
    if (interviewId && (session.role === "EMPLOYER" || session.role === "RECRUITER")) {
      try {
        const interview = await prisma.interview.findUnique({
          where: { id: interviewId },
          include: { application: { include: { job: true } } },
        });
        const profile = await prisma.employerProfile.findUnique({
          where: { userId: session.id },
        });
        if (interview && profile && interview.application.job.companyId !== profile.companyId) {
          return jsonError("Forbidden: You do not have access to telemetry for this interview.", 403);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          throw error;
        }
      }
    }

    let events = proctoringEventsStore.filter(
      (e) => !interviewId || e.interviewId === interviewId
    );

    // If candidate, restrict strictly to their own proctoring events
    if (session.role === "CANDIDATE") {
      events = events.filter((e) => e.candidateId === session.id);
    }

    const totalSeverityScore = events.reduce((acc, e) => {
      return acc + (e.severity === "high" ? 25 : e.severity === "medium" ? 15 : 5);
    }, 0);

    const cheatingRiskScore = Math.min(100, totalSeverityScore);

    return NextResponse.json({
      success: true,
      metrics: {
        totalViolations: events.length,
        cheatingRiskScore,
        status: cheatingRiskScore > 40 ? "FLAGGED" : "CLEAN",
        events: events.slice(0, 20),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const body = await req.json();
    const { interviewId, violationType, severity } = body;

    if (!violationType || !ALLOWED_VIOLATION_TYPES.has(violationType)) {
      return jsonError("Invalid or unsupported violationType", 400);
    }

    // Verify candidate belongs to the requested interview
    if (interviewId && session.role === "CANDIDATE") {
      try {
        const interview = await prisma.interview.findUnique({
          where: { id: interviewId },
          include: { application: { include: { candidateProfile: true } } },
        });
        if (interview && interview.application.candidateProfile?.userId !== session.id) {
          return jsonError("Forbidden: Candidate is not assigned to this interview.", 403);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          throw error;
        }
      }
    }

    const cleanSeverity: "low" | "medium" | "high" =
      severity && ALLOWED_SEVERITIES.has(severity) ? severity : "medium";

    const event: ProctoringEvent = {
      id: `proc_${crypto.randomUUID()}`,
      interviewId: interviewId || `int_${session.id}`,
      candidateId: session.id,
      violationType,
      severity: cleanSeverity,
      timestamp: new Date().toISOString(),
    };

    proctoringEventsStore.unshift(event);

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "PROCTORING_VIOLATION",
          resource: `interview:${event.interviewId}`,
          details: JSON.stringify({ violationType, severity: cleanSeverity }),
        },
      });
    } catch {
      // DB fallback
    }

    return NextResponse.json({
      success: true,
      event,
      message: "Proctoring violation telemetry recorded",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
