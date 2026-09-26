"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Policy = { roundName: string; mandatoryFeedback: boolean; candidateFeedbackPolicy: "REQUIRED" | "OPTIONAL" | "NOT_SHARED" } | null;

export default function InterviewFeedbackPage() {
  const params = useSearchParams();
  const interviewId = params.get("interviewId") || "";
  const [policy, setPolicy] = useState<Policy>(null);
  const [recommendation, setRecommendation] = useState<"PROCEED"|"ON_HOLD"|"REJECT"| "">("");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [notes, setNotes] = useState("");
  const [candidateFeedback, setCandidateFeedback] = useState("");
  const [finalized, setFinalized] = useState(false);
  const [loading, setLoading] = useState(Boolean(interviewId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roundComplete, setRoundComplete] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [pendingDecisionApproval, setPendingDecisionApproval] = useState<{action:"PROCEED"|"REJECT";approvalId:string;workflowId:string}|null>(null);

  useEffect(() => {
    if (!interviewId) return;
    fetch(`/api/employer/interviews/${encodeURIComponent(interviewId)}/feedback`, { cache: "no-store" })
      .then(async r => { const d=await r.json(); if(!r.ok||!d.success) throw new Error(d.error||"Unable to load feedback."); return d; })
      .then(d => {
        setPolicy(d.policy || null);
        setRoundComplete(Boolean(d.roundComplete));
        if (d.feedback) {
          setRecommendation(d.feedback.recommendation || "");
          const internal = d.feedback.internalFeedback || {};
          setStrengths(internal.strengths || ""); setConcerns(internal.concerns || ""); setNotes(internal.notes || "");
          setCandidateFeedback(d.feedback.candidateFeedback || ""); setFinalized(Boolean(d.feedback.finalizedAt));
        }
      }).catch(e=>setError(e instanceof Error?e.message:"Unable to load feedback.")).finally(()=>setLoading(false));
  },[interviewId]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!interviewId) { setError("Open feedback from a specific interview."); return; }
    if (!recommendation || strengths.trim().length < 10) { setError("Select a recommendation and provide meaningful strengths/observations."); return; }
    if (policy?.candidateFeedbackPolicy === "REQUIRED" && !candidateFeedback.trim()) { setError("Candidate-facing feedback is required for this round."); return; }
    setSaving(true);
    try {
      const r=await fetch(`/api/employer/interviews/${encodeURIComponent(interviewId)}/feedback`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({recommendation,strengths,concerns,notes,candidateFeedback:policy?.candidateFeedbackPolicy==="NOT_SHARED"?null:candidateFeedback})});
      const d=await r.json(); if(!r.ok||!d.success) throw new Error(d.error||"Unable to submit feedback.");
      setFinalized(true); setRoundComplete(Boolean(d.roundComplete)); setSuccess(d.roundComplete ? "Feedback finalized. All required panel feedback is complete for this round." : `Feedback finalized. Waiting for ${d.pendingFeedbackCount} required panelist(s).`);
    } catch(e){setError(e instanceof Error?e.message:"Unable to submit feedback.");} finally{setSaving(false);}
  }

  async function decide(action: "PROCEED"|"REJECT"|"HOLD") {
    setError(""); setSuccess(""); setDeciding(true);
    try {
      const approvalProof = pendingDecisionApproval?.action === action ? pendingDecisionApproval : null;
      const r=await fetch(`/api/employer/interviews/${encodeURIComponent(interviewId)}/round-decision`,{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          action,
          ...(approvalProof ? { approvalId: approvalProof.approvalId, workflowId: approvalProof.workflowId, confirmApproval: true } : {}),
        }),
      });
      const d=await r.json(); if(!r.ok||!d.success) throw new Error(d.error||"Unable to apply round decision.");
      if (d.requiresConfirmation && d.approvalId && d.workflowId) {
        const approvalAction = d.action === "REJECT" ? "REJECT" : "PROCEED";
        setPendingDecisionApproval({ action: approvalAction, approvalId: d.approvalId, workflowId: d.workflowId });
        setSuccess(approvalAction === "REJECT"
          ? "Rejection approval recorded. Click Confirm rejection to execute this consequential action."
          : "Final selection approval recorded. Click Confirm final selection to shortlist the candidate.");
        return;
      }
      if(d.action==="PROCEED") { setPendingDecisionApproval(null); setSuccess(`Candidate transferred to ${d.nextRound.name}. Schedule that configured round when ready.`); }
      else if(d.action==="FINAL_ROUND_COMPLETE") { setPendingDecisionApproval(null); setSuccess("Final selection approved. Candidate is shortlisted and eligible for a persisted offer."); }
      else if(d.action==="REJECT") { setPendingDecisionApproval(null); setSuccess("Candidate marked as not proceeding in this hiring process."); }
      else setSuccess("Candidate remains on hold.");
      if(action!=="HOLD") setRoundComplete(false);
    } catch(e){setError(e instanceof Error?e.message:"Unable to apply round decision.");} finally{setDeciding(false);}
  }

  return <PageContainer><main className="mx-auto max-w-4xl px-4 py-8">
    <div className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Interview workflow</p><h1 className="text-3xl font-bold text-text-primary">Interview feedback</h1><p className="mt-2 text-sm text-text-secondary">{policy?.roundName ? `${policy.roundName} · ` : ""}Your internal feedback is private to authorized hiring-team members.</p></div>
    {!interviewId && <div className="rounded-2xl border border-outline bg-bg-card p-8 text-center"><p className="font-semibold text-text-primary">No interview selected</p><Link href="/employer/upcoming-interviews-list" className="mt-4 inline-flex h-11 items-center rounded-full border border-outline px-5 text-sm font-bold text-text-primary">Back to interviews</Link></div>}
    {loading && <p className="text-text-secondary">Loading feedback…</p>}
    {error && <p role="alert" className="mb-5 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">{error}</p>}
    {success && <p role="status" className="mb-5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-text-primary">{success}</p>}
    {interviewId && !loading && <form onSubmit={submit} className="space-y-5">
      {finalized && <div className="rounded-xl border border-outline bg-bg-subtle p-4 text-sm text-text-secondary">Your feedback is finalized and read-only. Corrections require an audited amendment workflow.</div>}
      <section className="rounded-2xl border border-outline bg-bg-card p-5"><h2 className="mb-3 font-bold text-text-primary">Recommendation</h2><div className="flex flex-wrap gap-2">{(["PROCEED","ON_HOLD","REJECT"] as const).map(v=><button disabled={finalized} type="button" key={v} onClick={()=>setRecommendation(v)} className={`min-h-11 rounded-full border px-5 text-sm font-bold ${recommendation===v?"border-primary bg-primary text-white":"border-outline text-text-secondary"} disabled:opacity-60`}>{v.replace("_"," ")}</button>)}</div></section>
      <section className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-outline bg-bg-card p-5 text-sm text-text-secondary">Strengths / observations<textarea disabled={finalized} value={strengths} onChange={e=>setStrengths(e.target.value)} maxLength={4000} className="mt-3 min-h-36 w-full rounded-xl border border-outline bg-bg-page p-3 text-text-primary disabled:opacity-60" /></label>
        <label className="rounded-2xl border border-outline bg-bg-card p-5 text-sm text-text-secondary">Concerns<textarea disabled={finalized} value={concerns} onChange={e=>setConcerns(e.target.value)} maxLength={4000} className="mt-3 min-h-36 w-full rounded-xl border border-outline bg-bg-page p-3 text-text-primary disabled:opacity-60" /></label>
      </section>
      <label className="block rounded-2xl border border-outline bg-bg-card p-5 text-sm text-text-secondary">Private interviewer notes<textarea disabled={finalized} value={notes} onChange={e=>setNotes(e.target.value)} maxLength={8000} className="mt-3 min-h-28 w-full rounded-xl border border-outline bg-bg-page p-3 text-text-primary disabled:opacity-60" /><span className="mt-2 block text-xs">Never shown to the candidate.</span></label>
      {policy?.candidateFeedbackPolicy !== "NOT_SHARED" && <label className="block rounded-2xl border border-outline bg-bg-card p-5 text-sm text-text-secondary">Candidate-facing feedback {policy?.candidateFeedbackPolicy==="REQUIRED"?"(required)":"(optional)"}<textarea disabled={finalized} value={candidateFeedback} onChange={e=>setCandidateFeedback(e.target.value)} maxLength={4000} className="mt-3 min-h-28 w-full rounded-xl border border-outline bg-bg-page p-3 text-text-primary disabled:opacity-60" /><span className="mt-2 block text-xs">Stored separately from private notes. Release to the candidate is controlled independently.</span></label>}
      {finalized && roundComplete && <section className="rounded-2xl border border-outline bg-bg-card p-5"><h2 className="font-bold text-text-primary">Round decision</h2><p className="mt-1 text-sm text-text-secondary">All required panel feedback is complete. Choose the controlled next step for this candidate.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={deciding} onClick={()=>decide("PROCEED")} className="btn-3d-blue min-h-11 rounded-full px-5 font-bold text-white">{pendingDecisionApproval?.action === "PROCEED" ? "Confirm final selection" : "Proceed"}</button><button type="button" disabled={deciding} onClick={()=>decide("HOLD")} className="min-h-11 rounded-full border border-outline px-5 font-bold text-text-primary">Hold</button><button type="button" disabled={deciding} onClick={()=>decide("REJECT")} className="min-h-11 rounded-full border border-error/40 px-5 font-bold text-error">{pendingDecisionApproval?.action === "REJECT" ? "Confirm rejection" : "Not proceeding"}</button></div></section>}
      <div className="flex flex-wrap gap-3"><button disabled={saving||finalized} className="btn-3d-red h-12 rounded-full px-7 font-bold text-white disabled:opacity-50">{saving?"Finalizing…":"Finalize my feedback"}</button><Link href="/employer/upcoming-interviews-list" className="flex h-12 items-center rounded-full border border-outline px-7 text-sm font-bold text-text-secondary">Back to interviews</Link></div>
    </form>}
  </main></PageContainer>;
}