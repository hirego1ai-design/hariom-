"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type CurrencySummary = {
  currency: string;
  totalRevenue: number;
  totalRevenueFormatted: string;
  currentMonthRevenue: number;
  currentMonthRevenueFormatted: string;
  previousMonthRevenue: number;
  growthPct: number | null;
  mrr: number;
  mrrFormatted: string;
  arr: number;
  arrFormatted: string;
  taxesCollected: number;
  taxesCollectedFormatted: string;
  netRevenue: number;
  netRevenueFormatted: string;
  pendingRevenue: number;
  refundedRevenue: number;
  failedPayments: number;
  successfulTransactions: number;
  transactionCount: number;
  streams: Record<string, { total: number; formatted: string; sharePct: number }>;
};

type RevenueSummary = {
  currencyMode: "single" | "multiple";
  currencies: string[];
  transactionCount: number;
  successfulTransactions: number;
  platformFees: null;
  netProfit: null;
  byCurrency: Record<string, CurrencySummary>;
};

type RevenueTransaction = {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerType: string;
  company: string;
  revenueSource: string;
  planPurchased: string;
  amount: number;
  amountFormatted: string;
  tax: number;
  discount: number;
  gateway: string;
  paymentMethod: string;
  currency: string;
  status: string;
  createdDate: string;
  paidDate: string;
  recordType: "payment" | "invoice";
};

type TransactionFilters = {
  revenueSources: string[];
  currencies: string[];
  gateways: string[];
};

const PAGE_SIZE = 25;

