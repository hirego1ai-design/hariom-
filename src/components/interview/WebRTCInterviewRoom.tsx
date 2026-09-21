"use client";

import React, { useEffect, useRef, useState } from "react";

interface WebRTCInterviewRoomProps {
  roundTitle?: string;
  candidateName?: string;
  interviewerName?: string;
  roomId?: string;
  onComplete?: (interviewId?: string) => void;
}

type Signal = { id: string; senderId: string; targetId?: string | null; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
type RoomSnapshot = { interviewId: string; participantId: string; authorizedParticipantIds: string[]; isHost: boolean; status: "ACTIVE" | "COMPLETED"; iceServers: RTCIceServer[]; signaling: { offers: Signal[]; answers: Signal[]; candidates: Signal[] } };

async function readRoom(roomId: string): Promise<RoomSnapshot> {
  const response = await fetch(`/api/interviews/room?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || "Interview room unavailable.");
  return result.room as RoomSnapshot;
}

function RemoteVideo({ stream, label }: { stream: MediaStream; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) { ref.current.srcObject = stream; ref.current.play().catch(() => undefined); } }, [stream]);
  return <div className="relative rounded-2xl bg-[#121216] border border-white/10 overflow-hidden min-h-[220px]"><video ref={ref} autoPlay playsInline className="w-full h-full object-cover" /><span className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold">{label}</span></div>;
}

export default function WebRTCInterviewRoom({ roundTitle = "Technical Interview", candidateName = "Candidate", interviewerName = "Interview participant", roomId = "managed-hiring-room", onComplete }: WebRTCInterviewRoomProps) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const stream = useRef<MediaStream | null>(null);
  const seenSignals = useRef(new Set<string>());
  const pendingIce = useRef(new Map<string, RTCIceCandidateInit[]>());
  const reconnectAttempts = useRef(new Map<string, number>());
  const selfId = useRef("");
  const hostRef = useRef(false);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("Preparing camera and microphone...");
  const [error, setError] = useState("");
  const [interviewId, setInterviewId] = useState("");
  const [isHost, setIsHost] = useState(false);

  const signal = async (action: string, targetId?: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch("/api/interviews/room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId, action, ...(targetId ? { targetId } : {}), ...payload }) });
    if (!res.ok) throw new Error("Interview signaling failed.");
  };

  const ensurePeer = (peerId: string) => {
    const existing = peers.current.get(peerId);
    if (existing) return existing;
    const connection = new RTCPeerConnection({ iceServers: iceServersRef.current });
    stream.current?.getTracks().forEach(track => connection.addTrack(track, stream.current!));
    connection.ontrack = (event) => {
      const remote = event.streams[0];
      if (remote) setRemoteStreams(prev => ({ ...prev, [peerId]: remote }));
    };
    connection.onicecandidate = (event) => {
      if (event.candidate) signal("ICE_CANDIDATE", peerId, { candidate: event.candidate.toJSON() }).catch(() => undefined);
    };
    connection.onconnectionstatechange = async () => {
      const state = connection.connectionState;
      if (state === "connected") reconnectAttempts.current.set(peerId, 0);
      if (state === "disconnected") setStatus("Participant connection interrupted — reconnecting…");
      if (state === "failed") {
        setRemoteStreams(prev => { const next = { ...prev }; delete next[peerId]; return next; });
        const attempts = reconnectAttempts.current.get(peerId) || 0;
        if (attempts < 2 && selfId.current.localeCompare(peerId) < 0) {
          reconnectAttempts.current.set(peerId, attempts + 1);
          try {
            const offer = await connection.createOffer({ iceRestart: true });
            await connection.setLocalDescription(offer);
            await signal("OFFER", peerId, { sdp: offer });
            setStatus("Reconnecting participant…");
          } catch { setStatus("Participant connection failed."); }
        }
      }
      if (state === "closed") setRemoteStreams(prev => { const next = { ...prev }; delete next[peerId]; return next; });
    };
    peers.current.set(peerId, connection);
    return connection;
  };

  useEffect(() => {
    let stopped = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    async function start() {
      try {
        const room = await readRoom(roomId);
        if (room.status === "COMPLETED") throw new Error("This interview has already ended.");
        selfId.current = room.participantId;
        hostRef.current = room.isHost;
        setIsHost(room.isHost);
        iceServersRef.current = room.iceServers;
        setInterviewId(room.interviewId);

        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (stopped) { media.getTracks().forEach(track => track.stop()); return; }
        stream.current = media;
        if (localVideo.current) { localVideo.current.srcObject = media; await localVideo.current.play().catch(() => undefined); }

        // Deterministic initiator selection prevents offer glare. Each authorized
        // participant creates exactly one peer connection to every other member.
        const participantIds = room.authorizedParticipantIds;
        for (const peerId of participantIds.filter(id => id !== selfId.current)) {
          const connection = ensurePeer(peerId);
          if (selfId.current.localeCompare(peerId) < 0) {
            const offer = await connection.createOffer();
            await connection.setLocalDescription(offer);
            await signal("OFFER", peerId, { sdp: offer });
          }
        }
        setStatus("Secure interview room active");

        poll = setInterval(async () => {
          let latest: RoomSnapshot;
          try { latest = await readRoom(roomId); } catch { setStatus("Signaling connection interrupted — retrying…"); return; }
          if (latest.status === "COMPLETED") {
            setStatus("Interview ended");
            peers.current.forEach(connection => connection.close());
            stream.current?.getTracks().forEach(track => track.stop());
            if (poll) clearInterval(poll);
            return;
          }
          const signaling = latest.signaling;
          for (const offer of (signaling.offers || []) as Signal[]) {
            if (offer.targetId !== selfId.current || offer.senderId === selfId.current || seenSignals.current.has(offer.id) || !offer.sdp) continue;
            seenSignals.current.add(offer.id);
            const connection = ensurePeer(offer.senderId);
            if (connection.signalingState !== "stable") continue;
            await connection.setRemoteDescription(offer.sdp);
            const queued = pendingIce.current.get(offer.senderId) || [];
            for (const ice of queued) await connection.addIceCandidate(ice).catch(() => undefined);
            pendingIce.current.delete(offer.senderId);
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            await signal("ANSWER", offer.senderId, { sdp: answer });
          }
          for (const answer of (signaling.answers || []) as Signal[]) {
            if (answer.targetId !== selfId.current || answer.senderId === selfId.current || seenSignals.current.has(answer.id) || !answer.sdp) continue;
            seenSignals.current.add(answer.id);
            const connection = ensurePeer(answer.senderId);
            if (!connection.currentRemoteDescription) {
              await connection.setRemoteDescription(answer.sdp);
              const queued = pendingIce.current.get(answer.senderId) || [];
              for (const ice of queued) await connection.addIceCandidate(ice).catch(() => undefined);
              pendingIce.current.delete(answer.senderId);
            }
          }
          for (const candidate of (signaling.candidates || []) as Signal[]) {
            if (candidate.targetId !== selfId.current || candidate.senderId === selfId.current || seenSignals.current.has(candidate.id) || !candidate.candidate) continue;
            seenSignals.current.add(candidate.id);
            const connection = ensurePeer(candidate.senderId);
            if (!connection.remoteDescription) {
              pendingIce.current.set(candidate.senderId, [...(pendingIce.current.get(candidate.senderId) || []), candidate.candidate]);
            } else {
              await connection.addIceCandidate(candidate.candidate).catch(() => undefined);
            }
          }
        }, 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Camera or microphone access failed.");
        setStatus("Room not ready");
      }
    }
    start();
    return () => {
      stopped = true;
      if (poll) clearInterval(poll);
      peers.current.forEach(connection => connection.close());
      peers.current.clear();
      pendingIce.current.clear();
      reconnectAttempts.current.clear();
      stream.current?.getTracks().forEach(track => track.stop());
    };
  }, [roomId]);

  const toggleTrack = (kind: "audio" | "video") => {
    const track = stream.current?.getTracks().find(item => item.kind === kind);
    if (!track) return;
    track.enabled = !track.enabled;
    if (kind === "audio") setMicOn(track.enabled); else setCameraOn(track.enabled);
  };

  const toggleShare = async () => {
    if (!stream.current) return;
    const camera = stream.current.getVideoTracks()[0];
    if (sharing) {
      await Promise.all([...peers.current.values()].map(async connection => {
        const sender = connection.getSenders().find(item => item.track?.kind === "video");
        if (sender && camera) await sender.replaceTrack(camera);
      }));
      setSharing(false);
      return;
    }
    const display = await navigator.mediaDevices.getDisplayMedia({ video: true }).catch(() => null);
    const screen = display?.getVideoTracks()[0];
    if (!screen) return;
    await Promise.all([...peers.current.values()].map(async connection => {
      const sender = connection.getSenders().find(item => item.track?.kind === "video");
      if (sender) await sender.replaceTrack(screen);
    }));
    screen.onended = () => {
      if (camera) [...peers.current.values()].forEach(connection => connection.getSenders().find(item => item.track?.kind === "video")?.replaceTrack(camera).catch(() => undefined));
      setSharing(false);
    };
    setSharing(true);
  };

  const finish = async () => {
    if (!hostRef.current) return;
    await signal("COMPLETE").catch(() => undefined);
    peers.current.forEach(connection => connection.close());
    stream.current?.getTracks().forEach(track => track.stop());
    onComplete?.(interviewId || undefined);
  };

  const remotes = Object.entries(remoteStreams);
  return <div className="w-full h-full flex flex-col bg-[#0A0A0C] text-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
    <div className="h-14 bg-[#141418] border-b border-white/10 px-6 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /><span className="font-bold text-xs uppercase tracking-wider text-red-400">LIVE · {roundTitle}</span></div><span className="text-xs text-text-muted">{status} · {remotes.length + 1} connected</span></div>
    {error && <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-xs text-red-300">{error}. Allow camera and microphone permissions, then reload the room.</div>}
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 min-h-0 overflow-auto">
      {remotes.map(([peerId, remote]) => <RemoteVideo key={peerId} stream={remote} label={interviewerName} />)}
      <div className="relative rounded-2xl bg-[#121216] border border-white/10 overflow-hidden min-h-[220px]"><video ref={localVideo} muted autoPlay playsInline className="w-full h-full object-cover" /><span className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold">{candidateName} (You)</span></div>
    </div>
    <div className="min-h-16 bg-[#141418] border-t border-white/10 px-4 py-2 flex flex-wrap items-center justify-center gap-3"><button onClick={() => toggleTrack("audio")} className="w-11 h-11 rounded-xl bg-white/10">{micOn ? "🎙" : "🔇"}</button><button onClick={() => toggleTrack("video")} className="w-11 h-11 rounded-xl bg-white/10">{cameraOn ? "📹" : "🚫"}</button><button onClick={toggleShare} className={`px-4 h-11 rounded-xl font-bold text-xs ${sharing ? "bg-primary" : "bg-white/10"}`}>{sharing ? "Stop sharing" : "Share screen"}</button>{isHost && <button onClick={finish} className="px-5 h-11 rounded-xl bg-red-600 font-bold text-xs">End interview</button>}</div>
  </div>;
}
