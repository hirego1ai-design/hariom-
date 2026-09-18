"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Restriction = { id:string; status:"ACTIVE"|"EXPIRED"|"REVOKED"; reason:string; suspendedUntil:string|null; reviewedAt:string|null; appealNote:string|null; appealedAt:string|null };

export default function AssessmentRestrictionsPage() {
  const [items,setItems]=useState<Restriction[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [appealId,setAppealId]=useState<string|null>(null);
  const [appeal,setAppeal]=useState("");
  const [saving,setSaving]=useState(false);
  const load=useCallback(async()=>{setLoading(true);setError("");try{const response=await fetch("/api/candidate/recorded-assessment/restrictions",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to load assessment access status.");setItems(data.restrictions);}catch(e){setError(e instanceof Error?e.message:"Unable to load assessment access status.");}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  async function submit(event:FormEvent){event.preventDefault();if(!appealId)return;setSaving(true);setError("");try{const response=await fetch("/api/candidate/recorded-assessment/restrictions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({restrictionId:appealId,appealNote:appeal})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to submit appeal.");setAppealId(null);setAppeal("");await load();}catch(e){setError(e instanceof Error?e.message:"Unable to submit appeal.");}finally{setSaving(false);}}
  return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-semibold">Assessment access</h1><p className="mt-2 text-sm text-gray-600">Review recorded-assessment restrictions and submit an appeal when one is active.</p>
    {error&&<p role="alert" className="mt-4 rounded-lg border p-3">{error}</p>}
    {loading?<p className="mt-6">Loading access status…</p>:items.length===0?<p className="mt-6 rounded-xl border p-5">No recorded-assessment restrictions are associated with your account.</p>:<div className="mt-6 space-y-4">{items.map(item=><article key={item.id} className="rounded-xl border p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">{item.status==="ACTIVE"?"Assessment access restricted":"Previous assessment restriction"}</h2><span className="text-sm">{item.status}</span></div><p className="mt-3">{item.reason}</p>{item.suspendedUntil&&<p className="mt-2 text-sm"><strong>Until:</strong> {new Date(item.suspendedUntil).toLocaleString()}</p>}{item.appealedAt?<p className="mt-3 text-sm">Appeal submitted {new Date(item.appealedAt).toLocaleString()}.</p>:item.status==="ACTIVE"&&<button className="mt-4 rounded-lg border px-4 py-2" onClick={()=>setAppealId(item.id)}>Submit appeal</button>}{appealId===item.id&&<form className="mt-4" onSubmit={submit}><label className="block text-sm font-medium">Appeal details<textarea required minLength={20} maxLength={2000} value={appeal} onChange={e=>setAppeal(e.target.value)} className="mt-1 min-h-32 w-full rounded-lg border p-3"/></label><div className="mt-2 flex gap-2"><button disabled={saving} className="rounded-lg border px-4 py-2 disabled:opacity-50">{saving?"Submitting…":"Submit appeal"}</button><button type="button" disabled={saving} onClick={()=>{setAppealId(null);setAppeal("");}} className="rounded-lg border px-4 py-2">Cancel</button></div></form>}</article>)}</div>}
  </main>;
}
