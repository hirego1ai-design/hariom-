"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type InterviewDetails = {
  id: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  round: string;
  mode: string;
  candidateName: string;
  jobTitle: string;
};

function deliveryLabel(status?: string) {
  return status ? status.replaceAll("_", " ") : "Not reported";
}

function EmployerInterviewRescheduleContent() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId") || "";
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(Boolean(interviewId));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!interviewId) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/employer/interviews/${encodeURIComponent(interviewId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body.error || "Unable to load interview.");
        }
        return body.interview as InterviewDetails;
      })
      .then((details) => {
        setInterview(details);
        setMessage("");
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setMessageType("error");
        setMessage(cause instanceof Error ? cause.message : "Unable to load interview.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [interviewId]);

  async function update(action: "RESCHEDULE" | "CANCEL") {
    setMessage("");
    if (!interviewId) {
      setMessageType("error");
      setMessage("Open this screen from a scheduled interview.");
      return;
    }
    if (action === "RESCHEDULE" && !scheduledAt) {
      setMessageType("error");
      setMessage("Choose a new date and time before continuing.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/employer/interviews/${encodeURIComponent(interviewId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          scheduledAt: action === "RESCHEDULE" ? new Date(scheduledAt).toISOString() : undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update interview.");
      }

      setMessageType("success");
      const emailStatus = deliveryLabel(data.notifications?.email?.status);
      setMessage(
        action === "CANCEL"
          ? `Interview cancelled. Candidate email status: ${emailStatus}.`
          : `Interview rescheduled. Candidate email status: ${emailStatus}.`,
      );
      if (action === "RESCHEDULE" && data.interview?.scheduledAt) {
        setInterview((current) => current ? {
          ...current,
          scheduledAt: new Date(data.interview.scheduledAt).toISOString(),
          status: data.interview.status || current.status,
        } : current);
        setScheduledAt("");
      }
      if (action === "CANCEL") {
        setInterview((current) => current ? { ...current, status: data.interview?.status || "CANCELLED" } : current);
      }
    } catch (cause) {
      setMessageType("error");
      setMessage(cause instanceof Error ? cause.message : "Unable to update interview.");
    } finally {
      setBusy(false);
    }
  }

  if (!interviewId) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-text-primary">No interview selected</h1>
          <p className="mt-3 text-sm text-text-secondary">Open reschedule/cancel from the Interviews list so the authorized interview is carried into this screen.</p>
          <Link href="/employer/upcoming-interviews-list" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-outline px-5 text-sm font-bold text-text-primary">
            Back to interviews
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <main className="mx-auto max-w-xl px-4 py-8 space-y-6">
        <div>
          <p className="text-yellow text-xs font-bold uppercase tracking-[0.2em] mb-2">Interview operations</p>
          <h1 className="text-3xl font-bold text-text-primary">Reschedule or cancel</h1>
          <p className="text-text-secondary text-sm mt-2">Changes are persisted first. Email delivery status is reported separately and is never assumed successful.</p>
        </div>

        {loading && <div className="rounded-2xl border border-outline bg-bg-card p-6 text-sm text-text-secondary">Loading interview…</div>}

        {!loading && interview && (
          <section className="rounded-2xl border border-outline bg-bg-card p-6 space-y-4">
            <div className="rounded-xl border border-outline bg-bg-elevated p-4">
              <p className="font-bold text-text-primary">{interview.candidateName}</p>
              <p className="mt-1 text-sm text-text-secondary">{interview.jobTitle} · {interview.round}</p>
              <p className="mt-2 text-xs text-text-secondary">
                Current: {new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMins} minutes · {interview.mode} · {interview.status.replaceAll("_", " ")}
              </p>
            </div>

            {interview.status !== "CANCELLED" && (
              <>
                <label className="block text-xs text-text-secondary">
                  New date and time
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    className="mt-1 w-full rounded-lg bg-bg-page border border-outline p-3 text-text-primary"
                  />
                </label>
                <label className="block text-xs text-text-secondary">
                  Reason (optional)
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-1 w-full rounded-lg bg-bg-page border border-outline p-3 text-text-primary"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void update("RESCHEDULE")}
                    className="flex-1 min-h-11 rounded-xl bg-indigo-500 py-3 font-bold text-white disabled:opacity-50"
                  >
                    {busy ? "Saving…" : "Reschedule"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void update("CANCEL")}
                    className="flex-1 min-h-11 rounded-xl bg-red-500/20 text-red-300 py-3 font-bold disabled:opacity-50"
                  >
                    Cancel interview
                  </button>
                </div>
              </>
            )}

            <Link
              href={`/api/employer/interviews/${encodeURIComponent(interviewId)}/calendar`}
              className="block text-center text-sm font-bold text-indigo-300"
            >
              Download calendar invite
            </Link>

            {message && (
              <p
                role={messageType === "error" ? "alert" : "status"}
                className={`rounded-xl border p-4 text-sm ${
                  messageType === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-success/30 bg-success/10 text-text-primary"
                }`}
              >
                {message}
              </p>
            )}
          </section>
        )}

        {!loading && !interview && message && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{message}</p>
        )}

        <Link href="/employer/upcoming-interviews-list" className="inline-flex min-h-11 items-center rounded-full border border-outline px-5 text-sm font-bold text-text-primary">
          Back to interviews
        </Link>
      </main>
    </PageContainer>
  );
}

export default function EmployerInterviewReschedulePage() {
  return (
    <Suspense fallback={<PageContainer><div className="min-h-[60vh] text-text-secondary flex items-center justify-center">Loading…</div></PageContainer>}>
      <EmployerInterviewRescheduleContent />
    </Suspense>
  );
}
