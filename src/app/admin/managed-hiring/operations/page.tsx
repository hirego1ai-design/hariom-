"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Requirement = {
  id: string;
  referenceCode: string;
  companyName: string;
  jobTitles: string[];
  status: string;
  latestAgreementId: string | null;
  latestAgreementStatus: string | null;
  activeAgreementStatus: string | null;
  updatedAt: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  companyName: string;
  candidateName?: string | null;
  currency: string;
  totalAmount: number;
  status: string;
};

type InvoiceCurrencySummary = {
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
};

type InvoiceSummary = {
  count: number;
  currencies: string[];
  byCurrency: Record<string, InvoiceCurrencySummary>;
};

const requirementStages = [
  ["Requirements", "/admin/managed-hiring/requests"],
  ["Commercial pipeline", "/admin/managed-hiring/pipeline"],
  ["Agreement templates", "/admin/agreements/templates"],
  ["Agreement builder", "/admin/agreements/builder"],
  ["Invoices", "/admin/invoices"],
] as const;

export default function ManagedHiringOperationsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [requirementTotal, setRequirementTotal] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [requirementsResponse, invoicesResponse] = await Promise.all([
          fetch("/api/admin/managed-hiring/requirements?page=1&limit=8", {
            cache: "no-store",
          }),
          fetch("/api/admin/invoices?page=1&limit=8", { cache: "no-store" }),
        ]);
        const [requirementsPayload, invoicesPayload] = await Promise.all([
          requirementsResponse.json().catch(() => ({})),
          invoicesResponse.json().catch(() => ({})),
        ]);

        if (!requirementsResponse.ok || !requirementsPayload.success) {
          throw new Error(
            requirementsPayload.error || "Managed-hiring requirements are unavailable.",
          );
        }
        if (!invoicesResponse.ok || !invoicesPayload.success) {
          throw new Error(invoicesPayload.error || "Invoice evidence is unavailable.");
        }
        if (!mounted) return;

        setRequirements(
          Array.isArray(requirementsPayload.requirements)
            ? requirementsPayload.requirements
            : [],
        );
        setRequirementTotal(
          typeof requirementsPayload.total === "number"
            ? requirementsPayload.total
            : 0,
        );
        setStatusCounts(
          requirementsPayload.statusCounts &&
            typeof requirementsPayload.statusCounts === "object"
            ? requirementsPayload.statusCounts
            : {},
        );
        setInvoices(
          Array.isArray(invoicesPayload.invoices) ? invoicesPayload.invoices : [],
        );
        setInvoiceSummary(
          invoicesPayload.summary && typeof invoicesPayload.summary === "object"
            ? invoicesPayload.summary
            : null,
        );
      } catch (cause) {
        if (!mounted) return;
        setRequirements([]);
        setInvoices([]);
        setStatusCounts({});
        setRequirementTotal(0);
        setInvoiceSummary(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Managed-hiring operations evidence is unavailable.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const activeRequirementCount = useMemo(
    () =>
      Object.entries(statusCounts)
        .filter(([status]) => status !== "CLOSED")
        .reduce((sum, [, count]) => sum + count, 0),
    [statusCounts],
  );

  const openInvoiceCount = useMemo(() => {
    if (!invoiceSummary) return null;
    return Object.values(invoiceSummary.byCurrency || {}).reduce(
      (sum, currency) =>
        sum + Math.max(0, currency.invoiceCount - currency.paidCount),
      0,
    );
  }, [invoiceSummary]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Managed Hiring Operations"
          subtitle="Persisted requirement, agreement and invoice evidence"
        />

        <main className="mx-auto w-full max-w-[1500px] space-y-7 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                Admin operations
              </p>
              <h1 className="text-3xl font-bold">Managed Hiring control center</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Requirement stages and invoice counts are persisted database evidence.
                Commercial fee, tax, credit and replacement terms are configured per
                agreement template and snapshotted into each commercial agreement.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/agreements/templates"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white"
              >
                Manage agreement terms
              </Link>
              <Link
                href="/admin/settings/managed-hiring"
                className="rounded-xl border border-white/10 px-5 py-3 text-xs font-bold text-white"
              >
                Platform controls
              </Link>
            </div>
          </header>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div role="status" className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-slate-400">
              Loading authoritative operations evidence…
            </div>
          ) : !error ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Managed hiring summary">
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Active requirements
                  </p>
                  <p className="mt-2 text-2xl font-bold">{activeRequirementCount}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    all non-closed persisted requirements
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Total requirements
                  </p>
                  <p className="mt-2 text-2xl font-bold">{requirementTotal}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    database count
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Invoice records
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {invoiceSummary?.count ?? "No data"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    all currencies, not combined as money
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Unsettled invoices
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {openInvoiceCount ?? "No data"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    invoice count, not outstanding amount
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-6">
                <div className="mb-4">
                  <h2 className="font-bold">Operational surfaces</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    These links open real persisted workflow surfaces; no separate
                    sourcing/interview queue is implied where one does not exist.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {requirementStages.map(([stage, href], index) => (
                    <Link
                      key={stage}
                      href={href}
                      className="rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-4 text-center transition hover:bg-indigo-400/10"
                    >
                      <span className="text-xs font-bold text-indigo-300">
                        {index + 1}
                      </span>
                      <p className="mt-2 text-xs font-bold">{stage}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]">
                  <div className="flex items-center justify-between border-b border-white/10 p-5">
                    <div>
                      <h2 className="font-bold">Recent requirements</h2>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Latest 8 records; stage totals above are global.
                      </p>
                    </div>
                    <Link
                      href="/admin/managed-hiring/requests"
                      className="text-xs text-indigo-300"
                    >
                      View all
                    </Link>
                  </div>
                  {requirements.length === 0 ? (
                    <div className="p-8 text-sm text-slate-500">
                      No managed-hiring requirements are persisted.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {requirements.map((requirement) => (
                        <div key={requirement.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-[10px] text-amber-300">
                                {requirement.referenceCode}
                              </p>
                              <p className="mt-1 truncate text-sm font-bold">
                                {requirement.companyName}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {requirement.jobTitles.join(", ")}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px]">
                              {requirement.status.replaceAll("_", " ")}
                            </span>
                          </div>
                          <p className="mt-2 text-[10px] text-slate-500">
                            Agreement:{" "}
                            {requirement.latestAgreementStatus?.replaceAll("_", " ") ||
                              "None"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]">
                  <div className="flex items-center justify-between border-b border-white/10 p-5">
                    <div>
                      <h2 className="font-bold">Recent invoices</h2>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Latest 8 records; totals are taken from the invoice summary.
                      </p>
                    </div>
                    <Link href="/admin/invoices" className="text-xs text-indigo-300">
                      View all
                    </Link>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="p-8 text-sm text-slate-500">
                      No invoice records are persisted.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[620px] w-full text-left text-xs">
                        <thead className="text-slate-500">
                          <tr>
                            <th className="p-3">Invoice</th>
                            <th className="p-3">Company</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-t border-white/5">
                              <td className="p-3 font-mono">{invoice.invoiceNumber}</td>
                              <td className="p-3">{invoice.companyName}</td>
                              <td className="p-3">
                                {invoice.currency} {invoice.totalAmount.toLocaleString()}
                              </td>
                              <td className="p-3">{invoice.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
