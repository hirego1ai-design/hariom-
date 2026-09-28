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
  if (!response.ok || data.success === false) throw new Error(data.error || "Request failed.");
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
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError("");
    setNotice("");
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
      setPage(typeof data.page === "number" ? data.page : nextPage);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(cause instanceof Error ? cause.message : "Unable to load restriction reviews.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load(1);
  }, [load]);

  async function decide() {
    if (!reviewTarget || saving || reviewNote.trim().length < 3) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await readJson(
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
        `Restriction review saved as ${String(data.restriction?.status || reviewTarget.decision).replaceAll("_", " ")}.`,
      );
      setReviewTarget(null);
      setReviewNote("");
      await load(page);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review action failed.");
    } finally {
      setSaving(false);
    }
  }

  function openReview(item: Restriction, decision: ReviewDecision) {
    setReviewNote("");
    setReviewTarget({ item, decision });
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Assessment Restriction Review"
          subtitle="Human review of preserved proctoring evidence before candidate restrictions"
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <section className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 text-sm text-amber-100">
            Proctoring signals are evidence only. No candidate restriction becomes active without an administrator review and recorded decision.
          </section>

          {error && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" aria-live="polite" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {notice}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141418]" aria-labelledby="restriction-queue-heading">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 id="restriction-queue-heading" className="font-bold">Restriction review queue</h1>
                <p className="mt-1 text-xs text-slate-400">
                  {loading ? "Loading authoritative cases…" : `${total} case${total === 1 ? "" : "s"} in this status`}
                </p>
              </div>
              <label className="text-xs text-slate-400">
                Queue status
                <select
                  className="mt-1 w-full min-w-52 rounded-xl border border-white/10 bg-[#1A1A20] px-3 py-2 text-sm text-white"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as RestrictionStatus)}
                >
                  {RESTRICTION_STATUSES.map((value) => (
                    <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
            </div>

            {loading ? (
              <div role="status" aria-live="polite" className="p-8 text-sm text-slate-400">
                Loading review queue…
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-sm text-slate-400">No cases in this queue.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {items.map((item) => (
                  <article key={item.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-semibold">{item.user.name}</h2>
                        <p className="text-sm text-slate-400">{item.user.email}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <p><strong>Proposal reason:</strong> {item.reason}</p>
                      <p><strong>Proposed duration:</strong> {item.proposedMonths} month(s)</p>
                      {item.suspendedUntil && (
                        <p><strong>Restricted until:</strong> {new Date(item.suspendedUntil).toLocaleString()}</p>
                      )}
                      <p><strong>Created:</strong> {new Date(item.createdAt).toLocaleString()}</p>
                    </div>

                    {item.appealedAt && (
                      <section className="mt-4 rounded-xl border border-sky-400/20 bg-sky-500/5 p-3" aria-label="Candidate appeal">
                        <p className="font-medium text-sky-200">Candidate appeal</p>
                        <p className="mt-1 text-sm text-slate-300">{item.appealNote || "No appeal note recorded."}</p>
                        <p className="mt-1 text-xs text-slate-500">Submitted {new Date(item.appealedAt).toLocaleString()}</p>
                      </section>
                    )}

                    <details className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                      <summary className="cursor-pointer font-medium">Preserved evidence</summary>
                      <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
                        {JSON.stringify(item.evidence, null, 2)}
                      </pre>
                    </details>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.status === "PENDING_REVIEW" && (
                        <>
                          <button
                            type="button"
                            disabled={Boolean(reviewTarget)}
                            onClick={() => openReview(item, "APPROVE")}
                            className="rounded-xl border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300 disabled:opacity-50"
                          >
                            Approve restriction
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(reviewTarget)}
                            onClick={() => openReview(item, "REJECT")}
                            className="rounded-xl border border-red-500/30 px-4 py-2 text-xs font-bold text-red-300 disabled:opacity-50"
                          >
                            Reject proposal
                          </button>
                        </>
                      )}
                      {item.status === "ACTIVE" && (
                        <button
                          type="button"
                          disabled={Boolean(reviewTarget)}
                          onClick={() => openReview(item, "REVOKE")}
                          className="rounded-xl border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-300 disabled:opacity-50"
                        >
                          Revoke restriction
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && total > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-white/10 p-4">
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
          </section>
        </main>
      </div>

      {reviewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="restriction-review-title" className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl">
            <h2 id="restriction-review-title" className="text-lg font-bold">
              {reviewTarget.decision === "APPROVE"
                ? "Approve candidate restriction?"
                : reviewTarget.decision === "REJECT"
                  ? "Reject restriction proposal?"
                  : "Revoke active restriction?"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Candidate: {reviewTarget.item.user.name}. This action is version-checked and recorded in the security audit trail.
            </p>

            <label className="mt-5 block text-xs text-slate-400">
              Mandatory review note
              <textarea
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                maxLength={1000}
                rows={5}
                placeholder="Record the evidence-based reason for this decision."
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
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
                disabled={saving || reviewNote.trim().length < 3}
                onClick={() => void decide()}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-40 ${
                  reviewTarget.decision === "APPROVE"
                    ? "bg-emerald-600"
                    : reviewTarget.decision === "REJECT"
                      ? "bg-red-600"
                      : "bg-amber-600"
                }`}
              >
                {saving ? "Saving…" : "Confirm decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
