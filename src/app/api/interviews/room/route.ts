import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import { getOptionalEnv, requireProductionEnv } from "@/lib/env";
import {
  reconcileCopilotReservation,
  releaseCopilotReservation,
  reserveCopilotCapacityIfActive,
} from "@/lib/copilot/capacity";

const SIGNAL_TTL_MS = 10 * 60 * 1_000;
const roomActionSchema = z.object({
  roomId: z.string().min(1).max(256),
  action: z.enum(["OFFER", "ANSWER", "ICE_CANDIDATE", "COMPLETE"]),
  targetId: z.string().uuid().optional(),
  sdp: z.object({ type: z.string().max(32), sdp: z.string().max(50_000) }).optional(),
  candidate: z.object({
    candidate: z.string().max(4_000),
    sdpMid: z.string().nullable().optional(),
    sdpMLineIndex: z.number().int().min(0).max(100).nullable().optional(),
    usernameFragment: z.string().max(256).nullable().optional(),
  }).optional(),
}).superRefine((value, ctx) => {
  if ((value.action === "OFFER" || value.action === "ANSWER") && !value.sdp) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SDP is required for this signal", path: ["sdp"] });
  }
  if (value.action === "ICE_CANDIDATE" && !value.candidate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Candidate is required for this signal", path: ["candidate"] });
  }
});

