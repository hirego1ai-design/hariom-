"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export default function DomainSslSettingsPage() {
  const [domain, setDomain] = useState("portal.hirego.ai");
  const [sslStatus, setSslStatus] = useState("Active (Let's Encrypt Wildcard)");
  const [toast, setToast] = useState<string | null>(null);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setToast("Domain DNS & SSL configuration updated!");
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
        <h1 className="font-display-lg text-display-lg text-white">Domain & SSL Settings (G03)</h1>
        <p className="text-text-muted text-sm">Manage custom domain routing, CNAME records, and SSL encryption certificates.</p>
      </div>

      <form onSubmit={handleUpdate} className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Primary Custom Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
          <p className="text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            SSL Certificate Status: <span className="text-green">{sslStatus}</span>
          </p>
          <p className="text-[11px] text-text-muted">Auto-renews in 64 days • TLS 1.3 Strict Security Enabled</p>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all"
        >
          Verify & Bind Domain
        </button>
      </form>
    </div>
    </div>
);
}