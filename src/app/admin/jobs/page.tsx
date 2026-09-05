"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type JobRecord = { id: string; title: string; department: string | null; location: string; type: string; status: string; createdAt: string; company: { name: string }; _count: { applications: number } };

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/admin/jobs?search=${encodeURIComponent(search)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Unable to load jobs."); setJobs(payload.data || []); setError(null); })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search]);
  return <div className="min-h-screen bg-[#0E0E0E] text-white"><AdminSidebar /><div className="md:pl-[116px] min-h-screen"><AdminHeader title="Job Listings" subtitle="Persisted job listings and application counts." onSearch={setSearch} /><main className="pt-24 p-6 max-w-6xl mx-auto"><div className="bg-[#141418] border border-white/10 rounded-2xl overflow-hidden"><div className="p-5 border-b border-white/10 flex justify-between"><h1 className="font-bold">Published and draft jobs</h1><span className="text-xs text-slate-400">{jobs.length} loaded</span></div>{loading ? <p className="p-8 text-sm text-slate-400">Loading…</p> : error ? <p className="p-8 text-sm text-red-300">{error}</p> : jobs.length === 0 ? <p className="p-8 text-sm text-slate-400">No persisted jobs found.</p> : <div className="divide-y divide-white/5">{jobs.map((job) => <div key={job.id} className="p-4 flex items-center justify-between gap-4"><div><p className="font-semibold">{job.title}</p><p className="text-xs text-slate-400">{job.company.name} · {job.location} · {job.type}</p></div><div className="text-right text-xs"><p className="text-emerald-400">{job.status}</p><p className="text-slate-400">{job._count.applications} applications</p></div></div>)}</div>}</div></main></div></div>;
}
