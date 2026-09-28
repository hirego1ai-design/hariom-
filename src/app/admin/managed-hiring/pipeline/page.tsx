"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type RequirementStatus =
  | "SUBMITTED"
  | "IN_DISCUSSION"
  | "AGREEMENT_DRAFTED"
  | "AGREEMENT_SENT"
  | "ACTIVE"
  | "CLOSED";

type Requirement = {
  id: string;
  referenceCode: string;
  companyId: string | null;
  companyName: string;
  jobTitles: string[];
  numberOfPositions: number;
  location: string;
  hiringPriority: string;
  status: RequirementStatus;
  latestAgreementId: string | null;
  latestAgreementStatus: string | null;
  activeAgreementStatus: string | null;
  updatedAt: string;
};

const PAGE_SIZE = 20;
const stages: RequirementStatus[] = [
  "SUBMITTED",
  "IN_DISCUSSION",
  "AGREEMENT_DRAFTED",
  "AGREEMENT_SENT",
  "ACTIVE",
  "CLOSED",
];

export default function AdminManagedHiringPipeline() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCount = stages
    .filter((stage) => stage !== "CLOSED")
    .reduce((sum, stage) => sum + (statusCounts[stage] || 0), 0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (status) params.set("status", status);
      if (deferredSearch.trim()) params.set("search", deferredSearch.trim());

      const response = await fetch(
        `/api/admin/managed-hiring/requirements?${params.toString()}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.requirements)) {
        throw new Error(payload.error || "Unable to load managed-hiring pipeline.");
      }

      setRequirements(payload.requirements);
      setStatusCounts(
        payload.statusCounts && typeof payload.statusCounts === "object"
          ? payload.statusCounts
          : {},
      );
      setTotal(typeof payload.total === "number" ? payload.total : 0);
    } catch (cause) {
      setRequirements([]);
      setTotal(0);
      setStatusCounts({});
      setError(
        cause instanceof Error ? cause.message : "Unable to load managed-hiring pipeline.",
      );
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, page, status]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Managed Hiring Pipeline"
          subtitle="Persisted requirement stages and commercial agreement readiness"
        />

        <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Managed Hiring commercial pipeline
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Stage counts are database aggregates; list results below are paginated.
              </p>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-200">
              {activeCount} active requirement{activeCount === 1 ? "" : "s"}
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

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="Requirement stage counts">
            {stages.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setStatus((current) => current === stage ? "" : stage)}
                aria-pressed={status === stage}
                className={`rounded-2xl border p-4 text-left transition ${
                  status === stage
                    ? "border-primary/50 bg-primary/10"
                    : "border-white/10 bg-[#121215]"
                }`}
              >
                <p className="text-[10px] font-bold uppercase text-text-muted">
                  {stage.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {statusCounts[stage] || 0}
                </p>
              </button>
            ))}
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#121215]">
            <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-bold">Pipeline records</h2>
                <p className="mt-1 text-xs text-text-muted">
                  {total} record{total === 1 ? "" : "s"} match the current filters.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="text-xs text-text-muted">
                  Search
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={120}
                    placeholder="Reference or company"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white sm:w-64"
                  />
                </label>
                <label className="text-xs text-text-muted">
                  Stage
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] px-3 py-2 text-sm text-white sm:w-52"
                  >
                    <option value="">All stages</option>
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div role="status" className="p-12 text-center text-sm text-text-muted">
                Loading pipeline…
              </div>
            ) : requirements.length === 0 && !error ? (
              <div className="p-12 text-center text-sm text-text-muted">
                No managed-hiring requirements match the current filters.
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {requirements.map((requirement) => (
                  <article
                    key={requirement.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-amber-300">
                          {requirement.referenceCode}
                        </span>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold">
                          {requirement.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <h3 className="mt-2 font-bold text-white">
                        {requirement.companyName} — {requirement.jobTitles.join(", ")}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                        <span>{requirement.numberOfPositions} positions</span>
                        <span>{requirement.location}</span>
                        <span>Priority: {requirement.hiringPriority}</span>
                        <span>
                          Latest agreement: {requirement.latestAgreementStatus?.replaceAll("_", " ") || "None"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {requirement.latestAgreementId ? (
                        <Link
                          href={`/admin/agreements/${encodeURIComponent(requirement.latestAgreementId)}`}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
                        >
                          Review agreement
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/agreements/builder?reqId=${encodeURIComponent(requirement.id)}`}
                          aria-disabled={!requirement.companyId || requirement.status === "CLOSED"}
                          className={`rounded-xl px-4 py-2 text-xs font-bold ${
                            requirement.companyId && requirement.status !== "CLOSED"
                              ? "bg-sky-500 text-white"
                              : "pointer-events-none border border-white/10 text-text-muted opacity-50"
                          }`}
                        >
                          Draft agreement
                        </Link>
                      )}
                      <Link
                        href="/admin/managed-hiring/requests"
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white"
                      >
                        Open requests
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-white/10 p-4">
                <button
                  type="button"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
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
