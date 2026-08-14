"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { formatDate } from "@/utils";

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLogs(data.logs || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((l) =>
    searchQuery === ""
      ? true
      : String(l.action).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(l.details).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(l.userId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#26A69A]/10 text-[#26A69A] border border-[#26A69A]/20 mb-1">
              SECURITY AUDIT
            </div>
            <h1 className="text-2xl font-bold text-white">System Security Audit Trail</h1>
            <p className="text-xs text-slate-400">Complete audit log of admin actions, commercial transactions & security events</p>
          </div>

          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit events..."
              className="w-full bg-[#121215] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#26A69A]"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 bg-[#121215] border border-white/5 rounded-2xl">
            No audit events matching criteria.
          </div>
        ) : (
          <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Event History ({filteredLogs.length})</h3>

            <div className="divide-y divide-white/5">
              {filteredLogs.map((log, idx) => (
                <div key={idx} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#FFCA28]">{log.action || "SYSTEM_EVENT"}</span>
                      <span className="text-[10px] text-slate-500">IP: {log.ipAddress || "127.0.0.1"}</span>
                    </div>
                    <p className="text-slate-300">{typeof log.details === "string" ? log.details : JSON.stringify(log.details || {})}</p>
                  </div>

                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    {formatDate(log.timestamp || log.createdAt || new Date())}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
