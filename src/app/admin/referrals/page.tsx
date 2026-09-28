"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ReferralPayout, ReferralProgramConfig } from "@/types/referral";

type Message = { type: "success" | "error"; text: string } | null;

const MUTABLE_CONFIG_KEYS = [
  "isEnabled",
  "candidateRewardAmount",
  "candidateMaxQualifyingTransactions",
  "employerJobRewardAmount",
  "employerMaxQualifyingTransactions",
  "managedHiringRewardAmount",
  "managedHiringMaxRewards",
  "managedHiringDefaultLockDays",
  "minPayoutAmount",
  "attributionWindowDays",
] as const;

function money(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? `₹${value.toLocaleString()}` : "—";
}

export default function AdminReferralsPage() {
  const [config, setConfig] = useState<ReferralProgramConfig | null>(null);
  const [configLoadError, setConfigLoadError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<Message>(null);
  const [activeTab, setActiveTab] = useState<"CONFIG" | "PAYOUTS" | "ANALYTICS">("CONFIG");
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [payoutActionLoading, setPayoutActionLoading] = useState<Record<string, boolean>>({});
  const [payoutActionMsg, setPayoutActionMsg] = useState<Record<string, string>>({});
  const [pendingRejectPayoutId, setPendingRejectPayoutId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);

    const safeFetch = async (url: string) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, data };
      } catch {
        return { ok: false, data: {} as any };
      }
    };

    const [configResult, payoutsResult, analyticsResult] = await Promise.all([
      safeFetch("/api/admin/referrals/config"),
      safeFetch("/api/admin/referrals/payouts"),
      safeFetch("/api/admin/referrals/analytics"),
    ]);

    if (configResult.ok && configResult.data.success && configResult.data.config) {
      setConfig(configResult.data.config);
      setConfigLoadError(null);
    } else {
      setConfig(null);
      setConfigLoadError(configResult.data.error || "Authoritative referral configuration is unavailable.");
    }

    if (payoutsResult.ok && payoutsResult.data.success && Array.isArray(payoutsResult.data.queue)) {
      setPayouts(payoutsResult.data.queue);
    }
    if (analyticsResult.ok && analyticsResult.data.success && analyticsResult.data.data) {
      setAnalytics(analyticsResult.data.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const setNumberConfig = (key: keyof ReferralProgramConfig, rawValue: string, integer = false) => {
    if (!config || rawValue.trim() === "") return;
    const value = integer ? Number.parseInt(rawValue, 10) : Number(rawValue);
    if (!Number.isFinite(value)) return;
    setConfig((current) => current ? ({ ...current, [key]: value } as ReferralProgramConfig) : current);
  };

  const handleConfigSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config) {
      setSaveMessage({ type: "error", text: "Load authoritative referral configuration before saving." });
      return;
    }

    const payload = Object.fromEntries(
      MUTABLE_CONFIG_KEYS.map((key) => [key, config[key]]),
    );

    setSavingConfig(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/admin/referrals/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.config) {
        throw new Error(data.error || "Failed to save referral configuration.");
      }
      setConfig(data.config);
      setSaveMessage({ type: "success", text: "Referral configuration updated successfully." });
    } catch (error) {
      setSaveMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save referral configuration." });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    setPayoutActionLoading((previous) => ({ ...previous, [payoutId]: true }));
    setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: "" }));
    try {
      const response = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action: "APPROVE" }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: "Approved. Enter UTR to mark as PAID." }));
        await fetchData();
      } else {
        setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: data.error ?? "Approval failed." }));
      }
    } catch {
      setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: "Network error." }));
    } finally {
      setPayoutActionLoading((previous) => ({ ...previous, [payoutId]: false }));
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    const utr = utrInputs[payoutId]?.trim();
    if (!utr) {
      setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: "Enter the UTR / transaction reference first." }));
      return;
    }

    setPayoutActionLoading((previous) => ({ ...previous, [payoutId]: true }));
    setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: "" }));
    try {
      const response = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action: "MARK_PAID", transactionRef: utr }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: `Marked PAID — UTR: ${utr}` }));
        setUtrInputs((current) => {
          const next = { ...current };
          delete next[payoutId];
          return next;
        });
        await fetchData();
      } else {
        setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: data.error ?? "Mark-paid failed." }));
      }
    } catch {
      setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: "Network error." }));
    } finally {
      setPayoutActionLoading((previous) => ({ ...previous, [payoutId]: false }));
    }
  };

  const handleReject = async (payoutId: string) => {
    const reason = rejectionReason.trim();
    if (reason.length < 3) {
      setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: "Enter a specific rejection reason." }));
      return;
    }

    setPayoutActionLoading((previous) => ({ ...previous, [payoutId]: true }));
    try {
      const response = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action: "REJECT", rejectionReason: reason }),
      });
      const data = await response.json().catch(() => ({}));
      setPayoutActionMsg((previous) => ({
        ...previous,
        [payoutId]: response.ok && data.success ? "Rejected." : (data.error ?? "Reject failed."),
      }));
      if (response.ok && data.success) {
        setPendingRejectPayoutId(null);
        setRejectionReason("");
        await fetchData();
      }
    } catch {
      setPayoutActionMsg((previous) => ({ ...previous, [payoutId]: "Network error." }));
    } finally {
      setPayoutActionLoading((previous) => ({ ...previous, [payoutId]: false }));
    }
  };

  const pendingCount = payouts.filter((payout) => payout.status === "PENDING_ADMIN_APPROVAL").length;
  const approvedCount = payouts.filter((payout) => payout.status === "APPROVED").length;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex flex-col">
      <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 lg:px-10 h-20 shadow-md">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">Admin Control Center</span>
          <h1 className="text-xl lg:text-2xl text-white font-bold tracking-tight mt-0.5">Referral Engine & Payout Governance</h1>
        </div>
        <Link href="/admin/dashboard" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/10">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Dashboard
        </Link>
      </header>

      <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-6xl w-full mx-auto overflow-y-auto">
        <div className="flex gap-2 border-b border-white/10 pb-4 flex-wrap">
          {(["CONFIG", "PAYOUTS", "ANALYTICS"] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab ? "bg-primary text-white shadow-lg" : "bg-white/5 text-text-muted hover:text-white"}`}
            >
              {tab === "CONFIG" && "Program Rules & Slabs"}
              {tab === "PAYOUTS" && (
                <>
                  Payout Approval Queue
                  {(pendingCount + approvedCount) > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-400 text-black font-extrabold">{pendingCount + approvedCount}</span>}
                </>
              )}
              {tab === "ANALYTICS" && "Analytics & Fraud"}
            </button>
          ))}
        </div>

        {activeTab === "CONFIG" && loading && <div className="rounded-2xl border border-white/10 bg-[#141418] p-8 text-center text-sm text-text-muted">Loading authoritative referral configuration…</div>}

        {activeTab === "CONFIG" && !loading && !config && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            <p className="font-bold">Referral configuration is unavailable.</p>
            <p className="mt-2 text-sm text-red-200/80">No local reward, lock-period, payout, or attribution fallback can be edited or saved.</p>
            {configLoadError && <p className="mt-2 text-xs">{configLoadError}</p>}
            <button type="button" onClick={() => void fetchData()} className="mt-4 rounded-xl border border-red-300/30 px-4 py-2 text-xs font-bold hover:bg-red-500/10">Retry</button>
          </div>
        )}

        {activeTab === "CONFIG" && config && (
          <form onSubmit={handleConfigSave} className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 bg-[#141418] space-y-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Global Referral Economics & Thresholds</h2>
                <p className="text-xs text-text-muted">All values below come from the persisted referral configuration; this UI does not invent economic defaults.</p>
              </div>
              <button type="submit" disabled={savingConfig} className="btn-3d-gold px-6 py-2 rounded-full text-xs font-bold text-black shadow-lg disabled:opacity-50">
                {savingConfig ? "Saving…" : "Save Configuration"}
              </button>
            </div>

            {saveMessage && <div role={saveMessage.type === "error" ? "alert" : "status"} className={`p-3 rounded-2xl text-xs text-center font-bold border ${saveMessage.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>{saveMessage.text}</div>}

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs">
              <span><span className="block font-bold text-white">Referral program enabled</span><span className="text-text-muted">Disable qualification of new referral rewards without changing persisted economics.</span></span>
              <input type="checkbox" checked={config.isEnabled} onChange={(event) => setConfig({ ...config, isEnabled: event.target.checked })} className="h-4 w-4" />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Candidate Product Rules</h3>
                <label className="space-y-1 block text-xs text-text-muted">Reward Per Qualifying Purchase (₹)
                  <input type="number" min="0" max="10000" value={config.candidateRewardAmount} onChange={(event) => setNumberConfig("candidateRewardAmount", event.target.value)} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </label>
                <label className="space-y-1 block text-xs text-text-muted">Max Qualifying Purchases Per Candidate
                  <input type="number" min="1" max="100" value={config.candidateMaxQualifyingTransactions} onChange={(event) => setNumberConfig("candidateMaxQualifyingTransactions", event.target.value, true)} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </label>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400">Employer Job Posting Rules</h3>
                <label className="space-y-1 block text-xs text-text-muted">Reward Per Qualifying Job Post (₹)
                  <input type="number" min="0" max="50000" value={config.employerJobRewardAmount} onChange={(event) => setNumberConfig("employerJobRewardAmount", event.target.value)} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </label>
                <label className="space-y-1 block text-xs text-text-muted">Max Qualifying Job Posts Per Company
                  <input type="number" min="1" max="100" value={config.employerMaxQualifyingTransactions} onChange={(event) => setNumberConfig("employerMaxQualifyingTransactions", event.target.value, true)} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </label>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-400">HireGo Managed Hiring™ Rules</h3>
                <label className="space-y-1 block text-xs text-text-muted">Fixed Placement Referral Reward (₹)
                  <input type="number" min="0" max="100000" value={config.managedHiringRewardAmount} onChange={(event) => setNumberConfig("managedHiringRewardAmount", event.target.value)} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </label>
                <label className="space-y-1 block text-xs text-text-muted">Maximum Rewards Per Referred Employer
                  <input type="number" min="1" max="10" value={config.managedHiringMaxRewards} onChange={(event) => setNumberConfig("managedHiringMaxRewards", event.target.value, true)} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </label>
                <label className="space-y-1 block text-xs text-text-muted">Replacement Guarantee Lock Period
                  <select value={config.managedHiringDefaultLockDays} onChange={(event) => setNumberConfig("managedHiringDefaultLockDays", event.target.value, true)} className="input-pill w-full h-10 px-3 text-xs text-white bg-[#141418]">
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </label>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Payout & Attribution</h3>
                <label className="space-y-1 block text-xs text-text-muted">Minimum Withdrawal Threshold (₹)
                  <input type="number" min="100" max="100000" value={config.minPayoutAmount} onChange={(event) => setNumberConfig("minPayoutAmount", event.target.value)} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </label>
                <label className="space-y-1 block text-xs text-text-muted">Attribution Window (Days)
                  <input type="number" min="1" max="365" value={config.attributionWindowDays} onChange={(event) => setNumberConfig("attributionWindowDays", event.target.value, true)} className="input-pill w-full h-10 px-3 text-xs text-white font-mono" />
                </label>
              </div>
            </div>
          </form>
        )}

        {activeTab === "PAYOUTS" && (
          <div className="glass-card rounded-3xl border border-white/10 overflow-hidden bg-[#141418]">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-bold text-base text-white">Payout Approval Queue</h3>
              <p className="text-xs text-text-muted mt-1">Step 1: Approve request. Step 2: Enter real UTR after bank/UPI transfer. Step 3: Mark Paid.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 text-[10px] uppercase font-bold text-text-muted tracking-wider"><th className="px-5 py-4">Payout ID</th><th className="px-5 py-4">Referrer ID</th><th className="px-5 py-4">Method & Address</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">UTR / Ref</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {payouts.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-text-muted">No payout requests found.</td></tr>
                  ) : payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-mono text-[10px] text-text-muted">{payout.id.slice(0, 12)}…</td>
                      <td className="px-5 py-4 font-bold text-white font-mono text-[10px]">{payout.referrerId.slice(0, 12)}…</td>
                      <td className="px-5 py-4"><p className="font-mono text-white">{payout.payoutAddress}</p><p className="text-[10px] text-text-muted">{payout.payoutMethod}</p></td>
                      <td className="px-5 py-4 font-bold text-green-400 font-mono">₹{payout.amount.toLocaleString()}</td>
                      <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${payout.status === "PAID" ? "bg-green-500/10 text-green-400 border-green-500/20" : payout.status === "APPROVED" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : payout.status === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>{payout.status}</span></td>
                      <td className="px-5 py-4">
                        {payout.status === "PAID" ? <span className="font-mono text-[10px] text-green-400">{payout.transactionRef ?? "—"}</span> : payout.status === "APPROVED" ? <input type="text" placeholder="Enter UTR/Ref" value={utrInputs[payout.id] ?? ""} onChange={(event) => setUtrInputs((current) => ({ ...current, [payout.id]: event.target.value }))} className="input-pill h-8 px-2 text-[11px] text-white font-mono w-28" /> : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {payoutActionMsg[payout.id] && <span className={`text-[10px] font-bold mr-1 ${payoutActionMsg[payout.id].includes("PAID") || payoutActionMsg[payout.id].includes("Approved") ? "text-green-400" : payoutActionMsg[payout.id].includes("Reject") ? "text-text-muted" : "text-red-400"}`}>{payoutActionMsg[payout.id]}</span>}
                          {payoutActionLoading[payout.id] && <span className="material-symbols-outlined text-[14px] animate-spin text-text-muted">progress_activity</span>}
                          {payout.status === "PENDING_ADMIN_APPROVAL" && !payoutActionLoading[payout.id] && <><button type="button" onClick={() => void handleApprove(payout.id)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] font-bold hover:bg-blue-500/30 transition-all">Approve</button><button type="button" onClick={() => { setPendingRejectPayoutId(payout.id); setRejectionReason(""); }} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500/20 transition-all">Reject</button></>}
                          {payout.status === "APPROVED" && !payoutActionLoading[payout.id] && <><button type="button" onClick={() => void handleMarkPaid(payout.id)} className="btn-3d-gold px-3 py-1.5 rounded-lg text-[10px] font-bold text-black shadow-md">Mark Paid</button><button type="button" onClick={() => { setPendingRejectPayoutId(payout.id); setRejectionReason(""); }} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500/20 transition-all">Reject</button></>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "ANALYTICS" && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#141418]"><p className="text-[10px] uppercase font-bold text-text-muted">Total Attributions</p><p className="text-2xl font-bold text-white font-mono">{analytics.summary.totalAttributions ?? "—"}</p></div>
              <div className="glass-card p-5 rounded-2xl border border-green-500/20 bg-[#141418]"><p className="text-[10px] uppercase font-bold text-green-400">Total Rewards Value</p><p className="text-2xl font-bold text-green-400 font-mono">{money(analytics.summary.totalRewardsValue)}</p></div>
              <div className="glass-card p-5 rounded-2xl border border-yellow-500/20 bg-[#141418]"><p className="text-[10px] uppercase font-bold text-yellow-400">Locked Managed Hiring™ Liability</p><p className="text-2xl font-bold text-yellow-400 font-mono">{money(analytics.summary.totalLockedValue)}</p></div>
              <div className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-[#141418]"><p className="text-[10px] uppercase font-bold text-blue-400">Pending Payout Liability</p><p className="text-2xl font-bold text-blue-400 font-mono">{money(analytics.summary.pendingPayoutLiability)}</p></div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#141418] text-xs text-text-muted"><p className="font-bold text-white mb-1">Conversion Metrics</p><p>Candidate attributions: {analytics.summary.candidateAttributions ?? "—"}</p><p>Employer attributions: {analytics.summary.employerAttributions ?? "—"}</p><p>Paid out total: {money(analytics.summary.totalPaidValue)}</p></div>
          </div>
        )}
      </main>

      {pendingRejectPayoutId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="reject-payout-title" aria-describedby="reject-payout-description" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl">
            <h2 id="reject-payout-title" className="text-lg font-bold text-white">Reject payout request?</h2>
            <p id="reject-payout-description" className="mt-2 text-sm text-text-secondary">Rejecting this request releases the reserved payout balance. Enter the actual reason that should be recorded in the financial workflow.</p>
            <label className="mt-4 block text-xs text-text-muted">Rejection reason
              <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={1000} rows={4} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setPendingRejectPayoutId(null); setRejectionReason(""); }} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5">Cancel</button>
              <button type="button" onClick={() => void handleReject(pendingRejectPayoutId)} disabled={payoutActionLoading[pendingRejectPayoutId] || rejectionReason.trim().length < 3} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50">{payoutActionLoading[pendingRejectPayoutId] ? "Rejecting…" : "Reject payout"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
