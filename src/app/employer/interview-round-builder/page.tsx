"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type TeamMember = { userId: string; name: string; email: string; role: string; designation?: string | null };
type Round = {
  name: string; purpose: string; department: string; interviewType: "VIDEO" | "PHONE" | "IN_PERSON";
  durationMins: number; mandatory: boolean; mandatoryFeedback: boolean;
  candidateFeedbackPolicy: "REQUIRED" | "OPTIONAL" | "NOT_SHARED";
  previousFeedbackVisibility: "FULL" | "SUMMARY_ONLY" | "HIDDEN_UNTIL_OWN_FEEDBACK" | "HIDDEN";
  interviewerUserIds: string[];
};
const blankRound = (): Round => ({ name: "", purpose: "", department: "", interviewType: "VIDEO", durationMins: 30, mandatory: true, mandatoryFeedback: true, candidateFeedbackPolicy: "OPTIONAL", previousFeedbackVisibility: "HIDDEN_UNTIL_OWN_FEEDBACK", interviewerUserIds: [] });

export default function InterviewRoundBuilderPage() {
  const params = useSearchParams();
  const jobId = params.get("jobId") || "";
  const [jobTitle, setJobTitle] = useState("");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/employer/jobs/${encodeURIComponent(jobId)}/interview-process`, { cache: "no-store" })
      .then(async (r) => { const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.error || "Unable to load interview process."); return d; })
      .then((d) => {
        setJobTitle(d.job?.title || "");
        setTeam(d.team || []);
        setRounds(d.process?.rounds?.length ? d.process.rounds.map((r: any) => ({
          name: r.name, purpose: r.purpose || "", department: r.department || "", interviewType: r.interviewType,
          durationMins: r.durationMins, mandatory: r.mandatory, mandatoryFeedback: r.mandatoryFeedback,
          candidateFeedbackPolicy: r.candidateFeedbackPolicy, previousFeedbackVisibility: r.previousFeedbackVisibility,
          interviewerUserIds: (r.interviewers || []).map((i: any) => i.userId),
        })) : [blankRound()]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load interview process."))
      .finally(() => setLoading(false));
  }, [jobId]);

  const totalMinutes = useMemo(() => rounds.reduce((sum, r) => sum + Number(r.durationMins || 0), 0), [rounds]);
  const update = <K extends keyof Round>(index: number, key: K, value: Round[K]) => setRounds((items) => items.map((r, i) => i === index ? { ...r, [key]: value } : r));
  const move = (index: number, direction: -1 | 1) => setRounds((items) => { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next; });

  async function save() {
    if (!jobId) return;
    setError(""); setMessage("");
    if (rounds.some((r) => r.name.trim().length < 2 || r.interviewerUserIds.length === 0)) { setError("Every round needs a name and at least one assigned interviewer."); return; }
    setSaving(true);
    try {
      const response = await fetch(`/api/employer/jobs/${encodeURIComponent(jobId)}/interview-process`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ rounds }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save interview process.");
      setMessage("Interview process published.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save interview process."); }
    finally { setSaving(false); }
  }

  return <PageContainer>
    <main className="mx-auto max-w-5xl px-4 py-8 pb-28">
      <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-2 flex gap-2 text-sm text-text-secondary"><Link href="/employer/dashboard">Dashboard</Link><span>/</span><Link href="/employer/upcoming-interviews-list">Interviews</Link></nav>
          <h1 className="text-3xl font-bold text-text-primary">Interview process</h1>
          <p className="mt-2 text-sm text-text-secondary">{jobId ? (jobTitle ? `Configure rounds for ${jobTitle}.` : "Configure this job's interview rounds.") : "Open this builder from a job to configure its interview process."}</p>
        </div>
        <button type="button" disabled={!jobId || rounds.length >= 12} onClick={() => setRounds((r) => [...r, blankRound()])} className="btn-3d-blue h-11 rounded-full px-6 font-bold text-white disabled:opacity-40">+ Add round</button>
      </header>

      {!jobId && <div className="rounded-2xl border border-outline bg-bg-card p-8 text-center"><p className="font-semibold text-text-primary">No job selected</p><p className="mt-2 text-sm text-text-secondary">Choose a job first. Interview processes belong to a specific job and company.</p><Link href="/employer/jobs" className="mt-5 inline-flex h-11 items-center rounded-full border border-outline px-5 text-sm font-bold text-text-primary">View jobs</Link></div>}
      {error && <div role="alert" className="mb-5 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">{error}</div>}
      {message && <div role="status" className="mb-5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-text-primary">{message}</div>}
      {loading && <p className="text-text-secondary">Loading interview process…</p>}

      {!loading && jobId && <div className="space-y-5">
        {rounds.map((round, index) => <section key={index} className="rounded-2xl border border-outline bg-bg-card p-5 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span><div><h2 className="font-bold text-text-primary">{round.name || `Round ${index + 1}`}</h2><p className="text-xs text-text-secondary">{round.durationMins} minutes · {round.interviewerUserIds.length} interviewer{round.interviewerUserIds.length === 1 ? "" : "s"}</p></div></div>
            <div className="flex gap-1"><button type="button" aria-label="Move round up" onClick={() => move(index, -1)} disabled={index === 0} className="h-10 w-10 rounded-full border border-outline text-text-secondary disabled:opacity-30">↑</button><button type="button" aria-label="Move round down" onClick={() => move(index, 1)} disabled={index === rounds.length - 1} className="h-10 w-10 rounded-full border border-outline text-text-secondary disabled:opacity-30">↓</button><button type="button" aria-label="Delete round" onClick={() => setRounds((r) => r.filter((_, i) => i !== index))} disabled={rounds.length === 1} className="h-10 px-3 rounded-full border border-outline text-error disabled:opacity-30">Delete</button></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-text-secondary">Round name<input value={round.name} onChange={(e) => update(index, "name", e.target.value)} maxLength={100} className="mt-2 h-11 w-full rounded-xl border border-outline bg-bg-page px-4 text-text-primary" placeholder="e.g. Technical panel" /></label>
            <label className="text-sm text-text-secondary">Department<input value={round.department} onChange={(e) => update(index, "department", e.target.value)} maxLength={100} className="mt-2 h-11 w-full rounded-xl border border-outline bg-bg-page px-4 text-text-primary" placeholder="e.g. Engineering" /></label>
            <label className="md:col-span-2 text-sm text-text-secondary">Purpose<textarea value={round.purpose} onChange={(e) => update(index, "purpose", e.target.value)} maxLength={500} className="mt-2 min-h-20 w-full rounded-xl border border-outline bg-bg-page p-4 text-text-primary" placeholder="What should this round evaluate?" /></label>
            <label className="text-sm text-text-secondary">Interview type<select value={round.interviewType} onChange={(e) => update(index, "interviewType", e.target.value as Round["interviewType"])} className="mt-2 h-11 w-full rounded-xl border border-outline bg-bg-page px-3 text-text-primary"><option value="VIDEO">Video</option><option value="PHONE">Phone</option><option value="IN_PERSON">In person</option></select></label>
            <label className="text-sm text-text-secondary">Duration<select value={round.durationMins} onChange={(e) => update(index, "durationMins", Number(e.target.value))} className="mt-2 h-11 w-full rounded-xl border border-outline bg-bg-page px-3 text-text-primary">{[15,30,45,60,90,120].map((v) => <option key={v} value={v}>{v} minutes</option>)}</select></label>
            <fieldset className="md:col-span-2"><legend className="mb-2 text-sm text-text-secondary">Assigned interviewers</legend><div className="grid gap-2 sm:grid-cols-2">{team.map((m) => <label key={m.userId} className="flex min-h-12 items-center gap-3 rounded-xl border border-outline bg-bg-page px-4 text-sm text-text-primary"><input type="checkbox" checked={round.interviewerUserIds.includes(m.userId)} onChange={(e) => update(index, "interviewerUserIds", e.target.checked ? [...round.interviewerUserIds, m.userId] : round.interviewerUserIds.filter((id) => id !== m.userId))}/><span><strong>{m.name}</strong><span className="block text-xs text-text-secondary">{m.designation || m.role}</span></span></label>)}</div>{team.length === 0 && <p className="rounded-xl border border-outline p-4 text-sm text-text-secondary">No active company team members are available. Add team members before publishing this process.</p>}</fieldset>
            <label className="text-sm text-text-secondary">Candidate feedback<select value={round.candidateFeedbackPolicy} onChange={(e) => update(index, "candidateFeedbackPolicy", e.target.value as Round["candidateFeedbackPolicy"])} className="mt-2 h-11 w-full rounded-xl border border-outline bg-bg-page px-3 text-text-primary"><option value="REQUIRED">Required</option><option value="OPTIONAL">Optional</option><option value="NOT_SHARED">Not shared</option></select></label>
            <label className="text-sm text-text-secondary">Previous feedback visibility<select value={round.previousFeedbackVisibility} onChange={(e) => update(index, "previousFeedbackVisibility", e.target.value as Round["previousFeedbackVisibility"])} className="mt-2 h-11 w-full rounded-xl border border-outline bg-bg-page px-3 text-text-primary"><option value="HIDDEN_UNTIL_OWN_FEEDBACK">Hidden until own feedback</option><option value="HIDDEN">Hidden</option><option value="SUMMARY_ONLY">Summary only</option><option value="FULL">Full feedback</option></select></label>
            <label className="flex min-h-11 items-center gap-3 text-sm text-text-primary"><input type="checkbox" checked={round.mandatoryFeedback} onChange={(e) => update(index, "mandatoryFeedback", e.target.checked)}/>Mandatory interviewer feedback</label>
            <label className="flex min-h-11 items-center gap-3 text-sm text-text-primary"><input type="checkbox" checked={round.mandatory} onChange={(e) => update(index, "mandatory", e.target.checked)}/>Mandatory round</label>
          </div>
        </section>)}
      </div>}

      {jobId && !loading && <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline bg-bg-card/95 p-4 backdrop-blur md:left-[240px]"><div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-text-secondary">{rounds.length} round{rounds.length === 1 ? "" : "s"} · {totalMinutes} minutes total</p><button type="button" onClick={save} disabled={saving || rounds.length === 0} className="btn-3d-red h-11 rounded-full px-8 font-bold text-white disabled:opacity-50">{saving ? "Publishing…" : "Publish process"}</button></div></div>}
    </main>
  </PageContainer>;
}
