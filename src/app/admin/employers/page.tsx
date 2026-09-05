"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type EmployerRecord = { id: string; user: { name: string; email: string; emailVerified: boolean } | null; company: { id: string; name: string; industry: string | null; location: string | null } };

export default function AdminEmployersPage() {
  const [employers, setEmployers] = useState<EmployerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/admin/employers?search=${encodeURIComponent(search)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Unable to load employers."); setEmployers(payload.data || []); setError(null); })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search]);
  return <div className="min-h-screen bg-[#0E0E0E] text-white"><AdminSidebar /><div className="md:pl-[116px] min-h-screen"><AdminHeader title="Employers & Companies" subtitle="Persisted employer profiles and company records." onSearch={setSearch} /><main className="pt-24 p-6 max-w-6xl mx-auto"><div className="bg-[#141418] border border-white/10 rounded-2xl overflow-hidden"><div className="p-5 border-b border-white/10 flex justify-between"><h1 className="font-bold">Employer profiles</h1><span className="text-xs text-slate-400">{employers.length} loaded</span></div>{loading ? <p className="p-8 text-sm text-slate-400">Loading…</p> : error ? <p className="p-8 text-sm text-red-300">{error}</p> : employers.length === 0 ? <p className="p-8 text-sm text-slate-400">No persisted employer profiles found.</p> : <div className="divide-y divide-white/5">{employers.map((employer) => <div key={employer.id} className="p-4 flex items-center justify-between gap-4"><div><p className="font-semibold">{employer.company.name}</p><p className="text-xs text-slate-400">{employer.user?.name || "Unknown"} · {employer.user?.email || "No email"}</p></div><div className="text-right text-xs text-slate-400"><p>{employer.company.industry || "Industry not set"}</p><p>{employer.company.location || "Location not set"}</p></div></div>)}</div>}</div></main></div></div>;
}
