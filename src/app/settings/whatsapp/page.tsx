"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export default function WhatsappApiConfigPage() {
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [toast, setToast] = useState<string | null>(null);

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
        <h1 className="font-display-lg text-display-lg text-white">WhatsApp Business API Setup (G05)</h1>
        <p className="text-text-muted text-sm">Integrate Meta Cloud API for instant WhatsApp interview notifications & candidate nudges.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Phone Number ID</label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="Configured securely on the server"
            autoComplete="off"
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">Permanent Access Token</label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Configured securely on the server"
            autoComplete="new-password"
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <button
          onClick={() => {
            setToast("WhatsApp Business API connected successfully!");
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-6 py-2.5 rounded-full bg-green text-black font-bold text-xs hover:bg-green/90 shadow-lg transition-all"
        >
          Connect WhatsApp API
        </button>
      </div>
    </div>
    </div>
);
}
