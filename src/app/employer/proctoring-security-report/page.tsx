"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

function ReportContent() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId") || "";
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) return;
    fetch(`/api/proctoring/telemetry?interviewId=${encodeURIComponent(interviewId)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error || "Unable to load report.");
        setData(body.metrics);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load report."));
  }, [interviewId]);

  if (!interviewId) {
    return <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-text-muted">Select a completed interview to view its proctoring evidence.</div>;
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Interview evidence</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Proctoring security report</h1>
        <p className="mt-2 text-sm text-text-muted">This report contains browser telemetry only. It does not claim face detection, audio analysis, or a verified finding of misconduct.</p>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {!data && !error && <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading report…</div>}

      {data && (
        <section className="rounded-3xl border border-white/10 bg-[#121215] p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><p className="text-[10px] uppercase text-text-muted">Recorded events</p><p className="mt-1 text-2xl font-bold">{data.totalViolations}</p></div>
            <div><p className="text-[10px] uppercase text-text-muted">Advisory score</p><p className="mt-1 text-2xl font-bold">{data.cheatingRiskScore}/100</p></div>
            <div><p className="text-[10px] uppercase text-text-muted">Review</p><p className="mt-1 text-sm font-bold">{data.requiresHumanReview ? "Required" : "Not flagged"}</p></div>
          </div>
          <div className="border-t border-white/10 pt-4 space-y-2">
            {(data.events || []).map((event: any) => (
              <div key={event.id} className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs flex justify-between gap-4">
                <span>{String(event.violationType).replaceAll("_", " ")}</span>
                <span className="text-text-muted">{event.severity} · {new Date(event.timestamp).toLocaleString()}</span>
              </div>
            ))}
            {(data.events || []).length === 0 && <p className="text-sm text-text-muted">No recorded browser-integrity events.</p>}
          </div>
          <p className="text-xs leading-relaxed text-text-muted">Any adverse hiring decision must be based on authorized human review and independent interview evidence, not this telemetry alone.</p>
        </section>
      )}
    </div>
  );
}

export default function ProctoringSecurityReportPage() {
  return (
    <PageContainer>
      <Suspense fallback={<div className="p-8 text-text-muted">Loading report…</div>}>
        <ReportContent />
      </Suspense>
    </PageContainer>
  );
}
