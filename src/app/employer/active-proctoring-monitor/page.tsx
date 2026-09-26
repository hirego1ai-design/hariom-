"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Metrics = {
  totalViolations: number;
  cheatingRiskScore: number;
  status: string;
  evidenceSource: string;
  requiresHumanReview: boolean;
  events: Array<{ id: string; violationType: string; severity: string; timestamp: string }>;
};

function Monitor() {
  const params = useSearchParams();
  const interviewId = params.get("interviewId") || "";
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) return;
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async () => {
      try {
        const response = await fetch(`/api/proctoring/telemetry?interviewId=${encodeURIComponent(interviewId)}`, { cache: "no-store" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Unable to load proctoring telemetry.");
        if (!stopped) { setMetrics(body.metrics); setError(""); }
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : "Unable to load proctoring telemetry.");
      }
    };
    void load();
    timer = setInterval(() => void load(), 5000);
    return () => { stopped = true; if (timer) clearInterval(timer); };
  }, [interviewId]);

  if (!interviewId) return <PageContainer><div className="mx-auto max-w-xl py-16 text-center"><h1 className="text-2xl font-bold">Proctoring telemetry monitor</h1><p className="mt-3 text-sm text-text-secondary">Open this monitor with an authorized interviewId. No demo telemetry is shown.</p></div></PageContainer>;

  return <PageContainer><div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
    <div><h1 className="text-2xl font-bold text-white">Live proctoring telemetry</h1><p className="text-sm text-text-secondary">Client-reported browser observations. Human review is required before using this evidence.</p></div>
    {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
    {metrics && <>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4"><p className="text-xs text-text-secondary">Events</p><p className="text-2xl font-bold">{metrics.totalViolations}</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-xs text-text-secondary">Advisory score</p><p className="text-2xl font-bold">{metrics.cheatingRiskScore}</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-xs text-text-secondary">Review status</p><p className="text-sm font-bold">{metrics.status}</p></div>
      </div>
      <div className="glass-card rounded-2xl p-5 space-y-2">
        <p className="text-xs text-text-secondary">Evidence source: {metrics.evidenceSource}</p>
        {metrics.events.length === 0 ? <p className="text-sm text-text-secondary">No browser observations recorded.</p> : metrics.events.map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-3 border-b border-white/5 py-2 text-sm"><span>{event.violationType}</span><span>{event.severity}</span><span className="text-text-secondary">{new Date(event.timestamp).toLocaleString()}</span></div>)}
      </div>
    </>}
  </div></PageContainer>;
}

export default function ActiveProctoringMonitorPage() {
  return <Suspense fallback={<PageContainer><div className="py-16 text-center">Loading telemetry…</div></PageContainer>}><Monitor /></Suspense>;
}
