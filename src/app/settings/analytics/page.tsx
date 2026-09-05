"use client";
import { useEffect, useState } from "react";

type Analytics = { candidateSignups: number; applications: number; interviewsCompleted: number; paidSubscriptions: number };

export default function PlatformAnalyticsHubPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/admin/analytics", { cache: "no-store" }).then(async (r) => { const p = await r.json(); if (!r.ok) throw new Error(p.error || "Unable to load analytics."); setData(p.data); }).catch((e) => setError(e.message)); }, []);
  const cards = data ? [["Candidate Signups", data.candidateSignups], ["Applications Submitted", data.applications], ["Interviews Completed", data.interviewsCompleted], ["Active Paid Subscriptions", data.paidSubscriptions]] : [];
  return <div className="min-h-screen bg-[#0E0E0E] p-6 text-white"><h1 className="text-2xl font-bold">Platform Analytics Hub</h1><p className="mt-2 text-sm text-slate-400">Live counts from the persisted production database.</p>{error ? <p className="mt-6 text-sm text-red-300">{error}</p> : !data ? <p className="mt-6 text-sm text-slate-400">Loading…</p> : <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">{cards.map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div>}</div>;
}
