"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminDbPoolPage() {
  const [connections, setConnections] = useState(84);
  const [maxConnections] = useState(100);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Database Pool & Migration Manager (SI02)" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs">
              {toast}
            </div>
          )}

          <div>
            <h1 className="font-display-lg text-display-lg text-white">Database Pool & Migration Manager (SI02)</h1>
            <p className="text-text-muted text-sm">PostgreSQL/Prisma connection pooling, active locks, and schema migrations.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white font-bold">Active Connection Pool</span>
              <span className="text-primary font-bold">{connections} / {maxConnections} connections</span>
            </div>
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${(connections / maxConnections) * 100}%` }} />
            </div>
            <button
              onClick={() => {
                setConnections(42);
                setToast("Flushed idle database connections!");
                setTimeout(() => setToast(null), 3000);
              }}
              className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white font-bold text-xs shadow-lg transition-all"
            >
              Flush Idle Pool Connections
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
