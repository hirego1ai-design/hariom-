import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError, ApiError } from "@/lib/apiSecurity";
import { getOptionalEnv, requireProductionEnv } from "@/lib/env";

/**
 * Generate ICE servers for WebRTC connection
 * Returns STUN server + TURN server (if configured)
 */
function iceServers() {
  const turnUrl = getOptionalEnv("TURN_URL");
  const username = getOptionalEnv("TURN_USERNAME");
  const credential = getOptionalEnv("TURN_CREDENTIAL");
  if (process.env.NODE_ENV === "production" && (!turnUrl || !username || !credential)) {
    requireProductionEnv("TURN_URL");
    requireProductionEnv("TURN_USERNAME");
    requireProductionEnv("TURN_CREDENTIAL");
  }
  return [
    { urls: "stun:stun.l.google.com:19302" },
    ...(turnUrl && username && credential ? [{ urls: turnUrl, username, credential }] : []),
  ];
}

/**
 * Verify that the authenticated user's company owns the interview
 */
async function authorizedInterview(id: string, session: { id: string; role: string }) {
  const interview = await prisma.interview.findFirst({
    where: {
      id,
    },
    include: {
      application: {
        include: {
          job: { include: { company: true } },
        },
      },
    },
  });

  if (!interview) return null;
  if (session.role === "ADMIN") return interview;

  const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id } });
  return profile?.companyId === interview.application.job.companyId ? interview : null;
}

/**
 * GET /api/employer/interviews/[id]/room-credentials
 * 
 * Fetches room credentials (ICE servers) for an interview.
 * Returns 403 if user's company doesn't own the interview.
 * Returns 404 if interview not found or user unauthorized.
 * 
 * Response: { roomId, accessToken, credentials: { iceServers, ... } }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await enforceRateLimit(request, "employer_interview_room_credentials", 60, 60_000);

  const session = await getCurrentSession(request.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const interview = await authorizedInterview(id, session);

    // Not found or access denied
    if (!interview) {
      return NextResponse.json(
        { success: false, error: "Interview not found or access denied" },
        { status: 404 }
      );
    }

    // Parse metadata to get roomId
    let roomId = id; // Default to interview ID
    try {
      if (interview.aiFeedback) {
        const meta = JSON.parse(interview.aiFeedback);
        if (typeof meta.roomId === "string") {
          roomId = meta.roomId;
        }
      }
    } catch {
      // If metadata is invalid, fall back to interview ID
    }

    return NextResponse.json({
      success: true,
      roomId,
      accessToken: null, // Legacy compatibility field
      credentials: {
        iceServers: iceServers(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
