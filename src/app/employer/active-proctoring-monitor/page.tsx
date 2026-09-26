"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type EventRecord = {
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
  events: EventRecord[];
};

function MonitorContent() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId") || "";
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/proctoring/telemetry?interviewId=${encodeURIComponent(interviewId)}`, { cache: "no-store" });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error || "Unable to load proctoring telemetry.");
        if (!cancelled) {
          setMetrics(body.metrics);
          setError("");
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load proctoring telemetry.");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [interviewId]);

  if (!interviewId) {
    return <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-text-muted">Open this monitor from a scheduled interview. An interviewId is required.</div>;
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Live evidence</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Browser-integrity monitor</h1>
        <p className="mt-2 text-sm text-text-muted">Client-reported events are advisory evidence for human review, not an automated cheating verdict.</p>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {!metrics ? (
        <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading telemetry…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">Events</p>
              <p className="mt-2 text-3xl font-bold">{metrics.totalViolations}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">Advisory score</p>
              <p className="mt-2 text-3xl font-bold">{metrics.cheatingRiskScore}/100</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">Review state</p>
              <p className="mt-2 text-sm font-bold">{metrics.requiresHumanReview ? "Human review required" : "No review flag"}</p>
            </div>
          </div>

          <section className="rounded-3xl border border-white/10 bg-[#121215] p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-bold">Recent events</h2>
              <span className="text-[10px] text-text-muted">{metrics.evidenceSource}</span>
            </div>
            {metrics.events.length === 0 ? (
              <p className="text-sm text-text-muted">No browser-integrity events have been recorded.</p>
            ) : (
              <div className="space-y-2">
                {metrics.events.map((event) => (
                  <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs">
                    <span className="font-semibold">{event.violationType.replaceAll("_", " ")}</span>
                    <span className="text-text-muted">{event.severity} · {new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function ActiveProctoringMonitorPage() {
  return (
    <PageContainer>
      <Suspense fallback={<div className="p-8 text-text-muted">Loading telemetry…</div>}>
        <MonitorContent />
      </Suspense>
    </PageContainer>
  );
}
