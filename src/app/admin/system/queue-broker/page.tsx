"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminQueueBrokerPage() {
  const [queues, setQueues] = useState([
    { name: "ai-eval-queue", pending: 14, processed: 18240, status: "Active" },
    { name: "webhook-dispatch-queue", pending: 0, processed: 94210, status: "Active" },
    { name: "email-otp-queue", pending: 2, processed: 48920, status: "Active" },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Queue Broker & Webhook Dispatcher (SI03)" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs">
              {toast}
            </div>
          )}

          <div>
            <h1 className="font-display-lg text-display-lg text-white">Queue Broker & Webhook Health (SI03)</h1>
            <p className="text-text-muted text-sm">Redis BullMQ workers, message retry policies, and dead-letter queues.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {queues.map((q) => (
              <div key={q.name} className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-green/20 text-green">{q.status}</span>
                <h3 className="font-bold text-base text-white">{q.name}</h3>
                <div className="text-xs text-text-muted space-y-1">
                  <p>Pending Messages: <span className="text-primary font-bold">{q.pending}</span></p>
                  <p>Total Processed: <span className="text-white font-bold">{q.processed.toLocaleString()}</span></p>
                </div>
                <button
                  onClick={() => {
                    setToast(`Purged dead-letter items in ${q.name}`);
                    setTimeout(() => setToast(null), 3000);
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors"
                >
                  Purge Dead-Letter Queue
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
