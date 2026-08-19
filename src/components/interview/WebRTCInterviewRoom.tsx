"use client";

import React, { useEffect, useRef, useState } from "react";

interface WebRTCInterviewRoomProps {
  roundTitle?: string;
  candidateName?: string;
  interviewerName?: string;
  roomId?: string;
  onComplete?: (interviewId?: string) => void;
}

type Signal = { senderId: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };

export default function WebRTCInterviewRoom({ roundTitle = "Technical Interview Round 1", candidateName = "Candidate", interviewerName = "HireGo AI Interview Panel", roomId = "managed-hiring-room", onComplete }: WebRTCInterviewRoomProps) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const seenSignals = useRef(new Set<string>());
  const hostRef = useRef(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("Preparing camera and microphone...");
  const [error, setError] = useState("");
  const [interviewId, setInterviewId] = useState("");

  const signal = async (action: string, payload: Record<string, unknown> = {}) => {
    await fetch("/api/interviews/room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId, action, ...payload }) });
  };

  useEffect(() => {
    let stopped = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    async function start() {
      try {
        const roomResponse = await fetch(`/api/interviews/room?roomId=${encodeURIComponent(roomId)}`);
        const roomResult = await roomResponse.json();
        if (!roomResult.success) throw new Error(roomResult.error || "Interview room unavailable");
        hostRef.current = Boolean(roomResult.room.isHost);
        setInterviewId(roomResult.room.interviewId || "");
        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (stopped) { media.getTracks().forEach(track => track.stop()); return; }
        stream.current = media;
        if (localVideo.current) { localVideo.current.srcObject = media; await localVideo.current.play().catch(() => undefined); }
        const connection = new RTCPeerConnection({ iceServers: roomResult.room.iceServers || [{ urls: "stun:stun.l.google.com:19302" }] });
        peer.current = connection;
        media.getTracks().forEach(track => connection.addTrack(track, media));
        connection.ontrack = (event) => { if (remoteVideo.current && event.streams[0]) { remoteVideo.current.srcObject = event.streams[0]; remoteVideo.current.play().catch(() => undefined); } };
        connection.onicecandidate = (event) => { if (event.candidate) signal("ICE_CANDIDATE", { candidate: event.candidate.toJSON() }).catch(() => undefined); };
        connection.onconnectionstatechange = () => setStatus(connection.connectionState === "connected" ? "Connected securely" : `Connection ${connection.connectionState}`);
        if (roomResult.room.isHost) {
          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          await signal("OFFER", { sdp: offer });
        }
        setStatus(roomResult.room.isHost ? "Waiting for candidate to join..." : "Joining secure interview room...");
        poll = setInterval(async () => {
          if (!peer.current || peer.current.connectionState === "closed") return;
          const response = await fetch(`/api/interviews/room?roomId=${encodeURIComponent(roomId)}`).catch(() => null);
          if (!response?.ok) return;
          const result = await response.json();
          const signaling = result.room?.signaling || {};
          for (const offer of (signaling.offers || []) as Signal[]) {
            const key = `offer:${JSON.stringify(offer.sdp)}`;
            if (hostRef.current || seenSignals.current.has(key) || !offer.sdp) continue;
            seenSignals.current.add(key);
            await connection.setRemoteDescription(offer.sdp);
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            await signal("ANSWER", { sdp: answer });
          }
          for (const answer of (signaling.answers || []) as Signal[]) {
            const key = `answer:${JSON.stringify(answer.sdp)}`;
            if (!hostRef.current || seenSignals.current.has(key) || !answer.sdp || connection.currentRemoteDescription) continue;
            seenSignals.current.add(key);
            await connection.setRemoteDescription(answer.sdp);
          }
          for (const candidate of (signaling.candidates || []) as Signal[]) {
            const key = `candidate:${JSON.stringify(candidate.candidate)}`;
            if (seenSignals.current.has(key) || !candidate.candidate) continue;
            seenSignals.current.add(key);
            await connection.addIceCandidate(candidate.candidate).catch(() => undefined);
          }
        }, 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Camera or microphone access failed.");
        setStatus("Room not ready");
      }
    }
    start();
    return () => { stopped = true; if (poll) clearInterval(poll); peer.current?.close(); stream.current?.getTracks().forEach(track => track.stop()); };
  }, [roomId]);

  const toggleTrack = (kind: "audio" | "video") => {
    const track = stream.current?.getTracks().find(item => item.kind === kind);
    if (!track) return;
    track.enabled = !track.enabled;
    if (kind === "audio") setMicOn(track.enabled); else setCameraOn(track.enabled);
  };

  const toggleShare = async () => {
    if (!peer.current || !stream.current) return;
    if (sharing) {
      const camera = stream.current.getVideoTracks()[0];
      const sender = peer.current.getSenders().find(item => item.track?.kind === "video");
      if (sender && camera) await sender.replaceTrack(camera);
      setSharing(false); return;
    }
    const display = await navigator.mediaDevices.getDisplayMedia({ video: true }).catch(() => null);
    const screen = display?.getVideoTracks()[0];
    const sender = peer.current.getSenders().find(item => item.track?.kind === "video");
    if (screen && sender) { await sender.replaceTrack(screen); screen.onended = () => setSharing(false); setSharing(true); }
  };

  const finish = async () => { await signal("COMPLETE").catch(() => undefined); peer.current?.close(); stream.current?.getTracks().forEach(track => track.stop()); onComplete?.(interviewId || undefined); };

  return <div className="w-full h-full flex flex-col bg-[#0A0A0C] text-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
    <div className="h-14 bg-[#141418] border-b border-white/10 px-6 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /><span className="font-bold text-xs uppercase tracking-wider text-red-400">LIVE · {roundTitle}</span></div><span className="text-xs text-text-muted">{status}</span></div>
    {error && <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-xs text-red-300">{error}. Allow camera and microphone permissions, then reload the room.</div>}
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-0"><div className="relative rounded-2xl bg-[#121216] border border-white/10 overflow-hidden"><video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" /><span className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold">{interviewerName}</span></div><div className="relative rounded-2xl bg-[#121216] border border-white/10 overflow-hidden"><video ref={localVideo} muted autoPlay playsInline className="w-full h-full object-cover" /><span className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold">{candidateName} (You)</span></div></div>
    <div className="h-16 bg-[#141418] border-t border-white/10 px-6 flex items-center justify-center gap-3"><button onClick={() => toggleTrack("audio")} className="w-11 h-11 rounded-xl bg-white/10">{micOn ? "🎙" : "🔇"}</button><button onClick={() => toggleTrack("video")} className="w-11 h-11 rounded-xl bg-white/10">{cameraOn ? "📹" : "🚫"}</button><button onClick={toggleShare} className={`px-4 h-11 rounded-xl font-bold text-xs ${sharing ? "bg-primary" : "bg-white/10"}`}>{sharing ? "Stop sharing" : "Share screen"}</button><button onClick={finish} className="px-5 h-11 rounded-xl bg-red-600 font-bold text-xs">End interview</button></div>
  </div>;
}