async function findAuthorizedInterview(session: { id: string; role: string }, roomId: string) {
  const interview = await prisma.interview.findFirst({
    where: {
      OR: [
        { id: roomId },
        { aiFeedback: { contains: `"roomId":"${roomId}"` } },
        // Backward compatibility for interviews scheduled before room IDs were
        // persisted in metadata.
        { roomUrl: `/employer/active-video-interview-interviewer-view?roomId=${roomId}` },
      ],
    },
    include: { application: { include: { candidateProfile: true, job: true } }, roundProgress: { include: { round: { include: { interviewers: true } } } } },
  });
  if (!interview) return null;
  const candidateUserId = interview.application.candidateProfile?.userId;
  if (session.role === "CANDIDATE") return session.id === candidateUserId ? interview : null;
  if (session.role !== "EMPLOYER" && session.role !== "RECRUITER" && session.role !== "ADMIN") return null;
  if (!interview.roundProgress?.round.interviewers.some((item) => item.userId === session.id)) return null;
  if (session.role === "ADMIN") return interview.roundProgress?.round.interviewers.some((item) => item.userId === session.id) ? interview : null;
  const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id }, select: { companyId: true } });
  return profile?.companyId === interview.application.job.companyId ? interview : null;
}

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

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "interview_room_poll", 240, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    const roomId = new URL(req.url).searchParams.get("roomId");
    if (!roomId || roomId.length > 256) return jsonError("roomId is required", 400);
    const interview = await findAuthorizedInterview(session, roomId);
    if (!interview) return jsonError("Forbidden: You are not an authorized participant for this interview.", 403);

    const now = new Date();
    await prisma.interviewSignal.deleteMany({ where: { interviewId: interview.id, expiresAt: { lte: now } } });
    const signals = await prisma.interviewSignal.findMany({
      where: { interviewId: interview.id, expiresAt: { gt: now } },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderId: true, type: true, payload: true },
      take: 300,
    });
    const candidateUserId = interview.application.candidateProfile?.userId;
    const assignedInterviewerIds = interview.roundProgress?.round.interviewers.map((item) => item.userId) || [];
    const authorizedParticipantIds = [candidateUserId, ...assignedInterviewerIds].filter((id): id is string => Boolean(id));
    const participantIds = new Set([session.id, ...signals.map((signal) => signal.senderId)]);

    return NextResponse.json({
      success: true,
      room: {
        roomId,
        interviewId: interview.id,
        status: interview.status === "COMPLETED"
          ? "COMPLETED"
          : interview.status === "CANCELLED"
            ? "CLOSED"
            : "ACTIVE",
        participantCount: participantIds.size,
        participantId: session.id,
        authorizedParticipantIds,
        isHost: session.role !== "CANDIDATE",
        iceServers: iceServers(),
        signaling: {
          offers: signals.filter((signal) => signal.type === "OFFER").map((signal) => ({ id: signal.id, senderId: signal.senderId, ...(signal.payload as object) })),
          answers: signals.filter((signal) => signal.type === "ANSWER").map((signal) => ({ id: signal.id, senderId: signal.senderId, ...(signal.payload as object) })),
          candidates: signals.filter((signal) => signal.type === "ICE_CANDIDATE").map((signal) => ({ id: signal.id, senderId: signal.senderId, ...(signal.payload as object) })),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "interview_room_signal", 180, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    const body = await readValidatedJson(req, roomActionSchema, 64 * 1024);
    const interview = await findAuthorizedInterview(session, body.roomId);
    if (!interview) return jsonError("Forbidden: Unauthorized room signaling action.", 403);
    if (body.action !== "COMPLETE" && session.role !== "CANDIDATE") {
      const blocking = await prisma.interviewRoundProgress.count({
        where: { status: "ENDED_PENDING_FEEDBACK", interviewId: { not: interview.id }, round: { mandatoryFeedback: true, interviewers: { some: { userId: session.id, required: true } } }, feedbacks: { none: { authorId: session.id, finalizedAt: { not: null } } } },
      });
      if (blocking > 0) throw new ApiError("Complete your pending mandatory interview feedback before joining another interview.", 409);
    }
    if (interview.status === "COMPLETED" || interview.status === "CANCELLED") {
      throw new ApiError("Interview room is closed", 409);
    }

    if (body.action === "COMPLETE") {
      if (session.role === "CANDIDATE") throw new ApiError("Only an assigned interviewer can end the interview.", 403);
      const endedAt = new Date();
      const effectiveStartedAt = interview.startedAt || endedAt;
      await prisma.$transaction(async (tx) => {
        await tx.interview.update({
          where: { id: interview.id },
          data: {
            status: "COMPLETED",
            completedAt: endedAt,
            ...(interview.startedAt ? {} : { startedAt: endedAt }),
          },
        });
        if (interview.roundProgress) {
          await tx.interviewRoundProgress.update({
            where: { id: interview.roundProgress.id },
            data: {
              status: interview.roundProgress.round.mandatoryFeedback
                ? "ENDED_PENDING_FEEDBACK"
                : "ROUND_COMPLETE",
              completedAt: interview.roundProgress.round.mandatoryFeedback
                ? null
                : endedAt,
            },
          });
        }
      });

      // Never strand a completed interview because metering reconciliation is
      // unavailable. The reservation was made before the room started; actual
      // usage is reconciled afterward and unavoidable overage is recorded.
      const actualMinutes = Math.max(1, Math.ceil((endedAt.getTime() - effectiveStartedAt.getTime()) / 60_000));
      const reservations = await prisma.copilotUsageReservation.findMany({
        where: {
          companyId: interview.application.job.companyId,
          interviewId: interview.id,
          idempotencyKey: { in: [
            `live-interview:${interview.id}:video`,
            `live-interview:${interview.id}:proctoring`,
          ] },
        },
      });
      for (const reservation of reservations) {
        try {
          await reconcileCopilotReservation({
            reservationId: reservation.id,
            actualQuantity: reservation.actionKey === "VIDEO_INTERVIEW_MINUTE" ? actualMinutes : 1,
            allowOverage: true,
            metadata: {
              scheduledDurationMins: interview.durationMins,
              actualDurationMins: actualMinutes,
              completedAt: endedAt.toISOString(),
            },
          });
        } catch (meterError) {
          await prisma.auditLog.create({
            data: {
              companyId: interview.application.job.companyId,
              action: "COPILOT_USAGE_RECONCILIATION_FAILED",
              resource: `Interview:${interview.id}`,
              details: meterError instanceof Error ? meterError.message.slice(0, 500) : "Unknown metering reconciliation failure",
            },
          }).catch(() => undefined);
        }
      }
    } else {
      if (!interview.startedAt) {
        let videoReservationId: string | null = null;
        try {
          const videoReservation = await reserveCopilotCapacityIfActive({
            companyId: interview.application.job.companyId,
            actionKey: "VIDEO_INTERVIEW_MINUTE",
            quantity: Math.max(1, interview.durationMins),
            idempotencyKey: `live-interview:${interview.id}:video`,
            reference: { interviewId: interview.id, applicationId: interview.applicationId },
            expiresAt: new Date(Date.now() + Math.max(4 * 60 * 60_000, interview.durationMins * 60_000 + 60 * 60_000)),
          });
          videoReservationId = videoReservation?.id || null;
          await reserveCopilotCapacityIfActive({
            companyId: interview.application.job.companyId,
            actionKey: "PROCTORING_SESSION",
            quantity: 1,
            idempotencyKey: `live-interview:${interview.id}:proctoring`,
            reference: { interviewId: interview.id, applicationId: interview.applicationId },
            expiresAt: new Date(Date.now() + Math.max(4 * 60 * 60_000, interview.durationMins * 60_000 + 60 * 60_000)),
          });
        } catch (meterError) {
          if (videoReservationId) await releaseCopilotReservation(videoReservationId).catch(() => undefined);
          throw meterError;
        }

        await prisma.interview.updateMany({
          where: {
            id: interview.id,
            startedAt: null,
            status: { in: ["SCHEDULED", "RESCHEDULED", "LIVE"] },
          },
          data: { startedAt: new Date(), status: "LIVE" },
        });
      }
      if (body.targetId) {
        const candidateUserId = interview.application.candidateProfile?.userId;
        const assignedIds = interview.roundProgress?.round.interviewers.map((item) => item.userId) || [];
        if (![candidateUserId, ...assignedIds].includes(body.targetId) || body.targetId === session.id) {
          throw new ApiError("Signal target is not an authorized room participant.", 403);
        }
      }
      const payload = body.action === "ICE_CANDIDATE"
        ? { candidate: body.candidate, targetId: body.targetId || null }
        : { sdp: body.sdp, targetId: body.targetId || null };
      await prisma.interviewSignal.create({
        data: { interviewId: interview.id, senderId: session.id, type: body.action, payload, expiresAt: new Date(Date.now() + SIGNAL_TTL_MS) },
      });
    }
    return NextResponse.json({ success: true, roomId: body.roomId, status: body.action === "COMPLETE" ? "COMPLETED" : "ACTIVE" });
  } catch (error) {
    return handleApiError(error);
  }
}
