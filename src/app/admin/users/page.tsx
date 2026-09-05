"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type UserRecord = { id: string; name: string; email: string; emailVerified: boolean; createdAt: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Unable to load candidate users."); setUsers(payload.data || []); setError(null); })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search]);
  return <div className="min-h-screen bg-[#0E0E0E] text-white"><AdminSidebar /><div className="md:pl-[116px] min-h-screen"><AdminHeader title="Candidate Users" subtitle="Persisted candidate accounts from the production database." onSearch={setSearch} /><main className="pt-24 p-6 max-w-6xl mx-auto"><div className="bg-[#141418] border border-white/10 rounded-2xl overflow-hidden"><div className="p-5 border-b border-white/10 flex justify-between"><h1 className="font-bold">Candidate accounts</h1><span className="text-xs text-slate-400">{users.length} loaded</span></div>{loading ? <p className="p-8 text-sm text-slate-400">Loading…</p> : error ? <p className="p-8 text-sm text-red-300">{error}</p> : users.length === 0 ? <p className="p-8 text-sm text-slate-400">No persisted candidate accounts found.</p> : <div className="divide-y divide-white/5">{users.map((user) => <div key={user.id} className="p-4 flex items-center justify-between gap-4"><div><p className="font-semibold">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p></div><div className="text-right text-xs text-slate-400"><p className={user.emailVerified ? "text-emerald-400" : "text-amber-300"}>{user.emailVerified ? "Verified" : "Unverified"}</p><p>{new Date(user.createdAt).toLocaleDateString()}</p></div></div>)}</div>}</div></main></div></div>;
}
