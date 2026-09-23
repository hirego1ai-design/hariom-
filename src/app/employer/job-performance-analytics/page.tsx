"use client";

import { useEffect, useState } from "react";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type Job = { id: string; title: string; status: string; location: string };
type Analytics = {
  metrics: { applications: number; completedInterviews: number; hires: number; averageTimeToHireDays: number | null };
  funnel: Record<string, number>;
  unavailableMetrics: string[];
};

export default function JobPerformanceAnalyticsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employer/jobs", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load jobs.");
        const rows = Array.isArray(payload.jobs) ? payload.jobs : [];
        setJobs(rows);
        if (rows[0]?.id) setJobId(rows[0].id);
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Unable to load jobs.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!jobId) {
      if (jobs.length === 0) setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetch(`/api/employer/analytics?range=30&jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load job analytics.");
        setAnalytics(payload.data);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load job analytics."))
      .finally(() => setLoading(false));
  }, [jobId, jobs.length]);

  const selected = jobs.find((job) => job.id === jobId);

  return (
    <PageContainer>
      <PageHeader title="Job Performance Analytics" subtitle="Verified application and interview metrics for one company-owned job listing." />

      <div className="mb-6 max-w-xl">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">Job listing</label>
        <select value={jobId} onChange={(event) => setJobId(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-bg-elevated px-3 text-sm text-white outline-none focus:border-secondary">
          {jobs.length === 0 && <option value="">No jobs available</option>}
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.status}</option>)}
        </select>
      </div>

      {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading job analytics…</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}
      {!loading && !error && jobs.length === 0 && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Create a job before opening job analytics.</div>}

      {!loading && !error && selected && analytics && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <h2 className="text-xl font-extrabold text-white">{selected.title}</h2>
            <p className="mt-1 text-xs text-text-muted">{selected.location} · {selected.status}</p>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Applications", analytics.metrics.applications],
              ["Completed Interviews", analytics.metrics.completedInterviews],
              ["Hires", analytics.metrics.hires],
              ["Avg. Time to Hire", analytics.metrics.averageTimeToHireDays === null ? "Not available" : `${analytics.metrics.averageTimeToHireDays} days`],
            ].map(([label, value]) => (
              <article key={String(label)} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-white">{String(value)}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <h2 className="text-lg font-extrabold text-white">Candidate Funnel</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries(analytics.funnel).map(([stage, count]) => (
                <div key={stage} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold uppercase text-text-muted">{stage.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{count}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-xs text-text-muted">
            {analytics.unavailableMetrics.map((note) => <p key={note} className="mt-1 first:mt-0">• {note}</p>)}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
