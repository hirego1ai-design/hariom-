"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export default function ApiIntegrationsHubPage() {
  const [integrations, setIntegrations] = useState([
    { name: "Greenhouse ATS", connected: true, category: "HRIS / ATS" },
    { name: "Lever Recruiting", connected: true, category: "HRIS / ATS" },
    { name: "Slack Notifications", connected: true, category: "Chat Ops" },
    { name: "Google Calendar", connected: false, category: "Scheduling" },
    { name: "Zoom Video Meetings", connected: true, category: "Video Interviews" },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  const toggleIntegration = (name: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.name === name ? { ...item, connected: !item.connected } : item))
    );
    setToast(`Integration '${name}' status updated!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">API & Integrations Hub (G07)</h1>
        <p className="text-text-muted text-sm">Connect third-party ATS platforms, communication channels, and calendar syncs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {integrations.map((item) => (
          <div key={item.name} className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-text-muted">{item.category}</span>
              <h3 className="font-bold text-base text-white mt-2">{item.name}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className={`text-xs font-bold ${item.connected ? "text-green" : "text-text-muted"}`}>
                {item.connected ? "Connected ✓" : "Disconnected"}
              </span>
              <button
                onClick={() => toggleIntegration(item.name)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  item.connected ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-primary text-white hover:bg-primary-light"
                }`}
              >
                {item.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
);
}