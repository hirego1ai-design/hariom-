"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  timestamp: string;
  userId?: string | null;
  action: string;
  resource: string;
  details?: string | null;
};

export default function SystemAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit-logs", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load audit logs.");
        setLogs(Array.isArray(payload.logs) ? payload.logs : Array.isArray(payload.auditLogs) ? payload.auditLogs : []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load audit logs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 text-text-primary">
      <div>
        <h1 className="text-2xl font-bold text-white">System Audit Log</h1>
        <p className="mt-2 text-sm text-text-muted">Authoritative administrative audit events recorded by the backend.</p>
      </div>

      {loading && <div role="status" className="rounded-2xl border border-white/10 bg-[#121215] p-6 text-sm text-text-muted">Loading audit records…</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}

      {!loading && !error && logs.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-6 text-sm text-text-muted">No audit records are available.</div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121215]">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead className="border-b border-white/10 text-text-muted">
              <tr><th className="p-4">Time</th><th className="p-4">Actor</th><th className="p-4">Action</th><th className="p-4">Resource</th><th className="p-4">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="p-4 text-text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4 text-white">{log.userId || "system"}</td>
                  <td className="p-4 font-bold text-primary">{log.action}</td>
                  <td className="p-4 text-text-secondary">{log.resource}</td>
                  <td className="p-4 text-text-secondary">{log.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
