"use client";

import React, { useEffect, useMemo, useState } from "react";
import EmployerHeader from "@/components/employer/EmployerHeader";
import { useEmployer } from "@/context/EmployerContext";

type SourcedCandidate = {
  id: string; headline: string | null; location: string | null; skills: string[]; experienceYears: number | null;
  lastAvailabilityConfirmedAt: string | null; user: { name: string }; readinessRecords: Array<{ roleTitle:string; seniority:string; score:number|null; validUntil:string|null }>;
  sourcingStatus: "SOURCED"|"SHORTLISTED"|"INVITED"|"ACCEPTED"|"DECLINED"; application: {id:string;status:string}|null;
};
type SourceResponse = { job:{id:string;title:string;requiresJobReady:boolean}; policy:{availabilityWindowDays:number;requiresExplicitCandidateConfirmation:boolean;suppresses:string[]}; candidates:SourcedCandidate[] };

export default function ProactiveCandidateSearchPage() {
  const { jobs, candidates: pipelineCandidates, isLoading } = useEmployer();
  const [mode,setMode]=useState<"SOURCED"|"PIPELINE">("SOURCED");
  const [jobId,setJobId]=useState("");
  const [data,setData]=useState<SourceResponse|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [actions,setActions]=useState<Record<string,string>>({});
  const [actionMessage,setActionMessage]=useState("");

  useEffect(()=>{ if(!jobId){setData(null);return;} let cancelled=false;setLoading(true);setError("");
    fetch(`/api/employer/jobs/${jobId}/source-candidates`,{cache:"no-store"}).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.error||"Unable to source candidates.");return b;})
      .then(b=>{if(!cancelled){setData(b);setActions(Object.fromEntries((b.candidates||[]).map((candidate:SourcedCandidate)=>[candidate.id,candidate.sourcingStatus])))}}).catch(e=>{if(!cancelled)setError(e.message)}).finally(()=>{if(!cancelled)setLoading(false)});
    return()=>{cancelled=true};
  },[jobId]);

  const act=async(candidateId:string,action:"SHORTLIST"|"INVITE")=>{if(!jobId)return;setActions(x=>({...x,[candidateId]:"BUSY"}));setActionMessage("");try{const r=await fetch(`/api/employer/jobs/${jobId}/source-candidates/action`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({candidateProfileId:candidateId,action})});const b=await r.json();if(!r.ok)throw new Error(b.error||"Action failed.");setActions(x=>({...x,[candidateId]:b.relationship.status}));setActionMessage(action==="INVITE"?"Invitation saved and candidate notified in HireGo.":"Candidate shortlisted for this sourcing job.");}catch(e){setActions(x=>({...x,[candidateId]:""}));setActionMessage(e instanceof Error?e.message:"Action failed.");}};
  const sourced=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return data?.candidates||[];return (data?.candidates||[]).filter(c=>[c.user.name,c.headline,c.location,...c.skills].filter(Boolean).some(v=>String(v).toLowerCase().includes(q)));},[data,query]);
  const pipeline=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return pipelineCandidates;return pipelineCandidates.filter((c:any)=>[c.name,c.currentRole,c.currentLocation,c.appliedJob].filter(Boolean).some(v=>String(v).toLowerCase().includes(q)));},[pipelineCandidates,query]);

  return <><EmployerHeader title="Proactive Candidate Search" subtitle="Job-scoped sourcing from confirmed available HireGo candidates" />
    <main className="min-h-screen bg-bg-page text-text-primary px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <section className="rounded-3xl border border-outline bg-bg-card p-5 space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          <button onClick={()=>setMode("SOURCED")} className={`min-h-11 rounded-full px-5 font-bold ${mode==="SOURCED"?"btn-3d-red":"border border-outline bg-bg-elevated"}`}>Sourced candidates</button>
          <button onClick={()=>setMode("PIPELINE")} className={`min-h-11 rounded-full px-5 font-bold ${mode==="PIPELINE"?"btn-3d-red":"border border-outline bg-bg-elevated"}`}>Organic applicants</button>
        </div>
        {mode==="SOURCED"&&<label className="block text-sm font-bold">Source for job
          <select value={jobId} onChange={e=>setJobId(e.target.value)} disabled={isLoading} className="mt-2 w-full min-h-11 rounded-xl border border-outline bg-bg-elevated px-3">
            <option value="">Select an employer job</option>{jobs.map((j:any)=><option key={j.id} value={j.id}>{j.title} · {j.status}</option>)}
          </select>
        </label>}
        <label className="block text-sm font-bold">Search visible candidates<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, role, location or skill" className="mt-2 w-full min-h-11 rounded-xl border border-outline bg-bg-elevated px-3"/></label>
      </section>

      {mode==="SOURCED"&&data&&<section className="rounded-2xl border border-outline bg-bg-card p-4 text-sm">
        <p className="font-bold">Sourcing policy for {data.job.title}</p>
        <p className="text-text-secondary mt-1">Only candidates who explicitly confirmed availability within the last {data.policy.availabilityWindowDays} days are shown{data.job.requiresJobReady?", and this job also requires a valid Job-Ready record":"."}.</p>
      </section>}
      {actionMessage&&<div role="status" className="rounded-2xl border border-outline bg-bg-card p-4 text-sm">{actionMessage}</div>}
      {error&&<div role="alert" className="rounded-2xl border border-outline bg-bg-card p-5">{error}</div>}
      {mode==="SOURCED"&&!jobId&&<div className="rounded-3xl border border-outline bg-bg-card p-8 text-center"><h2 className="font-bold">Choose a job to start sourcing</h2><p className="text-sm text-text-secondary mt-2">HireGo will apply that job&apos;s availability and readiness policy before returning candidates.</p></div>}
      {mode==="SOURCED"&&loading&&<div className="rounded-3xl border border-outline bg-bg-card p-8">Checking eligible HireGo candidates…</div>}
      {mode==="SOURCED"&&!loading&&jobId&&data&&sourced.length===0&&<div className="rounded-3xl border border-outline bg-bg-card p-8 text-center"><h2 className="font-bold">No eligible candidates found</h2><p className="text-sm text-text-secondary mt-2">No candidate currently satisfies this job&apos;s sourcing policy and your search.</p></div>}

      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mode==="SOURCED"&&sourced.map(c=><article key={c.id} className="rounded-3xl border border-outline bg-bg-card p-5 space-y-4">
          <div><h2 className="font-bold">{c.user.name}</h2><p className="text-sm text-text-secondary">{c.headline||"Profile headline not provided"}</p></div>
          <div className="flex flex-wrap gap-2">{c.skills.slice(0,8).map(skill=><span key={skill} className="rounded-full bg-bg-elevated px-3 py-1 text-xs">{skill}</span>)}</div>
          <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-text-secondary text-xs">Location</dt><dd>{c.location||"Not provided"}</dd></div><div><dt className="text-text-secondary text-xs">Experience</dt><dd>{c.experienceYears==null?"Not provided":`${c.experienceYears} years`}</dd></div></dl>
          <div className="rounded-2xl bg-bg-elevated p-3 text-xs"><p className="font-bold">Confirmed available</p><p className="text-text-secondary mt-1">{c.lastAvailabilityConfirmedAt?new Date(c.lastAvailabilityConfirmedAt).toLocaleDateString():"Confirmation date unavailable"}</p>{c.readinessRecords.length>0&&<p className="mt-2">Job-Ready: {c.readinessRecords.map(r=>`${r.roleTitle} · ${r.seniority}`).join(", ")}</p>}</div>
          <p className="text-xs text-text-secondary">Sourced profile — not an organic application. Employer actions are stored in a separate job-scoped sourcing relationship.</p>{c.application?<div className="rounded-2xl border border-outline bg-bg-elevated p-3 text-xs"><p className="font-bold">Application exists · {c.application.status}</p><p className="text-text-secondary mt-1">This candidate is now in the hiring pipeline. Sourcing actions are locked.</p></div>:actions[c.id]==="ACCEPTED"?<div className="rounded-2xl border border-outline bg-bg-elevated p-3 text-xs font-bold">Invitation accepted · application is being reflected in the pipeline.</div>:actions[c.id]==="DECLINED"?<div className="rounded-2xl border border-outline bg-bg-elevated p-3 text-xs font-bold">Invitation declined by candidate</div>:<div className="flex gap-2"><button disabled={actions[c.id]==="BUSY"||actions[c.id]==="INVITED"} onClick={()=>void act(c.id,"SHORTLIST")} className="min-h-11 flex-1 rounded-full border border-outline px-4 font-bold disabled:opacity-50">{actions[c.id]==="SHORTLISTED"?"Shortlisted":actions[c.id]==="INVITED"?"Shortlisted":"Shortlist"}</button><button disabled={actions[c.id]==="BUSY"||actions[c.id]==="INVITED"} onClick={()=>void act(c.id,"INVITE")} className="min-h-11 flex-1 rounded-full btn-3d-red px-4 font-bold disabled:opacity-50">{actions[c.id]==="INVITED"?"Invited":"Invite"}</button></div>}
        </article>)}
        {mode==="PIPELINE"&&pipeline.map((c:any)=><article key={c.id} className="rounded-3xl border border-outline bg-bg-card p-5 space-y-3"><div><h2 className="font-bold">{c.name}</h2><p className="text-sm text-text-secondary">{c.currentRole}</p></div><p className="text-sm">{c.currentLocation} · {c.experience}</p><div className="rounded-2xl bg-bg-elevated p-3 text-xs"><p className="font-bold">Organic applicant</p><p className="text-text-secondary mt-1">{c.appliedJob} · {c.stage}</p></div></article>)}
      </section>
    </main></>;
}
