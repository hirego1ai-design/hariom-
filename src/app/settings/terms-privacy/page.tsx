"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export default function TermsPrivacyPage() {
  const [terms, setTerms] = useState("Welcome to HireGo AI. By accessing our platform, you agree to our AI evaluation and data processing terms.");
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
        <h1 className="font-display-lg text-display-lg text-white">Terms of Service & Privacy Policy Editor (G13)</h1>
        <p className="text-text-muted text-sm">Update platform legal agreements, GDPR compliance policies, and AI candidate consent disclosures.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-2xl">
        <label className="text-xs text-text-secondary block mb-1">Terms of Service Markdown Document</label>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={8}
          className="w-full rounded-xl bg-[#1E1E1E] border border-white/10 p-4 text-xs text-white font-mono leading-relaxed"
        />

        <button
          onClick={() => {
            setToast("Legal documents published successfully!");
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all"
        >
          Publish Legal Document
        </button>
      </div>
    </div>
    </div>
);
}