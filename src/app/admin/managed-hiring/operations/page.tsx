"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
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

type PlacementStatus = "SCHEDULED" | "HOLD" | "INVOICED" | "CANCELLED";
type PlacementAction = "HOLD" | "RESUME" | "CANCEL";

type Placement = {
  id: string;
  applicationId: string;
  agreementId: string;
  agreementNumber: string;
  agreementStatus: string;
  companyId: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  applicationStatus: string;
  joinedAt: string;
  invoiceEligibleAt: string;
  annualCtc: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  creditDays: number;
  status: PlacementStatus;
  holdReason: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

const requirementStages = [
  ["Requirements", "/admin/managed-hiring/requests"],
  ["Commercial pipeline", "/admin/managed-hiring/pipeline"],
  ["Agreement templates", "/admin/agreements/templates"],
  ["Agreement builder", "/admin/agreements/builder"],
  ["Invoices", "/admin/invoices"],
] as const;

const PLACEMENT_PAGE_SIZE = 25;

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

function placementStatusClass(status: PlacementStatus) {
  switch (status) {
    case "SCHEDULED":
      return "border-sky-400/20 bg-sky-500/10 text-sky-300";
    case "HOLD":
      return "border-amber-400/20 bg-amber-500/10 text-amber-300";
    case "INVOICED":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "CANCELLED":
      return "border-red-400/20 bg-red-500/10 text-red-300";
  }
}

export default function ManagedHiringOperationsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [requirementTotal, setRequirementTotal] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [placementTotal, setPlacementTotal] = useState(0);
  const [placementPage, setPlacementPage] = useState(1);
  const [placementStatus, setPlacementStatus] = useState<"" | PlacementStatus>("");
  const [placementSearch, setPlacementSearch] = useState("");
  const deferredPlacementSearch = useDeferredValue(placementSearch);
  const [placementStatusCounts, setPlacementStatusCounts] = useState<Record<string, number>>({});
  const [placementLoading, setPlacementLoading] = useState(true);
  const [placementError, setPlacementError] = useState("");
  const [placementNotice, setPlacementNotice] = useState("");
  const [placementActionTarget, setPlacementActionTarget] = useState<{
    placement: Placement;
    action: PlacementAction;
  } | null>(null);
  const [placementReason, setPlacementReason] = useState("");
  const [placementSaving, setPlacementSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOverview() {
      setOverviewLoading(true);
      setOverviewError("");
      try {
        const [requirementsResponse, invoicesResponse] = await Promise.all([
          fetch("/api/admin/managed-hiring/requirements?page=1&limit=8", { cache: "no-store" }),
          fetch("/api/admin/invoices?page=1&limit=8", { cache: "no-store" }),
        ]);
        const [requirementsPayload, invoicesPayload] = await Promise.all([
          requirementsResponse.json().catch(() => ({})),
          invoicesResponse.json().catch(() => ({})),
        ]);

        if (!requirementsResponse.ok || !requirementsPayload.success) {
          throw new Error(requirementsPayload.error || "Managed-hiring requirements are unavailable.");
        }
        if (!invoicesResponse.ok || !invoicesPayload.success) {
          throw new Error(invoicesPayload.error || "Invoice evidence is unavailable.");
        }
        if (!mounted) return;

        setRequirements(Array.isArray(requirementsPayload.requirements) ? requirementsPayload.requirements : []);
        setRequirementTotal(typeof requirementsPayload.total === "number" ? requirementsPayload.total : 0);
        setStatusCounts(
          requirementsPayload.statusCounts && typeof requirementsPayload.statusCounts === "object"
            ? requirementsPayload.statusCounts
            : {},
        );
        setInvoices(Array.isArray(invoicesPayload.invoices) ? invoicesPayload.invoices : []);
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
        setOverviewError(
          cause instanceof Error ? cause.message : "Managed-hiring operations evidence is unavailable.",
        );
      } finally {
        if (mounted) setOverviewLoading(false);
      }
    }

    void loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const loadPlacements = useCallback(async () => {
    setPlacementLoading(true);
    setPlacementError("");
    try {
      const params = new URLSearchParams({
        page: String(placementPage),
        limit: String(PLACEMENT_PAGE_SIZE),
      });
      if (placementStatus) params.set("status", placementStatus);
      if (deferredPlacementSearch.trim()) params.set("search", deferredPlacementSearch.trim());

      const response = await fetch(
        `/api/admin/managed-hiring/placements?${params.toString()}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.placements)) {
        throw new Error(payload.error || "Managed-hiring placements are unavailable.");
      }

      setPlacements(payload.placements);
      setPlacementTotal(typeof payload.total === "number" ? payload.total : 0);
      setPlacementStatusCounts(
        payload.statusCounts && typeof payload.statusCounts === "object"
          ? payload.statusCounts
          : {},
      );
    } catch (cause) {
      setPlacements([]);
      setPlacementTotal(0);
      setPlacementStatusCounts({});
      setPlacementError(
        cause instanceof Error ? cause.message : "Managed-hiring placements are unavailable.",
      );
    } finally {
      setPlacementLoading(false);
    }
  }, [deferredPlacementSearch, placementPage, placementStatus]);

  useEffect(() => {
    setPlacementPage(1);
  }, [deferredPlacementSearch, placementStatus]);

  useEffect(() => {
    void loadPlacements();
  }, [loadPlacements]);

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
      (sum, currency) => sum + Math.max(0, currency.invoiceCount - currency.paidCount),
      0,
    );
  }, [invoiceSummary]);

  const placementPages = Math.max(1, Math.ceil(placementTotal / PLACEMENT_PAGE_SIZE));

  async function applyPlacementAction() {
    if (!placementActionTarget || placementSaving || placementReason.trim().length < 5) return;
    setPlacementSaving(true);
    setPlacementError("");
    setPlacementNotice("");
    try {
      const response = await fetch("/api/admin/managed-hiring/placements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placementId: placementActionTarget.placement.id,
          action: placementActionTarget.action,
          reason: placementReason.trim(),
          expectedUpdatedAt: placementActionTarget.placement.updatedAt,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to update placement state.");
      }

      setPlacementNotice(payload.message || "Placement state updated and audited.");
      setPlacementActionTarget(null);
      setPlacementReason("");
      await loadPlacements();
    } catch (cause) {
      setPlacementError(cause instanceof Error ? cause.message : "Unable to update placement state.");
    } finally {
      setPlacementSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Managed Hiring Operations"
          subtitle="Persisted requirement, placement, agreement and invoice evidence"
        />

        <main className="mx-auto w-full max-w-[1500px] space-y-7 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                Admin operations
              </p>
              <h1 className="text-3xl font-bold">Managed Hiring control center</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Commercial mandates, signed-agreement placement billing, invoice scheduling and operator holds are shown from persisted database evidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/agreements/templates" className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white">
                Manage agreement terms
              </Link>
              <Link href="/admin/settings/managed-hiring" className="rounded-xl border border-white/10 px-5 py-3 text-xs font-bold text-white">
                Platform controls
              </Link>
            </div>
          </header>

          {overviewError && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {overviewError}
            </div>
          )}

          {placementError && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {placementError}
            </div>
          )}
          {placementNotice && (
            <div role="status" aria-live="polite" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {placementNotice}
            </div>
          )}

          {overviewLoading ? (
            <div role="status" className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-slate-400">
              Loading authoritative operations evidence…
            </div>
          ) : !overviewError ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Managed hiring summary">
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Active requirements</p>
                  <p className="mt-2 text-2xl font-bold">{activeRequirementCount}</p>
                  <p className="mt-1 text-[10px] text-slate-500">all non-closed persisted requirements</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Total requirements</p>
                  <p className="mt-2 text-2xl font-bold">{requirementTotal}</p>
                  <p className="mt-1 text-[10px] text-slate-500">database count</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Invoice records</p>
                  <p className="mt-2 text-2xl font-bold">{invoiceSummary?.count ?? "No data"}</p>
                  <p className="mt-1 text-[10px] text-slate-500">all currencies, not combined as money</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Unsettled invoices</p>
                  <p className="mt-2 text-2xl font-bold">{openInvoiceCount ?? "No data"}</p>
                  <p className="mt-1 text-[10px] text-slate-500">invoice count, not outstanding amount</p>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-6">
                <div className="mb-4">
                  <h2 className="font-bold">Operational surfaces</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Each link opens a persisted workflow surface; placement operations are managed directly below.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {requirementStages.map(([stage, href], index) => (
                    <Link key={stage} href={href} className="rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-4 text-center transition hover:bg-indigo-400/10">
                      <span className="text-xs font-bold text-indigo-300">{index + 1}</span>
                      <p className="mt-2 text-xs font-bold">{stage}</p>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]" aria-labelledby="placement-operations-heading">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 id="placement-operations-heading" className="font-bold">PPH placement operations</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {placementTotal} persisted placement{placementTotal === 1 ? "" : "s"}. HOLD pauses invoice scheduling; CANCEL stops this placement from future invoicing but does not rewrite the candidate's hired application state.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Search
                  <input
                    value={placementSearch}
                    onChange={(event) => setPlacementSearch(event.target.value)}
                    maxLength={120}
                    placeholder="Candidate, company, job, placement…"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#19191e] px-3 py-2 text-xs normal-case text-white sm:w-72"
                  />
                </label>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Status
                  <select
                    value={placementStatus}
                    onChange={(event) => setPlacementStatus(event.target.value as "" | PlacementStatus)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#19191e] px-3 py-2 text-xs normal-case text-white sm:w-44"
                  >
                    <option value="">All statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="HOLD">Hold</option>
                    <option value="INVOICED">Invoiced</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-2 border-b border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {(["SCHEDULED", "HOLD", "INVOICED", "CANCELLED"] as PlacementStatus[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={placementStatus === item}
                  onClick={() => setPlacementStatus((current) => current === item ? "" : item)}
                  className={`rounded-xl border p-3 text-left ${
                    placementStatus === item ? "border-indigo-400/40 bg-indigo-400/10" : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase text-slate-500">{item}</p>
                  <p className="mt-1 text-xl font-bold">{placementStatusCounts[item] || 0}</p>
                </button>
              ))}
            </div>

            {placementLoading ? (
              <div role="status" aria-live="polite" className="p-8 text-sm text-slate-400">
                Loading persisted placement evidence…
              </div>
            ) : placements.length === 0 ? (
              <div className="p-8 text-sm text-slate-400">No placements match the current filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] text-left text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="p-4">Candidate / job</th>
                      <th className="p-4">Company / agreement</th>
                      <th className="p-4">Joining</th>
                      <th className="p-4">Billing snapshot</th>
                      <th className="p-4">Invoice</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placements.map((placement) => (
                      <tr key={placement.id} className="border-t border-white/5 align-top">
                        <td className="p-4">
                          <p className="font-bold text-white">{placement.candidateName || "Candidate name unavailable"}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{placement.candidateEmail}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{placement.jobTitle}</p>
                          <p className="mt-1 font-mono text-[10px] text-slate-600">{placement.applicationId}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">{placement.companyName}</p>
                          <p className="mt-1 font-mono text-[10px] text-indigo-300">{placement.agreementNumber}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{placement.agreementStatus.replaceAll("_", " ")}</p>
                        </td>
                        <td className="p-4 text-slate-400">
                          <p>Joined {new Date(placement.joinedAt).toLocaleDateString()}</p>
                          <p className="mt-1">Invoice eligible {new Date(placement.invoiceEligibleAt).toLocaleDateString()}</p>
                          <p className="mt-1">Application: {placement.applicationStatus}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">{money(placement.totalAmount, placement.currency)}</p>
                          <p className="mt-1 text-[10px] text-slate-500">CTC {money(placement.annualCtc, placement.currency)}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{placement.creditDays} credit days</p>
                        </td>
                        <td className="p-4">
                          {placement.invoiceNumber ? (
                            <>
                              <p className="font-mono text-[11px]">{placement.invoiceNumber}</p>
                              <p className="mt-1 text-[10px] text-slate-500">{placement.invoiceStatus}</p>
                            </>
                          ) : (
                            <span className="text-slate-500">Not invoiced</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${placementStatusClass(placement.status)}`}>
                            {placement.status}
                          </span>
                          {placement.holdReason && <p className="mt-2 max-w-xs text-[10px] text-slate-500">{placement.holdReason}</p>}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {placement.status === "SCHEDULED" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPlacementReason("");
                                  setPlacementActionTarget({ placement, action: "HOLD" });
                                }}
                                className="rounded-lg border border-amber-400/30 px-3 py-2 text-[10px] font-bold text-amber-300"
                              >
                                Hold
                              </button>
                            )}
                            {placement.status === "HOLD" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPlacementReason("");
                                  setPlacementActionTarget({ placement, action: "RESUME" });
                                }}
                                className="rounded-lg border border-emerald-400/30 px-3 py-2 text-[10px] font-bold text-emerald-300"
                              >
                                Resume
                              </button>
                            )}
                            {(placement.status === "SCHEDULED" || placement.status === "HOLD") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPlacementReason("");
                                  setPlacementActionTarget({ placement, action: "CANCEL" });
                                }}
                                className="rounded-lg border border-red-400/30 px-3 py-2 text-[10px] font-bold text-red-300"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {placementTotal > PLACEMENT_PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-white/10 p-4">
                <button
                  type="button"
                  disabled={placementLoading || placementPage <= 1}
                  onClick={() => setPlacementPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">Page {placementPage} of {placementPages}</span>
                <button
                  type="button"
                  disabled={placementLoading || placementPage >= placementPages}
                  onClick={() => setPlacementPage((value) => Math.min(placementPages, value + 1))}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>

          {!overviewLoading && !overviewError && (
            <section className="grid gap-6 xl:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]">
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div>
                    <h2 className="font-bold">Recent requirements</h2>
                    <p className="mt-1 text-[10px] text-slate-500">Latest 8 records; stage totals above are global.</p>
                  </div>
                  <Link href="/admin/managed-hiring/requests" className="text-xs text-indigo-300">View all</Link>
                </div>
                {requirements.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">No managed-hiring requirements are persisted.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {requirements.map((requirement) => (
                      <div key={requirement.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] text-amber-300">{requirement.referenceCode}</p>
                            <p className="mt-1 truncate text-sm font-bold">{requirement.companyName}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{requirement.jobTitles.join(", ")}</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px]">
                            {requirement.status.replaceAll("_", " ")}
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500">
                          Agreement: {requirement.latestAgreementStatus?.replaceAll("_", " ") || "None"}
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
                    <p className="mt-1 text-[10px] text-slate-500">Latest 8 records; totals are taken from the invoice summary.</p>
                  </div>
                  <Link href="/admin/invoices" className="text-xs text-indigo-300">View all</Link>
                </div>
                {invoices.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">No invoice records are persisted.</div>
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
                            <td className="p-3">{invoice.currency} {invoice.totalAmount.toLocaleString()}</td>
                            <td className="p-3">{invoice.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {placementActionTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="placement-action-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl">
            <h2 id="placement-action-title" className="text-lg font-bold">
              {placementActionTarget.action === "HOLD"
                ? "Hold invoice scheduling?"
                : placementActionTarget.action === "RESUME"
                  ? "Resume invoice scheduling?"
                  : "Cancel this PPH placement?"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {placementActionTarget.placement.candidateName} · {placementActionTarget.placement.companyName} · {placementActionTarget.placement.jobTitle}
            </p>
            {placementActionTarget.action === "CANCEL" && (
              <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                Cancellation stops this placement from future PPH invoicing. It does not automatically change the candidate application's HIRED status.
              </p>
            )}
            <label className="mt-5 block text-xs text-slate-400">
              Operational reason
              <textarea
                value={placementReason}
                onChange={(event) => setPlacementReason(event.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Record the operational or reconciliation reason."
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPlacementActionTarget(null);
                  setPlacementReason("");
                }}
                disabled={placementSaving}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void applyPlacementAction()}
                disabled={placementSaving || placementReason.trim().length < 5}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-40 ${
                  placementActionTarget.action === "CANCEL"
                    ? "bg-red-600"
                    : placementActionTarget.action === "HOLD"
                      ? "bg-amber-600"
                      : "bg-emerald-600"
                }`}
              >
                {placementSaving ? "Saving…" : `Confirm ${placementActionTarget.action.toLowerCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
