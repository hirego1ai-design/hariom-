import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

// In-memory room signaling state for WebRTC handshake fallback
interface RoomState {
  roomId: string;
  interviewId: string;
  hostId: string;
  participants: string[];
  offers: any[];
  answers: any[];
  candidates: any[];
  status: "WAITING" | "ACTIVE" | "COMPLETED";
}

const activeRooms = new Map<string, RoomState>();

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId") || "default-room";

    let room = activeRooms.get(roomId);
    if (!room) {
      room = {
      roomId,
      interviewId: `int_${Date.now()}`,
      hostId: session.id,
      participants: [session.id],
      offers: [],
      answers: [],
      candidates: [],
      status: "ACTIVE",
      };
      activeRooms.set(roomId, room);
    }

    return NextResponse.json({
      success: true,
      room: {
        roomId: room.roomId,
        status: room.status,
        participantCount: room.participants.length,
        isHost: room.hostId === session.id,
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
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
    const { roomId, action, sdp, candidate } = body;

    if (!roomId) {
      return jsonError("roomId is required", 400);
    }

    let room = activeRooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        interviewId: `int_${Date.now()}`,
        hostId: session.id,
        participants: [session.id],
        offers: [],
        answers: [],
        candidates: [],
        status: "ACTIVE",
      };
      activeRooms.set(roomId, room);
    }

    if (!room.participants.includes(session.id)) {
      room.participants.push(session.id);
    }

    if (action === "OFFER" && sdp) {
      room.offers.push({ senderId: session.id, sdp, timestamp: Date.now() });
    } else if (action === "ANSWER" && sdp) {
      room.answers.push({ senderId: session.id, sdp, timestamp: Date.now() });
    } else if (action === "ICE_CANDIDATE" && candidate) {
      room.candidates.push({ senderId: session.id, candidate, timestamp: Date.now() });
    } else if (action === "COMPLETE") {
      room.status = "COMPLETED";
    }

    return NextResponse.json({
      success: true,
      roomId: room.roomId,
      status: room.status,
      signaling: {
        offers: room.offers,
        answers: room.answers,
        candidates: room.candidates,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
