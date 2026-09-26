"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

function Report() {
  const params = useSearchParams();
  const interviewId = params.get("interviewId") || "";
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) return;
    fetch(`/api/proctoring/telemetry?interviewId=${encodeURIComponent(interviewId)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Unable to load proctoring report.");
        setData(body.metrics);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load proctoring report."));
  }, [interviewId]);

  if (!interviewId) return <PageContainer><div className="mx-auto max-w-xl py-16 text-center"><h1 className="text-2xl font-bold">Proctoring security report</h1><p className="mt-3 text-sm text-text-secondary">Select an interview to view its persisted telemetry. No sample report is displayed.</p></div></PageContainer>;

  return <PageContainer><div className="max-w-3xl mx-auto py-8 px-4 space-y-5">
    <h1 className="text-2xl font-bold">Proctoring security report</h1>
    <p className="text-sm text-text-secondary">This report summarizes client-reported browser telemetry only. It is not a cheating determination.</p>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {data && <div className="glass-card rounded-2xl p-6 space-y-4">
      <p><strong>Events:</strong> {data.totalViolations}</p>
      <p><strong>Advisory score:</strong> {data.cheatingRiskScore}/100</p>
      <p><strong>Human review:</strong> {data.requiresHumanReview ? "Required" : "Not currently triggered"}</p>
      <p><strong>Evidence source:</strong> {data.evidenceSource}</p>
      <div className="space-y-2">{data.events.map((event: any) => <div key={event.id} className="rounded-xl border border-white/10 p-3 text-sm"><p>{event.violationType} · {event.severity}</p><p className="text-xs text-text-secondary">{new Date(event.timestamp).toLocaleString()}</p></div>)}</div>
    </div>}
  </div></PageContainer>;
}

export default function ProctoringSecurityReportPage() {
  return <Suspense fallback={<PageContainer><div className="py-16 text-center">Loading report…</div></PageContainer>}><Report /></Suspense>;
}
