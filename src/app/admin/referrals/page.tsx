"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ReferralPayout, ReferralProgramConfig } from "@/types/referral";

export default function AdminReferralsPage() {
  const [config, setConfig] = useState<ReferralProgramConfig | null>(null);
  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"CONFIG" | "PAYOUTS" | "ANALYTICS">("CONFIG");

  // Per-payout UTR input state
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [payoutActionLoading, setPayoutActionLoading] = useState<Record<string, boolean>>({});
  const [payoutActionMsg, setPayoutActionMsg] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [configRes, payoutsRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/referrals/config").then((r) => r.json()),
        fetch("/api/admin/referrals/payouts").then((r) => r.json()),
        fetch("/api/admin/referrals/analytics").then((r) => r.json()),
      ]);
      if (configRes.success && configRes.config) setConfig(configRes.config);
      if (payoutsRes.success && payoutsRes.queue) setPayouts(payoutsRes.queue);
      if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      const res = await fetch("/api/admin/referrals/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setSaveMessage(data.success ? "Configuration updated successfully!" : (data.error ?? "Failed to save."));
      setTimeout(() => setSaveMessage(null), 4000);
    } catch {
      setSaveMessage("Network error. Failed to save.");
    }
  };

  // Step 1: APPROVE — transitions payout to APPROVED state
  const handleApprove = async (payoutId: string) => {
    setPayoutActionLoading((p) => ({ ...p, [payoutId]: true }));
    setPayoutActionMsg((p) => ({ ...p, [payoutId]: "" }));
    try {
      const res = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action: "APPROVE" }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutActionMsg((p) => ({ ...p, [payoutId]: "Approved. Enter UTR to mark as PAID." }));
        fetchData();
      } else {
        setPayoutActionMsg((p) => ({ ...p, [payoutId]: data.error ?? "Approval failed." }));
      }
    } catch {
      setPayoutActionMsg((p) => ({ ...p, [payoutId]: "Network error." }));
    } finally {
      setPayoutActionLoading((p) => ({ ...p, [payoutId]: false }));
    }
  };

  // Step 2: MARK_PAID — requires a real UTR / transaction reference
  const handleMarkPaid = async (payoutId: string) => {
    const utr = utrInputs[payoutId]?.trim();
    if (!utr) {
      setPayoutActionMsg((p) => ({ ...p, [payoutId]: "Enter the UTR / transaction reference first." }));
      return;
    }
    setPayoutActionLoading((p) => ({ ...p, [payoutId]: true }));
    setPayoutActionMsg((p) => ({ ...p, [payoutId]: "" }));
    try {
      const res = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action: "MARK_PAID", transactionRef: utr }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutActionMsg((p) => ({ ...p, [payoutId]: `Marked PAID — UTR: ${utr}` }));
        setUtrInputs((u) => { const n = { ...u }; delete n[payoutId]; return n; });
        fetchData();
      } else {
        setPayoutActionMsg((p) => ({ ...p, [payoutId]: data.error ?? "Mark-paid failed." }));
      }
    } catch {
      setPayoutActionMsg((p) => ({ ...p, [payoutId]: "Network error." }));
    } finally {
      setPayoutActionLoading((p) => ({ ...p, [payoutId]: false }));
    }
  };

  // REJECT
  const handleReject = async (payoutId: string) => {
    if (!confirm("Reject this payout request? This will release the reserved balance.")) return;
    setPayoutActionLoading((p) => ({ ...p, [payoutId]: true }));
    try {
      const res = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action: "REJECT", rejectionReason: "Rejected by admin." }),
      });
      const data = await res.json();
      setPayoutActionMsg((p) => ({ ...p, [payoutId]: data.success ? "Rejected." : (data.error ?? "Reject failed.") }));
      if (data.success) fetchData();
    } catch {
      setPayoutActionMsg((p) => ({ ...p, [payoutId]: "Network error." }));
    } finally {
      setPayoutActionLoading((p) => ({ ...p, [payoutId]: false }));
    }
  };

  const pendingCount = payouts.filter((p) => p.status === "PENDING_ADMIN_APPROVAL").length;
  const approvedCount = payouts.filter((p) => p.status === "APPROVED").length;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex flex-col">
      <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
            Admin Control Center
          </span>
          <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight mt-0.5">
            Referral Engine & Payout Governance
          </h1>
        </div>
        <Link href="/admin/dashboard" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/10">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Dashboard
        </Link>
      </header>

      <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-6xl w-full mx-auto overflow-y-auto">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-4 flex-wrap">
          {(["CONFIG", "PAYOUTS", "ANALYTICS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab ? "bg-primary text-white shadow-lg" : "bg-white/5 text-text-muted hover:text-white"
              }`}
            >
              {tab === "CONFIG" && "Program Rules & Slabs"}
              {tab === "PAYOUTS" && (
                <>
                  Payout Approval Queue
                  {(pendingCount + approvedCount) > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-400 text-black font-extrabold">
                      {pendingCount + approvedCount}
                    </span>
                  )}
                </>
              )}
              {tab === "ANALYTICS" && "Analytics & Fraud"}
            </button>
          ))}
        </div>

        {/* ── CONFIG TAB ── */}
        {activeTab === "CONFIG" && config && (
          <form onSubmit={handleConfigSave} className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 bg-[#141418] space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Global Referral Economics & Thresholds</h2>
                <p className="text-xs text-text-muted">Changes take effect immediately across all active qualification hooks.</p>
              </div>
              <button type="submit" className="btn-3d-gold px-6 py-2 rounded-full text-xs font-bold text-black shadow-lg">
                Save Configuration
              </button>
            </div>
            {saveMessage && (
              <div className={`p-3 rounded-2xl text-xs text-center font-bold border ${saveMessage.includes("success") || saveMessage.includes("updated") ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                {saveMessage}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Candidate Product Rules</h3>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Reward Per Qualifying Purchase (₹)</label>
                  <input type="number" value={config.candidateRewardAmount} onChange={(e) => setConfig({ ...config, candidateRewardAmount: parseFloat(e.target.value) || 0 })} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Max Qualifying Purchases Per Candidate</label>
                  <input type="number" value={config.candidateMaxQualifyingTransactions} onChange={(e) => setConfig({ ...config, candidateMaxQualifyingTransactions: parseInt(e.target.value) || 2 })} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400">Employer Job Posting Rules</h3>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Reward Per Qualifying Job Post (₹)</label>
                  <input type="number" value={config.employerJobRewardAmount} onChange={(e) => setConfig({ ...config, employerJobRewardAmount: parseFloat(e.target.value) || 0 })} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Max Qualifying Job Posts Per Company</label>
                  <input type="number" value={config.employerMaxQualifyingTransactions} onChange={(e) => setConfig({ ...config, employerMaxQualifyingTransactions: parseInt(e.target.value) || 2 })} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-400">HireGo Managed Hiring™ Rules</h3>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Fixed Placement Referral Reward (₹)</label>
                  <input type="number" value={config.managedHiringRewardAmount ?? 5000} onChange={(e) => setConfig({ ...config, managedHiringRewardAmount: parseFloat(e.target.value) || 0 })} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Default Replacement Guarantee Lock Period</label>
                  <select value={config.managedHiringDefaultLockDays ?? 90} onChange={(e) => setConfig({ ...config, managedHiringDefaultLockDays: parseInt(e.target.value) || 90 })} className="input-pill w-full h-10 px-3 text-xs text-white bg-[#141418]">
                    <option value={45}>45 Days — Startup SLA</option>
                    <option value={60}>60 Days — Growth SLA</option>
                    <option value={90}>90 Days — Enterprise SLA</option>
                  </select>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Payout & Attribution</h3>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Minimum Withdrawal Threshold (₹)</label>
                  <input type="number" value={config.minPayoutAmount} onChange={(e) => setConfig({ ...config, minPayoutAmount: parseFloat(e.target.value) || 500 })} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Attribution Cookie Window (Days)</label>
                  <input type="number" value={config.attributionWindowDays} onChange={(e) => setConfig({ ...config, attributionWindowDays: parseInt(e.target.value) || 30 })} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── PAYOUTS TAB ── */}
        {activeTab === "PAYOUTS" && (
          <div className="glass-card rounded-3xl border border-white/10 overflow-hidden bg-[#141418]">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-bold text-base text-white">Payout Approval Queue</h3>
              <p className="text-xs text-text-muted mt-1">
                Step 1: Approve request. Step 2: Enter real UTR after bank/UPI transfer. Step 3: Mark Paid.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-text-muted tracking-wider">
                    <th className="px-5 py-4">Payout ID</th>
                    <th className="px-5 py-4">Referrer ID</th>
                    <th className="px-5 py-4">Method & Address</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">UTR / Ref</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-text-muted">
                        No payout requests found.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-mono text-[10px] text-text-muted">{p.id.slice(0, 12)}…</td>
                        <td className="px-5 py-4 font-bold text-white font-mono text-[10px]">{p.referrerId.slice(0, 12)}…</td>
                        <td className="px-5 py-4">
                          <p className="font-mono text-white">{p.payoutAddress}</p>
                          <p className="text-[10px] text-text-muted">{p.payoutMethod}</p>
                        </td>
                        <td className="px-5 py-4 font-bold text-green-400 font-mono">₹{p.amount.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            p.status === "PAID" ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : p.status === "APPROVED" ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : p.status === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {p.status === "PAID" ? (
                            <span className="font-mono text-[10px] text-green-400">{p.transactionRef ?? "—"}</span>
                          ) : p.status === "APPROVED" ? (
                            <input
                              type="text"
                              placeholder="Enter UTR/Ref"
                              value={utrInputs[p.id] ?? ""}
                              onChange={(e) => setUtrInputs((u) => ({ ...u, [p.id]: e.target.value }))}
                              className="input-pill h-8 px-2 text-[11px] text-white font-mono w-28"
                            />
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {payoutActionMsg[p.id] && (
                              <span className={`text-[10px] font-bold mr-1 ${payoutActionMsg[p.id].includes("PAID") || payoutActionMsg[p.id].includes("Approved") ? "text-green-400" : payoutActionMsg[p.id].includes("Reject") ? "text-text-muted" : "text-red-400"}`}>
                                {payoutActionMsg[p.id]}
                              </span>
                            )}
                            {payoutActionLoading[p.id] && (
                              <span className="material-symbols-outlined text-[14px] animate-spin text-text-muted">progress_activity</span>
                            )}
                            {p.status === "PENDING_ADMIN_APPROVAL" && !payoutActionLoading[p.id] && (
                              <>
                                <button onClick={() => handleApprove(p.id)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] font-bold hover:bg-blue-500/30 transition-all">
                                  Approve
                                </button>
                                <button onClick={() => handleReject(p.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500/20 transition-all">
                                  Reject
                                </button>
                              </>
                            )}
                            {p.status === "APPROVED" && !payoutActionLoading[p.id] && (
                              <>
                                <button onClick={() => handleMarkPaid(p.id)} className="btn-3d-gold px-3 py-1.5 rounded-lg text-[10px] font-bold text-black shadow-md">
                                  Mark Paid
                                </button>
                                <button onClick={() => handleReject(p.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500/20 transition-all">
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "ANALYTICS" && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#141418]">
                <p className="text-[10px] uppercase font-bold text-text-muted">Total Attributions</p>
                <p className="text-2xl font-bold text-white font-mono">{analytics.summary.totalAttributions}</p>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-green-500/20 bg-[#141418]">
                <p className="text-[10px] uppercase font-bold text-green-400">Total Rewards Value</p>
                <p className="text-2xl font-bold text-green-400 font-mono">₹{analytics.summary.totalRewardsValue.toLocaleString()}</p>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-yellow-500/20 bg-[#141418]">
                <p className="text-[10px] uppercase font-bold text-yellow-400">Locked Managed Hiring™ Liability</p>
                <p className="text-2xl font-bold text-yellow-400 font-mono">₹{analytics.summary.totalLockedValue.toLocaleString()}</p>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-[#141418]">
                <p className="text-[10px] uppercase font-bold text-blue-400">Pending Payout Liability</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">₹{analytics.summary.pendingPayoutLiability.toLocaleString()}</p>
              </div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#141418] text-xs text-text-muted">
              <p className="font-bold text-white mb-1">Conversion Metrics</p>
              <p>Candidate attributions: {analytics.summary.candidateAttributions ?? "—"}</p>
              <p>Employer attributions: {analytics.summary.employerAttributions ?? "—"}</p>
              <p>Paid out total: ₹{(analytics.summary.totalPaidValue ?? 0).toLocaleString()}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