const statusClass = (status: string) => {
  switch (status) {
    case "Success":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "Pending":
      return "border-amber-400/20 bg-amber-500/10 text-amber-300";
    case "Refunded":
      return "border-sky-400/20 bg-sky-500/10 text-sky-300";
    case "Failed":
    case "Cancelled":
      return "border-red-400/20 bg-red-500/10 text-red-300";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
};

export default function AdminRevenuePage() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({ revenueSources: [], currencies: [], gateways: [] });
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [source, setSource] = useState("");
  const [currency, setCurrency] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setSummaryLoading(true);
    setSummaryError(null);

    fetch("/api/admin/revenue/summary", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load revenue summary.");
        }
        setSummary(payload.data);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setSummary(null);
        setSummaryError(reason instanceof Error ? reason.message : "Unable to load revenue summary.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setSummaryLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, source, currency, status]);

  useEffect(() => {
    const controller = new AbortController();
    setTransactionsLoading(true);
    setTransactionsError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (deferredSearch) params.set("search", deferredSearch);
    if (source) params.set("source", source);
    if (currency) params.set("currency", currency);
    if (status) params.set("status", status);

    fetch(`/api/admin/revenue/transactions?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load revenue transactions.");
        }
        setTransactions(Array.isArray(payload.data) ? payload.data : []);
        setTransactionTotal(typeof payload.total === "number" ? payload.total : 0);
        setFilters({
          revenueSources: Array.isArray(payload.filters?.revenueSources) ? payload.filters.revenueSources : [],
          currencies: Array.isArray(payload.filters?.currencies) ? payload.filters.currencies : [],
          gateways: Array.isArray(payload.filters?.gateways) ? payload.filters.gateways : [],
        });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setTransactions([]);
        setTransactionTotal(0);
        setTransactionsError(reason instanceof Error ? reason.message : "Unable to load revenue transactions.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTransactionsLoading(false);
      });

    return () => controller.abort();
  }, [deferredSearch, source, currency, status, page]);

  const currencySummaries = useMemo(
    () => (summary ? Object.values(summary.byCurrency).sort((a, b) => a.currency.localeCompare(b.currency)) : []),
    [summary],
  );
  const totalPages = Math.max(1, Math.ceil(transactionTotal / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Revenue & Billing"
          subtitle="Persisted payment and invoice evidence, separated by currency."
          onSearch={setSearch}
        />

        <main className="mx-auto max-w-7xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/invoices" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10">
              Invoice Operations
            </Link>
            <a
              href="/api/admin/revenue/export?format=csv"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
            >
              Export CSV
            </a>
            {summary?.currencyMode === "multiple" && (
              <span className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Multiple currencies are reported separately; no artificial combined total is shown.
              </span>
            )}
          </div>

          <section aria-labelledby="revenue-summary-heading">
            <div className="mb-3">
              <h1 id="revenue-summary-heading" className="text-lg font-bold">Revenue summary</h1>
              <p className="mt-1 text-xs text-slate-400">Successful payment and paid-invoice evidence only. Pending/refunded/failed values stay separate.</p>
            </div>

            {summaryLoading ? (
              <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-[#141418] p-8 text-sm text-slate-400">
                Loading revenue summary…
              </div>
            ) : summaryError ? (
              <div role="alert" className="rounded-2xl border border-red-400/25 bg-red-500/10 p-6 text-sm text-red-200">
                {summaryError}
              </div>
            ) : currencySummaries.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#141418] p-8 text-sm text-slate-400">
                No persisted financial transactions are available yet.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {currencySummaries.map((item) => (
                  <article key={item.currency} className="rounded-2xl border border-white/10 bg-[#141418] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">{item.currency}</p>
                        <p className="mt-2 text-2xl font-black">{item.totalRevenueFormatted}</p>
                        <p className="mt-1 text-[11px] text-slate-400">Collected revenue · {item.successfulTransactions} successful records</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>Current month</p>
                        <p className="mt-1 font-bold text-white">{item.currentMonthRevenueFormatted}</p>
                        <p className="mt-1">{item.growthPct === null ? "No prior-month baseline" : `${item.growthPct >= 0 ? "+" : ""}${item.growthPct}% vs prior month`}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ["MRR", item.mrrFormatted],
                        ["ARR run-rate", item.arrFormatted],
                        ["Taxes", item.taxesCollectedFormatted],
                        ["Net excl. tax", item.netRevenueFormatted],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
                          <p className="mt-1 text-sm font-bold">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-200">Pending: {new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency }).format(item.pendingRevenue)}</div>
                      <div className="rounded-xl bg-sky-500/10 p-3 text-xs text-sky-200">Refunded: {new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency }).format(item.refundedRevenue)}</div>
                      <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-200">Failed: {new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency }).format(item.failedPayments)}</div>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-xs font-bold text-slate-300">Revenue sources</p>
                      {Object.keys(item.streams).length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500">No successful source totals.</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {Object.entries(item.streams).map(([name, stream]) => (
                            <div key={name} className="flex items-center justify-between gap-4 text-xs">
                              <span className="text-slate-400">{name}</span>
                              <span className="font-semibold text-white">{stream.formatted} · {stream.sharePct}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141418]" aria-labelledby="revenue-transactions-heading">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 id="revenue-transactions-heading" className="font-bold">Transactions & invoices</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {transactionsLoading ? "Loading persisted records…" : `${transactionTotal} matching record${transactionTotal === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Source
                  <select value={source} onChange={(event) => setSource(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-xs normal-case text-white">
                    <option value="">All sources</option>
                    {filters.revenueSources.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Currency
                  <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-xs normal-case text-white">
                    <option value="">All currencies</option>
                    {filters.currencies.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Status
                  <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-xs normal-case text-white">
                    <option value="">All statuses</option>
                    <option value="Success">Success</option>
                    <option value="Pending">Pending</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Failed">Failed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>
              </div>
            </div>

            {transactionsLoading ? (
              <div role="status" aria-live="polite" className="p-8 text-sm text-slate-400">Loading revenue records…</div>
            ) : transactionsError ? (
              <div role="alert" className="p-8 text-sm text-red-300">{transactionsError}</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-sm text-slate-400">No records match the current search and filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="p-4">Record</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Source</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Gateway</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((transaction) => (
                      <tr key={`${transaction.recordType}:${transaction.id}`} className="hover:bg-white/[0.03]">
                        <td className="p-4">
                          <p className="font-mono text-[11px] text-white">{transaction.invoiceNo || transaction.id}</p>
                          <p className="mt-1 text-[10px] uppercase text-slate-500">{transaction.recordType}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{transaction.company || transaction.customerName}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{transaction.customerType}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white">{transaction.revenueSource}</p>
                          {transaction.planPurchased && <p className="mt-1 text-[11px] text-slate-500">{transaction.planPurchased}</p>}
                        </td>
                        <td className="p-4 font-semibold">{transaction.amountFormatted}</td>
                        <td className="p-4 text-slate-400">{transaction.gateway || "Offline / invoice"}</td>
                        <td className="p-4">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(transaction.status)}`}>{transaction.status}</span>
                        </td>
                        <td className="p-4 text-slate-400">{new Date(transaction.createdDate).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!transactionsLoading && !transactionsError && transactionTotal > PAGE_SIZE && (
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
        </main>
      </div>
    </div>
  );
}
