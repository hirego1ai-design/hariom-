"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  jobPostsQuota: number;
  jobValidityDays: number;
  marketingBenefits: string[];
  copilotIncluded: boolean;
  copilotJobLimit: number;
  isFeatured: boolean;
  badgeText?: string | null;
  displayOrder: number;
  eligible?: boolean;
  eligibilityReason?: string | null;
};

type CopilotConfig = {
  enabled: boolean;
  addonPrice: number;
  currency: string;
  addonJobLimit: number;
  title: string;
  description: string;
  badgeText?: string | null;
  benefits: string[];
};

export default function EmployerSubscriptionsStorePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [credits, setCredits] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [subscriptionState, setSubscriptionState] = useState<any>(null);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [copilotConfig, setCopilotConfig] = useState<CopilotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [addCopilot, setAddCopilot] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("STRIPE");
  const [promoCode, setPromoCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const checkoutRequestKey = useRef<string | null>(null);

  async function load() {
    try {
      setMessage(null);
      const response = await fetch("/api/employer/subscribe", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to load hiring plans.");
      setPlans((body.plans || []).sort((a: Plan, b: Plan) => a.displayOrder - b.displayOrder));
      setCredits(body.credits || null);
      setActivePlan(body.activePlan || null);
      setSubscriptionState(body.subscriptionState || null);
      setGatewayConfig(body.gatewayConfig || null);
      setCopilotConfig(body.copilotConfig || null);
      setSelectedGateway(body.gatewayConfig?.primaryGateway || "STRIPE");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to load hiring plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  const checkoutTotal = useMemo(() => {
    if (!checkoutPlan) return 0;
    return checkoutPlan.price + (addCopilot && copilotConfig ? copilotConfig.addonPrice : 0);
  }, [checkoutPlan, addCopilot, copilotConfig]);

  async function choosePlan(plan: Plan) {
    setMessage(null);
    if (plan.eligible === false) {
      setMessage(plan.eligibilityReason || "This plan is not available for your account.");
      return;
    }
    if (plan.price === 0) {
      setSubmitting(true);
      try {
        const response = await fetch("/api/employer/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: plan.id }),
        });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error || "Unable to activate free plan.");
        setMessage("Free plan activated successfully.");
        await load();
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : "Unable to activate free plan.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    checkoutRequestKey.current = crypto.randomUUID();
    setAddCopilot(false);
    setPromoCode("");
    setCheckoutPlan(plan);
  }

  async function checkout() {
    if (!checkoutPlan || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutRequestKey.current || crypto.randomUUID(),
        },
        body: JSON.stringify({
          planId: checkoutPlan.id,
          paymentMethod: gatewayConfig?.allowEmployerSelection ? selectedGateway : undefined,
          promoCode: promoCode.trim() || undefined,
          addCopilot,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success || !body.order) throw new Error(body.error || "Unable to start payment.");
      const order = body.order;
      if (order.gateway === "PAYU" && order.checkoutParams && order.checkoutUrl) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = order.checkoutUrl;
        Object.entries(order.checkoutParams).forEach(([key, value]) => {
          if (value == null) return;
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
      if (!order.checkoutUrl) throw new Error("Payment provider did not return a checkout URL.");
      window.location.href = order.checkoutUrl;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to start payment.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080b18] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-[1480px]">
        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_10%_15%,rgba(105,70,255,.26),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(58,187,255,.24),transparent_28%),linear-gradient(135deg,#111937,#091023_55%,#101532)] px-6 py-10 shadow-[0_35px_90px_rgba(0,0,0,.45)] md:px-10">
          <div className="pointer-events-none absolute -left-20 top-24 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute right-10 top-10 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative text-center">
            <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">
              Simple pricing. Powerful hiring.
            </span>
            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-[-.04em] md:text-6xl">
              Choose the right <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">hiring plan</span>
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              AI-assisted hiring tools for employers, from job creation and matching to assessments, virtual interviews and structured feedback.
            </p>
          </div>

          {message ? (
            <div className="relative mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-center text-sm text-slate-200">
              {message}
            </div>
          ) : null}

          <div className="relative mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {loading ? (
              <div className="col-span-full rounded-[30px] border border-white/10 bg-white/[.05] p-12 text-center text-slate-400">Loading live plans…</div>
            ) : plans.map((plan, index) => {
              const isCopilot = plan.copilotIncluded;
              const isCurrent = activePlan?.id === plan.id;
              return (
                <article
                  key={plan.id}
                  className={`group relative min-h-[570px] overflow-hidden rounded-[30px] border p-5 transition duration-300 hover:-translate-y-2 md:p-6 ${
                    isCopilot
                      ? "border-cyan-300/35 bg-[linear-gradient(155deg,#102e54,#102647_45%,#24155d)] shadow-[0_26px_55px_rgba(31,132,255,.25),inset_0_1px_0_rgba(255,255,255,.15)]"
                      : plan.isFeatured
                      ? "border-violet-300/25 bg-[linear-gradient(155deg,rgba(255,255,255,.98),rgba(241,244,255,.96))] text-slate-950 shadow-[0_24px_55px_rgba(83,69,180,.22)]"
                      : "border-white/15 bg-[linear-gradient(155deg,rgba(255,255,255,.97),rgba(239,245,255,.95))] text-slate-950 shadow-[0_20px_45px_rgba(0,0,0,.2)]"
                  }`}
                  style={{ transform: `perspective(1200px) rotateY(${index % 2 === 0 ? "-1deg" : "1deg"})` }}
                >
                  <div className={`absolute inset-x-8 top-0 h-px ${isCopilot ? "bg-gradient-to-r from-transparent via-cyan-300 to-transparent" : "bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"}`} />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-lg ${isCopilot ? "bg-cyan-300/15 text-cyan-200" : "bg-blue-600/10 text-blue-600"}`}>✦</div>
                      {plan.badgeText ? (
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${isCopilot ? "bg-cyan-300 text-slate-950" : "bg-blue-600/10 text-blue-700"}`}>
                          {plan.badgeText}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-5 text-2xl font-black tracking-tight">{plan.name}</h2>
                    <p className={`mt-2 min-h-12 text-sm leading-5 ${isCopilot ? "text-slate-300" : "text-slate-600"}`}>{plan.description}</p>
                    <div className="mt-5 flex items-end gap-2">
                      <span className="text-4xl font-black">{money(plan.price, plan.currency)}</span>
                    </div>
                    <div className={`mt-5 grid grid-cols-2 gap-2 rounded-2xl p-3 text-xs ${isCopilot ? "bg-white/[.07]" : "bg-blue-600/[.06]"}`}>
                      <div><span className="block font-black">{plan.jobPostsQuota}</span><span className={isCopilot ? "text-slate-400" : "text-slate-500"}>job post{plan.jobPostsQuota === 1 ? "" : "s"}</span></div>
                      <div><span className="block font-black">{plan.jobValidityDays} days</span><span className={isCopilot ? "text-slate-400" : "text-slate-500"}>per job</span></div>
                    </div>

                    <ul className="mt-5 flex-1 space-y-2.5">
                      {(plan.marketingBenefits || []).map(benefit => (
                        <li key={benefit} className="flex gap-2 text-sm">
                          <span className={isCopilot ? "text-cyan-300" : "text-emerald-500"}>●</span>
                          <span className={isCopilot ? "text-slate-200" : "text-slate-700"}>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      disabled={submitting || plan.eligible === false}
                      onClick={() => void choosePlan(plan)}
                      className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
                        isCopilot
                          ? "bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 text-slate-950 shadow-[0_12px_30px_rgba(65,189,255,.25)]"
                          : "bg-[#1769ff] text-white shadow-[0_12px_26px_rgba(23,105,255,.28)]"
                      }`}
                    >
                      {plan.eligible === false ? plan.eligibilityReason : isCurrent ? "Renew plan" : plan.price === 0 ? "Start free" : `Choose ${plan.name}`}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="relative mt-6 grid gap-3 rounded-[28px] border border-white/10 bg-[#0e1732]/85 p-5 shadow-[0_22px_45px_rgba(0,0,0,.3)] md:grid-cols-[1.2fr_repeat(6,1fr)] md:items-center">
            <div>
              <p className="text-lg font-black">Everything you need to hire, in one place</p>
              <p className="mt-1 text-xs text-slate-400">Plan benefits are controlled from Admin and loaded live.</p>
            </div>
            {["AI JD","Matching","Assessments","Virtual Interview","Proctoring","Feedback"].map(label => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[.05] p-3 text-center text-xs font-bold text-slate-200">{label}</div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex justify-center gap-3 text-xs text-slate-400">
          <Link href="/employer/revenue-and-billing-management" className="hover:text-white">Billing & receipts</Link>
          <span>•</span>
          <Link href="/employer/ai-hiring-copilot-hub" className="hover:text-white">Co-Pilot hub</Link>
          <span>•</span>
          <Link href="/employer/employer-subscription-and-plans" className="hover:text-white">Managed Hiring</Link>
        </div>
      </div>

      {checkoutPlan ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/60 p-3 backdrop-blur-sm">
          <button aria-label="Close checkout" className="absolute inset-0" onClick={() => !submitting && setCheckoutPlan(null)} />
          <aside className="relative h-full w-full max-w-[520px] overflow-y-auto rounded-[32px] border border-white/15 bg-[linear-gradient(180deg,#f8fbff,#eef3ff)] p-6 text-slate-950 shadow-[0_30px_100px_rgba(0,0,0,.5)] md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Secure checkout</p>
                <h2 className="mt-1 text-2xl font-black">{checkoutPlan.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{checkoutPlan.jobPostsQuota} job post{checkoutPlan.jobPostsQuota === 1 ? "" : "s"} · {checkoutPlan.jobValidityDays}-day validity per job</p>
              </div>
              <button onClick={() => !submitting && setCheckoutPlan(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/5 text-xl">×</button>
            </div>

            {!checkoutPlan.copilotIncluded && copilotConfig?.enabled ? (
              <div className="mt-6 rounded-[26px] border border-blue-200 bg-white p-4 shadow-[0_20px_45px_rgba(64,105,190,.14)]">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-200 to-violet-200 text-xl">✦</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{copilotConfig.title}</h3>
                      {copilotConfig.badgeText ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black text-violet-700">{copilotConfig.badgeText}</span> : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{copilotConfig.description}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {copilotConfig.benefits.slice(0, 6).map(benefit => (
                    <div key={benefit} className="rounded-xl bg-slate-50 p-2.5 text-[11px] font-bold text-slate-700">✓ {benefit}</div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAddCopilot(value => !value)}
                  className={`mt-4 flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${addCopilot ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
                >
                  <span>
                    <span className="block text-sm font-black">{addCopilot ? "Co-Pilot added" : "Add Co-Pilot"}</span>
                    <span className="text-xs text-slate-500">{copilotConfig.addonJobLimit} hiring workflow entitlement</span>
                  </span>
                  <span className="font-black text-blue-700">+{money(copilotConfig.addonPrice, copilotConfig.currency)}</span>
                </button>
              </div>
            ) : checkoutPlan.copilotIncluded ? (
              <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-900">Co-Pilot is already included in this plan.</div>
            ) : null}

            <div className="mt-6 space-y-4">
              {gatewayConfig?.allowEmployerSelection ? (
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Payment provider</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {["STRIPE","PAYU"].filter(g => gatewayConfig?.gatewaysStatus?.[g] !== "DISABLED").map(g => (
                      <button key={g} onClick={() => setSelectedGateway(g)} className={`rounded-xl border px-3 py-2 text-xs font-black ${selectedGateway === g ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white"}`}>{g}</button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Promo code</label>
                <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Optional" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-950 p-4 text-white">
              <div className="flex justify-between text-sm"><span>Plan</span><span className="font-bold">{money(checkoutPlan.price, checkoutPlan.currency)}</span></div>
              {addCopilot && copilotConfig ? <div className="mt-2 flex justify-between text-sm"><span>Co-Pilot</span><span className="font-bold">{money(copilotConfig.addonPrice, copilotConfig.currency)}</span></div> : null}
              <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-lg font-black"><span>Checkout total</span><span>{money(checkoutTotal, checkoutPlan.currency)}</span></div>
              <p className="mt-2 text-[11px] text-slate-400">Any valid promo discount is applied server-side before payment.</p>
            </div>

            <button disabled={submitting} onClick={() => void checkout()} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(62,76,210,.25)] disabled:opacity-50">
              {submitting ? "Starting secure checkout…" : "Continue to payment"}
            </button>
            {!checkoutPlan.copilotIncluded && copilotConfig?.enabled && !addCopilot ? (
              <p className="mt-3 text-center text-[11px] text-slate-500">You can continue without Co-Pilot and activate it later from an eligible plan/add-on.</p>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
