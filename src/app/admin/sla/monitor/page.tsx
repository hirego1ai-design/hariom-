"use client";
import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminSlaMonitorPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="SLA & Uptime Compliance (LM06)" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">SLA & Uptime Compliance Monitor (LM06)</h1>
            <p className="text-text-muted text-sm">Contractual SLA compliance verification (99.9% guarantee) across enterprise clients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">30-Day System Uptime</p>
              <h3 className="font-bold text-3xl text-green mt-1">99.98%</h3>
              <p className="text-xs text-green mt-2 font-bold">SLA Commitment Passed ✓</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Unplanned Downtime</p>
              <h3 className="font-bold text-3xl text-white mt-1">4.2 mins</h3>
              <p className="text-xs text-text-muted mt-2">Max allowed: 43.8 mins</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Incident Response Time</p>
              <h3 className="font-bold text-3xl text-primary mt-1">1.8 mins</h3>
              <p className="text-xs text-green mt-2 font-bold">Target &lt; 15 mins</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
