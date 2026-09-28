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
  contactPerson: string;
  email: string;
  industry: string;
  numberOfPositions: number;
  jobTitles: string[];
  experienceYears: string;
  location: string;
  joiningTimeline: string;
  hiringPriority: string;
  replacementExpectation: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  currency: string;
  status: RequirementStatus;
  assignedSalesLead: string | null;
  activeAgreementId: string | null;
  activeAgreementStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 25;
const statuses: RequirementStatus[] = [
  "SUBMITTED",
  "IN_DISCUSSION",
  "AGREEMENT_DRAFTED",
  "AGREEMENT_SENT",
  "ACTIVE",
  "CLOSED",
];

export default function AdminManagedHiringRequestsPage() {
  const [requests, setRequests] = useState<Requirement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
      if (status) params.set("status", status);

      const response = await fetch(
        `/api/admin/managed-hiring/requirements?${params.toString()}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.requirements)) {
        throw new Error(payload.error || "Unable to load managed-hiring requirements.");
      }

      setRequests(payload.requirements);
      setTotal(typeof payload.total === "number" ? payload.total : 0);
    } catch (cause) {
      setRequests([]);
      setTotal(0);
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load managed-hiring requirements.",
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
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Managed Hiring Requests"
          subtitle="Authoritative employer mandates and agreement readiness"
        />

        <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Hiring mandates
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Review persisted requirements and initiate commercial agreement work only from company-bound records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/agreements/templates"
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white"
              >
                Agreement templates
              </Link>
              <Link
                href="/admin/agreements/builder"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
              >
                Draft agreement
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

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#141418]">
            <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-bold text-white">Requirement queue</h2>
                <p className="mt-1 text-xs text-text-muted">
                  {total} matching requirement{total === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="text-xs text-text-muted">
                  Search
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={120}
                    placeholder="Reference, company, contact or email"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white sm:w-72"
                  />
                </label>
                <label className="text-xs text-text-muted">
                  Status
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] px-3 py-2 text-sm text-white sm:w-52"
                  >
                    <option value="">All statuses</option>
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div
                role="status"
                aria-live="polite"
                className="p-12 text-center text-sm text-text-muted"
              >
                Loading persisted requirements…
              </div>
            ) : requests.length === 0 && !error ? (
              <div className="p-12 text-center text-sm text-text-muted">
                No managed-hiring requirements match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1120px] w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-text-muted">
                    <tr>
                      <th className="px-5 py-4">Reference / company</th>
                      <th className="px-5 py-4">Roles & volume</th>
                      <th className="px-5 py-4">Timeline / location</th>
                      <th className="px-5 py-4">Commercial evidence</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-5 py-4 align-top">
                          <p className="font-mono text-[10px] text-primary">
                            {request.referenceCode}
                          </p>
                          <p className="mt-1 font-bold text-white">{request.companyName}</p>
                          <p className="mt-1 text-text-muted">
                            {request.contactPerson} · {request.email}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex max-w-xs flex-wrap gap-1">
                            {request.jobTitles.map((title) => (
                              <span
                                key={title}
                                className="rounded bg-white/5 px-2 py-1 text-[10px] text-text-secondary"
                              >
                                {title}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 text-text-muted">
                            {request.numberOfPositions} position{request.numberOfPositions === 1 ? "" : "s"} · {request.experienceYears}
                          </p>
                          <p className="mt-1 text-text-muted">
                            {request.currency} {request.salaryRangeMin.toLocaleString()}–{request.salaryRangeMax.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top text-text-secondary">
                          <p>{request.location}</p>
                          <p className="mt-1">{request.joiningTimeline}</p>
                          <p className="mt-1">Priority: {request.hiringPriority}</p>
                          <p className="mt-1">Replacement: {request.replacementExpectation}</p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          {request.companyId ? (
                            <p className="text-emerald-300">Company bound</p>
                          ) : (
                            <p className="text-red-300">Missing company binding</p>
                          )}
                          <p className="mt-1 text-text-muted">
                            Agreement: {request.activeAgreementStatus?.replaceAll("_", " ") || "None active"}
                          </p>
                          {request.assignedSalesLead && (
                            <p className="mt-1 text-text-muted">
                              Sales lead: {request.assignedSalesLead}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="rounded-full border border-white/10 px-2.5 py-1 font-bold">
                            {request.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right align-top">
                          <Link
                            href={`/admin/agreements/builder?reqId=${encodeURIComponent(request.id)}`}
                            aria-disabled={!request.companyId}
                            className={`rounded-lg px-3 py-2 font-bold ${
                              request.companyId
                                ? "bg-primary text-white"
                                : "pointer-events-none border border-white/10 text-text-muted opacity-50"
                            }`}
                          >
                            Draft agreement
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
