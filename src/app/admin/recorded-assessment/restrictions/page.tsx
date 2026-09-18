"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "EXPIRED" | "REVOKED";
type Restriction = { id:string; status:Status; proposedMonths:number; reason:string; suspendedUntil:string|null; createdAt:string; appealedAt:string|null; appealNote:string|null; user:{name:string;email:string}; evidence:unknown };

export default function AssessmentRestrictionReviewPage() {
  const [status,setStatus]=useState<Status>("PENDING_REVIEW");
  const [items,setItems]=useState<Restriction[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [busyId,setBusyId]=useState<string|null>(null);

  const load=useCallback(async()=>{ setLoading(true); setError(""); try { const response=await fetch(`/api/admin/recorded-assessment/restrictions?status=${status}`,{cache:"no-store"}); const data=await response.json(); if(!response.ok) throw new Error(data.error||"Unable to load restriction reviews."); setItems(data.restrictions); } catch(e){ setError(e instanceof Error?e.message:"Unable to load restriction reviews."); } finally { setLoading(false); } },[status]);
  useEffect(()=>{ void load(); },[load]);

  async function decide(id:string,decision:"APPROVE"|"REJECT"|"REVOKE"){
    const note=window.prompt(`Review note for ${decision.toLowerCase()}:`)?.trim();
    if(!note) return;
    setBusyId(id); setError("");
    try { const response=await fetch(`/api/admin/recorded-assessment/restrictions/${id}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({decision,reviewNote:note})}); const data=await response.json(); if(!response.ok) throw new Error(data.error||"Review action failed."); await load(); }
    catch(e){ setError(e instanceof Error?e.message:"Review action failed."); } finally { setBusyId(null); }
  }

  return <main className="mx-auto max-w-6xl p-6">
    <h1 className="text-2xl font-semibold">Assessment restriction review</h1>
    <p className="mt-2 text-sm text-gray-600">Proctoring signals are evidence only. A restriction becomes active only after an administrator reviews the preserved evidence and records a decision.</p>
    <label className="mt-6 block max-w-xs text-sm font-medium">Queue status
      <select className="mt-1 w-full rounded-lg border p-2" value={status} onChange={e=>setStatus(e.target.value as Status)}>
        {(["PENDING_REVIEW","ACTIVE","REJECTED","EXPIRED","REVOKED"] as Status[]).map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
      </select>
    </label>
    {error&&<p role="alert" className="mt-4 rounded-lg border p-3">{error}</p>}
    {loading?<p className="mt-6">Loading review queue…</p>:items.length===0?<p className="mt-6 text-gray-600">No cases in this queue.</p>:
      <div className="mt-6 space-y-4">{items.map(item=><article key={item.id} className="rounded-xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{item.user.name}</h2><p className="text-sm text-gray-600">{item.user.email}</p></div><span className="rounded-full border px-3 py-1 text-xs">{item.status.replaceAll("_"," ")}</span></div>
        <p className="mt-4"><strong>Reason:</strong> {item.reason}</p><p className="mt-2 text-sm"><strong>Proposed duration:</strong> {item.proposedMonths} month(s)</p>
        {item.suspendedUntil&&<p className="mt-1 text-sm"><strong>Restricted until:</strong> {new Date(item.suspendedUntil).toLocaleString()}</p>}
        {item.appealedAt&&<section className="mt-4 rounded-lg border p-3" aria-label="Candidate appeal"><p className="font-medium">Candidate appeal</p><p className="mt-1 text-sm">{item.appealNote}</p><p className="mt-1 text-xs text-gray-600">Submitted {new Date(item.appealedAt).toLocaleString()}</p><p className="mt-2 text-xs">To resolve an approved restriction after reviewing this appeal, use Revoke restriction and record the resolution in the mandatory review note.</p></section>}<details className="mt-4"><summary className="cursor-pointer font-medium">Preserved evidence</summary><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs">{JSON.stringify(item.evidence,null,2)}</pre></details>
        <div className="mt-4 flex flex-wrap gap-2">{item.status==="PENDING_REVIEW"&&<><button disabled={busyId!==null} onClick={()=>void decide(item.id,"APPROVE")} className="rounded-lg border px-4 py-2 disabled:opacity-50">Approve restriction</button><button disabled={busyId!==null} onClick={()=>void decide(item.id,"REJECT")} className="rounded-lg border px-4 py-2 disabled:opacity-50">Reject proposal</button></>}{item.status==="ACTIVE"&&<button disabled={busyId!==null} onClick={()=>void decide(item.id,"REVOKE")} className="rounded-lg border px-4 py-2 disabled:opacity-50">Revoke restriction</button>}</div>
      </article>)}</div>}
  </main>;
}
