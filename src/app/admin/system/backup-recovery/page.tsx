"use client";
import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminBackupRecoveryPage() {
  return <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
    <AdminSidebar />
    <div className="flex-1 md:ml-[116px] flex flex-col min-w-0">
      <AdminHeader title="Backup & Disaster Recovery" />
      <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1200px] w-full mx-auto">
        <div><h1 className="font-display-lg text-display-lg text-white">Backup & Disaster Recovery</h1><p className="text-text-muted text-sm">Deployment backup evidence and restore controls must come from the configured database/storage provider.</p></div>
        <div className="glass-card p-6 rounded-2xl border border-amber-400/20 space-y-4 max-w-2xl">
          <div className="text-xs font-bold text-amber-300">EXTERNAL EVIDENCE REQUIRED</div>
          <p className="text-sm text-text-muted">HireGo does not currently expose a verified backup-provider API through this Admin screen. Snapshot time, bucket, encryption, PITR and multi-region recovery status are therefore not claimed here.</p>
          <p className="text-xs text-text-muted">Use the production database and object-storage provider consoles for backup/restore operations until an authenticated provider integration and immutable restore audit trail are implemented.</p>
        </div>
      </main>
    </div>
  </div>;
}
