"use client";
import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminProctoringControlPanelPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Proctoring Control Panel" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1200px] w-full mx-auto">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">Proctoring Control Panel</h1>
            <p className="text-text-muted text-sm">Assessment monitoring controls must be persisted, tenant-scoped, consent-aware, and enforced by the assessment runtime.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-amber-400/20 max-w-2xl space-y-3">
            <div className="text-xs font-bold text-amber-300">PROCTORING CONFIGURATION NOT CONNECTED</div>
            <p className="text-sm text-text-muted">The previous switches and tolerance sliders were browser-only defaults and did not prove that face detection, tab monitoring, recording, audio analysis, clipboard blocking, or any global proctoring engine was active.</p>
            <p className="text-sm text-text-muted">Those simulated controls have been removed. Do not present monitoring as enabled until an authenticated configuration API, runtime enforcement, candidate disclosure/consent, retention controls, and auditable policy versioning are connected.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
