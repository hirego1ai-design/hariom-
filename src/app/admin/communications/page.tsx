"use client";
import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type EventDef={eventKey:string;label:string;category:string;audiences:string[];channels:string[];variables:string[]};
type Template={id:string;eventKey:string;channel:string;audience:string;name:string;locale:string;status:string;provider?:string;providerAlias?:string;version:number;enabled:boolean};

export default function CommunicationsPage(){
 const [events,setEvents]=useState<EventDef[]>([]),[templates,setTemplates]=useState<Template[]>([]),[error,setError]=useState("");
 const [eventKey,setEventKey]=useState(""),[channel,setChannel]=useState("WHATSAPP"),[audience,setAudience]=useState("CANDIDATE"),[name,setName]=useState(""),[alias,setAlias]=useState(""),[body,setBody]=useState("");
 async function load(){const r=await fetch("/api/admin/communications/templates",{cache:"no-store"});const j=await r.json();if(!r.ok){setError(j.error||"Unable to load communications.");return}setEvents(j.events||[]);setTemplates(j.templates||[]);if(!eventKey&&j.events?.[0])setEventKey(j.events[0].eventKey)}
 useEffect(()=>{load()},[]);
 const def=useMemo(()=>events.find(e=>e.eventKey===eventKey),[events,eventKey]);
 async function create(){setError("");const provider=channel==="WHATSAPP"?"META":"ZEPTOMAIL";const r=await fetch("/api/admin/communications/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventKey,channel,audience,name,locale:"en",provider,providerAlias:alias,body,enabled:false})});const j=await r.json();if(!r.ok){setError(j.error||"Unable to create template.");return}setName("");setAlias("");setBody("");await load()}
 return <div className="min-h-screen bg-[#0E0E0E] text-white flex"><AdminSidebar/><div className="flex-1 ml-[116px] min-w-0"><AdminHeader title="Communications"/><main className="p-8 pt-24 max-w-[1600px] mx-auto">
  <div className="mb-8"><h1 className="text-3xl font-semibold">Communication Center</h1><p className="text-zinc-400 mt-2">Manage HireGo transactional WhatsApp and email templates, lifecycle events and delivery operations.</p></div>
  {error&&<div className="mb-6 rounded-xl border border-red-800 bg-red-950/30 p-4 text-red-200">{error}</div>}
  <div className="grid grid-cols-4 gap-4 mb-8">{[["Events",events.length],["Templates",templates.length],["Active",templates.filter(t=>t.enabled).length],["Channels","WhatsApp + Email"]].map(([a,b])=><div key={String(a)} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="text-sm text-zinc-500">{a}</div><div className="text-2xl mt-2 font-semibold">{b}</div></div>)}</div>
  <div className="grid grid-cols-5 gap-6">
   <section className="col-span-3 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden"><div className="p-5 border-b border-zinc-800"><h2 className="font-semibold">Template catalogue</h2></div><div className="divide-y divide-zinc-900">{templates.length?templates.map(t=><div key={t.id} className="p-5 flex items-center justify-between"><div><div className="font-medium">{t.name}</div><div className="text-xs text-zinc-500 mt-1">{t.eventKey} · {t.audience} · v{t.version}</div></div><div className="flex gap-2"><span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">{t.channel}</span><span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">{t.status}</span></div></div>):<div className="p-10 text-center text-zinc-500">No templates yet. Create the first controlled template.</div>}</div></section>
   <section className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="font-semibold mb-5">Create template draft</h2><div className="space-y-4">
    <label className="block text-sm">Business event<select value={eventKey} onChange={e=>setEventKey(e.target.value)} className="mt-2 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3">{events.map(e=><option key={e.eventKey} value={e.eventKey}>{e.category} — {e.label}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-3"><label className="text-sm">Channel<select value={channel} onChange={e=>setChannel(e.target.value)} className="mt-2 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3"><option>WHATSAPP</option><option>EMAIL</option></select></label><label className="text-sm">Audience<select value={audience} onChange={e=>setAudience(e.target.value)} className="mt-2 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3">{(def?.audiences||["CANDIDATE"]).map(a=><option key={a}>{a}</option>)}</select></label></div>
    <label className="block text-sm">Template name<input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3"/></label>
    <label className="block text-sm">Provider alias / Meta template name<input value={alias} onChange={e=>setAlias(e.target.value)} className="mt-2 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3"/></label>
    <label className="block text-sm">Preview body<textarea value={body} onChange={e=>setBody(e.target.value)} rows={7} className="mt-2 w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3"/></label>
    <div className="text-xs text-zinc-500">Allowed variables: {(def?.variables||[]).map(v=>`{{${v}}}`).join(", ")||"None"}</div>
    <button onClick={create} disabled={!eventKey||!name||!body} className="w-full rounded-xl bg-white text-black font-medium p-3 disabled:opacity-40">Save draft</button>
   </div></section>
  </div>
 </main></div></div>
}