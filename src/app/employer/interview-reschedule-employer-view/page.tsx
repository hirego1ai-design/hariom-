"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function EmployerInterviewRescheduleContent() {
  const searchParams = useSearchParams();
  const [interviewId, setInterviewId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInterviewId(searchParams.get("interviewId") || "");
  }, [searchParams]);

  async function update(status: "RESCHEDULE" | "CANCEL") {
    if (saving) return;
    if (!interviewId || (status === "RESCHEDULE" && !scheduledAt)) {
      setMessageType("error");
      setMessage("Enter the interview ID and a new time before continuing.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/employer/interviews/${encodeURIComponent(interviewId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: status,
          scheduledAt: status === "RESCHEDULE" ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update interview.");
      }

      const emailStatus = data.notifications?.email?.status;
      setMessageType("success");
      setMessage(
        status === "CANCEL"
          ? `Interview cancelled. Candidate email status: ${emailStatus || "not available"}.`
          : `Interview rescheduled. Candidate email status: ${emailStatus || "not available"}.`,
      );
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to update interview.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0C] text-white p-6 md:p-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <p className="text-yellow text-xs font-bold uppercase tracking-[0.2em] mb-2">Interview operations</p>
          <h1 className="text-3xl font-bold">Reschedule or cancel</h1>
          <p className="text-slate-400 text-sm mt-2">The backend attempts a candidate email notification after a successful change. Provider acceptance is reported separately from the interview update itself.</p>
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
            <button disabled={saving} onClick={() => void update("RESCHEDULE")} className="flex-1 rounded-xl bg-indigo-500 py-3 font-bold disabled:opacity-50">
              {saving ? "Saving…" : "Reschedule"}
            </button>
            <button disabled={saving} onClick={() => void update("CANCEL")} className="flex-1 rounded-xl bg-red-500/20 text-red-300 py-3 font-bold disabled:opacity-50">
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
          {message && (
            <p role={messageType === "error" ? "alert" : "status"} className={messageType === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"}>
              {message}
            </p>
          )}
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
