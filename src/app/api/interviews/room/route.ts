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
import { getLiveInterviewProctoringPolicy } from "@/lib/proctoringPolicy";
import { hasCurrentLiveProctoringConsent } from "@/lib/proctoringConsent";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const SIGNAL_TTL_MS = 10 * 60 * 1_000;
const INTERVIEW_EARLY_START_GRACE_MS = 15 * 60 * 1_000;
const INTERVIEW_LATE_START_GRACE_MS = 2 * 60 * 60 * 1_000;
const SIGNALING_OPEN_STATUSES = ["SCHEDULED", "RESCHEDULED", "LIVE"] as const;
const COMPLETED_ROOM_STATUSES = ["COMPLETED", "FEEDBACK_SUBMITTED"] as const;
const roomActionSchema = z.object({
  roomId: z.string().min(1).max(256),
  action: z.enum(["OFFER", "ANSWER", "ICE_CANDIDATE", "COMPLETE"]),
  targetId: z.string().uuid().optional(),
  sdp: z.object({ type: z.enum(["offer", "answer"]), sdp: z.string().max(50_000) }).optional(),
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
  if (value.action === "OFFER" && value.sdp?.type !== "offer") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "OFFER action requires offer SDP", path: ["sdp", "type"] });
  }
  if (value.action === "ANSWER" && value.sdp?.type !== "answer") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ANSWER action requires answer SDP", path: ["sdp", "type"] });
  }
  if (value.action === "ICE_CANDIDATE" && !value.candidate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Candidate is required for this signal", path: ["candidate"] });
  }
  if (value.action !== "COMPLETE" && !value.targetId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A target participant is required for signaling", path: ["targetId"] });
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
    include: { application: { include: { candidateProfile: { include: { user: { select: { id: true, name: true } } } }, job: true } }, roundProgress: { include: { round: { include: { interviewers: { include: { user: { select: { id: true, name: true } } } } } } } } },
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
    const signalingOpen = SIGNALING_OPEN_STATUSES.includes(
      interview.status as (typeof SIGNALING_OPEN_STATUSES)[number],
    );
    if (!signalingOpen) {
      return NextResponse.json({
        success: true,
        room: {
          roomId,
          interviewId: interview.id,
          lifecycleStatus: interview.status,
          status: COMPLETED_ROOM_STATUSES.includes(
            interview.status as (typeof COMPLETED_ROOM_STATUSES)[number],
          )
            ? "COMPLETED"
            : "CLOSED",
          participantCount: 1,
          participantId: session.id,
          authorizedParticipantIds: [session.id],
          participantLabels: {},
          roundTitle: interview.roundProgress?.round.name || "Interview",
          isHost: session.role !== "CANDIDATE",
          iceServers: [],
          signaling: { offers: [], answers: [], candidates: [] },
        },
      }, { headers: { "Cache-Control": "no-store" } });
    }
    if (
      !interview.startedAt &&
      ["SCHEDULED", "RESCHEDULED"].includes(interview.status)
    ) {
      const earliestStartAt = new Date(
        interview.scheduledAt.getTime() - INTERVIEW_EARLY_START_GRACE_MS,
      );
      const latestStartAt = new Date(
        interview.scheduledAt.getTime() +
          interview.durationMins * 60_000 +
          INTERVIEW_LATE_START_GRACE_MS,
      );
      if (now < earliestStartAt) {
        throw new ApiError(
          "Interview room opens 15 minutes before the scheduled start time.",
          409,
        );
      }
      if (now > latestStartAt) {
        throw new ApiError(
          "The scheduled interview start window has passed. Reschedule the interview before opening the room.",
          409,
        );
      }
    }

    await prisma.interviewSignal.deleteMany({ where: { interviewId: interview.id, expiresAt: { lte: now } } });
    const signals = await prisma.interviewSignal.findMany({
      where: { interviewId: interview.id, expiresAt: { gt: now } },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderId: true, type: true, payload: true },
      take: 300,
    });
    const visibleSignals = signals.filter((signal) => {
      if (signal.senderId === session.id) return true;
      const payload =
        signal.payload && typeof signal.payload === "object" && !Array.isArray(signal.payload)
          ? signal.payload as Record<string, unknown>
          : {};
      return payload.targetId === session.id;
    });
    const candidateUserId = interview.application.candidateProfile?.userId;
    const assignedInterviewers = interview.roundProgress?.round.interviewers || [];
    const assignedInterviewerIds = assignedInterviewers.map((item) => item.userId);
    const authorizedParticipantIds = [candidateUserId, ...assignedInterviewerIds].filter((id): id is string => Boolean(id));
    const participantLabels = Object.fromEntries([
      ...(candidateUserId
        ? [[candidateUserId, interview.application.candidateProfile?.user?.name || "Candidate"]]
        : []),
      ...assignedInterviewers.map((item) => [item.userId, item.user?.name || "Interviewer"]),
    ]);
    const participantIds = new Set([session.id, ...signals.map((signal) => signal.senderId)]);

    return NextResponse.json({
      success: true,
      room: {
        roomId,
        interviewId: interview.id,
        lifecycleStatus: interview.status,
        status: interview.status === "COMPLETED"
          ? "COMPLETED"
          : interview.status === "CANCELLED"
            ? "CLOSED"
            : "ACTIVE",
        participantCount: participantIds.size,
        participantId: session.id,
        authorizedParticipantIds,
        participantLabels,
        roundTitle: interview.roundProgress?.round.name || "Interview",
        isHost: session.role !== "CANDIDATE",
        iceServers: iceServers(),
        signaling: {
          offers: visibleSignals.filter((signal) => signal.type === "OFFER").map((signal) => ({ id: signal.id, senderId: signal.senderId, ...(signal.payload as object) })),
          answers: visibleSignals.filter((signal) => signal.type === "ANSWER").map((signal) => ({ id: signal.id, senderId: signal.senderId, ...(signal.payload as object) })),
          candidates: visibleSignals.filter((signal) => signal.type === "ICE_CANDIDATE").map((signal) => ({ id: signal.id, senderId: signal.senderId, ...(signal.payload as object) })),
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
    if (session.role === "CANDIDATE") {
      const policy = await getLiveInterviewProctoringPolicy();
      if (
        policy.enabled &&
        !(await hasCurrentLiveProctoringConsent({
          candidateUserId: session.id,
          interviewId: interview.id,
          policyVersion: policy.policyVersion,
        }))
      ) {
        throw new ApiError(
          "Review and accept the current interview monitoring disclosure before entering.",
          409,
        );
      }
    }
    if (body.action !== "COMPLETE" && session.role !== "CANDIDATE") {
      const blocking = await prisma.interviewRoundProgress.count({
        where: { status: "ENDED_PENDING_FEEDBACK", interviewId: { not: interview.id }, round: { mandatoryFeedback: true, interviewers: { some: { userId: session.id, required: true } } }, feedbacks: { none: { authorId: session.id, finalizedAt: { not: null } } } },
      });
      if (blocking > 0) throw new ApiError("Complete your pending mandatory interview feedback before joining another interview.", 409);
    }
    if (
      COMPLETED_ROOM_STATUSES.includes(
        interview.status as (typeof COMPLETED_ROOM_STATUSES)[number],
      )
    ) {
      if (body.action === "COMPLETE" && session.role !== "CANDIDATE") {
        return NextResponse.json({
          success: true,
          roomId: body.roomId,
          status: "COMPLETED",
          idempotent: true,
        });
      }
      throw new ApiError("Interview room is closed", 409);
    }
    if (
      !SIGNALING_OPEN_STATUSES.includes(
        interview.status as (typeof SIGNALING_OPEN_STATUSES)[number],
      )
    ) {
      throw new ApiError("Interview room is closed", 409);
    }
    if (interview.application.status !== "AI_INTERVIEW") {
      throw new ApiError(
        "This application is no longer in the active interview workflow.",
        409,
      );
    }

    if (body.action === "COMPLETE") {
      if (session.role === "CANDIDATE") throw new ApiError("Only an assigned interviewer can end the interview.", 403);
      const endedAt = new Date();
      const completion = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${interview.applicationId} FOR UPDATE`;
        const lockedApplication = await tx.application.findUnique({
          where: { id: interview.applicationId },
          select: { status: true },
        });
        if (!lockedApplication || lockedApplication.status !== "AI_INTERVIEW") {
          throw new ApiError(
            "Application left the active interview workflow before completion.",
            409,
          );
        }

        await tx.$queryRaw`SELECT id FROM "Interview" WHERE id = ${interview.id} FOR UPDATE`;
        const current = await tx.interview.findUnique({
          where: { id: interview.id },
          select: { status: true, startedAt: true, completedAt: true },
        });
        if (!current) throw new ApiError("Interview not found.", 404);
        if (current.status === "COMPLETED") {
          return {
            completedNow: false,
            startedAt: current.startedAt ?? current.completedAt ?? endedAt,
          };
        }
        if (current.status !== "LIVE" || !current.startedAt) {
          throw new ApiError("Only a live interview can be completed.", 409);
        }

        const claimed = await tx.interview.updateMany({
          where: { id: interview.id, status: "LIVE", completedAt: null },
          data: { status: "COMPLETED", completedAt: endedAt },
        });
        if (claimed.count !== 1) {
          throw new ApiError("Interview completion was already processed.", 409);
        }

        if (interview.roundProgress) {
          const progress = await tx.interviewRoundProgress.updateMany({
            where: {
              id: interview.roundProgress.id,
              interviewId: interview.id,
              status: "LIVE",
            },
            data: {
              status: interview.roundProgress.round.mandatoryFeedback
                ? "ENDED_PENDING_FEEDBACK"
                : "ROUND_COMPLETE",
              completedAt: interview.roundProgress.round.mandatoryFeedback
                ? null
                : endedAt,
            },
          });
          if (progress.count !== 1) {
            throw new ApiError("Interview round completion state changed concurrently.", 409);
          }
        }

        const auditLog = await tx.auditLog.create({
          data: {
            userId: session.id,
            companyId: interview.application.job.companyId,
            action: "INTERVIEW_COMPLETED",
            resource: `Interview:${interview.id}`,
            details: JSON.stringify({
              completedAt: endedAt.toISOString(),
              applicationId: interview.applicationId,
              actorRole: session.role,
            }),
          },
        });
        await enqueueSecurityAuditEvent(tx, auditLog, session.id);

        return { completedNow: true, startedAt: current.startedAt };
      });

      if (!completion.completedNow) {
        return NextResponse.json({
          success: true,
          roomId: body.roomId,
          status: "COMPLETED",
          idempotent: true,
        });
      }

      // Never strand a completed interview because metering reconciliation is
      // unavailable. The reservation was made before the room started; actual
      // usage is reconciled afterward and unavoidable overage is recorded.
      const actualMinutes = Math.max(1, Math.ceil((endedAt.getTime() - completion.startedAt.getTime()) / 60_000));
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
        const earliestStartAt = new Date(
          interview.scheduledAt.getTime() - INTERVIEW_EARLY_START_GRACE_MS,
        );
        const latestStartAt = new Date(
          interview.scheduledAt.getTime() +
            interview.durationMins * 60_000 +
            INTERVIEW_LATE_START_GRACE_MS,
        );
        const now = new Date();
        if (now < earliestStartAt) {
          throw new ApiError(
            "Interview room signaling opens 15 minutes before the scheduled start time.",
            409,
          );
        }
        if (now > latestStartAt) {
          throw new ApiError(
            "The scheduled interview start window has passed. Reschedule the interview before opening the room.",
            409,
          );
        }

        // Candidates may pre-negotiate WebRTC signaling within the allowed
        // room window, but only an assigned interviewer can establish the
        // authoritative LIVE/start state and begin usage metering.
        if (session.role !== "CANDIDATE") {
          let videoReservationId: string | null = null;
          let proctoringReservationId: string | null = null;
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
          const proctoringReservation = await reserveCopilotCapacityIfActive({
            companyId: interview.application.job.companyId,
            actionKey: "PROCTORING_SESSION",
            quantity: 1,
            idempotencyKey: `live-interview:${interview.id}:proctoring`,
            reference: { interviewId: interview.id, applicationId: interview.applicationId },
            expiresAt: new Date(Date.now() + Math.max(4 * 60 * 60_000, interview.durationMins * 60_000 + 60 * 60_000)),
          });
          proctoringReservationId = proctoringReservation?.id || null;

          const startedAt = new Date();
          await prisma.$transaction(async (tx) => {
            // Withdrawal, round decisions and room lifecycle all serialize on
            // the application first so a terminal application can never gain a
            // newly-live interview.
            await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${interview.applicationId} FOR UPDATE`;
            const lockedApplication = await tx.application.findUnique({
              where: { id: interview.applicationId },
              select: { status: true },
            });
            if (!lockedApplication || lockedApplication.status !== "AI_INTERVIEW") {
              throw new ApiError(
                "Application is no longer eligible to start this interview.",
                409,
              );
            }

            await tx.$queryRaw`SELECT id FROM "Interview" WHERE id = ${interview.id} FOR UPDATE`;
            const currentInterview = await tx.interview.findUnique({
              where: { id: interview.id },
              select: {
                status: true,
                startedAt: true,
                scheduledAt: true,
                durationMins: true,
              },
            });
            if (!currentInterview) throw new ApiError("Interview not found.", 404);
            if (currentInterview.startedAt) {
              if (currentInterview.status !== "LIVE") {
                throw new ApiError("Interview room is no longer active.", 409);
              }
              return;
            }
            if (!["SCHEDULED", "RESCHEDULED", "LIVE"].includes(currentInterview.status)) {
              throw new ApiError("Interview is no longer eligible to start.", 409);
            }

            const lockedEarliestStartAt = new Date(
              currentInterview.scheduledAt.getTime() - INTERVIEW_EARLY_START_GRACE_MS,
            );
            const lockedLatestStartAt = new Date(
              currentInterview.scheduledAt.getTime() +
                currentInterview.durationMins * 60_000 +
                INTERVIEW_LATE_START_GRACE_MS,
            );
            if (startedAt < lockedEarliestStartAt) {
              throw new ApiError(
                "Interview room signaling opens 15 minutes before the scheduled start time.",
                409,
              );
            }
            if (startedAt > lockedLatestStartAt) {
              throw new ApiError(
                "The scheduled interview start window has passed. Reschedule the interview before opening the room.",
                409,
              );
            }

            const claimed = await tx.interview.updateMany({
              where: {
                id: interview.id,
                startedAt: null,
                status: { in: ["SCHEDULED", "RESCHEDULED", "LIVE"] },
              },
              data: { startedAt, status: "LIVE" },
            });
            if (claimed.count !== 1) {
              throw new ApiError("Interview start state changed concurrently.", 409);
            }

            if (interview.roundProgress) {
              const progress = await tx.interviewRoundProgress.updateMany({
                where: {
                  id: interview.roundProgress.id,
                  interviewId: interview.id,
                  status: { in: ["PENDING", "SCHEDULED"] },
                },
                data: { status: "LIVE", startedAt },
              });
              if (progress.count !== 1) {
                throw new ApiError(
                  "Interview round is no longer eligible to start.",
                  409,
                );
              }
            }

            const auditLog = await tx.auditLog.create({
              data: {
                userId: session.id,
                companyId: interview.application.job.companyId,
                action: "INTERVIEW_STARTED",
                resource: `Interview:${interview.id}`,
                details: JSON.stringify({
                  applicationId: interview.applicationId,
                  startedAt: startedAt.toISOString(),
                  actorRole: session.role,
                  scheduledAt: currentInterview.scheduledAt.toISOString(),
                }),
              },
            });
            await enqueueSecurityAuditEvent(tx, auditLog, session.id);
          });
          } catch (startError) {
            if (proctoringReservationId) {
              await releaseCopilotReservation(proctoringReservationId).catch(() => undefined);
            }
            if (videoReservationId) {
              await releaseCopilotReservation(videoReservationId).catch(() => undefined);
            }
            throw startError;
          }
        }
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
