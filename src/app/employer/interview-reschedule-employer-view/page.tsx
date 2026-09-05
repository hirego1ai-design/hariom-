"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function EmployerInterviewRescheduleContent() {
  const searchParams = useSearchParams();
  const [interviewId, setInterviewId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setInterviewId(searchParams.get("interviewId") || "");
  }, [searchParams]);

  async function update(status: "RESCHEDULE" | "CANCEL") {
    if (!interviewId || (status === "RESCHEDULE" && !scheduledAt)) {
      setMessage("Enter the interview ID and a new time before continuing.");
      return;
    }
    const response = await fetch(`/api/employer/interviews/${encodeURIComponent(interviewId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: status,
        scheduledAt: status === "RESCHEDULE" ? new Date(scheduledAt).toISOString() : undefined,
      }),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? status === "CANCEL"
          ? "Interview cancelled and candidate notified."
          : "Interview rescheduled and candidate notified."
        : data.error || "Unable to update interview."
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0C] text-white p-6 md:p-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <p className="text-yellow text-xs font-bold uppercase tracking-[0.2em] mb-2">Interview operations</p>
          <h1 className="text-3xl font-bold">Reschedule or cancel</h1>
          <p className="text-slate-400 text-sm mt-2">The candidate receives an in-app and email update after the change.</p>
        </div>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <label className="block text-xs text-slate-400">
            Interview ID
            <input
              value={interviewId}
              onChange={(event) => setInterviewId(event.target.value)}
              className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 p-3 text-white"
              placeholder="Paste the interview ID"
            />
          </label>
          <label className="block text-xs text-slate-400">
            New date and time
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 p-3 text-white"
            />
          </label>
          <div className="flex gap-3">
            <button onClick={() => update("RESCHEDULE")} className="flex-1 rounded-xl bg-indigo-500 py-3 font-bold">
              Reschedule
            </button>
            <button onClick={() => update("CANCEL")} className="flex-1 rounded-xl bg-red-500/20 text-red-300 py-3 font-bold">
              Cancel interview
            </button>
          </div>
          {interviewId && (
            <Link
              href={`/api/employer/interviews/${encodeURIComponent(interviewId)}/calendar`}
              className="block text-center text-sm text-indigo-300"
            >
              Download calendar invite
            </Link>
          )}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
        </section>
      </div>
    </main>
  );
}

export default function EmployerInterviewReschedulePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0C] text-slate-400 flex items-center justify-center">Loading...</div>}>
      <EmployerInterviewRescheduleContent />
    </Suspense>
  );
}
