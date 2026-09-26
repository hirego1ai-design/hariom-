"use client";

import { useCallback, useEffect, useState } from "react";

type EventItem = {
  id: string;
  violationType: string;
  severity: string;
  timestamp: string;
};

type Metrics = {
  totalViolations: number;
  cheatingRiskScore: number;
  status: "REVIEW_REQUIRED" | "NO_REVIEW_REQUIRED";
  evidenceSource: string;
  requiresHumanReview: boolean;
  events: EventItem[];
};

export default function ProctoringReviewPanel({ interviewId, live = false }: { interviewId: string; live?: boolean }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!interviewId) return;
    try {
      const response = await fetch(`/api/proctoring/telemetry?interviewId=${encodeURIComponent(interviewId)}`, { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Could not load proctoring telemetry.");
      setMetrics(data.metrics);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load proctoring telemetry.");
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    void load();
    if (!live) return;
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [live, load]);

  if (!interviewId) {
    return <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-slate-400">Open this page from an interview so a valid interview ID is supplied.</div>;
  }
  if (loading) return <div className="p-8 text-sm text-slate-400">Loading integrity telemetry…</div>;
  if (error) return <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>;
  if (!metrics) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
          <p className="text-xs text-slate-400">Browser events</p>
          <p className="mt-2 text-2xl font-bold text-white">{metrics.totalViolations}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
          <p className="text-xs text-slate-400">Advisory risk score</p>
          <p className="mt-2 text-2xl font-bold text-white">{metrics.cheatingRiskScore}/100</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
          <p className="text-xs text-slate-400">Review status</p>
          <p className="mt-2 text-sm font-bold text-white">{metrics.status.replaceAll("_", " ")}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-100">
        Evidence source: {metrics.evidenceSource}. Browser telemetry is advisory and requires human review; it must not automatically select or reject a candidate.
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121215] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold text-white">Integrity events</h2>
          <button onClick={() => void load()} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/5">Refresh</button>
        </div>
        {metrics.events.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No browser integrity events have been recorded for this interview.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {metrics.events.map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs">
                <div>
                  <p className="font-bold text-white">{event.violationType.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 uppercase text-slate-300">{event.severity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
