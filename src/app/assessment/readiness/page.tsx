"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Template = {
  id: string;
  title: string;
  description: string | null;
  roleTitle: string | null;
  seniority: string | null;
  durationMinutes: number;
  passingPercentage: number;
};
type ReadinessRecord = {
  roleTitle: string;
  seniority: string;
  status: "NOT_STARTED" | "DEVELOPING" | "JOB_READY" | "EXPIRED";
  score: number | null;
  validUntil: string | null;
  assessmentId: string | null;
};

export default function ReadinessPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [records, setRecords] = useState<ReadinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState("");

  useEffect(() => {
    fetch("/api/candidate/readiness")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not load Job-Ready assessments.");
        setTemplates(data.templates || []);
        setRecords(data.records || []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load Job-Ready assessments."))
      .finally(() => setLoading(false));
  }, []);

  const recordsByRole = useMemo(() => new Map(records.map((record) => [`${record.roleTitle}::${record.seniority}`, record])), [records]);

  const begin = async (template: Template) => {
    if (!template.roleTitle || !template.seniority) return;
    setStartingId(template.id);
    setError("");
    try {
      const response = await fetch("/api/candidate/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTitle: template.roleTitle, seniority: template.seniority }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not start the assessment.");
      router.push(`/assessment/mcq/active?id=${encodeURIComponent(data.assessmentId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the assessment.");
      setStartingId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />
      <main className="flex-1 ml-[100px] lg:ml-[116px] max-w-5xl p-6 lg:p-10">
        <header className="mb-8 max-w-3xl">
          <p className="text-primary text-xs font-bold uppercase tracking-wider">Candidate readiness</p>
          <h1 className="mt-2 text-3xl font-extrabold">Job-Ready assessments</h1>
          <p className="mt-3 text-sm text-text-secondary">Choose an assessment configured by HireGo administrators for your role and seniority. A result can meet a job’s stated readiness requirement; it does not guarantee employment.</p>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
        {loading && <p className="text-sm text-text-secondary">Loading configured assessments…</p>}
        {!loading && !error && templates.length === 0 && <div className="glass-card rounded-3xl border border-white/10 p-8 text-center"><h2 className="font-bold">No Job-Ready assessment is available yet</h2><p className="mt-2 text-sm text-text-secondary">This is intentional until an administrator creates, adds questions to, and publishes an assessment for a specific role and seniority.</p></div>}

        <div className="grid gap-5 md:grid-cols-2">
          {templates.map((template) => {
            const record = recordsByRole.get(`${template.roleTitle}::${template.seniority}`);
            const status = record?.status || "NOT_STARTED";
            const statusLabel = status.replace("_", " ");
            return <article key={template.id} className="glass-card rounded-3xl border border-white/10 p-6 space-y-4">
              <div className="flex justify-between gap-4"><div><p className="text-xs text-primary font-bold">{template.roleTitle} · {template.seniority}</p><h2 className="mt-1 text-xl font-bold">{template.title}</h2></div><span className="rounded-full bg-white/5 px-3 py-1 text-[11px] h-fit text-text-secondary">{statusLabel}</span></div>
              {template.description && <p className="text-sm text-text-secondary">{template.description}</p>}
              <p className="text-xs text-text-muted">{template.durationMinutes} minutes · Passing score: {template.passingPercentage}%</p>
              {record?.score !== null && record?.score !== undefined && <p className="text-xs text-text-secondary">Latest result: {record.score}%{record.validUntil ? ` · Valid until ${new Date(record.validUntil).toLocaleDateString()}` : ""}</p>}
              <button onClick={() => begin(template)} disabled={Boolean(startingId)} className="w-full rounded-xl btn-3d-red px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{startingId === template.id ? "Opening assessment…" : status === "NOT_STARTED" ? "Start assessment" : "View / continue assessment"}</button>
            </article>;
          })}
        </div>
      </main>
    </div>
  );
}
