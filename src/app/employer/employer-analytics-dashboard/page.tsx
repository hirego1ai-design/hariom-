"use client";

import { useEffect, useState } from "react";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type AnalyticsData = {
  rangeDays: number;
  metrics: {
    applications: number;
    previousApplications: number;
    applicationGrowthPercent: number | null;
    activeJobs: number;
    completedInterviews: number;
    hires: number;
    averageTimeToHireDays: number | null;
  };
  funnel: Record<string, number>;
  departments: Array<{ name: string; applications: number; hires: number; conversionPercent: number }>;
  unavailableMetrics: string[];
};

export default function EmployerAnalyticsDashboard() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/employer/analytics?range=${encodeURIComponent(range)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load recruiting analytics.");
        setData(payload.data);
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Unable to load recruiting analytics.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [range]);

  const cards = data
    ? [
        ["Applications", data.metrics.applications.toLocaleString(), data.metrics.applicationGrowthPercent === null ? "No prior-period baseline" : `${data.metrics.applicationGrowthPercent >= 0 ? "+" : ""}${data.metrics.applicationGrowthPercent}% vs prior period`],
        ["Active Jobs", data.metrics.activeJobs.toLocaleString(), "Currently accepting applications"],
        ["Completed Interviews", data.metrics.completedInterviews.toLocaleString(), `Last ${data.rangeDays} days`],
        ["Hires", data.metrics.hires.toLocaleString(), data.metrics.averageTimeToHireDays === null ? "Time-to-hire not available yet" : `${data.metrics.averageTimeToHireDays} day average time-to-hire`],
      ]
    : [];

  return (
    <PageContainer>
      <PageHeader
        title="Recruiting Performance"
        subtitle="Authoritative recruiting analytics calculated from your company’s persisted jobs, applications, interviews, and hires."
      />

      <div className="mb-6 flex justify-end">
        <select
          aria-label="Analytics date range"
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="h-10 rounded-xl border border-white/10 bg-bg-elevated px-3 text-sm text-white outline-none focus:border-secondary"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading verified analytics…</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}

      {!loading && !error && data && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([label, value, note]) => (
              <article key={label} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
                <p className="mt-2 text-xs text-text-muted">{note}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <h2 className="text-lg font-extrabold text-white">Application Funnel</h2>
            <p className="mt-1 text-xs text-text-muted">Counts are derived directly from persisted application status.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries(data.funnel).map(([stage, count]) => (
                <div key={stage} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{stage.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{count}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
            <h2 className="text-lg font-extrabold text-white">Department Performance</h2>
            {data.departments.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">No application data is available for this period.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-white/10 text-text-muted">
                    <tr><th className="py-3">Department</th><th className="py-3 text-right">Applications</th><th className="py-3 text-right">Hires</th><th className="py-3 text-right">Conversion</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.departments.map((department) => (
                      <tr key={department.name}>
                        <td className="py-3 font-semibold text-white">{department.name}</td>
                        <td className="py-3 text-right text-text-secondary">{department.applications}</td>
                        <td className="py-3 text-right text-text-secondary">{department.hires}</td>
                        <td className="py-3 text-right text-text-secondary">{department.conversionPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
            <h2 className="text-sm font-bold text-amber-200">Metrics intentionally not fabricated</h2>
            <ul className="mt-3 space-y-2 text-xs text-text-muted">
              {data.unavailableMetrics.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
