"use client";

import React, { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Service = { name: string; type: string; provider: string; status: string; details: string; latencyMs?: number };
type Health = { success: boolean; timestamp: string; overallStatus: string; services: Service[] };

export default function AdminSystemHealthPage() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/system-health", { cache: "no-store" })
      .then(async (res) => { const body = await res.json(); if (!res.ok || !body.success) throw new Error(body.error || "Unable to load system health."); return body; })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load system health."))
      .finally(() => setLoading(false));
  }, []);

  return <div className="bg-[#0A0A0C] text-white min-h-screen relative">
    <AdminSidebar /><AdminHeader />
    <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">System Diagnostics & Cloud Health</h1>
        <p className="text-xs text-slate-400">Observed application health and configuration evidence. Configuration alone is not reported as provider uptime.</p>
      </div>
      {loading ? <div className="text-center py-12 text-xs text-slate-400">Loading system diagnostics...</div> :
       error ? <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> :
       data ? <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
          <h3 className="text-base font-bold">Observed status: {data.overallStatus}</h3>
          <span className="text-xs font-mono text-slate-400">{new Date(data.timestamp).toLocaleString()}</span>
        </div>
        <div className="space-y-3">{data.services.map((s) => <div key={s.name} className="p-4 bg-[#16161B] rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h4 className="text-xs font-bold">{s.name}</h4><p className="text-[10px] text-slate-400">{s.details}</p></div>
          <div className="text-right"><div className="text-xs font-bold">{s.status.replaceAll("_", " ")}</div>{typeof s.latencyMs === "number" && <div className="text-[10px] font-mono text-slate-400">{s.latencyMs} ms observed query latency</div>}</div>
        </div>)}</div>
      </div> : null}
    </main>
  </div>;
}
