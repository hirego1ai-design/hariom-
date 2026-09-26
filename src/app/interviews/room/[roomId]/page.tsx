"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import WebRTCInterviewRoom from "@/components/interview/WebRTCInterviewRoom";
import ProctoringEngine, { type LiveProctoringClientPolicy } from "@/components/proctoring/ProctoringEngine";

type RoomInfo = { interviewId: string; status: string };

export default function CandidateInterviewRoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [policy, setPolicy] = useState<LiveProctoringClientPolicy | null>(null);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingConsent, setSubmittingConsent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/interviews/room?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" }).then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) throw new Error(body.error || "Interview room is unavailable.");
        return body.room as RoomInfo;
      }),
      fetch("/api/proctoring/config", { cache: "no-store" }).then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) throw new Error(body.error || "Monitoring policy is unavailable.");
        return body.policy as LiveProctoringClientPolicy;
      }),
    ]).then(([roomInfo, currentPolicy]) => {
      if (cancelled) return;
      setRoom(roomInfo);
      setPolicy(currentPolicy);
      if (!currentPolicy.enabled) setConsented(true);
    }).catch((cause) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "Interview room is unavailable.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [roomId]);

  async function acceptMonitoring() {
    if (!room || !policy) return;
    setSubmittingConsent(true);
    setError("");
    try {
      const response = await fetch("/api/proctoring/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: room.interviewId, policyVersion: policy.policyVersion }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Consent could not be recorded.");
      setConsented(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Consent could not be recorded.");
    } finally {
      setSubmittingConsent(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-bg-page grid place-items-center text-text-primary"><p>Preparing secure interview room…</p></main>;
  if (error && !room) return <main className="min-h-screen bg-bg-page grid place-items-center px-6 text-center text-text-primary"><p>{error}</p></main>;
  if (!room || !policy) return <main className="min-h-screen bg-bg-page grid place-items-center text-text-primary"><p>Interview room is unavailable.</p></main>;

  if (policy.enabled && !consented) {
    return (
      <main className="min-h-screen bg-bg-page px-6 py-12 text-text-primary grid place-items-center">
        <section className="w-full max-w-xl rounded-3xl border border-outline bg-bg-card p-7 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Interview monitoring disclosure</p>
            <h1 className="mt-2 text-2xl font-bold">Review browser monitoring before entering</h1>
          </div>
          <p className="text-sm text-text-secondary">
            HireGo records configured browser observations for this interview. These observations are advisory evidence for an authorized human reviewer and do not automatically decide selection or rejection.
          </p>
          <ul className="space-y-2 text-sm text-text-secondary">
            {policy.trackTabSwitch && <li>• Tab visibility changes</li>}
            {policy.trackClipboard && <li>• Copy and paste attempts</li>}
            {policy.trackContextMenu && <li>• Context-menu attempts</li>}
          </ul>
          <p className="text-xs text-text-muted">Policy version: {policy.policyVersion}. Camera/audio anomaly detection is not claimed by this browser policy.</p>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button disabled={submittingConsent} onClick={() => void acceptMonitoring()} className="rounded-full bg-primary px-6 py-3 text-xs font-bold text-white disabled:opacity-50">
              {submittingConsent ? "Recording consent…" : "I understand — enter interview"}
            </button>
            <button onClick={() => router.push("/interviews")} className="rounded-full border border-outline px-6 py-3 text-xs font-bold">Leave</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto flex h-[calc(100vh-64px)] min-h-[620px] max-w-7xl flex-col gap-3">
        <div>
          <p className="text-xs text-primary font-bold uppercase tracking-[0.2em]">HireGo AI secure interview portal</p>
          <h1 className="text-lg text-text-primary font-bold">Candidate interview room</h1>
        </div>
        {policy.enabled && <ProctoringEngine interviewId={room.interviewId} policy={policy} />}
        <div className="min-h-0 flex-1">
          <WebRTCInterviewRoom roomId={roomId} candidateName="Candidate" interviewerName="HireGo AI Interview Panel" onComplete={() => router.push("/interviews")} />
        </div>
      </div>
    </main>
  );
}
