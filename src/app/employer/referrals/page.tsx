"use client";

import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";
import Link from "next/link";
import {
  ReferralDashboardStatsDTO,
  SanitizedReferralRewardDTO,
  SanitizedReferralAttributionDTO,
  ReferralStatus,
  ReferralProductType,
  PayoutMethod,
} from "@/types/referral";

// ─── Helpers ────────────────────────────────────────────────────

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: ReferralStatus) {
  const map: Record<string, string> = {
    ATTRIBUTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    QUALIFIED: "bg-green-500/10 text-green-400 border-green-500/20",
    LOCKED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    ELIGIBLE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PAYABLE: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    PAID: "bg-white/10 text-white border-white/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    FRAUD_HOLD: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };
  return map[status] ?? "bg-white/5 text-text-muted border-white/10";
}

function productLabel(type: ReferralProductType | string) {
  const map: Record<string, string> = {
    EMPLOYER_JOB_POST: "Job Post",
    EMPLOYER_SUBSCRIPTION: "Subscription",
    EMPLOYER_MANAGED_HIRING: "Managed Hiring™",
    CANDIDATE_MOCK_INTERVIEW: "Mock Interview",
    CANDIDATE_CAREER_PASS: "Career Pass",
  };
  return map[type] ?? type;
}

// ─── Page ───────────────────────────────────────────────────────

export default function EmployerReferralsPage() {
  const [stats, setStats] = useState<ReferralDashboardStatsDTO | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payout withdrawal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"UPI" | "BANK_TRANSFER">("UPI");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active history tab
  const [historyTab, setHistoryTab] = useState<"rewards" | "attributions">("rewards");

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    const link = stats?.referralLink ?? "https://hirego.ai/register?ref=ENTERPRISE2026";
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0) {
      setPayoutMsg({ type: "error", text: "Enter a valid withdrawal amount." });
      return;
    }
    if ((stats?.availableBalance ?? 0) < amt) {
      setPayoutMsg({ type: "error", text: "Amount exceeds your available balance." });
      return;
    }
    if (!payoutAddress.trim()) {
      setPayoutMsg({ type: "error", text: "Payout address is required." });
      return;
    }

    setPayoutLoading(true);
    setPayoutMsg(null);

    try {
      const body: Record<string, unknown> = {
        payoutMethod,
        payoutAddress: payoutAddress.trim(),
        amount: amt,
        accountHolderName: accountHolderName.trim() || undefined,
      };

      if (payoutMethod === "BANK_TRANSFER") {
        body.bankDetails = {
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          ifscCode: ifscCode.trim().toUpperCase() || undefined,
        };
      }

      const res = await fetch("/api/referrals/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPayoutMsg({ type: "error", text: data.error ?? "Withdrawal request failed." });
      } else {
        setPayoutMsg({ type: "success", text: data.message ?? "Withdrawal request submitted. Pending admin approval." });
        setPayoutAmount("");
        setPayoutAddress("");
        setAccountHolderName("");
        setBankName("");
        setAccountNumber("");
        setIfscCode("");
        // Refresh stats
        const refreshed = await fetch("/api/referrals").then((r) => r.json());
        if (refreshed.success && refreshed.stats) setStats(refreshed.stats);
      }
    } catch {
      setPayoutMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteMsg({ type: "error", text: "Partner email is required." });
      return;
    }
    setInviteLoading(true);
    setInviteMsg(null);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INVITE",
          email: inviteEmail.trim().toLowerCase(),
          name: inviteName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setInviteMsg({ type: "error", text: data.error ?? "Invite failed. Try again." });
      } else {
        setInviteMsg({
          type: "success",
          text: `Invite registered for ${inviteEmail}. Once they join and post a job, your reward will be triggered.`,
        });
        setInviteEmail("");
        setInviteName("");
      }
    } catch {
      setInviteMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined text-primary text-[32px] animate-spin">progress_activity</span>
        </div>
      </PageContainer>
    );
  }

  const availableBalance = stats?.availableBalance ?? 0;
  const lockedBalance = stats?.lockedBalance ?? 0;
  const pendingBalance = stats?.pendingPayoutBalance ?? 0;
  const recentRewards: SanitizedReferralRewardDTO[] = stats?.recentRewards ?? [];
  const recentAttributions: SanitizedReferralAttributionDTO[] = stats?.recentAttributions ?? [];

  return (
    <PageContainer>
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display-xl text-3xl md:text-4xl text-primary font-bold tracking-tight">
            Corporate Referral & Partner Rewards
          </h1>
          <p className="text-text-secondary mt-1 text-xs md:text-sm">
            Refer partner companies, startups, and hiring teams. Earn up to ₹7,000 per referred company.
          </p>
        </div>
        <Link
          href="/employer/dashboard"
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/10 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Dashboard
        </Link>
      </header>

      {/* ── Balance Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-3xl border border-primary/30 bg-primary/5 space-y-2">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
            Partner Companies Referred
          </p>
          <h3 className="font-bold text-3xl text-white font-mono">
            {stats?.totalAttributions ?? 0} Companies
          </h3>
          <p className="text-primary text-xs font-bold">Unlimited Referral Cap Active</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-green-500/30 bg-green-500/5 space-y-2">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
            Available to Withdraw
          </p>
          <h3 className="font-bold text-3xl text-green-400 font-mono">
            {formatINR(availableBalance)}
          </h3>
          <p className="text-xs text-text-muted">Instant Withdrawal via UPI or Bank Transfer</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/5 space-y-2">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
            Locked (Replacement SLA)
          </p>
          <h3 className="font-bold text-3xl text-yellow-400 font-mono">
            {formatINR(lockedBalance)}
          </h3>
          <p className="text-xs text-text-muted">Releases on 45–90d SLA completion</p>
        </div>
      </div>

      {/* ── Pending payout notice ── */}
      {pendingBalance > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex items-center gap-3 text-xs text-blue-300">
          <span className="material-symbols-outlined text-blue-400 text-[18px]">hourglass_top</span>
          <span>
            <strong className="font-bold">{formatINR(pendingBalance)}</strong> in payout requests pending admin approval.
          </span>
        </div>
      )}

      {/* ── Referral Link ── */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#141418] space-y-4 mb-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
          Your Company's Partner Invite Link
        </h3>
        <p className="text-xs text-text-muted">
          Share this with HR leaders, founders, and recruitment teams. They get priority onboarding; you earn rewards on their first 2 job posts and first Managed Hiring™ placement.
        </p>
        <div className="flex gap-2 max-w-2xl">
          <input
            type="text"
            readOnly
            value={stats?.referralLink ?? "https://hirego.ai/register?ref=ENTERPRISE2026"}
            className="input-pill w-full h-11 px-4 text-xs text-white font-mono"
          />
          <button
            onClick={handleCopy}
            className="btn-3d-red px-6 py-2 rounded-full text-white text-xs font-bold shrink-0 transition-all shadow-md"
          >
            {copied ? "Copied! ✓" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* ── Email Invite + Payout side by side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Email Invite */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#141418] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">send</span>
            Invite a Partner Company
          </h3>
          <p className="text-xs text-text-muted">
            Register an email invite. Once they sign up and post a job, your reward is automatically triggered.
          </p>
          <form onSubmit={handleInviteSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="input-pill w-full h-10 px-3 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Work Email *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="hr@company.com"
                  className="input-pill w-full h-10 px-3 text-xs text-white"
                />
              </div>
            </div>
            {inviteMsg && (
              <p className={`text-xs font-bold px-3 py-2 rounded-xl border ${inviteMsg.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                {inviteMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={inviteLoading}
              className="btn-3d-red w-full h-10 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              {inviteLoading ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Send Invite
                </>
              )}
            </button>
          </form>
        </div>

        {/* Payout Withdrawal */}
        <div className="glass-card p-6 rounded-3xl border border-green-500/20 bg-[#141418] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 text-[18px]">account_balance_wallet</span>
              Withdraw Earnings
            </h3>
            <span className="text-xs font-mono font-bold text-green-400">{formatINR(availableBalance)} available</span>
          </div>

          <form onSubmit={handlePayoutSubmit} className="space-y-3">
            {/* Method selector */}
            <div className="flex gap-2">
              {(["UPI", "BANK_TRANSFER"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayoutMethod(m)}
                  className={`flex-1 h-9 rounded-xl border text-[11px] font-bold transition-all ${
                    payoutMethod === m
                      ? "bg-green-500/20 border-green-500/40 text-green-300"
                      : "bg-white/5 border-white/10 text-text-muted hover:bg-white/10"
                  }`}
                >
                  {m === "UPI" ? "UPI / VPA" : "Bank Transfer"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                max={availableBalance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="500"
                className="input-pill w-full h-10 px-3 text-xs text-white font-mono"
              />
            </div>

            {/* UPI address */}
            {payoutMethod === "UPI" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">UPI ID / VPA *</label>
                <input
                  type="text"
                  required
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder="yourname@upi"
                  className="input-pill w-full h-10 px-3 text-xs text-white font-mono"
                />
              </div>
            )}

            {/* Bank fields */}
            {payoutMethod === "BANK_TRANSFER" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Account Holder *</label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Full name"
                      className="input-pill w-full h-10 px-3 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="HDFC Bank"
                      className="input-pill w-full h-10 px-3 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Account Number *</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="00001234567890"
                      className="input-pill w-full h-10 px-3 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="input-pill w-full h-10 px-3 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Beneficiary Address (Bank Account no.) *</label>
                  <input
                    type="text"
                    required
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                    placeholder="Account number or IFSC+Account"
                    className="input-pill w-full h-10 px-3 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}

            {payoutMsg && (
              <p className={`text-xs font-bold px-3 py-2 rounded-xl border ${
                payoutMsg.type === "success"
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {payoutMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={payoutLoading || availableBalance <= 0}
              className="w-full h-10 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 14px rgba(34,197,94,0.25)" }}
            >
              {payoutLoading ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  Request Withdrawal
                </>
              )}
            </button>
            <p className="text-[10px] text-text-muted text-center">
              Withdrawals are reviewed and approved by the HireGo AI compliance team within 2 business days.
            </p>
          </form>
        </div>
      </div>

      {/* ── Rewards & Attributions History ── */}
      <div className="glass-card rounded-3xl border border-white/10 bg-[#141418] overflow-hidden mb-8">
        {/* Tab header */}
        <div className="flex items-center gap-2 p-5 border-b border-white/10">
          <button
            onClick={() => setHistoryTab("rewards")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              historyTab === "rewards"
                ? "bg-primary text-white"
                : "bg-white/5 text-text-muted hover:text-white"
            }`}
          >
            Reward History ({recentRewards.length})
          </button>
          <button
            onClick={() => setHistoryTab("attributions")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              historyTab === "attributions"
                ? "bg-primary text-white"
                : "bg-white/5 text-text-muted hover:text-white"
            }`}
          >
            Attributed Companies ({recentAttributions.length})
          </button>
        </div>

        {/* Rewards tab */}
        {historyTab === "rewards" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-text-muted tracking-wider">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Lock Expiry</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentRewards.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                      No rewards yet. Start referring partner companies to earn rewards.
                    </td>
                  </tr>
                ) : (
                  recentRewards.map((r) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[16px]">
                            {r.productType === "EMPLOYER_MANAGED_HIRING" ? "handshake" : "work"}
                          </span>
                          <span className="font-bold text-white">{r.productDisplayName || productLabel(r.productType)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-green-400">
                        {formatINR(r.rewardAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        {r.isLocked && r.lockExpiresAt
                          ? formatDate(r.lockExpiresAt)
                          : r.unlockedAt
                          ? <span className="text-green-400">Unlocked {formatDate(r.unlockedAt)}</span>
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-text-muted">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Attributions tab */}
        {historyTab === "attributions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-text-muted tracking-wider">
                  <th className="px-6 py-4">Company / Referral</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Total Earned</th>
                  <th className="px-6 py-4">Rewards</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentAttributions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                      No attributed companies yet.
                    </td>
                  </tr>
                ) : (
                  recentAttributions.map((a) => (
                    <tr key={a.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-white">{a.referredMaskedName ?? "—"}</span>
                        <p className="text-[10px] text-text-muted font-mono">{a.referralCode}</p>
                      </td>
                      <td className="px-6 py-4 text-text-muted">{a.attributionSource.replace(/_/g, " ")}</td>
                      <td className="px-6 py-4 font-mono font-bold text-green-400">
                        {formatINR(a.totalRewardsEarned)}
                      </td>
                      <td className="px-6 py-4 font-mono text-white">{a.rewardsCount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          a.status === "COMPLETED"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : a.status === "EXPIRED"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted">{formatDate(a.attributionDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── B2B Structure ── */}
      <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 bg-[#141418] space-y-6">
        <h3 className="text-base font-bold text-white">B2B Corporate Referral Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: 1, color: "primary", icon: "share", title: "Share Partner Link", desc: "Invite partner companies to hire on HireGo AI with priority talent matching." },
            { step: 2, color: "yellow-400", icon: "payments", title: "₹1,000 on Job Posts (Max 2)", desc: "Earn ₹1,000 for each of the first 2 job posting orders placed by the referred company." },
            { step: 3, color: "green-400", icon: "handshake", title: "₹5,000 on First Managed Hiring™", desc: "₹5,000 bonus when their first Managed Hiring™ candidate is placed." },
          ].map(({ step, color, icon, title, desc }) => (
            <div key={step} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-${color}/20 text-${color}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </div>
              <h4 className="font-bold text-sm text-white">{title}</h4>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
