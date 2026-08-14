"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminBackupRecoveryPage() {
  const [backingUp, setBackingUp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const runBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      setToast("Encrypted DB Backup created & pushed to GCS Bucket!");
      setTimeout(() => setToast(null), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Backup & Disaster Recovery (LM07)" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs">
              {toast}
            </div>
          )}

          <div>
            <h1 className="font-display-lg text-display-lg text-white">System Backup & Disaster Recovery (LM07)</h1>
            <p className="text-text-muted text-sm">Automated daily snapshot backups, point-in-time recovery (PITR), and multi-region failover.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
            <div className="space-y-1 text-xs text-text-muted">
              <p>Last Snapshot: <span className="text-white font-bold">Today, 03:00 AM UTC</span></p>
              <p>Storage Bucket: <span className="text-primary font-bold">gs://hirego-db-backups-prod</span></p>
              <p>Encryption: <span className="text-green font-bold">AES-256 GCM</span></p>
            </div>
            <button
              onClick={runBackup}
              disabled={backingUp}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white font-bold text-xs shadow-lg transition-all"
            >
              {backingUp ? "Generating Backup Snapshot..." : "Trigger Manual Instant Backup"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
