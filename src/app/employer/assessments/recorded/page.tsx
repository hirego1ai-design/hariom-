"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ProctoringEvent={id:string;eventType:string;severity:"INFO"|"WARNING"|"HIGH";warningNumber:number|null;createdAt:string};
type AssessmentResponse={id:string;durationSeconds:number;mediaType:"AUDIO"|"VIDEO";transcript:string|null;analysisStatus:string;analysisResult:unknown;mediaUrl:string;storedFile:null|{mimeType:string}};
type AttemptQuestion={id:string;questionText:string;answerDurationSeconds:number;response:AssessmentResponse|null};
type Attempt={id:string;status:string;mediaType:"AUDIO"|"VIDEO";createdAt:string;candidateProfile:{user:{name:string;email:string}};proctoringEvents:ProctoringEvent[];questions:AttemptQuestion[]};

function EvidenceSummary({value}:{value:unknown}){
 if(!value||typeof value!=="object")return null;
 const result=value as {signals?:Array<{type?:string;confidence?:number;detail?:string}>;metrics?:Record<string,number>};
 const signals=Array.isArray(result.signals)?result.signals:[];
 const metrics=result.metrics&&typeof result.metrics==="object"?Object.entries(result.metrics):[];
 if(!signals.length&&!metrics.length)return null;
 return <div className="rounded-xl border border-outline p-3 space-y-2"><p className="text-xs font-bold">Automated analysis evidence</p>{signals.map((s,i)=><p key={i} className="text-xs text-text-secondary">{s.type||"Signal"}{typeof s.confidence==="number"?` · ${Math.round(s.confidence*100)}% model confidence`:""}{s.detail?` · ${s.detail}`:""}</p>)}{metrics.length>0&&<p className="text-xs text-text-secondary">{metrics.map(([k,v])=>`${k}: ${v}`).join(" · ")}</p>}<p className="text-xs text-text-secondary">Automated signals support review; they do not determine selection, rejection, or misconduct.</p></div>;
}
function ResponseMedia({response}:{response:AssessmentResponse}){
 if(!response.storedFile)return <p className="text-xs text-text-secondary">Media is unavailable.</p>;
 const common={controls:true,preload:"metadata" as const,src:response.mediaUrl,className:"w-full max-w-xl rounded-xl"};
 return response.mediaType==="AUDIO"?<audio {...common}/>:<video {...common}/>;
}
export default function RecordedAssessmentReviewPage(){
 const q=useSearchParams();const jobId=q.get("jobId")||"";const[items,setItems]=useState<Attempt[]>([]);const[error,setError]=useState("");const[loading,setLoading]=useState(true);
 useEffect(()=>{let cancelled=false;if(!jobId){setError("Select a job to review recorded assessments.");setLoading(false);return;}setLoading(true);setError("");fetch(`/api/employer/jobs/${jobId}/recorded-assessment/attempts`,{cache:"no-store"}).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.error||"Unable to load assessments.");return b;}).then(b=>{if(!cancelled)setItems(b.attempts)}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:"Unable to load assessments.")}).finally(()=>{if(!cancelled)setLoading(false)});return()=>{cancelled=true}},[jobId]);
 return <div className="max-w-6xl mx-auto space-y-6"><div><h1 className="text-2xl font-bold">Recorded Assessment Review</h1><p className="text-sm text-text-secondary mt-1">Review candidate answers, transcripts and observable proctoring evidence. Hiring and misconduct decisions remain human decisions.</p></div>
 {loading&&<div className="rounded-2xl border border-outline bg-bg-card p-6">Loading assessments…</div>}{error&&<div role="alert" className="rounded-2xl border border-outline bg-bg-card p-6">{error}</div>}{!loading&&!error&&items.length===0&&<div className="rounded-2xl border border-outline bg-bg-card p-6">No recorded assessment attempts for this job yet.</div>}
 <div className="space-y-5">{items.map(a=><article key={a.id} className="rounded-3xl border border-outline bg-bg-card p-5 space-y-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold">{a.candidateProfile.user.name}</h2><p className="text-xs text-text-secondary">{a.candidateProfile.user.email}</p></div><div className="text-xs text-text-secondary">{a.status} · {a.mediaType} · {a.proctoringEvents.length} observed events</div></div>
 <div className="space-y-4">{a.questions.map((x,i)=><section key={x.id} className="rounded-2xl bg-bg-elevated p-4 space-y-3"><p className="text-xs font-bold">Question {i+1}</p><p className="text-sm">{x.questionText}</p>{x.response?<><div className="flex flex-wrap gap-3 text-xs text-text-secondary"><span>{x.response.durationSeconds}s recorded</span><span>Analysis: {x.response.analysisStatus}</span></div><ResponseMedia response={x.response}/>{x.response.transcript&&<div><p className="text-xs font-bold mb-1">Transcript</p><p className="text-sm text-text-secondary whitespace-pre-wrap">{x.response.transcript}</p></div>}<EvidenceSummary value={x.response.analysisResult}/></>:<p className="text-xs text-text-secondary">No response saved.</p>}</section>)}</div>
 {a.proctoringEvents.length>0&&<details className="rounded-2xl border border-outline p-4"><summary className="cursor-pointer font-bold text-sm">Proctoring evidence ({a.proctoringEvents.length})</summary><div className="mt-3 space-y-2">{a.proctoringEvents.map(e=><div key={e.id} className="text-xs text-text-secondary">{e.eventType.replaceAll("_"," ")} · {e.severity}{e.warningNumber?` · warning ${e.warningNumber}/3`:""} · {new Date(e.createdAt).toLocaleString()}</div>)}</div><p className="mt-3 text-xs text-text-secondary">These are observable device/browser events, not a finding of cheating.</p></details>}
 </article>)}</div></div>;
}
