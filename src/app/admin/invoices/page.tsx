"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE" | "PENDING_VERIFICATION";

type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  agreementId: string;
  companyName: string;
  candidateName?: string;
  jobTitle?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidDate?: string;
  updatedAt: string;
  bankTransferRef?: string;
  bankTransferReceiptUrl?: string;
  receiptMimeType?: string;
};

type CurrencySummary = {
  currency: string;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  pendingVerification: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
};

type InvoiceSummary = {
  currencyMode: "single" | "multiple";
  currencies: string[];
  byCurrency: Record<string, CurrencySummary>;
  count: number;
};

type ReviewAction = "mark_paid" | "reject_receipt";
const PAGE_SIZE = 25;

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function statusClass(status: InvoiceStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "PENDING_VERIFICATION":
      return "border-amber-400/20 bg-amber-500/10 text-amber-300";
    case "OVERDUE":
      return "border-red-400/20 bg-red-500/10 text-red-300";
    default:
      return "border-slate-400/20 bg-slate-500/10 text-slate-300";
  }
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<"" | InvoiceStatus>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ invoice: InvoiceRecord; action: ReviewAction } | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [agreementId, setAgreementId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (deferredSearch) params.set("search", deferredSearch);
    if (status) params.set("status", status);

    fetch(`/api/admin/invoices?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load invoices.");
        }
        setInvoices(Array.isArray(payload.invoices) ? payload.invoices : []);
        setSummary(payload.summary || null);
        setTotal(typeof payload.total === "number" ? payload.total : 0);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setInvoices([]);
        setSummary(null);
        setTotal(0);
        setLoadError(reason instanceof Error ? reason.message : "Unable to load invoices.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [deferredSearch, status, page, refreshKey]);

  const currencySummaries = useMemo(
    () => (summary ? Object.values(summary.byCurrency).sort((a, b) => a.currency.localeCompare(b.currency)) : []),
    [summary],
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const createReady = Boolean(agreementId.trim()) && Number.isFinite(Number(amount)) && Number(amount) > 0;

  async function createInvoice() {
    if (!createReady || busy) return;
    setBusy(true);
    setActionMessage(null);
    try {
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreementId: agreementId.trim(),
          candidateName: candidateName.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          amount: Number(amount),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Invoice creation failed.");
      }

      setActionMessage({ type: "success", text: "Invoice created successfully." });
      setShowCreateModal(false);
      setAgreementId("");
      setCandidateName("");
      setJobTitle("");
      setAmount("");
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setActionMessage({ type: "error", text: error instanceof Error ? error.message : "Invoice creation failed." });
    } finally {
      setBusy(false);
    }
  }

  async function reviewReceipt() {
    if (!reviewTarget || busy) return;
    if (reviewTarget.action === "reject_receipt" && reviewReason.trim().length < 3) {
      setActionMessage({ type: "error", text: "Enter a rejection reason before rejecting the receipt." });
      return;
    }

    setBusy(true);
    setActionMessage(null);
    try {
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewTarget.action,
          invoiceId: reviewTarget.invoice.id,
          expectedUpdatedAt: reviewTarget.invoice.updatedAt,
          reason: reviewReason.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Receipt review failed.");
      }

      setActionMessage({
        type: "success",
        text: reviewTarget.action === "mark_paid"
          ? "Payment confirmed and invoice marked paid."
          : "Receipt rejected; invoice remains outstanding.",
      });
      setReviewTarget(null);
      setReviewReason("");
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setActionMessage({ type: "error", text: error instanceof Error ? error.message : "Receipt review failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Invoice Operations"
          subtitle="Signed-agreement invoices and bank-transfer receipt review."
          onSearch={setSearch}
        />

        <main className="mx-auto max-w-7xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24">
          {actionMessage && (
            <div
              role={actionMessage.type === "error" ? "alert" : "status"}
              aria-live={actionMessage.type === "error" ? "assertive" : "polite"}
              className={`rounded-xl border px-4 py-3 text-sm ${
                actionMessage.type === "error"
                  ? "border-red-400/30 bg-red-500/10 text-red-200"
                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Invoice & Revenue Operations</h1>
              <p className="mt-1 text-xs text-slate-400">Tax, currency and due date come from the signed commercial agreement.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#26A69A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#26A69A]/90"
            >
              <span className="material-symbols-outlined text-sm">post_add</span>
              Create Invoice
            </button>
          </div>

          {loading ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-slate-400">
              Loading invoices…
            </div>
          ) : loadError ? (
            <div role="alert" className="rounded-2xl border border-red-400/25 bg-red-500/10 p-6 text-sm text-red-200">
              {loadError}
            </div>
          ) : (
            <>
              {summary?.currencyMode === "multiple" && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Multiple currencies are reported separately; invoice values are never combined into an artificial total.
                </div>
              )}

              {currencySummaries.length > 0 && (
                <section className="grid gap-4 xl:grid-cols-2" aria-label="Invoice financial summary by currency">
                  {currencySummaries.map((item) => (
                    <article key={item.currency} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#26A69A]">{item.currency}</p>
                          <p className="mt-2 text-xl font-black">{money(item.totalBilled, item.currency)}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{item.invoiceCount} invoices billed</p>
                        </div>
                        <p className="text-right text-xs text-slate-400">
                          Collected<br />
                          <strong className="text-emerald-300">{money(item.totalCollected, item.currency)}</strong>
                        </p>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-200">
                          Outstanding<br /><strong>{money(item.totalOutstanding, item.currency)}</strong>
                        </div>
                        <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-200">
                          Overdue<br /><strong>{money(item.totalOverdue, item.currency)}</strong>
                        </div>
                        <div className="rounded-xl bg-sky-500/10 p-3 text-xs text-sky-200">
                          Awaiting audit<br /><strong>{money(item.pendingVerification, item.currency)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}

              <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]" aria-labelledby="invoice-queue-heading">
                <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 id="invoice-queue-heading" className="font-bold">Commercial invoices</h2>
                    <p className="mt-1 text-xs text-slate-400">{total} matching invoice{total === 1 ? "" : "s"}</p>
                  </div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500">
                    Status
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as "" | InvoiceStatus)}
                      className="mt-1 w-full min-w-52 rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-xs normal-case text-white"
                    >
                      <option value="">All statuses</option>
                      <option value="UNPAID">Unpaid</option>
                      <option value="PENDING_VERIFICATION">Awaiting receipt audit</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </label>
                </div>

                {invoices.length === 0 ? (
                  <div className="p-8 text-sm text-slate-400">No invoices match the current search and status filter.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {invoices.map((invoice) => (
                      <article key={invoice.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#FFCA28]">{invoice.invoiceNumber}</span>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(invoice.status)}`}>
                              {invoice.status === "PENDING_VERIFICATION" ? "AWAITING AUDIT" : invoice.status}
                            </span>
                          </div>
                          <h3 className="truncate text-sm font-bold">{invoice.companyName}</h3>
                          <p className="text-xs text-slate-400">
                            {invoice.candidateName ? `Candidate: ${invoice.candidateName}` : "No candidate attached"}
                            {invoice.jobTitle ? ` · ${invoice.jobTitle}` : ""}
                          </p>
                          <p className="text-[11px] text-slate-500">Agreement: {invoice.agreementId}</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="font-mono text-sm font-extrabold">{money(invoice.totalAmount, invoice.currency)}</p>
                            <p className="text-[10px] text-slate-500">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
                          </div>
                          {invoice.status === "PENDING_VERIFICATION" && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewReason("");
                                setReviewTarget({ invoice, action: "mark_paid" });
                              }}
                              className="rounded-xl bg-[#FFCA28] px-4 py-2 text-xs font-bold text-black hover:bg-[#FFCA28]/90"
                            >
                              Review Receipt
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {total > PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t border-white/10 p-4">
                    <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40">
                      Previous
                    </button>
                    <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                    <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40">
                      Next
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="create-invoice-title" className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <h2 id="create-invoice-title" className="text-lg font-bold">Generate Commercial Invoice</h2>
            <label className="block text-xs text-slate-400">
              Commercial Agreement ID
              <input value={agreementId} onChange={(event) => setAgreementId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-xs text-white" />
            </label>
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-400">
              Company identity, billing currency, tax rate and due date are derived from the signed agreement and linked hiring requirement.
            </p>
            <label className="block text-xs text-slate-400">
              Candidate name (optional)
              <input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} maxLength={200} className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-xs text-white" />
            </label>
            <label className="block text-xs text-slate-400">
              Job title (optional)
              <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} maxLength={200} className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-xs text-white" />
            </label>
            <label className="block text-xs text-slate-400">
              Approved base fee amount
              <input
                type="number"
                value={amount}
                min="0.01"
                step="0.01"
                placeholder="Enter amount in the agreement currency"
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-xs text-white"
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              <button type="button" onClick={() => setShowCreateModal(false)} disabled={busy} className="px-4 py-2 text-xs text-slate-400 disabled:opacity-40">Cancel</button>
              <button type="button" onClick={() => void createInvoice()} disabled={!createReady || busy} className="rounded-xl bg-[#26A69A] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">
                {busy ? "Creating…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="receipt-review-title" className="w-full max-w-lg space-y-5 rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <div>
              <p className="font-mono text-xs font-bold text-[#FFCA28]">{reviewTarget.invoice.invoiceNumber}</p>
              <h2 id="receipt-review-title" className="mt-1 text-lg font-bold">Review bank-transfer receipt</h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#16161B] p-4 text-xs">
              <div className="flex justify-between gap-4"><span className="text-slate-400">Company</span><strong>{reviewTarget.invoice.companyName}</strong></div>
              <div className="mt-2 flex justify-between gap-4"><span className="text-slate-400">Invoice total</span><strong>{money(reviewTarget.invoice.totalAmount, reviewTarget.invoice.currency)}</strong></div>
              <div className="mt-2 flex justify-between gap-4"><span className="text-slate-400">UTR / reference</span><strong className="font-mono text-[#FFCA28]">{reviewTarget.invoice.bankTransferRef || "Not recorded"}</strong></div>
            </div>

            {reviewTarget.invoice.bankTransferReceiptUrl ? (
              <a href={reviewTarget.invoice.bankTransferReceiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex text-xs font-bold text-[#26A69A] hover:underline">
                Open submitted receipt
              </a>
            ) : (
              <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">Receipt file is unavailable; do not approve this payment.</div>
            )}

            <label className="block text-xs text-slate-400">
              Reviewer reason {reviewTarget.action === "reject_receipt" ? "(required)" : "(optional)"}
              <textarea
                value={reviewReason}
                onChange={(event) => setReviewReason(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={reviewTarget.action === "reject_receipt" ? "Explain why the submitted receipt is rejected." : "Optional payment verification note"}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>

            <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setReviewTarget((current) => current ? { ...current, action: "reject_receipt" } : null)}
                disabled={busy}
                className="rounded-xl border border-red-500/30 bg-red-600/20 px-4 py-2 text-xs font-bold text-red-300 disabled:opacity-40"
              >
                Reject Receipt
              </button>
              <div className="flex gap-2 sm:justify-end">
                <button type="button" onClick={() => { setReviewTarget(null); setReviewReason(""); }} disabled={busy} className="px-4 py-2 text-xs text-slate-400 disabled:opacity-40">Cancel</button>
                <button
                  type="button"
                  onClick={() => void reviewReceipt()}
                  disabled={
                    busy ||
                    !reviewTarget.invoice.bankTransferReceiptUrl ||
                    (reviewTarget.action === "reject_receipt" && reviewReason.trim().length < 3)
                  }
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white disabled:opacity-40 ${
                    reviewTarget.action === "reject_receipt" ? "bg-red-600" : "bg-[#26A69A]"
                  }`}
                >
                  {busy ? "Saving…" : reviewTarget.action === "reject_receipt" ? "Confirm Rejection" : "Approve & Mark Paid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
