"use client";

import React, { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import type { ReferralDashboardStatsDTO } from "@/types/referral";

export default function ReferralProgramPage() {
  const [stats, setStats] = useState<ReferralDashboardStatsDTO | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/referrals", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.stats) {
        throw new Error(data.error || "Referral data is unavailable.");
      }
      setStats(data.stats);
    } catch (error) {
      setStats(null);
      setLoadError(error instanceof Error ? error.message : "Referral data is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  const handleCopy = async () => {
    if (!stats?.referralLink) return;
    await navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
        <CandidateSidebar />
        <main className="flex-1 ml-0 md:ml-[116px] grid place-items-center p-6">
          <p className="text-sm text-text-muted">Loading referral program…</p>
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
        <CandidateSidebar />
        <main className="flex-1 ml-0 md:ml-[116px] grid place-items-center p-6">
          <section className="max-w-lg rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <h1 className="text-xl font-bold">Referral program unavailable</h1>
            <p className="mt-2 text-sm text-text-secondary">{loadError || "Referral data could not be loaded."}</p>
            <button type="button" onClick={() => void loadStats()} className="mt-5 min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-white">
              Try again
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-0 md:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
          <div>
            <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight">
              Referral Program & Rewards
            </h1>
            <p className="text-text-muted text-xs">
              Share your unique link and track rewards recorded under the current referral program rules.
            </p>
          </div>

          <Link
            href="/referrals/dashboard"
            className="min-h-11 btn-3d-red px-5 rounded-full text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            <span>Full Analytics Dashboard</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </header>

        <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-6xl w-full mx-auto overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-2 bg-[#141418]">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                Referral Attributions
              </p>
              <h3 className="font-bold text-3xl text-white">{stats.totalAttributions}</h3>
              <p className="text-green-400 text-xs font-bold">
                {stats.totalQualifiedConversions} qualified reward event{stats.totalQualifiedConversions === 1 ? "" : "s"}
              </p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-2 bg-[#141418]">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                Lifetime Referral Earnings
              </p>
              <h3 className="font-bold text-3xl text-yellow-400 font-mono">
                ₹{stats.lifetimeEarnings.toLocaleString()}
              </h3>
              <p className="text-xs text-text-muted">
                Available ₹{stats.availableBalance.toLocaleString()} · Pending payout ₹{stats.pendingPayoutBalance.toLocaleString()}
              </p>
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
                  value={stats.referralLink}
                  className="input-pill w-full h-10 px-3 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="min-h-11 btn-3d-red px-4 rounded-full text-white text-xs font-bold shrink-0 transition-all"
                >
                  {copied ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-6 bg-[#141418]">
            <h2 className="text-base font-bold text-white">How HireGo Referral Rewards Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                <h3 className="font-bold text-sm text-white">Share Your Link</h3>
                <p className="text-xs text-text-muted">
                  Use the unique referral link tied to your account. The code is persisted by HireGo and is not generated from display text.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">2</div>
                <h3 className="font-bold text-sm text-white">Track Qualified Activity</h3>
                <p className="text-xs text-text-muted">
                  Eligible referral events and any lock period are recorded in the referral ledger under the active program configuration.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 font-bold">3</div>
                <h3 className="font-bold text-sm text-white">Request Eligible Payout</h3>
                <p className="text-xs text-text-muted">
                  Only the server-confirmed available balance can be requested. Payouts remain subject to the configured minimum, fraud checks, and administrative verification.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
