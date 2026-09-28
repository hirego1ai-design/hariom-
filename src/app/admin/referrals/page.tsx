"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  FraudStatus,
  type ReferralPayout,
  type ReferralProgramConfig,
  type UserFraudProfile,
} from "@/types/referral";

type Message = { type: "success" | "error"; text: string } | null;
type Tab = "CONFIG" | "PAYOUTS" | "FRAUD" | "ANALYTICS";
type PayoutAction = "APPROVE" | "MARK_PAID" | "REJECT";

type AnalyticsData = {
  summary: {
    totalAttributions: number;
    candidateAttributions: number;
    employerAttributions: number;
    totalRewardsValue: number;
    totalEligibleValue: number;
    totalLockedValue: number;
    totalPaidValue: number;
    pendingPayoutLiability: number;
    currency: string;
  };
  conversionMetrics: {
    leadToRegisterRate: string;
    registerToQualifyingRate: string;
    pphWarrantyRetentionRate: string;
  };
};

const PAGE_SIZE = 25;

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

const payoutStatuses = [
  "PENDING_ADMIN_APPROVAL",
  "APPROVED",
  "PAID",
  "REJECTED",
] as const;

function money(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `₹${value.toLocaleString("en-IN")}`
    : "—";
}

function iso(value: Date | string): string {
  return new Date(value).toISOString();
}

