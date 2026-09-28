"use client";

import { useCallback, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  FraudStatus,
  type ReferralPayout,
  type ReferralProgramConfig,
  type UserFraudProfile,
} from "@/types/referral";

type Message = { type: "success" | "error"; text: string } | null;
type PayoutStatusFilter = "" | "PENDING_ADMIN_APPROVAL" | "APPROVED" | "PAID" | "REJECTED";

const PAYOUT_PAGE_SIZE = 25;
const FRAUD_PAGE_SIZE = 25;

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

function money(value: unknown, currency = "INR") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminReferralsPage() {
  const [activeTab, setActiveTab] = useState<"CONFIG" | "PAYOUTS" | "ANALYTICS">("CONFIG");

  const [config, setConfig] = useState<ReferralProgramConfig | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [coreLoading, setCoreLoading] = useState(true);
  const [coreError, setCoreError] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<Message>(null);

  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatusFilter>("");
  const [payoutLoading, setPayoutLoading] = useState(true);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutActionLoading, setPayoutActionLoading] = useState<Record<string, boolean>>({});
  const [payoutActionMsg, setPayoutActionMsg] = useState<Record<string, string>>({});
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [approveTarget, setApproveTarget] = useState<ReferralPayout | null>(null);
  const [approvalReason, setApprovalReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<ReferralPayout | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [fraudQueue, setFraudQueue] = useState<UserFraudProfile[]>([]);
  const [fraudPage, setFraudPage] = useState(1);
  const [fraudTotal, setFraudTotal] = useState(0);
  const [fraudStatus, setFraudStatus] = useState<"" | FraudStatus>("");
  const [fraudLoading, setFraudLoading] = useState(true);
  const [fraudError, setFraudError] = useState<string | null>(null);
  const [fraudTarget, setFraudTarget] = useState<{ profile: UserFraudProfile; newStatus: FraudStatus } | null>(null);
  const [fraudReason, setFraudReason] = useState("");
  const [fraudSaving, setFraudSaving] = useState(false);
  const [fraudNotice, setFraudNotice] = useState<Message>(null);

  const loadCore = useCallback(async () => {
    setCoreLoading(true);
    setCoreError(null);
    try {
      const [configResponse, analyticsResponse] = await Promise.all([
        fetch("/api/admin/referrals/config", { cache: "no-store" }),
        fetch("/api/admin/referrals/analytics", { cache: "no-store" }),
      ]);
      const [configPayload, analyticsPayload] = await Promise.all([
        configResponse.json().catch(() => ({})),
        analyticsResponse.json().catch(() => ({})),
      ]);
      if (!configResponse.ok || !configPayload.success || !configPayload.config) {
        throw new Error(configPayload.error || "Authoritative referral configuration is unavailable.");
      }
      if (!analyticsResponse.ok || !analyticsPayload.success || !analyticsPayload.data) {
        throw new Error(analyticsPayload.error || "Referral analytics are unavailable.");
      }
      setConfig(configPayload.config);
      setAnalytics(analyticsPayload.data);
    } catch (error) {
      setConfig(null);
      setAnalytics(null);
      setCoreError(error instanceof Error ? error.message : "Referral administration data is unavailable.");
    } finally {
      setCoreLoading(false);
    }
  }, []);

  const loadPayouts = useCallback(async () => {
    setPayoutLoading(true);
    setPayoutError(null);
    try {
      const params = new URLSearchParams({
        page: String(payoutPage),
        limit: String(PAYOUT_PAGE_SIZE),
      });
      if (payoutStatus) params.set("status", payoutStatus);
      const response = await fetch(`/api/admin/referrals/payouts?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load payout queue.");
      setPayouts(Array.isArray(payload.queue) ? payload.queue : []);
      setPayoutTotal(typeof payload.total === "number" ? payload.total : 0);
    } catch (error) {
      setPayouts([]);
      setPayoutTotal(0);
      setPayoutError(error instanceof Error ? error.message : "Unable to load payout queue.");
    } finally {
      setPayoutLoading(false);
    }
  }, [payoutPage, payoutStatus]);

  const loadFraud = useCallback(async () => {
    setFraudLoading(true);
    setFraudError(null);
    try {
      const params = new URLSearchParams({
        page: String(fraudPage),
        limit: String(FRAUD_PAGE_SIZE),
      });
      if (fraudStatus) params.set("status", fraudStatus);
      const response = await fetch(`/api/admin/referrals/fraud?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load fraud review queue.");
      setFraudQueue(Array.isArray(payload.queue) ? payload.queue : []);
      setFraudTotal(typeof payload.total === "number" ? payload.total : 0);
    } catch (error) {
      setFraudQueue([]);
      setFraudTotal(0);
      setFraudError(error instanceof Error ? error.message : "Unable to load fraud review queue.");
    } finally {
      setFraudLoading(false);
    }
  }, [fraudPage, fraudStatus]);

  useEffect(() => { void loadCore(); }, [loadCore]);
  useEffect(() => { void loadPayouts(); }, [loadPayouts]);
  useEffect(() => { void loadFraud(); }, [loadFraud]);

  const setNumberConfig = (key: keyof ReferralProgramConfig, raw: string, integer = false) => {
    if (!config || raw.trim() === "") return;
    const value = integer ? Number.parseInt(raw, 10) : Number(raw);
    if (!Number.isFinite(value)) return;
    setConfig((current) => current ? ({ ...current, [key]: value } as ReferralProgramConfig) : current);
  };

  async function saveConfig(event: React.FormEvent) {
    event.preventDefault();
    if (!config || savingConfig) return;
    setSavingConfig(true);
    setSaveMessage(null);
    try {
      const body = {
        ...Object.fromEntries(MUTABLE_CONFIG_KEYS.map((key) => [key, config[key]])),
        expectedUpdatedAt: new Date(config.updatedAt).toISOString(),
      };
      const response = await fetch("/api/admin/referrals/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.config) {
        throw new Error(payload.error || "Failed to save referral configuration.");
      }
      setConfig(payload.config);
      setSaveMessage({ type: "success", text: "Referral configuration updated." });
    } catch (error) {
      setSaveMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save referral configuration." });
    } finally {
      setSavingConfig(false);
    }
  }

  async function approvePayout() {
    if (!approveTarget || approvalReason.trim().length < 3) return;
    const payout = approveTarget;
    setPayoutActionLoading((current) => ({ ...current, [payout.id]: true }));
    try {
      const response = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: payout.id,
          action: "APPROVE",
          adminNotes: approvalReason.trim(),
          expectedUpdatedAt: new Date(payout.updatedAt).toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Approval failed.");
      setPayoutActionMsg((current) => ({ ...current, [payout.id]: "Approved. Enter UTR after settlement, then mark paid." }));
      setApproveTarget(null);
      setApprovalReason("");
      await loadPayouts();
    } catch (error) {
      setPayoutActionMsg((current) => ({ ...current, [payout.id]: error instanceof Error ? error.message : "Approval failed." }));
    } finally {
      setPayoutActionLoading((current) => ({ ...current, [payout.id]: false }));
    }
  }

  async function markPaid(payout: ReferralPayout) {
    const transactionRef = utrInputs[payout.id]?.trim();
    if (!transactionRef) {
      setPayoutActionMsg((current) => ({ ...current, [payout.id]: "Enter the settlement UTR / transaction reference first." }));
      return;
    }
    setPayoutActionLoading((current) => ({ ...current, [payout.id]: true }));
    try {
      const response = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: payout.id,
          action: "MARK_PAID",
          transactionRef,
          expectedUpdatedAt: new Date(payout.updatedAt).toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Settlement update failed.");
      setPayoutActionMsg((current) => ({ ...current, [payout.id]: `Marked paid — UTR ${transactionRef}` }));
      setUtrInputs((current) => {
        const next = { ...current };
        delete next[payout.id];
        return next;
      });
      await Promise.all([loadPayouts(), loadCore()]);
    } catch (error) {
      setPayoutActionMsg((current) => ({ ...current, [payout.id]: error instanceof Error ? error.message : "Settlement update failed." }));
    } finally {
      setPayoutActionLoading((current) => ({ ...current, [payout.id]: false }));
    }
  }

  async function rejectPayout() {
    if (!rejectTarget || rejectionReason.trim().length < 3) return;
    const payout = rejectTarget;
    setPayoutActionLoading((current) => ({ ...current, [payout.id]: true }));
    try {
      const response = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: payout.id,
          action: "REJECT",
          rejectionReason: rejectionReason.trim(),
          expectedUpdatedAt: new Date(payout.updatedAt).toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Rejection failed.");
      setPayoutActionMsg((current) => ({ ...current, [payout.id]: "Rejected and reserved liability released." }));
      setRejectTarget(null);
      setRejectionReason("");
      await Promise.all([loadPayouts(), loadCore()]);
    } catch (error) {
      setPayoutActionMsg((current) => ({ ...current, [payout.id]: error instanceof Error ? error.message : "Rejection failed." }));
    } finally {
      setPayoutActionLoading((current) => ({ ...current, [payout.id]: false }));
    }
  }

  async function applyFraudReview() {
    if (!fraudTarget || fraudReason.trim().length < 3 || fraudSaving) return;
    setFraudSaving(true);
    setFraudNotice(null);
    try {
      const response = await fetch("/api/admin/referrals/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: fraudTarget.profile.userId,
          newStatus: fraudTarget.newStatus,
          reason: fraudReason.trim(),
          expectedLastEvaluatedAt: new Date(fraudTarget.profile.lastEvaluatedAt).toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Fraud review update failed.");
      setFraudNotice({ type: "success", text: `Fraud status updated to ${fraudTarget.newStatus}.` });
      setFraudTarget(null);
      setFraudReason("");
      await loadFraud();
    } catch (error) {
      setFraudNotice({ type: "error", text: error instanceof Error ? error.message : "Fraud review update failed." });
    } finally {
      setFraudSaving(false);
    }
  }

  const payoutPages = Math.max(1, Math.ceil(payoutTotal / PAYOUT_PAGE_SIZE));
  const fraudPages = Math.max(1, Math.ceil(fraudTotal / FRAUD_PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Referral & Payout Governance"
          subtitle="Persisted referral economics, financial payout review and durable fraud controls."
        />

        <main className="mx-auto max-w-7xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24">
          <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-4" aria-label="Referral administration sections">
            {([
              ["CONFIG", "Program rules"],
              ["PAYOUTS", "Payout governance"],
              ["ANALYTICS", "Analytics & fraud"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-xl px-4 py-2 text-xs font-bold ${activeTab === key ? "bg-primary text-white" : "border border-white/10 bg-white/5 text-slate-300"}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {activeTab === "CONFIG" && (
            coreLoading ? (
              <div role="status" className="rounded-2xl border border-white/10 bg-[#141418] p-8 text-sm text-slate-400">Loading authoritative referral configuration…</div>
            ) : coreError || !config ? (
              <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
                {coreError || "Referral configuration is unavailable."}
              </div>
            ) : (
              <form onSubmit={saveConfig} className="space-y-5 rounded-3xl border border-white/10 bg-[#141418] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-bold">Authoritative referral economics</h2>
                    <p className="mt-1 text-xs text-slate-400">Managed Hiring fields are canonical; legacy PPH fields are compatibility fallback only.</p>
                  </div>
                  <button disabled={savingConfig} className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold disabled:opacity-40">
                    {savingConfig ? "Saving…" : "Save configuration"}
                  </button>
                </div>

                {saveMessage && (
                  <div role={saveMessage.type === "error" ? "alert" : "status"} className={`rounded-xl border p-3 text-xs ${saveMessage.type === "error" ? "border-red-400/20 bg-red-500/10 text-red-200" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"}`}>
                    {saveMessage.text}
                  </div>
                )}

                <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs">
                  <span><strong className="block text-white">Referral program enabled</strong><span className="text-slate-400">Controls qualification of new referral rewards.</span></span>
                  <input type="checkbox" checked={config.isEnabled} onChange={(event) => setConfig({ ...config, isEnabled: event.target.checked })} />
                </label>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["candidateRewardAmount", "Candidate reward", false, 0, 10000],
                    ["candidateMaxQualifyingTransactions", "Candidate qualifying purchases", true, 1, 100],
                    ["employerJobRewardAmount", "Employer job reward", false, 0, 50000],
                    ["employerMaxQualifyingTransactions", "Employer qualifying transactions", true, 1, 100],
                    ["managedHiringRewardAmount", "Managed Hiring reward", false, 0, 100000],
                    ["managedHiringMaxRewards", "Managed Hiring max rewards", true, 1, 10],
                    ["minPayoutAmount", "Minimum payout", false, 100, 100000],
                    ["attributionWindowDays", "Attribution window days", true, 1, 365],
                  ].map(([key, label, integer, min, max]) => (
                    <label key={String(key)} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
                      {label}
                      <input
                        type="number"
                        min={Number(min)}
                        max={Number(max)}
                        value={String(config[key as keyof ReferralProgramConfig] ?? "")}
                        onChange={(event) => setNumberConfig(key as keyof ReferralProgramConfig, event.target.value, Boolean(integer))}
                        className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-white"
                      />
                    </label>
                  ))}
                  <label className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
                    Managed Hiring warranty lock
                    <select
                      value={config.managedHiringDefaultLockDays}
                      onChange={(event) => setNumberConfig("managedHiringDefaultLockDays", event.target.value, true)}
                      className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#141418] px-3 text-white"
                    >
                      <option value={45}>45 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </label>
                </div>
              </form>
            )
          )}

          {activeTab === "PAYOUTS" && (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#141418]" aria-labelledby="payout-heading">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="payout-heading" className="font-bold">Payout governance</h2>
                  <p className="mt-1 text-xs text-slate-400">Approve with rationale → settle externally → record the real UTR/reference → mark paid.</p>
                </div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Status
                  <select
                    value={payoutStatus}
                    onChange={(event) => { setPayoutPage(1); setPayoutStatus(event.target.value as PayoutStatusFilter); }}
                    className="mt-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs normal-case text-white"
                  >
                    <option value="">All</option>
                    <option value="PENDING_ADMIN_APPROVAL">Pending approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </label>
              </div>

              {payoutLoading ? (
                <div role="status" className="p-8 text-sm text-slate-400">Loading payout records…</div>
              ) : payoutError ? (
                <div role="alert" className="p-8 text-sm text-red-300">{payoutError}</div>
              ) : payouts.length === 0 ? (
                <div className="p-8 text-sm text-slate-400">No payout records match this filter.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-xs">
                    <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                      <tr><th className="p-4">Payout</th><th className="p-4">Referrer</th><th className="p-4">Destination</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Settlement</th><th className="p-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {payouts.map((payout) => (
                        <tr key={payout.id}>
                          <td className="p-4 font-mono text-[10px]">{payout.id}</td>
                          <td className="p-4 font-mono text-[10px]">{payout.referrerId}</td>
                          <td className="p-4"><strong>{payout.payoutMethod}</strong><div className="mt-1 font-mono text-[10px] text-slate-400">{payout.payoutAddress}</div></td>
                          <td className="p-4 font-bold">{money(payout.amount, payout.currency)}</td>
                          <td className="p-4">{payout.status}</td>
                          <td className="p-4">
                            {payout.status === "APPROVED" ? (
                              <input
                                value={utrInputs[payout.id] || ""}
                                onChange={(event) => setUtrInputs((current) => ({ ...current, [payout.id]: event.target.value }))}
                                maxLength={200}
                                placeholder="UTR / transaction ref"
                                className="h-9 w-40 rounded-lg border border-white/10 bg-black/20 px-2 font-mono text-[11px] text-white"
                              />
                            ) : payout.transactionRef || "—"}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {payout.status === "PENDING_ADMIN_APPROVAL" && (
                                <button type="button" onClick={() => { setApprovalReason(""); setApproveTarget(payout); }} className="rounded-lg border border-blue-400/20 px-3 py-1.5 text-blue-300">Approve</button>
                              )}
                              {payout.status === "APPROVED" && (
                                <button type="button" onClick={() => void markPaid(payout)} disabled={payoutActionLoading[payout.id]} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold disabled:opacity-40">Mark paid</button>
                              )}
                              {(payout.status === "PENDING_ADMIN_APPROVAL" || payout.status === "APPROVED") && (
                                <button type="button" onClick={() => { setRejectionReason(""); setRejectTarget(payout); }} className="rounded-lg border border-red-400/20 px-3 py-1.5 text-red-300">Reject</button>
                              )}
                            </div>
                            {payoutActionMsg[payout.id] && <p className="mt-2 max-w-sm text-[10px] text-slate-400">{payoutActionMsg[payout.id]}</p>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {payoutTotal > PAYOUT_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t border-white/10 p-4">
                  <button type="button" disabled={payoutPage <= 1} onClick={() => setPayoutPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-white/10 px-4 py-2 text-xs disabled:opacity-40">Previous</button>
                  <span className="text-xs text-slate-400">Page {payoutPage} of {payoutPages} · {payoutTotal} records</span>
                  <button type="button" disabled={payoutPage >= payoutPages} onClick={() => setPayoutPage((value) => Math.min(payoutPages, value + 1))} className="rounded-lg border border-white/10 px-4 py-2 text-xs disabled:opacity-40">Next</button>
                </div>
              )}
            </section>
          )}

          {activeTab === "ANALYTICS" && (
            <div className="space-y-6">
              {coreError ? (
                <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{coreError}</div>
              ) : analytics ? (
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Referral analytics">
                  <div className="rounded-2xl border border-white/10 bg-[#141418] p-5"><p className="text-[10px] uppercase text-slate-500">Attributions</p><p className="mt-2 text-2xl font-bold">{analytics.summary.totalAttributions}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-[#141418] p-5"><p className="text-[10px] uppercase text-slate-500">Reward value</p><p className="mt-2 text-2xl font-bold">{money(analytics.summary.totalRewardsValue)}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-[#141418] p-5"><p className="text-[10px] uppercase text-slate-500">Locked liability</p><p className="mt-2 text-2xl font-bold">{money(analytics.summary.totalLockedValue)}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-[#141418] p-5"><p className="text-[10px] uppercase text-slate-500">Pending payout liability</p><p className="mt-2 text-2xl font-bold">{money(analytics.summary.pendingPayoutLiability)}</p></div>
                </section>
              ) : null}

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#141418]" aria-labelledby="fraud-heading">
                <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 id="fraud-heading" className="font-bold">Persisted fraud review queue</h2>
                    <p className="mt-1 text-xs text-slate-400">Risk scores/factors are persisted evidence. Status changes require a human reason and are audited.</p>
                  </div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500">
                    Status
                    <select
                      value={fraudStatus}
                      onChange={(event) => { setFraudPage(1); setFraudStatus(event.target.value as "" | FraudStatus); }}
                      className="mt-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs normal-case text-white"
                    >
                      <option value="">Review queue</option>
                      <option value={FraudStatus.FLAGGED}>Flagged</option>
                      <option value={FraudStatus.FRAUD_HOLD}>Fraud hold</option>
                      <option value={FraudStatus.ADMIN_REVIEW}>Admin review</option>
                      <option value={FraudStatus.NORMAL}>Normal</option>
                    </select>
                  </label>
                </div>

                {fraudNotice && <div role={fraudNotice.type === "error" ? "alert" : "status"} className={`m-4 rounded-xl border p-3 text-xs ${fraudNotice.type === "error" ? "border-red-400/20 bg-red-500/10 text-red-200" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"}`}>{fraudNotice.text}</div>}

                {fraudLoading ? (
                  <div role="status" className="p-8 text-sm text-slate-400">Loading persisted fraud profiles…</div>
                ) : fraudError ? (
                  <div role="alert" className="p-8 text-sm text-red-300">{fraudError}</div>
                ) : fraudQueue.length === 0 ? (
                  <div className="p-8 text-sm text-slate-400">No persisted fraud profiles match this filter.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {fraudQueue.map((profile) => (
                      <article key={profile.userId} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold">{profile.userId}</span>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px]">{profile.status.replaceAll("_", " ")}</span>
                            <span className="text-xs text-slate-400">Risk {profile.riskScore}/100</span>
                          </div>
                          <p className="mt-2 text-[11px] text-slate-500">Last evaluated {new Date(profile.lastEvaluatedAt).toLocaleString()}</p>
                          <p className="mt-2 text-xs text-slate-400">{profile.riskFactors.length ? profile.riskFactors.join(" · ") : "No persisted risk factors recorded."}</p>
                          {profile.history[0] && <p className="mt-2 text-[11px] text-slate-500">Latest review: {profile.history[0].previousStatus} → {profile.history[0].newStatus} · {profile.history[0].reason}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {profile.status !== FraudStatus.FRAUD_HOLD && <button type="button" onClick={() => { setFraudReason(""); setFraudTarget({ profile, newStatus: FraudStatus.FRAUD_HOLD }); }} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300">Place hold</button>}
                          {profile.status !== FraudStatus.ADMIN_REVIEW && <button type="button" onClick={() => { setFraudReason(""); setFraudTarget({ profile, newStatus: FraudStatus.ADMIN_REVIEW }); }} className="rounded-lg border border-amber-400/20 px-3 py-2 text-xs text-amber-300">Admin review</button>}
                          {profile.status !== FraudStatus.NORMAL && <button type="button" onClick={() => { setFraudReason(""); setFraudTarget({ profile, newStatus: FraudStatus.NORMAL }); }} className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs text-emerald-300">Clear to normal</button>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {fraudTotal > FRAUD_PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t border-white/10 p-4">
                    <button type="button" disabled={fraudPage <= 1} onClick={() => setFraudPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-white/10 px-4 py-2 text-xs disabled:opacity-40">Previous</button>
                    <span className="text-xs text-slate-400">Page {fraudPage} of {fraudPages} · {fraudTotal} profiles</span>
                    <button type="button" disabled={fraudPage >= fraudPages} onClick={() => setFraudPage((value) => Math.min(fraudPages, value + 1))} className="rounded-lg border border-white/10 px-4 py-2 text-xs disabled:opacity-40">Next</button>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {approveTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="approve-payout-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6">
            <h2 id="approve-payout-title" className="text-lg font-bold">Approve payout?</h2>
            <p className="mt-2 text-sm text-slate-400">{money(approveTarget.amount, approveTarget.currency)} for {approveTarget.referrerId}. This authorizes processing, not settlement.</p>
            <label className="mt-4 block text-xs text-slate-400">Approval rationale
              <textarea value={approvalReason} onChange={(event) => setApprovalReason(event.target.value)} maxLength={1000} rows={4} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setApproveTarget(null); setApprovalReason(""); }} className="rounded-lg border border-white/10 px-4 py-2 text-xs">Cancel</button>
              <button type="button" disabled={approvalReason.trim().length < 3 || payoutActionLoading[approveTarget.id]} onClick={() => void approvePayout()} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold disabled:opacity-40">Approve</button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="reject-payout-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6">
            <h2 id="reject-payout-title" className="text-lg font-bold">Reject payout?</h2>
            <p className="mt-2 text-sm text-slate-400">Rejection releases the reserved liability. Record the actual financial review reason.</p>
            <label className="mt-4 block text-xs text-slate-400">Rejection reason
              <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={1000} rows={4} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setRejectTarget(null); setRejectionReason(""); }} className="rounded-lg border border-white/10 px-4 py-2 text-xs">Cancel</button>
              <button type="button" disabled={rejectionReason.trim().length < 3 || payoutActionLoading[rejectTarget.id]} onClick={() => void rejectPayout()} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold disabled:opacity-40">Reject payout</button>
            </div>
          </div>
        </div>
      )}

      {fraudTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="fraud-review-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6">
            <h2 id="fraud-review-title" className="text-lg font-bold">Update fraud status?</h2>
            <p className="mt-2 text-sm text-slate-400">{fraudTarget.profile.userId}: {fraudTarget.profile.status} → {fraudTarget.newStatus}. This decision is persisted and audited.</p>
            <label className="mt-4 block text-xs text-slate-400">Review reason
              <textarea value={fraudReason} onChange={(event) => setFraudReason(event.target.value)} maxLength={1000} rows={4} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setFraudTarget(null); setFraudReason(""); }} disabled={fraudSaving} className="rounded-lg border border-white/10 px-4 py-2 text-xs disabled:opacity-40">Cancel</button>
              <button type="button" onClick={() => void applyFraudReview()} disabled={fraudSaving || fraudReason.trim().length < 3} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold disabled:opacity-40">{fraudSaving ? "Saving…" : "Confirm review"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
