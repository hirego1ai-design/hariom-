"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type Job = {
  id: string;
  title: string;
  department?: string | null;
  location: string;
  type: string;
  salaryRange?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  requirements?: string[];
};

const STATUS_OPTIONS = ["ACTIVE", "PAUSED", "CLOSED", "DRAFT"] as const;

export default function JobListingsManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [busyId, setBusyId] = useState("");

  async function loadJobs() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/employer/jobs", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load jobs.");
      setJobs(Array.isArray(payload.jobs) ? payload.jobs : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  const visibleJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery = !needle || [job.title, job.department, job.location, job.type]
        .some((value) => String(value || "").toLowerCase().includes(needle));
      const matchesStatus = statusFilter === "ALL" || String(job.status).toUpperCase() === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [jobs, query, statusFilter]);

  async function updateStatus(job: Job, status: typeof STATUS_OPTIONS[number]) {
    setBusyId(job.id);
    setNotice("");
    setError("");
    try {
      const response = await fetch(`/api/employer/jobs/${encodeURIComponent(job.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to update job status.");
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, ...payload.job, status: payload.job?.status || status } : item));
      setNotice(`Job status updated to ${status.replaceAll("_", " ")}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update job status.");
    } finally {
      setBusyId("");
    }
  }

  async function removeJob(job: Job) {
    if (!confirm(`Delete "${job.title}"? This action uses the authoritative job API and may be irreversible.`)) return;
    setBusyId(job.id);
    setNotice("");
    setError("");
    try {
      const response = await fetch(`/api/employer/jobs/${encodeURIComponent(job.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to delete job.");
      setJobs((current) => current.filter((item) => item.id !== job.id));
      setNotice("Job listing deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete job.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Job Listings"
        subtitle="Persisted company job listings only. Synthetic analytics, version history, benchmarks, AI projections, and simulated approval workflows are not shown."
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, department, location or type…"
            className="h-11 w-full max-w-xl rounded-xl border border-white/10 bg-bg-elevated px-4 text-sm text-white outline-none placeholder:text-text-muted focus:border-secondary"
          />
          <select
            aria-label="Filter jobs by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-bg-elevated px-3 text-sm text-white outline-none focus:border-secondary"
          >
            <option value="ALL">All statuses</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          <Link href="/employer/create-job-basic-info" className="rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white">Create job</Link>
          <Link href="/employer/job-performance-analytics" className="rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-white">Job analytics</Link>
        </div>
      </div>

      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">{notice}</div>}
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
      {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading company jobs…</div>}

      {!loading && visibleJobs.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-text-muted">
          No jobs match the current filters.
        </div>
      )}

      {!loading && visibleJobs.length > 0 && (
        <div className="space-y-4">
          {visibleJobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{job.title}</h2>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-text-secondary">
                      {String(job.status).replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {job.department || "Department not specified"} · {job.location} · {job.type}
                  </p>
                  {job.salaryRange && <p className="mt-2 text-xs text-text-secondary">Salary: {job.salaryRange}</p>}
                  {job.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">{job.description}</p>}
                  <p className="mt-3 text-[11px] text-text-muted">
                    Created: {job.createdAt ? new Date(job.createdAt).toLocaleString() : "Not available"}
                    {job.updatedAt ? ` · Updated: ${new Date(job.updatedAt).toLocaleString()}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 xl:max-w-sm xl:justify-end">
                  {STATUS_OPTIONS.filter((status) => status !== String(job.status).toUpperCase()).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={busyId === job.id}
                      onClick={() => updateStatus(job, status)}
                      className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-text-secondary hover:text-white disabled:opacity-50"
                    >
                      {status === "ACTIVE" ? "Activate" : status === "PAUSED" ? "Pause" : status === "CLOSED" ? "Close" : "Move to draft"}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={busyId === job.id}
                    onClick={() => removeJob(job)}
                    className="rounded-lg border border-red-500/20 px-3 py-2 text-[11px] font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
