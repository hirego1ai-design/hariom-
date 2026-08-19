"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { ReferralDashboardStatsDTO, ReferralStatus } from "@/types/referral";

export default function ReferralsDashboardPage() {
  const [stats, setStats] = useState<ReferralDashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("UPI");
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  const fetchStats = () => {
    fetch("/api/referrals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
          if (data.stats.availableBalance > 0) {
            setWithdrawAmount(data.stats.availableBalance.toString());
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopy = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) return;

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsProcessingWithdraw(true);
    setWithdrawMessage(null);

    try {
      const res = await fetch("/api/referrals/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          payoutMethod,
          payoutAddress: upiId.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawMessage(data.message);
        fetchStats();
        setTimeout(() => {
          setShowWithdrawModal(false);
          setWithdrawMessage(null);
        }, 4000);
      } else {
        setWithdrawMessage(`Error: ${data.error || "Failed to submit request."}`);
      }
    } catch {
      setWithdrawMessage("Network error. Failed to initiate payout.");
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const shareText = `Join me on HireGo AI, the autonomous neural talent & recruitment network! Use my referral code: ${
    stats?.referralCode || "HIREGO2026"
  }`;
  const encodedShareText = encodeURIComponent(shareText);
  const encodedShareUrl = encodeURIComponent(stats?.referralLink || "https://hirego.ai");

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[100px] lg:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
          <div>
            <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight">
              Referral Earnings & Analytics
            </h1>
            <p className="text-text-muted text-xs">
              Track multi-tier candidate, employer job post, and HireGo Managed Hiring™ rewards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/referrals"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span className="hidden sm:inline">Program Overview</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-6xl w-full mx-auto overflow-y-auto">
          {/* Top Bento Row: 4 Financial Metric Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Available to Withdraw */}
            <div className="glass-card p-5 rounded-3xl border border-green-500/30 bg-green-500/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-green-400">
                Available to Withdraw
              </span>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-green-400 font-mono">
                  ₹{(stats?.availableBalance || 0).toLocaleString()}
                </span>
              </div>
              <button
                disabled={(stats?.availableBalance || 0) < 500}
                onClick={() => setShowWithdrawModal(true)}
                className="btn-3d-gold px-4 py-1.5 rounded-full text-xs font-bold text-black flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span>Request Payout</span>
              </button>
            </div>

            {/* 2. Locked Managed Hiring™ Rewards (Replacement Guarantee) */}
            <div className="glass-card p-5 rounded-3xl border border-yellow-500/30 bg-yellow-500/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-400">
                Locked Managed Hiring™ Rewards
              </span>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-yellow-400 font-mono">
                  ₹{(stats?.lockedBalance || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-text-muted">
                Releases upon 45-90d replacement guarantee completion
              </span>
            </div>

            {/* 3. Pending Payout Approvals */}
            <div className="glass-card p-5 rounded-3xl border border-blue-500/30 bg-blue-500/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                Pending Approval
              </span>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-blue-400 font-mono">
                  ₹{(stats?.pendingPayoutBalance || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-text-muted">
                Under administrative verification
              </span>
            </div>

            {/* 4. Lifetime Paid Out */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 bg-[#141418] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                Lifetime Paid Out
              </span>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  ₹{(stats?.paidBalance || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-text-muted">
                Total earnings successfully disbursed
              </span>
            </div>
          </div>

          {/* Share & Unique Code Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 glass-card p-6 lg:p-7 rounded-3xl border border-primary/30 bg-primary/5 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">share</span>
                <span>Your Universal Referral Link (Unlimited Invites)</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={stats?.referralLink || "https://hirego.ai/register?ref=HIREGO2026"}
                  className="input-pill w-full h-11 px-4 text-xs text-white font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="btn-3d-red px-6 py-2.5 rounded-full text-white text-xs font-bold shrink-0 transition-all shadow-md"
                >
                  {copied ? "Copied! ✓" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Social Share Badges */}
            <div className="lg:col-span-4 glass-card p-6 rounded-3xl border border-white/10 bg-[#141418] flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs text-text-muted font-bold">1-Click Instant Share</span>
              <div className="flex items-center gap-3">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodedShareText}%20${encodedShareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 flex items-center justify-center text-green-400 transition-all shadow-md"
                  title="Share on WhatsApp"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 flex items-center justify-center text-blue-400 transition-all shadow-md"
                  title="Share on LinkedIn"
                >
                  <span className="material-symbols-outlined text-[20px]">link</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedShareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all shadow-md"
                  title="Share on X"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </a>
              </div>
            </div>
          </div>

          {/* Reward Transactions Table */}
          <div className="glass-card rounded-3xl border border-white/10 overflow-hidden bg-[#141418]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Referral Reward Ledger</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Sanitized activity feed. Commercial contract economics are confidential.
                </p>
              </div>
              <span className="text-xs text-green-400 flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live Database Stream
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-text-muted tracking-wider">
                    <th className="px-6 py-4">Referred Activity</th>
                    <th className="px-6 py-4">Sequence</th>
                    <th className="px-6 py-4">Replacement Guarantee SLA</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Your Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {!loading && (stats?.recentRewards?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-text-muted">
                        No referral rewards have been recorded yet.
                      </td>
                    </tr>
                  )}
                  {(stats?.recentRewards ?? []).map((ref) => {
                    const lockText = ref.isLocked && ref.lockExpiresAt
                      ? `Until ${new Date(ref.lockExpiresAt).toLocaleDateString()} (${ref.lockDurationDays}d replacement guarantee)`
                      : "None (Instant)";

                    return (
                      <tr key={ref.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {ref.productDisplayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white">{ref.productDisplayName}</p>
                              <p className="text-[11px] text-text-muted font-mono">{ref.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-text-muted">
                          #{ref.transactionSequenceNumber}
                        </td>

                        <td className="px-6 py-4 text-xs font-mono text-yellow-400">
                          {lockText}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                              ref.status === ReferralStatus.ELIGIBLE
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : ref.status === ReferralStatus.LOCKED
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                : ref.status === ReferralStatus.PAID
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-white/10 text-text-muted border-white/20"
                            }`}
                          >
                            {ref.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-green-400 font-mono">
                          +₹{ref.rewardAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Withdrawal Request Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-white/20 bg-[#141418] space-y-5 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-white">Request Referral Payout</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-text-muted hover:text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {withdrawMessage ? (
                <div
                  className={`p-4 rounded-2xl text-xs text-center font-bold border ${
                    withdrawMessage.startsWith("Error")
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : "bg-green-500/10 text-green-400 border-green-500/30"
                  }`}
                >
                  {withdrawMessage}
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                    <span className="text-text-muted">Available Eligible Balance:</span>
                    <span className="text-green-400 font-bold font-mono text-base">
                      ₹{(stats?.availableBalance || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted">Payout Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPayoutMethod("UPI")}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          payoutMethod === "UPI"
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 text-text-muted"
                        }`}
                      >
                        UPI / VPA
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayoutMethod("BANK_TRANSFER")}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          payoutMethod === "BANK_TRANSFER"
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 text-text-muted"
                        }`}
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted">
                      {payoutMethod === "UPI" ? "Enter UPI ID / VPA *" : "Enter Bank Account Details *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder={payoutMethod === "UPI" ? "e.g. yourname@okhdfcbank" : "A/C: 12345678, IFSC: HDFC000123"}
                      className="input-pill w-full h-11 px-4 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted">Withdrawal Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min={500}
                      max={stats?.availableBalance || 500}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="input-pill w-full h-11 px-4 text-xs text-white font-mono"
                    />
                    <p className="text-[10px] text-text-muted">Minimum withdrawal threshold: ₹500</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWithdrawModal(false)}
                      className="px-5 py-2 rounded-full text-xs text-text-muted hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingWithdraw}
                      className="btn-3d-gold px-6 py-2 rounded-full text-xs font-bold text-black shadow-lg disabled:opacity-50"
                    >
                      {isProcessingWithdraw ? "Submitting..." : "Submit Payout Request"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
