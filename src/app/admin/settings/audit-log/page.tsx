"use client";

import { useDeferredValue, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { formatDate } from "@/utils";

type AuditEvent = {
  id: string;
  userId: string | null;
  companyId: string | null;
  action: string;
  resource: string;
  ipAddress: string | null;
  details: string | null;
  timestamp: string;
};

const PAGE_SIZE = 50;

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (deferredSearch) params.set("search", deferredSearch);

    fetch(`/api/admin/audit-logs?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load audit events.");
        }
        setLogs(Array.isArray(payload.logs) ? payload.logs : []);
        setTotal(typeof payload.total === "number" ? payload.total : 0);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setLogs([]);
        setTotal(0);
        setError(cause instanceof Error ? cause.message : "Unable to load audit events.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [deferredSearch, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader title="Security Audit Trail" />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#26A69A]/20 bg-[#26A69A]/10 px-3 py-1 text-[10px] font-bold text-[#26A69A]">
                PERSISTED SECURITY AUDIT
              </div>
              <h1 className="text-2xl font-bold">System Security Audit Trail</h1>
              <p className="mt-1 text-xs text-slate-400">Searchable persisted audit events. Results are paginated; this page never claims a bounded response is the complete history.</p>
            </div>

            <label className="w-full md:w-80 text-[10px] uppercase tracking-wider text-slate-500">
              Search persisted events
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                maxLength={200}
                placeholder="Action, resource, actor, company, IP…"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#121215] px-3 py-2.5 text-xs normal-case text-white outline-none focus:border-[#26A69A]"
              />
            </label>
          </div>

          {loading ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-slate-400">
              Loading persisted audit events…
            </div>
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-slate-400">
              No persisted audit events match the current search.
            </div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]" aria-labelledby="audit-events-heading">
              <div className="border-b border-white/10 p-4">
                <h2 id="audit-events-heading" className="text-sm font-bold">Event history</h2>
                <p className="mt-1 text-[11px] text-slate-500">{total} matching persisted event{total === 1 ? "" : "s"}</p>
              </div>

              <div className="divide-y divide-white/5">
                {logs.map((log) => (
                  <article key={log.id} className="grid gap-3 p-4 text-xs lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#FFCA28]">{log.action || "SYSTEM_EVENT"}</span>
                        <span className="text-[10px] text-slate-500">{log.resource}</span>
                      </div>
                      <p className="mt-2 break-words text-slate-300">{log.details || "No additional detail recorded."}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                        <span>Actor: {log.userId || "System / not linked"}</span>
                        <span>Company: {log.companyId || "Not linked"}</span>
                        <span>IP: {log.ipAddress || "Not recorded"}</span>
                      </div>
                    </div>
                    <time className="font-mono text-[10px] text-slate-500">{formatDate(log.timestamp)}</time>
                  </article>
                ))}
              </div>

              {total > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t border-white/10 p-4">
                  <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40">
                    Previous
                  </button>
                  <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                  <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40">
                    Next
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
