"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminSystemHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/system-health")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-2xl font-bold text-white">System Diagnostics & Cloud Health</h1>
          <p className="text-xs text-slate-400">Global production platform uptime & health diagnostic hub</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading system diagnostics...</div>
        ) : data ? (
          <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#26A69A] animate-ping" />
                <h3 className="text-base font-bold text-white">Production System Status: {data.overallStatus}</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Uptime: {data.uptimePercent}%</span>
            </div>

            <div className="space-y-3">
              {data.services.map((s: any, i: number) => (
                <div key={i} className="p-4 bg-[#16161B] rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{s.name}</h4>
                    <p className="text-[10px] text-slate-400">{s.details}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#26A69A]">{s.latencyMs} ms</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