export default function AdminReferralsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("CONFIG");

  const [config, setConfig] = useState<ReferralProgramConfig | null>(null);
  const [configReason, setConfigReason] = useState("");
  const [configLoadError, setConfigLoadError] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<Message>(null);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [coreLoading, setCoreLoading] = useState(true);

  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutStatus, setPayoutStatus] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutNotice, setPayoutNotice] = useState("");
  const [payoutTarget, setPayoutTarget] = useState<{
    payout: ReferralPayout;
    action: PayoutAction;
  } | null>(null);
  const [payoutActionInput, setPayoutActionInput] = useState("");
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);

  const [fraudQueue, setFraudQueue] = useState<UserFraudProfile[]>([]);
  const [fraudTotal, setFraudTotal] = useState(0);
  const [fraudPage, setFraudPage] = useState(1);
  const [fraudStatus, setFraudStatus] = useState("");
  const [fraudLoading, setFraudLoading] = useState(false);
  const [fraudError, setFraudError] = useState("");
  const [fraudNotice, setFraudNotice] = useState("");
  const [fraudTarget, setFraudTarget] = useState<UserFraudProfile | null>(null);
  const [fraudNextStatus, setFraudNextStatus] = useState<FraudStatus>(FraudStatus.NORMAL);
  const [fraudReason, setFraudReason] = useState("");
  const [fraudSaving, setFraudSaving] = useState(false);

  const payoutTotalPages = Math.max(1, Math.ceil(payoutTotal / PAGE_SIZE));
  const fraudTotalPages = Math.max(1, Math.ceil(fraudTotal / PAGE_SIZE));

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/referrals/config", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.config) {
        throw new Error(payload.error || "Authoritative referral configuration is unavailable.");
      }
      setConfig(payload.config);
      setConfigLoadError(null);
    } catch (cause) {
      setConfig(null);
      setConfigLoadError(
        cause instanceof Error
          ? cause.message
          : "Authoritative referral configuration is unavailable.",
      );
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsError("");
    try {
      const response = await fetch("/api/admin/referrals/analytics", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Referral analytics are unavailable.");
      }
      setAnalytics(payload.data);
    } catch (cause) {
      setAnalytics(null);
      setAnalyticsError(
        cause instanceof Error ? cause.message : "Referral analytics are unavailable.",
      );
    }
  }, []);

  const loadPayouts = useCallback(async (page: number, status: string) => {
    setPayoutLoading(true);
    setPayoutError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (status) params.set("status", status);

      const response = await fetch(
        `/api/admin/referrals/payouts?${params.toString()}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.queue)) {
        throw new Error(payload.error || "Payout queue is unavailable.");
      }

      setPayouts(payload.queue);
      setPayoutTotal(typeof payload.total === "number" ? payload.total : 0);
      setPayoutPage(typeof payload.page === "number" ? payload.page : page);
    } catch (cause) {
      setPayouts([]);
      setPayoutTotal(0);
      setPayoutError(cause instanceof Error ? cause.message : "Payout queue is unavailable.");
    } finally {
      setPayoutLoading(false);
    }
  }, []);

  const loadFraud = useCallback(async (page: number, status: string) => {
    setFraudLoading(true);
    setFraudError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (status) params.set("status", status);

      const response = await fetch(
        `/api/admin/referrals/fraud?${params.toString()}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.queue)) {
        throw new Error(payload.error || "Fraud review queue is unavailable.");
      }

      setFraudQueue(payload.queue);
      setFraudTotal(typeof payload.total === "number" ? payload.total : 0);
      setFraudPage(typeof payload.page === "number" ? payload.page : page);
    } catch (cause) {
      setFraudQueue([]);
      setFraudTotal(0);
      setFraudError(
        cause instanceof Error ? cause.message : "Fraud review queue is unavailable.",
      );
    } finally {
      setFraudLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setCoreLoading(true);
    void Promise.all([loadConfig(), loadAnalytics(), loadPayouts(1, "")]).finally(() => {
      if (mounted) setCoreLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadAnalytics, loadConfig, loadPayouts]);

  useEffect(() => {
    if (activeTab === "FRAUD" && fraudQueue.length === 0 && !fraudLoading && !fraudError) {
      void loadFraud(1, fraudStatus);
    }
  }, [activeTab, fraudError, fraudLoading, fraudQueue.length, fraudStatus, loadFraud]);

  const setNumberConfig = (
    key: keyof ReferralProgramConfig,
    rawValue: string,
    integer = false,
  ) => {
    if (!config || rawValue.trim() === "") return;
    const value = integer ? Number.parseInt(rawValue, 10) : Number(rawValue);
    if (!Number.isFinite(value)) return;
    setConfig((current) =>
      current ? ({ ...current, [key]: value } as ReferralProgramConfig) : current,
    );
  };

  async function handleConfigSave(event: React.FormEvent) {
    event.preventDefault();
    if (!config || configReason.trim().length < 3) {
      setSaveMessage({
        type: "error",
        text: "Enter a specific reason before changing referral economics.",
      });
      return;
    }

    const payload = {
      ...Object.fromEntries(MUTABLE_CONFIG_KEYS.map((key) => [key, config[key]])),
      reason: configReason.trim(),
      expectedUpdatedAt: iso(config.updatedAt),
    };

    setSavingConfig(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/admin/referrals/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.config) {
        throw new Error(result.error || "Failed to save referral configuration.");
      }
      setConfig(result.config);
      setConfigReason("");
      setSaveMessage({
        type: "success",
        text: "Referral configuration updated and audited.",
      });
    } catch (cause) {
      setSaveMessage({
        type: "error",
        text: cause instanceof Error ? cause.message : "Failed to save referral configuration.",
      });
    } finally {
      setSavingConfig(false);
    }
  }

  function openPayoutAction(payout: ReferralPayout, action: PayoutAction) {
    setPayoutNotice("");
    setPayoutError("");
    setPayoutActionInput("");
    setPayoutTarget({ payout, action });
  }

  async function submitPayoutAction() {
    if (!payoutTarget || payoutActionLoading || payoutActionInput.trim().length < 3) return;

    const { payout, action } = payoutTarget;
    setPayoutActionLoading(true);
    setPayoutError("");
    setPayoutNotice("");

    try {
      const body: Record<string, unknown> = {
        payoutId: payout.id,
        action,
        expectedUpdatedAt: iso(payout.updatedAt),
      };
      if (action === "APPROVE") body.adminNotes = payoutActionInput.trim();
      if (action === "MARK_PAID") body.transactionRef = payoutActionInput.trim();
      if (action === "REJECT") body.rejectionReason = payoutActionInput.trim();

      const response = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Payout action failed.");
      }

      setPayoutNotice(
        action === "APPROVE"
          ? "Payout approved for processing. No transfer is performed by this action."
          : action === "MARK_PAID"
            ? "Payout recorded as paid with the supplied settlement reference."
            : "Payout rejected and reserved liability released.",
      );
      setPayoutTarget(null);
      setPayoutActionInput("");
      await Promise.all([
        loadPayouts(payoutPage, payoutStatus),
        loadAnalytics(),
      ]);
    } catch (cause) {
      setPayoutError(cause instanceof Error ? cause.message : "Payout action failed.");
    } finally {
      setPayoutActionLoading(false);
    }
  }

  function openFraudReview(profile: UserFraudProfile) {
    setFraudError("");
    setFraudNotice("");
    setFraudTarget(profile);
    setFraudNextStatus(profile.status);
    setFraudReason("");
  }

  async function submitFraudReview() {
    if (
      !fraudTarget ||
      !fraudTarget.updatedAt ||
      fraudSaving ||
      fraudReason.trim().length < 3 ||
      fraudNextStatus === fraudTarget.status
    ) {
      return;
    }

    setFraudSaving(true);
    setFraudError("");
    setFraudNotice("");
    try {
      const response = await fetch("/api/admin/referrals/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: fraudTarget.userId,
          newStatus: fraudNextStatus,
          reason: fraudReason.trim(),
          expectedUpdatedAt: fraudTarget.updatedAt,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Fraud review update failed.");
      }

      setFraudNotice(
        `Fraud review state updated to ${fraudNextStatus.replaceAll("_", " ")} and audited.`,
      );
      setFraudTarget(null);
      setFraudReason("");
      await loadFraud(fraudPage, fraudStatus);
    } catch (cause) {
      setFraudError(cause instanceof Error ? cause.message : "Fraud review update failed.");
    } finally {
      setFraudSaving(false);
    }
  }

  const tabCounts = useMemo(
    () => ({
      PAYOUTS: payoutTotal,
      FRAUD: fraudTotal,
    }),
    [fraudTotal, payoutTotal],
  );

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Referral Governance"
          subtitle="Referral economics, payout review, fraud controls and financial evidence"
        />

        <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Referral Engine & Payout Governance
            </h1>
            <p className="max-w-4xl text-sm text-text-muted">
              Admin changes are version-checked and audited. Payout approval does not move money;
              mark-paid records a settlement only after an external bank/UPI transfer has actually completed.
            </p>
          </header>

          <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-4" aria-label="Referral governance sections">
            {(["CONFIG", "PAYOUTS", "FRAUD", "ANALYTICS"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-current={activeTab === tab ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "bg-white/5 text-text-muted hover:text-white"
                }`}
              >
                {tab === "CONFIG" && "Program rules"}
                {tab === "PAYOUTS" && `Payouts${tabCounts.PAYOUTS ? ` · ${tabCounts.PAYOUTS}` : ""}`}
                {tab === "FRAUD" && `Fraud review${tabCounts.FRAUD ? ` · ${tabCounts.FRAUD}` : ""}`}
                {tab === "ANALYTICS" && "Analytics"}
              </button>
            ))}
          </nav>

          {coreLoading && activeTab === "CONFIG" && (
            <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-[#141418] p-8 text-sm text-text-muted">
              Loading authoritative referral configuration…
            </div>
          )}

          {activeTab === "CONFIG" && !coreLoading && !config && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              <h2 className="font-bold">Referral configuration is unavailable.</h2>
              <p className="mt-2 text-sm text-red-200/80">
                No local reward, lock-period, payout, or attribution defaults are shown as authoritative.
              </p>
              {configLoadError && <p className="mt-2 text-xs">{configLoadError}</p>}
              <button
                type="button"
                onClick={() => void loadConfig()}
                className="mt-4 rounded-xl border border-red-300/30 px-4 py-2 text-xs font-bold"
              >
                Retry
              </button>
            </section>
          )}

          {activeTab === "CONFIG" && config && (
            <form
              onSubmit={handleConfigSave}
              className="space-y-6 rounded-3xl border border-white/10 bg-[#141418] p-5 sm:p-6 lg:p-8"
            >
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Referral economics & thresholds</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Persisted database values only. A change reason is required for the audit trail.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingConfig || configReason.trim().length < 3}
                  className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black disabled:opacity-40"
                >
                  {savingConfig ? "Saving…" : "Save audited changes"}
                </button>
              </div>

              {saveMessage && (
                <div
                  role={saveMessage.type === "error" ? "alert" : "status"}
                  aria-live="polite"
                  className={`rounded-xl border p-3 text-sm ${
                    saveMessage.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-200"
                  }`}
                >
                  {saveMessage.text}
                </div>
              )}

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs">
                <span>
                  <span className="block font-bold text-white">Referral program enabled</span>
                  <span className="text-text-muted">
                    Disabling stops qualification of new referral rewards without deleting existing liabilities.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(event) => setConfig({ ...config, isEnabled: event.target.checked })}
                  className="h-4 w-4"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <section className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Candidate products
                  </h3>
                  <label className="block text-xs text-text-muted">
                    Reward per qualifying purchase (₹)
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={config.candidateRewardAmount}
                      onChange={(event) => setNumberConfig("candidateRewardAmount", event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                    />
                  </label>
                  <label className="block text-xs text-text-muted">
                    Maximum qualifying purchases per referred candidate
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.candidateMaxQualifyingTransactions}
                      onChange={(event) =>
                        setNumberConfig("candidateMaxQualifyingTransactions", event.target.value, true)
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                    />
                  </label>
                </section>

                <section className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Employer job products
                  </h3>
                  <label className="block text-xs text-text-muted">
                    Reward per qualifying job transaction (₹)
                    <input
                      type="number"
                      min="0"
                      max="50000"
                      value={config.employerJobRewardAmount}
                      onChange={(event) => setNumberConfig("employerJobRewardAmount", event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                    />
                  </label>
                  <label className="block text-xs text-text-muted">
                    Maximum qualifying transactions per referred employer
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.employerMaxQualifyingTransactions}
                      onChange={(event) =>
                        setNumberConfig("employerMaxQualifyingTransactions", event.target.value, true)
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                    />
                  </label>
                </section>

                <section className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Managed Hiring
                  </h3>
                  <label className="block text-xs text-text-muted">
                    Fixed placement referral reward (₹)
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      value={config.managedHiringRewardAmount}
                      onChange={(event) => setNumberConfig("managedHiringRewardAmount", event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                    />
                  </label>
                  <label className="block text-xs text-text-muted">
                    Maximum rewards per referred employer
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.managedHiringMaxRewards}
                      onChange={(event) =>
                        setNumberConfig("managedHiringMaxRewards", event.target.value, true)
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                    />
                  </label>
                  <label className="block text-xs text-text-muted">
                    Replacement guarantee lock period
                    <select
                      value={config.managedHiringDefaultLockDays}
                      onChange={(event) =>
                        setNumberConfig("managedHiringDefaultLockDays", event.target.value, true)
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-[#17171b] px-3 text-white"
                    >
                      <option value={45}>45 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </label>
                </section>

                <section className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                    Payout & attribution
                  </h3>
                  <label className="block text-xs text-text-muted">
                    Minimum withdrawal threshold (₹)
                    <input
                      type="number"
                      min="100"
                      max="100000"
                      value={config.minPayoutAmount}
                      onChange={(event) => setNumberConfig("minPayoutAmount", event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                    />
                  </label>
                  <label className="block text-xs text-text-muted">
                    Attribution window (days)
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={config.attributionWindowDays}
                      onChange={(event) =>
                        setNumberConfig("attributionWindowDays", event.target.value, true)
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                    />
                  </label>
                </section>
              </div>

              <label className="block text-xs text-text-muted">
                Change reason
                <textarea
                  value={configReason}
                  onChange={(event) => setConfigReason(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Why are these referral economics or thresholds changing?"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
                />
              </label>
            </form>
          )}

          {activeTab === "PAYOUTS" && (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#141418]">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-bold text-white">Payout approval queue</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    {payoutTotal} matching request{payoutTotal === 1 ? "" : "s"}. Approval reserves governance state only; it does not initiate a bank/UPI transfer.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    aria-label="Payout status"
                    value={payoutStatus}
                    onChange={(event) => setPayoutStatus(event.target.value)}
                    className="rounded-lg border border-white/10 bg-[#17171b] px-3 py-2 text-xs text-white"
                  >
                    <option value="">All statuses</option>
                    {payoutStatuses.map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void loadPayouts(1, payoutStatus)}
                    disabled={payoutLoading}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {payoutError && (
                <div role="alert" className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {payoutError}
                </div>
              )}
              {payoutNotice && (
                <div role="status" aria-live="polite" className="m-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  {payoutNotice}
                </div>
              )}
              {payoutLoading && (
                <div role="status" className="p-8 text-center text-sm text-text-muted">
                  Loading payout evidence…
                </div>
              )}

              {!payoutLoading && !payoutError && (
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full text-left text-xs">
                    <thead className="bg-white/[0.03] text-text-muted">
                      <tr>
                        <th className="px-5 py-4">Payout</th>
                        <th className="px-5 py-4">Referrer</th>
                        <th className="px-5 py-4">Method & destination</th>
                        <th className="px-5 py-4">Amount</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Settlement ref</th>
                        <th className="px-5 py-4 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-text-muted">
                            No payout requests match the current filter.
                          </td>
                        </tr>
                      ) : payouts.map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-5 py-4 font-mono text-[10px] text-text-muted">
                            {payout.id}
                          </td>
                          <td className="px-5 py-4 font-mono text-[10px] text-white">
                            {payout.referrerId}
                          </td>
                          <td className="px-5 py-4">
                            <p className="break-all font-mono text-white">{payout.payoutAddress}</p>
                            <p className="mt-1 text-[10px] text-text-muted">{payout.payoutMethod}</p>
                          </td>
                          <td className="px-5 py-4 font-bold text-emerald-300">{money(payout.amount)}</td>
                          <td className="px-5 py-4">{payout.status.replaceAll("_", " ")}</td>
                          <td className="px-5 py-4 font-mono text-[10px] text-text-secondary">
                            {payout.transactionRef || "Not recorded"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {payout.status === "PENDING_ADMIN_APPROVAL" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openPayoutAction(payout, "APPROVE")}
                                    className="rounded-lg border border-sky-500/30 px-3 py-1.5 font-bold text-sky-300"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openPayoutAction(payout, "REJECT")}
                                    className="rounded-lg border border-red-500/30 px-3 py-1.5 font-bold text-red-300"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {payout.status === "APPROVED" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openPayoutAction(payout, "MARK_PAID")}
                                    className="rounded-lg bg-amber-300 px-3 py-1.5 font-bold text-black"
                                  >
                                    Mark paid
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openPayoutAction(payout, "REJECT")}
                                    className="rounded-lg border border-red-500/30 px-3 py-1.5 font-bold text-red-300"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {(payout.status === "PAID" || payout.status === "REJECTED") && (
                                <span className="text-[10px] text-text-muted">Terminal state</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {payoutTotal > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t border-white/10 p-4">
                  <button
                    type="button"
                    disabled={payoutLoading || payoutPage <= 1}
                    onClick={() => void loadPayouts(payoutPage - 1, payoutStatus)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-text-muted">
                    Page {payoutPage} of {payoutTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={payoutLoading || payoutPage >= payoutTotalPages}
                    onClick={() => void loadPayouts(payoutPage + 1, payoutStatus)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === "FRAUD" && (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#141418]">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-bold text-white">Referral fraud review</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Durable persisted risk state and immutable review history. Stored risk score is evidence, not an automatic final decision.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    aria-label="Fraud status"
                    value={fraudStatus}
                    onChange={(event) => setFraudStatus(event.target.value)}
                    className="rounded-lg border border-white/10 bg-[#17171b] px-3 py-2 text-xs text-white"
                  >
                    <option value="">All statuses</option>
                    {Object.values(FraudStatus).map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void loadFraud(1, fraudStatus)}
                    disabled={fraudLoading}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {fraudError && (
                <div role="alert" className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {fraudError}
                </div>
              )}
              {fraudNotice && (
                <div role="status" aria-live="polite" className="m-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  {fraudNotice}
                </div>
              )}
              {fraudLoading && (
                <div role="status" className="p-8 text-center text-sm text-text-muted">
                  Loading fraud review evidence…
                </div>
              )}

              {!fraudLoading && !fraudError && (
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-left text-xs">
                    <thead className="bg-white/[0.03] text-text-muted">
                      <tr>
                        <th className="px-5 py-4">User</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Stored risk score</th>
                        <th className="px-5 py-4">Risk factors</th>
                        <th className="px-5 py-4">Last evaluated</th>
                        <th className="px-5 py-4 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {fraudQueue.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-text-muted">
                            No fraud profiles match the current filter.
                          </td>
                        </tr>
                      ) : fraudQueue.map((profile) => (
                        <tr key={profile.userId}>
                          <td className="px-5 py-4 font-mono text-[10px] text-white">{profile.userId}</td>
                          <td className="px-5 py-4">{profile.status.replaceAll("_", " ")}</td>
                          <td className="px-5 py-4 font-mono">{profile.riskScore.toFixed(1)}</td>
                          <td className="px-5 py-4 text-text-secondary">
                            {profile.riskFactors.length ? profile.riskFactors.join(", ") : "No recorded factors"}
                          </td>
                          <td className="px-5 py-4 text-text-muted">
                            {new Date(profile.lastEvaluatedAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openFraudReview(profile)}
                              disabled={!profile.updatedAt}
                              className="rounded-lg border border-white/10 px-3 py-1.5 font-bold text-white disabled:opacity-40"
                            >
                              Review state
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {fraudTotal > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t border-white/10 p-4">
                  <button
                    type="button"
                    disabled={fraudLoading || fraudPage <= 1}
                    onClick={() => void loadFraud(fraudPage - 1, fraudStatus)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-text-muted">
                    Page {fraudPage} of {fraudTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={fraudLoading || fraudPage >= fraudTotalPages}
                    onClick={() => void loadFraud(fraudPage + 1, fraudStatus)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === "ANALYTICS" && (
            <section className="space-y-5">
              {analyticsError && (
                <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {analyticsError}
                </div>
              )}

              {!analyticsError && !analytics && (
                <div role="status" className="rounded-2xl border border-white/10 bg-[#141418] p-8 text-sm text-text-muted">
                  Loading referral analytics…
                </div>
              )}

              {analytics && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-[#141418] p-5">
                      <p className="text-[10px] font-bold uppercase text-text-muted">Attributions</p>
                      <p className="mt-2 text-2xl font-bold text-white">{analytics.summary.totalAttributions}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-[#141418] p-5">
                      <p className="text-[10px] font-bold uppercase text-emerald-300">Reward value</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-300">{money(analytics.summary.totalRewardsValue)}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/20 bg-[#141418] p-5">
                      <p className="text-[10px] font-bold uppercase text-amber-300">Locked liability</p>
                      <p className="mt-2 text-2xl font-bold text-amber-300">{money(analytics.summary.totalLockedValue)}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 bg-[#141418] p-5">
                      <p className="text-[10px] font-bold uppercase text-sky-300">Unsettled payout liability</p>
                      <p className="mt-2 text-2xl font-bold text-sky-300">{money(analytics.summary.pendingPayoutLiability)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#141418] p-5 text-sm text-text-muted">
                    <p><strong className="text-white">Candidate attributions:</strong> {analytics.summary.candidateAttributions}</p>
                    <p className="mt-2"><strong className="text-white">Employer attributions:</strong> {analytics.summary.employerAttributions}</p>
                    <p className="mt-2"><strong className="text-white">Eligible reward value:</strong> {money(analytics.summary.totalEligibleValue)}</p>
                    <p className="mt-2"><strong className="text-white">Paid reward value:</strong> {money(analytics.summary.totalPaidValue)}</p>
                    <p className="mt-4 text-xs">
                      Funnel conversion rates are not displayed because authoritative funnel analytics are not implemented in this endpoint.
                    </p>
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>

      {payoutTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payout-action-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl"
          >
            <h2 id="payout-action-title" className="text-lg font-bold text-white">
              {payoutTarget.action === "APPROVE"
                ? "Approve payout?"
                : payoutTarget.action === "MARK_PAID"
                  ? "Record payout as paid?"
                  : "Reject payout?"}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {payoutTarget.action === "APPROVE"
                ? "Approval authorizes processing but does not initiate any bank or UPI transfer."
                : payoutTarget.action === "MARK_PAID"
                  ? "Use this only after the external transfer has actually completed. Enter the real UTR/transaction reference."
                  : "Rejecting releases the reserved referral liability back to the eligible reward balance."}
            </p>
            <p className="mt-3 text-xs text-text-muted">
              Amount: {money(payoutTarget.payout.amount)} · Referrer: {payoutTarget.payout.referrerId}
            </p>

            <label className="mt-5 block text-xs text-text-muted">
              {payoutTarget.action === "MARK_PAID" ? "Settlement UTR / transaction reference" : "Review reason"}
              <textarea
                value={payoutActionInput}
                onChange={(event) => setPayoutActionInput(event.target.value)}
                maxLength={payoutTarget.action === "MARK_PAID" ? 200 : 1000}
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={payoutActionLoading}
                onClick={() => {
                  setPayoutTarget(null);
                  setPayoutActionInput("");
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={payoutActionLoading || payoutActionInput.trim().length < 3}
                onClick={() => void submitPayoutAction()}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-40 ${
                  payoutTarget.action === "REJECT"
                    ? "bg-red-600"
                    : payoutTarget.action === "MARK_PAID"
                      ? "bg-amber-600"
                      : "bg-sky-600"
                }`}
              >
                {payoutActionLoading
                  ? "Saving…"
                  : payoutTarget.action === "APPROVE"
                    ? "Approve"
                    : payoutTarget.action === "MARK_PAID"
                      ? "Record paid"
                      : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {fraudTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fraud-review-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl"
          >
            <h2 id="fraud-review-title" className="text-lg font-bold text-white">
              Review referral fraud state
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              This is a consequential account-risk control. Select the intended state and record the evidence/reason for the audit trail.
            </p>
            <p className="mt-3 break-all font-mono text-[10px] text-text-muted">{fraudTarget.userId}</p>

            <label className="mt-5 block text-xs text-text-muted">
              New state
              <select
                value={fraudNextStatus}
                onChange={(event) => setFraudNextStatus(event.target.value as FraudStatus)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#17171b] p-3 text-sm text-white"
              >
                {Object.values(FraudStatus).map((status) => (
                  <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-xs text-text-muted">
              Review reason / evidence
              <textarea
                value={fraudReason}
                onChange={(event) => setFraudReason(event.target.value)}
                maxLength={1000}
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={fraudSaving}
                onClick={() => {
                  setFraudTarget(null);
                  setFraudReason("");
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  fraudSaving ||
                  fraudReason.trim().length < 3 ||
                  fraudNextStatus === fraudTarget.status ||
                  !fraudTarget.updatedAt
                }
                onClick={() => void submitFraudReview()}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {fraudSaving ? "Saving…" : "Save reviewed state"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
