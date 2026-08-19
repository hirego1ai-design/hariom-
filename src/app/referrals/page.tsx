"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalEarned: number;
  totalFriendsReferred: number;
  hiredCount: number;
  referrals: Array<{
    id: string;
    referredName: string;
    referredEmail: string;
    status: string;
    rewardAmount: number;
    createdAt: string;
  }>;
}

export default function ReferralProgramPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[100px] lg:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
          <div>
            <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight">
              Referral Program & Rewards
            </h1>
            <p className="text-text-muted text-xs">Invite peers and earn instant rewards on signups and successful hires.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/referrals/dashboard"
              className="btn-3d-red px-5 py-2 rounded-full text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <span>Full Analytics Dashboard</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-6xl w-full mx-auto overflow-y-auto">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-2 bg-[#141418]">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                Total Friends Referred
              </p>
              <h3 className="font-bold text-3xl text-white">
                {stats?.totalFriendsReferred ?? 3} Users
              </h3>
              <p className="text-green-400 text-xs font-bold">
                {stats?.hiredCount ?? 1} Hired / Placed
              </p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-2 bg-[#141418]">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                Total Referral Rewards Earned
              </p>
              <h3 className="font-bold text-3xl text-yellow-400 font-mono">
                ₹{stats?.totalEarned ? stats.totalEarned.toLocaleString() : "1,500"}
              </h3>
              <p className="text-xs text-text-muted">Instant UPI Payouts Supported</p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-primary/30 space-y-3 bg-primary/5">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">share</span>
                <span>Your Referral Link</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={stats?.referralLink || "https://hirego.ai/register?ref=HIREGO2026"}
                  className="input-pill w-full h-10 px-3 text-xs text-white font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="btn-3d-red px-4 py-2 rounded-full text-white text-xs font-bold shrink-0 transition-all"
                >
                  {copied ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* How It Works Steps */}
          <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-6 bg-[#141418]">
            <h3 className="text-base font-bold text-white">How HireGo Referral Rewards Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <h4 className="font-bold text-sm text-white">Share Your Link</h4>
                <p className="text-xs text-text-muted">
                  Send your unique referral code or link to peers, colleagues, or social circles.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">
                  2
                </div>
                <h4 className="font-bold text-sm text-white">Earn ₹250 on Signup</h4>
                <p className="text-xs text-text-muted">
                  Get ₹250 credited immediately when your referred friend completes their profile.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                  3
                </div>
                <h4 className="font-bold text-sm text-white">Earn ₹1,000 on Hire</h4>
                <p className="text-xs text-text-muted">
                  Unlock a ₹1,000 bonus whenever your referral accepts a verified job offer.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
