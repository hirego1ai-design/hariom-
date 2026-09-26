"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type PlanType = "FREE_TRIAL" | "STANDARD" | "COPILOT";

type CatalogPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  jobPostsQuota: number;
  jobValidityDays: number;
  planType: PlanType;
  firstTimeOnly: boolean;
  copilotJobsQuota: number;
  copilotAutoActivate: boolean;
  badge?: string | null;
  isFeatured: boolean;
  displayOrder: number;
  displayBenefits: string[];
  validityMonths: number;
  eligible: boolean;
};

type BillingPayload = {
  plans: CatalogPlan[];
  copilotUpsells: Record<string, CatalogPlan>;
  credits: { jobPostsLeft?: number; copilotJobsLeft?: number };
  activeSubscription: { planId: string; endDate: string } | null;
  activePlan: CatalogPlan | null;
  subscriptionState: {
    status: string;
    daysRemaining: number;
    planName: string;
    currency: string;
    price: number;
  };
  quotas: {
    jobPosts: { left: number; total: number };
    copilotJobs: { left: number; total: number };
  };
  gatewayConfig: {
    mode: string;
    primaryGateway: "STRIPE" | "PAYU";
    allowEmployerSelection: boolean;
    gatewaysStatus: Record<"STRIPE" | "PAYU", string>;
  };
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function cardStyle(plan: CatalogPlan) {
  if (plan.planType === "COPILOT") {
    return {
      shell: "border-cyan-300/50 bg-[linear-gradient(145deg,rgba(16,37,86,.98),rgba(36,18,86,.96))] shadow-[0_28px_80px_rgba(46,116,255,.28),inset_0_1px_0_rgba(255,255,255,.18)]",
      icon: "from-cyan-400 to-violet-500",
      button: "bg-[linear-gradient(90deg,#14D9E6,#4B7CFF_52%,#C842FF)] text-white shadow-[0_12px_34px_rgba(76,105,255,.4)]",
    };
  }
  if (plan.planType === "FREE_TRIAL") {
    return {
      shell: "border-emerald-300/20 bg-[linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.045))] shadow-[0_24px_60px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.13)]",
      icon: "from-emerald-300 to-cyan-400",
      button: "bg-[linear-gradient(90deg,#16B978,#09AFAF)] text-white shadow-[0_10px_26px_rgba(14,180,140,.24)]",
    };
  }
  return {
    shell: plan.isFeatured
      ? "border-blue-400/50 bg-[linear-gradient(145deg,rgba(255,255,255,.12),rgba(66,105,255,.08))] shadow-[0_28px_70px_rgba(42,93,255,.24),inset_0_1px_0_rgba(255,255,255,.16)]"
      : "border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.045))] shadow-[0_24px_60px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.13)]",
    icon: "from-blue-400 to-violet-500",
    button: plan.isFeatured
      ? "bg-[linear-gradient(90deg,#2775FF,#6C54FF)] text-white shadow-[0_10px_30px_rgba(54,103,255,.3)]"
      : "border border-white/15 bg-white/[.07] text-white hover:bg-white/[.11]",
  };
}

export default function EmployerSubscriptionsStorePage() {
  const [data, setData] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<CatalogPlan | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<"STRIPE" | "PAYU">("STRIPE");
  const [couponCode, setCouponCode] = useState("");
  const [promoText, setPromoText] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const checkoutRequestKey = useRef<string | null>(null);
  const checkoutInFlight = useRef(false);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/employer/subscribe", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to load subscription catalog.");
      setData(body as BillingPayload);
      if (body.gatewayConfig?.primaryGateway === "PAYU") setSelectedGateway("PAYU");
      else setSelectedGateway("STRIPE");
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to load subscription catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const closeCheckout = () => {
    if (submitting) return;
    setCheckoutPlan(null);
    setCheckoutError(null);
    setPromoError(null);
    setPromoText(null);
    setCouponCode("");
    checkoutRequestKey.current = null;
  };

  const openCheckout = (plan: CatalogPlan) => {
    setCheckoutPlan(plan);
    setCheckoutError(null);
    setPromoError(null);
    setPromoText(null);
    setCouponCode("");
    checkoutRequestKey.current = null;
  };

  const selectUpsell = (plan: CatalogPlan) => {
    setCheckoutPlan(plan);
    setPromoText(null);
    setPromoError(null);
    checkoutRequestKey.current = null;
  };

  const applyCoupon = async () => {
    if (!checkoutPlan || !couponCode.trim()) return;
    setPromoError(null);
    setPromoText(null);
    try {
      const response = await fetch(
        `/api/employer/promo/validate?code=${encodeURIComponent(couponCode.trim().toUpperCase())}&planId=${encodeURIComponent(checkoutPlan.id)}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Promo code is not valid for this checkout.");
      const discount = typeof body.discountApplied === "number"
        ? money(body.discountApplied, checkoutPlan.currency)
        : "discount";
      setPromoText(`Promo applied: ${discount}`);
    } catch (error) {
      setPromoError(error instanceof Error ? error.message : "Promo validation failed.");
    }
  };

  const activateFreePlan = async () => {
    if (!checkoutPlan || checkoutInFlight.current) return;
    checkoutInFlight.current = true;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/employer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: checkoutPlan.id }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Free plan activation failed.");
      setCheckoutPlan(null);
      await loadBilling();
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Free plan activation failed.");
    } finally {
      checkoutInFlight.current = false;
      setSubmitting(false);
    }
  };

  const startPaidCheckout = async () => {
    if (!checkoutPlan || checkoutInFlight.current) return;
    checkoutInFlight.current = true;
    checkoutRequestKey.current ||= crypto.randomUUID();
    setSubmitting(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutRequestKey.current,
        },
        body: JSON.stringify({
          planId: checkoutPlan.id,
          promoCode: couponCode.trim() ? couponCode.trim().toUpperCase() : undefined,
          paymentMethod: data?.gatewayConfig.allowEmployerSelection ? selectedGateway : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success || !body.order) {
        throw new Error(body.error || "Unable to initiate secure checkout.");
      }

      const order = body.order as {
        gateway: "STRIPE" | "PAYU";
        checkoutUrl?: string;
        checkoutParams?: Record<string, unknown>;
      };
      if (!order.checkoutUrl) throw new Error("Payment provider did not return a checkout destination.");

      if (order.gateway === "PAYU" && order.checkoutParams && order.checkoutUrl.startsWith("http")) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = order.checkoutUrl;
        Object.entries(order.checkoutParams).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (!order.checkoutUrl.startsWith("http") && !order.checkoutUrl.startsWith("/")) {
        throw new Error("Payment checkout destination is invalid.");
      }
      window.location.href = order.checkoutUrl;
    } catch (error) {
      checkoutRequestKey.current = null;
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      checkoutInFlight.current = false;
      setSubmitting(false);
    }
  };

  const handlePrimaryCheckout = async () => {
    if (!checkoutPlan) return;
    if (checkoutPlan.price === 0) await activateFreePlan();
    else await startPaidCheckout();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] grid place-items-center text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <span className="material-symbols-outlined animate-spin text-blue-400">progress_activity</span>
          Loading live plans…
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center text-white">
        <h1 className="text-2xl font-bold">Subscription catalog unavailable</h1>
        <p className="mt-3 text-sm text-slate-400">{checkoutError || "Unable to load live pricing."}</p>
        <button onClick={() => void loadBilling()} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold">
          Retry
        </button>
      </div>
    );
  }

  const plans = [...data.plans].sort((a, b) => a.displayOrder - b.displayOrder || a.price - b.price);
  const activePlanId = data.activeSubscription?.planId ?? null;
  const upsell = checkoutPlan ? data.copilotUpsells?.[checkoutPlan.id] ?? null : null;
  const gatewayOptions = (["STRIPE", "PAYU"] as const).filter(
    gateway => data.gatewayConfig.gatewaysStatus[gateway] !== "DISABLED",
  );

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[28px] bg-[#070B18] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-36 h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[110px]" />
        <div className="absolute right-[-120px] top-10 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute bottom-[-220px] left-1/3 h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-[1500px]">
        <header className="mb-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-200">
              <span className="material-symbols-outlined text-sm">bolt</span>
              Simple pricing · powerful hiring
            </span>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-.035em] sm:text-5xl lg:text-6xl">
              Choose the right <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">hiring plan</span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              AI-assisted hiring for every employer. Upgrade to a Co-Pilot plan when you want HireGo to actively help run the workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/employer/revenue-and-billing-management" className="rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10">
              Billing & receipts
            </Link>
            <Link href="/employer/employer-subscription-and-plans" className="rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 py-2.5 text-xs font-bold text-violet-200 hover:bg-violet-400/15">
              Managed Hiring / PPH
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-[1.4fr_.8fr_.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[.055] p-5 shadow-[0_22px_70px_rgba(0,0,0,.25)] backdrop-blur-xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">Current plan</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black">{data.activePlan?.name || "No active plan"}</h2>
              <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">
                {data.subscriptionState.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {data.activeSubscription
                ? `Plan period ends ${new Date(data.activeSubscription.endDate).toLocaleDateString()} · ${data.subscriptionState.daysRemaining} days remaining`
                : "Choose a plan to activate employer hiring access."}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-300/15 bg-gradient-to-br from-blue-500/12 to-white/[.04] p-5">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined rounded-xl bg-blue-400/15 p-2 text-blue-300">work</span>
              <span className="text-2xl font-black">{data.credits.jobPostsLeft ?? 0}</span>
            </div>
            <p className="mt-4 text-xs font-bold text-slate-300">Job posts remaining</p>
          </div>

          <div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/10 to-violet-500/8 p-5">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined rounded-xl bg-cyan-300/15 p-2 text-cyan-200">auto_awesome</span>
              <span className="text-2xl font-black">{data.credits.copilotJobsLeft ?? 0}</span>
            </div>
            <p className="mt-4 text-xs font-bold text-slate-300">Co-Pilot jobs remaining</p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {plans.map(plan => {
            const style = cardStyle(plan);
            const current = activePlanId === plan.id;
            const unavailable = !plan.eligible;
            return (
              <article
                key={plan.id}
                className={`group relative flex min-h-[560px] flex-col overflow-hidden rounded-[28px] border p-5 transition duration-300 hover:-translate-y-2 hover:rotate-[.15deg] ${style.shell} ${plan.isFeatured ? "xl:-translate-y-2" : ""}`}
              >
                <div className="pointer-events-none absolute -right-14 -top-12 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl transition group-hover:bg-cyan-300/20" />
                <div className="relative">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${style.icon} shadow-[0_12px_28px_rgba(66,100,255,.32)] ring-1 ring-white/20`}>
                      <span className="material-symbols-outlined text-2xl text-white">
                        {plan.planType === "COPILOT" ? "auto_awesome" : plan.planType === "FREE_TRIAL" ? "send" : "business_center"}
                      </span>
                    </div>
                    {plan.badge && (
                      <span className="rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-slate-100">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                  <p className="mt-1 min-h-[42px] text-xs leading-5 text-slate-300">{plan.description}</p>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-4xl font-black tracking-[-.04em]">{money(plan.price, plan.currency)}</span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/15 p-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Job posts</p>
                      <p className="mt-1 text-lg font-black">{plan.jobPostsQuota}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Per job</p>
                      <p className="mt-1 text-lg font-black">{plan.jobValidityDays} days</p>
                    </div>
                  </div>

                  {plan.copilotJobsQuota > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100">
                      <span className="material-symbols-outlined text-base">stars</span>
                      Co-Pilot included on {plan.copilotJobsQuota} {plan.copilotJobsQuota === 1 ? "job" : "jobs"}
                    </div>
                  )}

                  <div className="mt-5 space-y-2.5">
                    {plan.displayBenefits.map(benefit => (
                      <div key={benefit} className="flex items-start gap-2 text-xs leading-5 text-slate-200">
                        <span className="material-symbols-outlined mt-[1px] text-[16px] text-emerald-300">check_circle</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative mt-auto pt-6">
                  {unavailable && (
                    <p className="mb-2 text-center text-[11px] font-semibold text-amber-300">First-time offer already used</p>
                  )}
                  <button
                    type="button"
                    disabled={unavailable}
                    onClick={() => openCheckout(plan)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-extrabold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 ${style.button}`}
                  >
                    {current ? "Renew / buy again" : plan.price === 0 ? "Start free" : plan.planType === "COPILOT" ? "Start with Co-Pilot" : "Choose plan"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-7 grid gap-3 rounded-[28px] border border-white/10 bg-white/[.045] p-5 shadow-[0_24px_70px_rgba(0,0,0,.25)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["videocam", "Virtual interviews"],
            ["verified_user", "Proctoring evidence"],
            ["assignment", "Assessments"],
            ["compare_arrows", "Matching"],
            ["description", "Offers"],
            ["groups", "Team workflow"],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/10 p-3">
              <span className="material-symbols-outlined rounded-xl bg-violet-400/12 p-2 text-violet-200">{icon}</span>
              <span className="text-xs font-bold text-slate-200">{label}</span>
            </div>
          ))}
        </section>
      </div>

      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#02050D]/80 p-0 backdrop-blur-md sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Plan checkout">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-[30px] border border-white/12 bg-[linear-gradient(155deg,#111A35,#0A1021_58%,#13102B)] p-5 shadow-[0_34px_120px_rgba(0,0,0,.62)] sm:rounded-[30px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-cyan-300">Secure checkout</p>
                <h2 className="mt-2 text-3xl font-black">{checkoutPlan.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {money(checkoutPlan.price, checkoutPlan.currency)} · {checkoutPlan.jobPostsQuota} job {checkoutPlan.jobPostsQuota === 1 ? "post" : "posts"} · {checkoutPlan.jobValidityDays} days each
                </p>
              </div>
              <button onClick={closeCheckout} disabled={submitting} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {upsell && (
              <div className="mt-6 overflow-hidden rounded-3xl border border-cyan-300/30 bg-[linear-gradient(125deg,rgba(28,94,160,.28),rgba(100,36,180,.24))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.13),0_22px_55px_rgba(31,95,220,.16)]">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      Co-Pilot upgrade
                    </span>
                    <h3 className="mt-3 text-xl font-black">Want HireGo to actively help run the workflow?</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      Upgrade to {upsell.name}. Its Co-Pilot allocation is part of the purchased plan—no per-AI-call billing.
                    </p>
                  </div>
                  <div className="min-w-[150px] text-left md:text-right">
                    <p className="text-2xl font-black">{money(upsell.price, upsell.currency)}</p>
                    <button
                      type="button"
                      onClick={() => selectUpsell(upsell)}
                      className="mt-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_10px_26px_rgba(76,105,255,.3)]"
                    >
                      Upgrade to Co-Pilot
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {upsell.displayBenefits.slice(0, 6).map(benefit => (
                    <div key={benefit} className="flex items-start gap-2 rounded-xl border border-white/8 bg-black/10 px-3 py-2 text-[11px] text-slate-200">
                      <span className="material-symbols-outlined text-[15px] text-cyan-300">check_circle</span>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {checkoutPlan.copilotJobsQuota > 0 && (
              <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined rounded-xl bg-cyan-300/12 p-2 text-cyan-200">stars</span>
                  <div>
                    <p className="text-sm font-extrabold">Co-Pilot is included</p>
                    <p className="text-xs text-slate-400">
                      {checkoutPlan.copilotJobsQuota} Co-Pilot {checkoutPlan.copilotJobsQuota === 1 ? "job" : "jobs"} included in this plan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {checkoutPlan.price > 0 && (
              <>
                {data.gatewayConfig.allowEmployerSelection && gatewayOptions.length > 1 && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs font-bold text-slate-300">Payment provider</p>
                    <div className="grid grid-cols-2 gap-3">
                      {gatewayOptions.map(gateway => (
                        <button
                          key={gateway}
                          type="button"
                          onClick={() => setSelectedGateway(gateway)}
                          className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${selectedGateway === gateway ? "border-blue-400 bg-blue-400/12 text-white" : "border-white/10 bg-white/5 text-slate-300"}`}
                        >
                          {gateway}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <p className="mb-2 text-xs font-bold text-slate-300">Promo code</p>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={event => {
                        setCouponCode(event.target.value.toUpperCase());
                        setPromoText(null);
                        setPromoError(null);
                      }}
                      maxLength={64}
                      placeholder="Optional promo code"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
                    />
                    <button type="button" onClick={() => void applyCoupon()} className="rounded-xl border border-white/10 bg-white/7 px-4 text-xs font-bold hover:bg-white/10">
                      Apply
                    </button>
                  </div>
                  {promoText && <p className="mt-2 text-xs font-semibold text-emerald-300">{promoText}</p>}
                  {promoError && <p className="mt-2 text-xs font-semibold text-amber-300">{promoError}</p>}
                </div>
              </>
            )}

            {checkoutError && (
              <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-200">
                {checkoutError}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handlePrimaryCheckout()}
                disabled={submitting || !checkoutPlan.eligible}
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(65,91,255,.32)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Processing…" : checkoutPlan.price === 0 ? "Activate free plan" : checkoutPlan.planType === "COPILOT" ? "Continue with Co-Pilot" : "Continue to secure payment"}
              </button>
              <button type="button" onClick={closeCheckout} disabled={submitting} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-bold text-slate-300 hover:bg-white/8">
                Cancel
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] leading-4 text-slate-500">
              Paid access activates only after a verified payment-provider webhook. Plans are prepaid and do not auto-renew.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
