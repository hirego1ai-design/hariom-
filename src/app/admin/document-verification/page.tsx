"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

interface DocumentVerificationRecord {
  id: string;
  employerName: string;
  companyName: string;
  docType: string;
  declaredIdentifier: string | null;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  status: "Pending Audit" | "Verified" | "Rejected";
}

type ReviewAction = "Verified" | "Rejected";
const PAGE_SIZE = 25;

export default function AdminDocumentVerificationRoute() {
  const [documents, setDocuments] = useState<DocumentVerificationRecord[]>([]);
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [busyId, setBusyId] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: ReviewAction } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setMessage("");

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String((page - 1) * PAGE_SIZE),
    });
    if (filter !== "All") params.set("status", filter);

    fetch(`/api/admin/document-verification?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load KYC submissions.");
        }
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
        setTotal(typeof data.pagination?.total === "number" ? data.pagination.total : 0);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDocuments([]);
        setTotal(0);
        setMessageType("error");
        setMessage(error instanceof Error ? error.message : "Unable to load KYC submissions.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filter, page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleAction() {
    if (!reviewTarget || busyId) return;
    if (reviewTarget.action === "Rejected" && !reviewNotes.trim()) {
      setMessageType("error");
      setMessage("Enter a rejection reason before rejecting a KYC document.");
      return;
    }

    setBusyId(reviewTarget.id);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/document-verification/${encodeURIComponent(reviewTarget.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: reviewTarget.action,
            notes: reviewNotes.trim() || undefined,
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update KYC review.");
      }

      setMessageType("success");
      setMessage(`KYC document marked ${reviewTarget.action.toLowerCase()}.`);
      setReviewTarget(null);
      setReviewNotes("");
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to update KYC review.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0E0E0E] text-text-primary">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col md:pl-[116px]">
        <AdminHeader
          title="Document Verification Audit"
          subtitle="Manual review of employer KYC documents and declared identifiers"
        />
        <main className="flex-1 space-y-6 p-4 pt-24 sm:p-6 lg:p-8 lg:pt-24">
          {message && (
            <div
              role={messageType === "error" ? "alert" : "status"}
              aria-live={messageType === "error" ? "assertive" : "polite"}
              className={`rounded-xl border p-3 text-sm ${
                messageType === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex w-fit max-w-full gap-2 overflow-x-auto rounded-xl border border-white/10 bg-surface-container-low/40 p-1">
            {["All", "Pending Audit", "Verified", "Rejected"].map((statusOption) => (
              <button
                key={statusOption}
                type="button"
                onClick={() => setFilter(statusOption)}
                aria-pressed={filter === statusOption}
                className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  filter === statusOption
                    ? "bg-primary text-white shadow-md"
                    : "text-text-secondary hover:text-white"
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>

          <section className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl glass-card" aria-labelledby="kyc-queue-heading">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <h2 id="kyc-queue-heading" className="text-sm font-bold text-white">KYC review queue</h2>
                <p className="mt-1 text-[11px] text-text-muted">
                  {loading ? "Loading authoritative submissions…" : `${total} submission${total === 1 ? "" : "s"} in this filter`}
                </p>
              </div>
              {!loading && total > PAGE_SIZE && <span className="text-xs text-text-muted">Page {page} of {totalPages}</span>}
            </div>

            {loading ? (
              <div role="status" aria-live="polite" className="p-10 text-center text-sm text-text-muted">
                Loading KYC submissions…
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-text-secondary">
                        <th className="p-4">Employer & Company</th>
                        <th className="p-4">Document</th>
                        <th className="p-4">Declared Identifier</th>
                        <th className="p-4">Submitted</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="transition-colors hover:bg-white/5">
                          <td className="p-4">
                            <div className="font-bold text-text-primary">{doc.employerName}</div>
                            <div className="text-[11px] text-text-secondary">{doc.companyName}</div>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-white">{doc.docType}</p>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-[11px] font-bold text-primary hover:underline"
                            >
                              Review {doc.fileName}
                            </a>
                          </td>
                          <td className="p-4 font-mono text-text-secondary">
                            {doc.declaredIdentifier || "Not recorded"}
                          </td>
                          <td className="p-4 text-text-secondary">
                            {new Date(doc.submittedAt).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                doc.status === "Verified"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : doc.status === "Rejected"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="space-x-2 p-4 text-right">
                            {doc.status === "Pending Audit" && (
                              <>
                                <button
                                  type="button"
                                  disabled={Boolean(busyId)}
                                  onClick={() => {
                                    setReviewNotes("");
                                    setReviewTarget({ id: doc.id, action: "Verified" });
                                  }}
                                  className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/30 disabled:opacity-50"
                                >
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  disabled={Boolean(busyId)}
                                  onClick={() => {
                                    setReviewNotes("");
                                    setReviewTarget({ id: doc.id, action: "Rejected" });
                                  }}
                                  className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {documents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-text-muted">
                            No KYC submissions found for this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {total > PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t border-white/10 p-4">
                    <button
                      type="button"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={page <= 1}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-text-muted">Page {page} of {totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>

      {reviewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kyc-review-title"
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl"
          >
            <h2 id="kyc-review-title" className="text-lg font-bold text-white">
              {reviewTarget.action === "Rejected" ? "Reject KYC document?" : "Verify KYC document?"}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              This decision is persisted with the acting administrator and immutable audit evidence.
            </p>

            <label className="mt-5 block text-xs text-text-secondary">
              Reviewer note {reviewTarget.action === "Rejected" ? "(required)" : "(optional)"}
              <textarea
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                maxLength={2000}
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-primary/50"
                placeholder={reviewTarget.action === "Rejected" ? "Explain why this document is being rejected." : "Optional verification note"}
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReviewTarget(null);
                  setReviewNotes("");
                }}
                disabled={Boolean(busyId)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAction()}
                disabled={Boolean(busyId) || (reviewTarget.action === "Rejected" && !reviewNotes.trim())}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                  reviewTarget.action === "Rejected" ? "bg-red-600" : "bg-emerald-600"
                }`}
              >
                {busyId ? "Saving…" : reviewTarget.action === "Rejected" ? "Reject document" : "Verify document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
