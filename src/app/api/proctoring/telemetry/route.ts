import { NextRequest, NextResponse } from "next/server";
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

const proctoringEventsStore: ProctoringEvent[] = [];

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get("interviewId") || "";

    const events = proctoringEventsStore.filter(
      (e) => !interviewId || e.interviewId === interviewId
    );

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

    if (!violationType) {
      return jsonError("violationType is required", 400);
    }

    const event: ProctoringEvent = {
      id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      interviewId: interviewId || `int_${session.id}`,
      candidateId: session.id,
      violationType,
      severity: severity || "medium",
      timestamp: new Date().toISOString(),
    };

    proctoringEventsStore.unshift(event);

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "PROCTORING_VIOLATION",
          resource: `interview:${event.interviewId}`,
          details: JSON.stringify({ violationType, severity }),
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
