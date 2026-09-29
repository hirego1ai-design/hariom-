"use client";

import { useCallback, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

const RESTRICTION_STATUSES = ["PENDING_REVIEW", "ACTIVE", "REJECTED", "EXPIRED", "REVOKED"] as const;
type RestrictionStatus = (typeof RESTRICTION_STATUSES)[number];
type ReviewDecision = "APPROVE" | "REJECT" | "REVOKE";

type Restriction = {
  id: string;
  status: RestrictionStatus;
  proposedMonths: number;
  reason: string;
  suspendedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  appealedAt: string | null;
  appealNote: string | null;
  user: { name: string; email: string };
  evidence: unknown;
};

const PAGE_SIZE = 25;

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.error || "Request failed.");
  return data;
}

export default function AssessmentRestrictionReviewPage() {
  const [status, setStatus] = useState<RestrictionStatus>("PENDING_REVIEW");
  const [items, setItems] = useState<Restriction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ item: Restriction; decision: ReviewDecision } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        status,
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      });
      const response = await fetch(
        `/api/admin/recorded-assessment/restrictions?${params.toString()}`,
        { cache: "no-store" },
      );
      const data = await readJson(response);
      setItems(Array.isArray(data.restrictions) ? data.restrictions : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPage(nextPage);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(cause instanceof Error ? cause.message : "Unable to load restriction reviews.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load(1);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function applyDecision() {
    if (!reviewTarget || reviewSaving || reviewNote.trim().length < 3) return;
    setReviewSaving(true);
    setError("");
    setNotice("");
    try {
      await readJson(
        await fetch(
          `/api/admin/recorded-assessment/restrictions/${encodeURIComponent(reviewTarget.item.id)}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              decision: reviewTarget.decision,
              reviewNote: reviewNote.trim(),
              expectedUpdatedAt: reviewTarget.item.updatedAt,
            }),
          },
        ),
      );

      setNotice(
        reviewTarget.decision === "APPROVE"
          ? "Restriction approved and audited."
          : reviewTarget.decision === "REJECT"
            ? "Restriction proposal rejected and audited."
            : "Restriction revoked and audited.",
      );
      setReviewTarget(null);
      setReviewNote("");
      await load(page);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review action failed.");
    } finally {
      setReviewSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Assessment Restriction Review"
          subtitle="Human review of preserved proctoring evidence; no restriction is activated automatically."
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Proctoring signals are evidence only. Approval, rejection and revocation are explicit administrator decisions with a required review note and immutable audit evidence.
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" aria-live="polite" className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {notice}
            </div>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#141418] p-5" aria-labelledby="restriction-queue-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 id="restriction-queue-heading" className="font-bold">Review queue</h1>
                <p className="mt-1 text-xs text-slate-400">
                  {loading ? "Loading authoritative cases…" : `${total} case${total === 1 ? "" : "s"} in this status`}
                </p>
              </div>
              <label className="text-xs text-slate-400">
                Queue status
                <select
                  className="mt-1 min-w-56 rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-white"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as RestrictionStatus);
                    setPage(1);
                  }}
                >
                  {RESTRICTION_STATUSES.map((value) => (
                    <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {loading ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 p-8 text-sm text-slate-400">
              Loading review queue…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-slate-400">
              No restriction cases are currently in {status.replaceAll("_", " ").toLowerCase()}.
            </div>
          ) : (
            <section className="space-y-4" aria-label="Assessment restriction cases">
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-[#141418] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-semibold">{item.user.name}</h2>
                      <p className="truncate text-sm text-slate-400">{item.user.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">Proposal reason</dt>
                      <dd className="mt-1 text-slate-200">{item.reason}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">Proposed duration</dt>
                      <dd className="mt-1 text-slate-200">{item.proposedMonths} month(s)</dd>
                    </div>
                  </dl>

                  {item.suspendedUntil && (
                    <p className="mt-3 text-sm text-slate-300">
                      Restricted until: {new Date(item.suspendedUntil).toLocaleString()}
                    </p>
                  )}

                  {item.appealedAt && (
                    <section className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4" aria-label="Candidate appeal">
                      <p className="font-medium text-amber-100">Candidate appeal</p>
                      <p className="mt-1 text-sm text-slate-300">{item.appealNote || "No appeal note was persisted."}</p>
                      <p className="mt-1 text-xs text-slate-500">Submitted {new Date(item.appealedAt).toLocaleString()}</p>
                    </section>
                  )}

                  <details className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                    <summary className="cursor-pointer font-medium">Preserved evidence</summary>
                    <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                      {JSON.stringify(item.evidence, null, 2)}
                    </pre>
                  </details>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.status === "PENDING_REVIEW" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewNote("");
                            setReviewTarget({ item, decision: "APPROVE" });
                          }}
                          className="rounded-xl border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300"
                        >
                          Approve restriction
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewNote("");
                            setReviewTarget({ item, decision: "REJECT" });
                          }}
                          className="rounded-xl border border-red-500/30 px-4 py-2 text-xs font-bold text-red-300"
                        >
                          Reject proposal
                        </button>
                      </>
                    )}
                    {item.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewNote("");
                          setReviewTarget({ item, decision: "REVOKE" });
                        }}
                        className="rounded-xl border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-300"
                      >
                        Revoke restriction
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}

          {!loading && total > PAGE_SIZE && (
            <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => void load(Math.max(1, page - 1))}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => void load(Math.min(totalPages, page + 1))}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>

      {reviewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="restriction-review-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl">
            <h2 id="restriction-review-title" className="text-lg font-bold">
              {reviewTarget.decision === "APPROVE"
                ? "Approve restriction?"
                : reviewTarget.decision === "REJECT"
                  ? "Reject restriction proposal?"
                  : "Revoke active restriction?"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {reviewTarget.item.user.name} · current status {reviewTarget.item.status.replaceAll("_", " ")}. This decision is persisted and audited.
            </p>
            <label className="mt-5 block text-xs text-slate-400">
              Review note
              <textarea
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                minLength={3}
                maxLength={1000}
                rows={4}
                placeholder="Record the evidence-based reason for this decision."
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={reviewSaving}
                onClick={() => {
                  setReviewTarget(null);
                  setReviewNote("");
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewSaving || reviewNote.trim().length < 3}
                onClick={() => void applyDecision()}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-40 ${
                  reviewTarget.decision === "APPROVE"
                    ? "bg-emerald-600"
                    : reviewTarget.decision === "REJECT"
                      ? "bg-red-600"
                      : "bg-amber-600"
                }`}
              >
                {reviewSaving ? "Saving…" : "Confirm decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
