"use client";

import { useDeferredValue, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type JobStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";

type JobRecord = {
  id: string;
  title: string;
  department: string | null;
  location: string;
  type: string;
  status: JobStatus;
  createdAt: string;
  company: { name: string };
  _count: { applications: number };
};

const PAGE_SIZE = 25;

const statusClasses: Record<JobStatus, string> = {
  ACTIVE: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  DRAFT: "border-slate-400/20 bg-slate-500/10 text-slate-300",
  PAUSED: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  CLOSED: "border-red-400/20 bg-red-500/10 text-red-300",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<"" | JobStatus>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      search: deferredSearch,
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (status) params.set("status", status);

    fetch(`/api/admin/jobs?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load jobs.");
        }
        setJobs(Array.isArray(payload.data) ? payload.data : []);
        setTotal(typeof payload.total === "number" ? payload.total : 0);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setJobs([]);
        setTotal(0);
        setError(reason instanceof Error ? reason.message : "Unable to load jobs.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [deferredSearch, status, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Job Listings"
          subtitle="Persisted job listings and application counts."
          onSearch={setSearch}
        />

        <main className="mx-auto max-w-6xl p-4 pt-24 sm:p-6 sm:pt-24">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141418]" aria-labelledby="job-listings-heading">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 id="job-listings-heading" className="font-bold">All job listings</h1>
                <p className="mt-1 text-xs text-slate-400">
                  {loading ? "Loading authoritative records…" : total === 0 ? "No matching jobs" : `Showing ${from}–${to} of ${total}`}
                </p>
              </div>

              <label className="flex min-w-44 flex-col gap-1 text-[11px] text-slate-400">
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as "" | JobStatus)}
                  className="rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className="p-8 text-sm text-slate-400" role="status" aria-live="polite">Loading job listings…</div>
            ) : error ? (
              <div className="p-8 text-sm text-red-300" role="alert">{error}</div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-sm text-slate-400">
                {deferredSearch || status ? "No jobs match the current search and filters." : "No persisted jobs found."}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {jobs.map((job) => (
                  <article key={job.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{job.title}</p>
                      <p className="truncate text-xs text-slate-400">
                        {job.company.name} · {job.location} · {job.type}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {job.department || "Department not set"} · Created {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses[job.status]}`}>
                        {job.status}
                      </span>
                      <span className="text-xs text-slate-400">{job._count.applications} applications</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && !error && total > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 border-t border-white/10 p-4">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400" aria-live="polite">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
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
