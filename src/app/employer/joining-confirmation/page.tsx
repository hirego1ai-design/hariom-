"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type JoiningData = {
  success: boolean;
  mode: "DIRECT_HIRE" | "PPH_MANAGED";
  application: {
    id: string;
    status: string;
    job: { id: string; title: string; companyName: string };
    candidateName?: string | null;
    candidateEmail?: string | null;
  };
  acceptedOffer: {
    id: string;
    title: string;
    acceptedAt: string | null;
    startDate: string | null;
    compensationAmount?: string | null;
    currency: string;
  } | null;
  joining: {
    confirmed: boolean;
    joinedAt: string | null;
    confirmedAt: string | null;
  };
  error?: string;
};

export default function DirectHireJoiningConfirmationPage() {
  const params = useSearchParams();
  const applicationId = params.get("applicationId") || "";
  const [data, setData] = useState<JoiningData | null>(null);
  const [joinedAt, setJoinedAt] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) {
      setMessageType("error");
      setMessage("Application ID is missing.");
      setLoading(false);
      return;
    }

    fetch(`/api/employer/joining-confirmation?applicationId=${encodeURIComponent(applicationId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body.error || "Unable to load joining details.");
        }
        if (!cancelled) {
          setData(body);
          if (body.joining?.joinedAt) {
            const value = new Date(body.joining.joinedAt);
            const offsetMs = value.getTimezoneOffset() * 60_000;
            setJoinedAt(new Date(value.getTime() - offsetMs).toISOString().slice(0, 16));
          } else if (body.acceptedOffer?.startDate) {
            const value = new Date(body.acceptedOffer.startDate);
            const offsetMs = value.getTimezoneOffset() * 60_000;
            setJoinedAt(new Date(value.getTime() - offsetMs).toISOString().slice(0, 16));
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMessageType("error");
          setMessage(error instanceof Error ? error.message : "Unable to load joining details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!data || !joinedAt || !confirmed || saving) return;
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/employer/joining-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: data.application.id,
          joinedAt: new Date(joinedAt).toISOString(),
          confirmJoined: true,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.error || "Unable to confirm joining.");
      }

      setData((current) => current ? {
        ...current,
        application: { ...current.application, status: "HIRED" },
        joining: {
          confirmed: true,
          joinedAt: body.joinedAt,
          confirmedAt: new Date().toISOString(),
        },
      } : current);
      setMessageType("success");
      setMessage(body.message || "Joining confirmed.");
      setConfirmed(false);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to confirm joining.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Confirm joining</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Record actual joining only after the candidate has accepted the persisted offer.
          </p>
        </div>

        {message && (
          <p
            role={messageType === "error" ? "alert" : "status"}
            className={`rounded-xl border p-4 text-sm ${
              messageType === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {message}
          </p>
        )}

        {loading && (
          <div className="glass-card rounded-2xl p-6 text-sm text-text-secondary">
            Loading joining details…
          </div>
        )}

        {!loading && data?.mode === "PPH_MANAGED" && (
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">Managed-hiring placement</h2>
            <p className="text-sm text-text-secondary">
              This job is tied to managed-hiring commercial terms. Joining must be confirmed through the signed PPH agreement workflow.
            </p>
            <a
              href={`/employer/managed-hiring/join?applicationId=${encodeURIComponent(data.application.id)}`}
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-xs font-bold text-white"
            >
              Open PPH joining confirmation
            </a>
          </div>
        )}

        {!loading && data?.mode === "DIRECT_HIRE" && (
          <>
            <section className="glass-card rounded-2xl p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Candidate</p>
                  <p className="mt-1 font-bold text-white">{data.application.candidateName || "Candidate"}</p>
                  <p className="text-xs text-text-secondary">{data.application.candidateEmail || ""}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Role</p>
                  <p className="mt-1 font-bold text-white">{data.application.job.title}</p>
                  <p className="text-xs text-text-secondary">{data.application.job.companyName}</p>
                </div>
              </div>

              {data.acceptedOffer ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-text-secondary">
                  <p><strong className="text-white">Offer:</strong> {data.acceptedOffer.title}</p>
                  <p className="mt-1">
                    <strong className="text-white">Accepted:</strong>{" "}
                    {data.acceptedOffer.acceptedAt ? new Date(data.acceptedOffer.acceptedAt).toLocaleString() : "Not recorded"}
                  </p>
                  {data.acceptedOffer.compensationAmount && (
                    <p className="mt-1">
                      <strong className="text-white">Compensation:</strong>{" "}
                      {data.acceptedOffer.currency} {data.acceptedOffer.compensationAmount}
                    </p>
                  )}
                </div>
              ) : (
                <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  No accepted offer is available. Joining cannot be confirmed.
                </p>
              )}
            </section>

            {data.joining.confirmed ? (
              <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <h2 className="text-lg font-bold text-emerald-200">Joining confirmed</h2>
                <p className="mt-2 text-sm text-emerald-100/80">
                  Actual joining: {data.joining.joinedAt ? new Date(data.joining.joinedAt).toLocaleString() : "Recorded"}.
                  The application is now HIRED and the direct-hire joining workflow is complete.
                </p>
              </section>
            ) : (
              <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-5">
                <label className="block text-sm text-text-secondary">
                  Actual joining date and time
                  <input
                    required
                    type="datetime-local"
                    value={joinedAt}
                    onChange={(event) => {
                      setJoinedAt(event.target.value);
                      setConfirmed(false);
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
                  />
                </label>

                <label className="block text-sm text-text-secondary">
                  Internal note (optional)
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, 1000))}
                    maxLength={1000}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
                    placeholder="Optional joining note"
                  />
                </label>

                <label className="flex items-start gap-3 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    I confirm that the candidate actually joined on the date/time above. This will mark the application as HIRED and complete the direct-hire joining workflow.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={saving || !confirmed || !joinedAt || !data.acceptedOffer}
                  className="min-h-12 w-full rounded-xl bg-emerald-500 px-5 text-sm font-extrabold text-black disabled:opacity-50"
                >
                  {saving ? "Confirming…" : "Confirm actual joining"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
