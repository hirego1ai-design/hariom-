import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const INTERVIEW_EARLY_START_GRACE_MS = 15 * 60 * 1_000;
const INTERVIEW_LATE_START_GRACE_MS = 2 * 60 * 60 * 1_000;

function parseMetadata(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function legacyRoomId(roomUrl: string | null): string | null {
  if (!roomUrl?.startsWith("/employer/active-video-interview-interviewer-view?")) return null;
  try {
    return new URL(roomUrl, "https://www.hiregoai.com").searchParams.get("roomId");
  } catch {
    return null;
  }
}

function roomAvailability(interview: {
  status: string;
  scheduledAt: Date;
  durationMins: number;
  startedAt: Date | null;
}) {
  if (interview.status === "LIVE" || interview.startedAt) {
    return {
      canEnterRoom: interview.status === "LIVE",
      roomAvailabilityMessage:
        interview.status === "LIVE"
          ? "Interview room is live."
          : "Interview room is no longer active.",
    };
  }

  if (!["SCHEDULED", "RESCHEDULED"].includes(interview.status)) {
    return { canEnterRoom: false, roomAvailabilityMessage: "Interview room is not active." };
  }

  const now = Date.now();
  const earliest = interview.scheduledAt.getTime() - INTERVIEW_EARLY_START_GRACE_MS;
  const latest =
    interview.scheduledAt.getTime() +
    interview.durationMins * 60_000 +
    INTERVIEW_LATE_START_GRACE_MS;

  if (now < earliest) {
    return {
      canEnterRoom: false,
      roomAvailabilityMessage: "Online room opens 15 minutes before the scheduled start time.",
    };
  }
  if (now > latest) {
    return {
      canEnterRoom: false,
      roomAvailabilityMessage: "The interview start window has passed. Wait for the employer to reschedule.",
    };
  }
  return {
    canEnterRoom: true,
    roomAvailabilityMessage: "Online room is available.",
  };
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_interviews_list", 60, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Candidate access required.", 403);
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });
    if (!candidateProfile) throw new ApiError("Candidate profile not found.", 404);

    const rows = await prisma.interview.findMany({
      where: {
        application: { candidateProfileId: candidateProfile.id },
        status: { in: ["SCHEDULED", "RESCHEDULED", "LIVE"] },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMins: true,
        status: true,
        roomUrl: true,
        aiFeedback: true,
        startedAt: true,
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
      take: 100,
    });

    const interviews = rows.map((interview) => {
      const metadata = parseMetadata(interview.aiFeedback);
      const metadataMode =
        typeof metadata.mode === "string" ? metadata.mode.toUpperCase() : null;
      const mode =
        metadataMode === "ONLINE" || metadataMode === "OFFLINE" || metadataMode === "PHONE"
          ? metadataMode
          : interview.roomUrl?.startsWith("OFFLINE:")
            ? "OFFLINE"
            : interview.roomUrl?.startsWith("PHONE:")
              ? "PHONE"
              : "ONLINE";
      const metadataRoomId =
        typeof metadata.roomId === "string" && metadata.roomId.length <= 256
          ? metadata.roomId
          : null;
      const roomId = mode === "ONLINE" ? metadataRoomId ?? legacyRoomId(interview.roomUrl) : null;
      const availability = roomAvailability(interview);

      return {
        id: interview.id,
        applicationId: interview.application.id,
        scheduledAt: interview.scheduledAt.toISOString(),
        durationMins: interview.durationMins,
        status: interview.status,
        mode,
        roomId: Boolean(roomId) && availability.canEnterRoom ? roomId : null,
        canEnterRoom: Boolean(roomId) && availability.canEnterRoom,
        roomAvailabilityMessage:
          mode === "ONLINE" && roomId
            ? availability.roomAvailabilityMessage
            : mode === "ONLINE"
              ? "Online room details are not available yet."
              : null,
        address:
          mode === "OFFLINE" && typeof metadata.address === "string"
            ? metadata.address
            : null,
        contactNumber:
          (mode === "OFFLINE" || mode === "PHONE") &&
          typeof metadata.contactNumber === "string"
            ? metadata.contactNumber
            : null,
        instructions:
          typeof metadata.instructions === "string" ? metadata.instructions : null,
        job: interview.application.job,
      };
    });

    return NextResponse.json(
      { success: true, interviews },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
