"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export default function SystemAuditLogPage() {
  const [filter, setFilter] = useState("ALL");

  const logs = [
    { id: "LOG-01", time: "16:10:04", user: "admin@hirego.ai", action: "UPDATE_SYSTEM_SETTINGS", detail: "Modified SMTP Host" },
    { id: "LOG-02", time: "15:44:12", user: "compliance@hirego.ai", action: "VERIFY_CANDIDATE", detail: "Verified candidate CND-901" },
    { id: "LOG-03", time: "14:20:55", user: "support@hirego.ai", action: "SUSPEND_USER", detail: "Suspended company Vanguard Systems" },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">System Audit Log (G09)</h1>
        <p className="text-text-muted text-sm">Immutable audit trail of all administrative actions, data edits, and security events.</p>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h3 className="font-bold text-sm text-white">Audit Entries ({logs.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin Account</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-text-muted">{log.time}</td>
                  <td className="p-4 text-white font-bold">{log.user}</td>
                  <td className="p-4 text-primary font-bold">{log.action}</td>
                  <td className="p-4 text-text-secondary">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
);
}