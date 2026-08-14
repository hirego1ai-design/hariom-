"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export default function SmtpConfigurationPage() {
  const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.net");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("apikey");
  const [isTesting, setIsTesting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const testConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setToast("SMTP Test Email sent successfully!");
      setTimeout(() => setToast(null), 3000);
    }, 1000);
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
        <h1 className="font-display-lg text-display-lg text-white">SMTP Email Configuration (G04)</h1>
        <p className="text-text-muted text-sm">Configure transactional email servers for OTPs, interview invites, and system alerts.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-text-secondary block mb-1">SMTP Host</label>
          <input
            type="text"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Port</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Username</label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            {isTesting ? "Testing Relay..." : "Send Test Email"}
          </button>
          <button
            onClick={() => {
              setToast("SMTP Settings Saved!");
              setTimeout(() => setToast(null), 3000);
            }}
            className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all"
          >
            Save Gateway
          </button>
        </div>
      </div>
    </div>
    </div>
);
}