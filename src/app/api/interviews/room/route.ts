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
    where: { OR: [{ id: roomId }, { roomUrl: { contains: roomId } }] },
    include: { application: { include: { candidateProfile: true, job: true } } },
  });
  if (!interview) return null;
  if (session.role === "ADMIN") return interview;

  const candidateUserId = interview.application.candidateProfile?.userId;
  if (session.role === "CANDIDATE") return session.id === candidateUserId ? interview : null;
  if (session.role !== "EMPLOYER" && session.role !== "RECRUITER") return null;
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
    const session = getCurrentSession(req.headers);
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
    const session = getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    const body = await readValidatedJson(req, roomActionSchema, 64 * 1024);
    const interview = await findAuthorizedInterview(session, body.roomId);
    if (!interview) return jsonError("Forbidden: Unauthorized room signaling action.", 403);
    if (interview.status === "COMPLETED") throw new ApiError("Interview room is closed", 409);

    if (body.action === "COMPLETE") {
      await prisma.interview.update({ where: { id: interview.id }, data: { status: "COMPLETED" } });
    } else {
      const payload = body.action === "ICE_CANDIDATE" ? { candidate: body.candidate } : { sdp: body.sdp };
      await prisma.interviewSignal.create({
        data: { interviewId: interview.id, senderId: session.id, type: body.action, payload, expiresAt: new Date(Date.now() + SIGNAL_TTL_MS) },
      });
    }
    return NextResponse.json({ success: true, roomId: body.roomId, status: body.action === "COMPLETE" ? "COMPLETED" : "ACTIVE" });
  } catch (error) {
    return handleApiError(error);
  }
}
