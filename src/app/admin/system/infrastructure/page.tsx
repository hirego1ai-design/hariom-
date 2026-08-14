"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminInfrastructurePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    fetch("/api/admin/system-health")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#26A69A]/10 text-[#26A69A] border border-[#26A69A]/20 mb-1">
              CLOUD ARCHITECTURE
            </div>
            <h1 className="text-2xl font-bold text-white">Railway + Supabase + R2 + Vercel Infrastructure</h1>
            <p className="text-xs text-slate-400">Real-time status monitor of database pools, cloud storage & edge CDN nodes</p>
          </div>

          <button
            onClick={fetchHealth}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">refresh</span> Refresh Status
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Pinging cloud services...</div>
        ) : data ? (
          <div className="space-y-6">
            {/* Overview Banner */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#26A69A]/20 border border-[#26A69A]/40 flex items-center justify-center text-[#26A69A]">
                  <span className="material-symbols-outlined text-2xl animate-pulse">cloud_done</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">All Cloud Systems Operational</h3>
                  <p className="text-xs text-slate-400">Production SLA Uptime: <strong className="text-[#26A69A]">{data.uptimePercent}%</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Last Ping</span>
                  <span className="text-slate-300">{new Date(data.timestamp).toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Overall Status</span>
                  <span className="text-[#26A69A] font-bold">OPTIMAL</span>
                </div>
              </div>
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.services.map((s: any, idx: number) => (
                <div key={idx} className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-[#FFCA28] uppercase tracking-wider">{s.type}</span>
                      <h4 className="text-base font-bold text-white mt-0.5">{s.name}</h4>
                      <p className="text-xs text-slate-400">{s.provider}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#26A69A]/20 text-[#26A69A] border border-[#26A69A]/30">
                      {s.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#16161B] p-3 rounded-xl border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Latency</span>
                      <span className="font-bold text-white">{s.latencyMs} ms</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Health Metric</span>
                      <span className="font-bold text-[#29B6F6]">
                        {s.activeConnections ? `${s.activeConnections}/${s.maxConnections} Conns` : s.memoryHeapMb ? `${s.memoryHeapMb} MB Heap` : "100% SLA"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic">{s.details}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
