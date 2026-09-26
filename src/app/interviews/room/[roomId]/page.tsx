"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import WebRTCInterviewRoom from "@/components/interview/WebRTCInterviewRoom";

export default function CandidateInterviewRoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const [acknowledged, setAcknowledged] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const join = async () => {
    if (!acknowledged || joining) return;
    setJoining(true);
    setError("");
    try {
      const response = await fetch("/api/interviews/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: params.roomId, action: "CONSENT" }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.error || "Unable to join the interview.");
      setJoined(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to join the interview.");
      setJoining(false);
    }
  };

  if (joined) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-7xl mx-auto min-h-[620px]">
          <div className="mb-3">
            <p className="text-xs text-primary font-bold uppercase tracking-[0.2em]">HireGo AI secure interview portal</p>
            <h1 className="text-lg text-text-primary font-bold">Candidate interview room</h1>
          </div>
          <WebRTCInterviewRoom
            roomId={params.roomId}
            candidateName="Candidate"
            interviewerName="HireGo AI Interview Panel"
            onComplete={() => router.push("/interviews")}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-page text-text-primary p-6 flex items-center justify-center">
      <section className="w-full max-w-2xl rounded-3xl border border-outline bg-bg-card p-8 space-y-6 shadow-2xl">
        <div>
          <p className="text-xs text-primary font-bold uppercase tracking-[0.2em]">Interview privacy & integrity notice</p>
          <h1 className="mt-2 text-2xl font-bold">Before joining the interview</h1>
        </div>
        <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
          <p>HireGo records limited browser-integrity events during the live interview: tab switches, clipboard attempts, browser focus changes, and stopping an active screen share.</p>
          <p>These client-reported events are unverified evidence for human review. They are not an automatic cheating verdict and do not automatically select or reject a candidate.</p>
          <p>Camera and microphone are used for the live interview itself. This flow does not claim face recognition, multiple-face detection, or audio-anomaly detection.</p>
        </div>
        <label className="flex gap-3 items-start text-sm">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1" />
          <span>I understand and consent to the interview media and browser-integrity monitoring described above.</span>
        </label>
        {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        <div className="flex gap-3">
          <button type="button" disabled={!acknowledged || joining} onClick={() => void join()} className="rounded-full bg-primary px-7 py-3 text-xs font-bold text-white disabled:opacity-50">
            {joining ? "Joining…" : "Join interview"}
          </button>
          <button type="button" onClick={() => router.push("/interviews")} className="rounded-full border border-outline px-7 py-3 text-xs font-bold">
            Leave
          </button>
        </div>
      </section>
    </main>
  );
}
