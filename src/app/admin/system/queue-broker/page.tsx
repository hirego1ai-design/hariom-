"use client";
import React, { useCallback, useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type QueueSnapshot = { name: string; counts: Record<string, number> };
type WorkerLiveness = {
  status: "NOT_STARTED" | "STALE" | "HEALTHY" | "ATTENTION" | "UNAVAILABLE";
  stale: boolean;
  state: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export default function AdminQueueBrokerPage() {
  const [queues, setQueues] = useState<QueueSnapshot[]>([]);
  const [observedAt, setObservedAt] = useState<string | null>(null);
  const [worker, setWorker] = useState<WorkerLiveness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/system/queues", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Queue data could not be loaded.");
      setQueues(Array.isArray(data.queues) ? data.queues : []);
      setObservedAt(typeof data.observedAt === "string" ? data.observedAt : null);
      setWorker(data.workerLiveness?.workflowRecovery || null);
    } catch (err) {
      setQueues([]);
      setObservedAt(null);
      setWorker(null);
      setError(err instanceof Error ? err.message : "Queue data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="min-h-screen flex-1 md:pl-[116px] flex flex-col min-w-0">
        <AdminHeader title="Queue Processing" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto">
          <h1 className="font-display-lg text-display-lg text-white">Queue processing</h1>
          <p className="text-text-muted text-sm">Saved job counts by processing state. These counts do not confirm whether a worker is currently running.</p>
          <button disabled={loading} onClick={() => void refresh()} className="px-5 py-2 rounded-xl bg-primary text-white disabled:opacity-50">{loading ? "Loading…" : "Refresh"}</button>
          {error && <p role="alert" className="text-red-400">{error}</p>}
          {observedAt && <p className="text-text-muted text-xs">Last checked: {new Date(observedAt).toLocaleString()}</p>}
          {worker && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" aria-labelledby="recovery-worker-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="recovery-worker-heading" className="font-bold text-white">Workflow recovery worker</h2>
                  <p className="mt-1 text-xs text-text-muted">Persisted heartbeat evidence; this does not infer liveness when the heartbeat is stale or unavailable.</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-text-secondary">{worker.status.replaceAll("_", " ")}</span>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-text-muted sm:grid-cols-3">
                <p>State: <span className="text-white">{worker.state || "Not recorded"}</span></p>
                <p>Started: <span className="text-white">{worker.startedAt ? new Date(worker.startedAt).toLocaleString() : "Not recorded"}</span></p>
                <p>Finished: <span className="text-white">{worker.finishedAt ? new Date(worker.finishedAt).toLocaleString() : "Not recorded"}</span></p>
              </div>
            </section>
          )}
          {queues.length === 0 && !loading && !error ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-200">No queue snapshots were returned.</div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {queues.map((queue) => (
              <div key={queue.name} className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <h2 className="font-bold text-base text-white">{queue.name}</h2>
                {Object.entries(queue.counts).length === 0 ? <p className="text-text-muted text-sm">No saved jobs.</p> :
                  Object.entries(queue.counts).map(([status, count]) => <p key={status} className="text-sm text-text-muted">{status}: <span className="text-white">{count}</span></p>)}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
