"use client";
import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function ReferralProgramPage() {
  const [refLink] = useState("https://hirego.ai/ref/rahul-v");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
              CF10 Module
            </span>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight mt-0.5">
              Referral Program & Rewards Dashboard
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Dashboard
          </Link>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Referrals</p>
              <h3 className="font-bold text-3xl text-white">12 Users</h3>
              <p className="text-green text-xs font-bold">8 Hired / Active</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Referral Rewards Earned</p>
              <h3 className="font-bold text-3xl text-gold-payment font-mono">₹24,000</h3>
              <p className="text-xs text-text-muted">Paid out via Instant UPI</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
              <h3 className="font-bold text-sm text-white">Your Personal Referral Link</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={refLink}
                  className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold shrink-0 transition-all"
                >
                  {copied ? "Copied! ✓" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
