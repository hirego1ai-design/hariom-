"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLogStreamPage() {
  const [logs] = useState([
    "[16:54:10] INFO - Next.js Turbopack dev server online",
    "[16:54:12] DEBUG - PostgreSQL pool connected (42ms)",
    "[16:54:15] WARN - High candidate signup throughput detected",
    "[16:54:20] INFO - AI HireScore model inference complete for candidate CND-9012",
  ]);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Real-Time Log Stream (LM04)" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">Real-Time Log Stream Viewer (LM04)</h1>
            <p className="text-text-muted text-sm">Live stdout/stderr stream from Next.js server, API gateways, and background workers.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#0A0A0C]">
            <div className="space-y-2 font-mono text-xs text-green leading-relaxed">
              {logs.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
