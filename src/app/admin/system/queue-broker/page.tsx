"use client";
import React, { useCallback, useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type QueueSnapshot = { name: string; counts: Record<string, number> };

export default function AdminQueueBrokerPage() {
  const [queues, setQueues] = useState<QueueSnapshot[]>([]);
  const [observedAt, setObservedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/system/queues", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Queue data could not be loaded.");
      setQueues(data.queues);
      setObservedAt(data.observedAt);
    } catch (err) {
      setQueues([]);
      setObservedAt(null);
      setError(err instanceof Error ? err.message : "Queue data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Queue Processing" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto">
          <h1 className="font-display-lg text-display-lg text-white">Queue processing</h1>
          <p className="text-text-muted text-sm">Saved job counts by processing state. These counts do not confirm whether a worker is currently running.</p>
          <button disabled={loading} onClick={() => void refresh()} className="px-5 py-2 rounded-xl bg-primary text-white disabled:opacity-50">{loading ? "Loading…" : "Refresh"}</button>
          {error && <p role="alert" className="text-red-400">{error}</p>}
          {observedAt && <p className="text-text-muted text-xs">Last checked: {new Date(observedAt).toLocaleString()}</p>}
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
