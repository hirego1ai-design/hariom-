import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import { getOptionalEnv, requireProductionEnv } from "@/lib/env";

const SIGNAL_TTL_MS = 10 * 60 * 1_000;
const roomActionSchema = z.object({
  roomId: z.string().min(1).max(256),
  action: z.enum(["OFFER", "ANSWER", "ICE_CANDIDATE", "COMPLETE"]),
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
    where: { OR: [{ id: roomId }, { roomUrl: `/employer/active-video-interview-interviewer-view?roomId=${roomId}` }] },
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
    const participantIds = new Set([session.id, ...signals.map((signal) => signal.senderId)]);

    return NextResponse.json({
      success: true,
      room: {
        roomId,
        interviewId: interview.id,
        status: interview.status === "COMPLETED" ? "COMPLETED" : "ACTIVE",
        participantCount: participantIds.size,
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
    if (["COMPLETED", "FEEDBACK_SUBMITTED", "CANCELLED"].includes(interview.status)) {
      if (body.action === "COMPLETE" && session.role !== "CANDIDATE" && ["COMPLETED", "FEEDBACK_SUBMITTED"].includes(interview.status)) {
        return NextResponse.json({ success: true, roomId: body.roomId, status: "COMPLETED", idempotent: true });
      }
      throw new ApiError("Interview room is closed", 409);
    }

    if (body.action === "COMPLETE") {
      if (session.role === "CANDIDATE") throw new ApiError("Only an assigned interviewer can end the interview.", 403);
      const completed = await prisma.$transaction(async (tx) => {
        const claimed = await tx.interview.updateMany({
          where: { id: interview.id, status: { in: ["SCHEDULED", "RESCHEDULED", "LIVE"] } },
          data: { status: "COMPLETED" },
        });
        if (claimed.count !== 1) return false;
        if (interview.roundProgress) {
          await tx.interviewRoundProgress.updateMany({
            where: { id: interview.roundProgress.id, status: { in: ["SCHEDULED", "LIVE"] } },
            data: {
              status: interview.roundProgress.round.mandatoryFeedback ? "ENDED_PENDING_FEEDBACK" : "ROUND_COMPLETE",
              completedAt: interview.roundProgress.round.mandatoryFeedback ? null : new Date(),
            },
          });
        }
        return true;
      });
      if (!completed) return NextResponse.json({ success: true, roomId: body.roomId, status: "COMPLETED", idempotent: true });
    } else {
      const payload = body.action === "ICE_CANDIDATE" ? { candidate: body.candidate } : { sdp: body.sdp };
      await prisma.$transaction(async (tx) => {
        // Fence signaling against a concurrent cancel/complete. The initial
        // authorization read is not authoritative once another request mutates
        // the interview lifecycle.
        await tx.$queryRaw`SELECT id FROM "Interview" WHERE id = ${interview.id} FOR UPDATE`;
        const current = await tx.interview.findUnique({ where: { id: interview.id }, select: { status: true } });
        if (!current || !["SCHEDULED", "RESCHEDULED", "LIVE"].includes(current.status)) {
          throw new ApiError("Interview room is closed", 409);
        }
        await tx.interviewSignal.create({
          data: { interviewId: interview.id, senderId: session.id, type: body.action, payload, expiresAt: new Date(Date.now() + SIGNAL_TTL_MS) },
        });
      });
    }
    return NextResponse.json({ success: true, roomId: body.roomId, status: body.action === "COMPLETE" ? "COMPLETED" : "ACTIVE" });
  } catch (error) {
    return handleApiError(error);
  }
}
