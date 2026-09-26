"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PublicPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  validityMonths: number;
  featuresAllowed: string[];
  price: {
    regionCode: string;
    countryCode: string;
    currency: string;
    amount: number;
    taxInclusive: boolean;
    taxesMayApplyAtCheckout: boolean;
    checkoutAvailable: boolean;
  };
};

type CapacityOffer = {
  id: string;
  code: string;
  name: string;
  description: string;
  price: {
    countryCode: string;
    regionCode: string;
    currency: string;
    amount: number;
    taxInclusive: boolean;
    taxesMayApplyAtCheckout: boolean;
    checkoutAvailable: boolean;
  };
};

type CapacityState = {
  active: boolean;
  percentageUsed: number;
  level: "NORMAL" | "MODERATE" | "HIGH" | "REACHED";
  plan?: { id: string; code: string; name: string };
  billingCycle?: { startsAt: string; endsAt: string };
  canStartExpensiveOperation?: boolean;
};

const FEATURE_LABELS: Record<string, string> = {
  PROFILE_MATCHING: "Candidate screening & job-fit analysis",
  SHORTLIST_RECOMMENDATION: "Shortlist recommendations",
  ASSESSMENT_SUPPORT: "Assessment workflow support",
  INTERVIEW_SCHEDULING: "Interview scheduling automation",
  NOTIFICATIONS: "Email & WhatsApp workflow notifications",
  VIDEO_INTERVIEW: "HireGo virtual interview room",
  PROCTORING: "Interview proctoring evidence",
  INTERVIEW_REPORTS: "Interview transcript & AI report support",
  MULTI_ROUND: "Multi-round interview workflow",
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function levelCopy(level: CapacityState["level"]) {
  if (level === "REACHED") return "Capacity reached";
  if (level === "HIGH") return "High usage";
  if (level === "MODERATE") return "Moderate usage";
  return "Normal usage";
}

export default function EmployerCopilotHubPage() {
  const [country, setCountry] = useState("");
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [capacity, setCapacity] = useState<CapacityState | null>(null);
  const [offers, setOffers] = useState<CapacityOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<PublicPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const checkoutKey = useRef<string | null>(null);

  const load = useCallback(async (countryOverride?: string) => {
    setLoading(true);
    setCheckoutError("");
    try {
      const suffix = countryOverride ? `?country=${encodeURIComponent(countryOverride.toUpperCase())}` : "";
      const [plansRes, capacityRes, offersRes] = await Promise.all([
        fetch(`/api/copilot/plans${suffix}`, { cache: "no-store" }),
        fetch("/api/employer/copilot/capacity", { cache: "no-store" }),
        fetch(`/api/copilot/capacity-offers${suffix}`, { cache: "no-store" }),
      ]);
      const plansData = await plansRes.json();
      const capacityData = await capacityRes.json();
      const offersData = await offersRes.json();
      if (!plansRes.ok || !plansData.success) throw new Error(plansData.error || "Unable to load Copilot plans.");
      setPlans(plansData.plans || []);
      setCountry(plansData.countryCode || countryOverride || "US");
      if (capacityRes.ok && capacityData.success) setCapacity(capacityData.capacity);
      else setCapacity(null);
      if (offersRes.ok && offersData.success) setOffers(offersData.offers || []);
      else setOffers([]);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to load HireGo Copilot.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const currentPlanId = capacity?.active ? capacity.plan?.id : null;
  const activePlan = useMemo(() => plans.find((plan) => plan.id === currentPlanId) || null, [plans, currentPlanId]);

  async function beginCheckout() {
    if (!checkoutPlan || submitting) return;
    const normalizedCountry = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      setCheckoutError("Enter a valid two-letter billing country code, for example IN, US, GB, DE.");
      return;
    }

    checkoutKey.current ||= crypto.randomUUID();
    setSubmitting(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/payments/copilot/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutKey.current,
        },
        body: JSON.stringify({ planId: checkoutPlan.id, countryCode: normalizedCountry }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.order) throw new Error(data.error || "Unable to start Copilot checkout.");

      const order = data.order;
      if (!order.checkoutUrl || typeof order.checkoutUrl !== "string" || !order.checkoutUrl.startsWith("http")) {
        throw new Error("Payment provider did not return a valid checkout destination.");
      }

      if (order.gateway === "PAYU" && order.checkoutParams && typeof order.checkoutParams === "object") {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = order.checkoutUrl;
        for (const [key, value] of Object.entries(order.checkoutParams)) {
          if (value === undefined || value === null) continue;
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }

      window.location.assign(order.checkoutUrl);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout.");
      checkoutKey.current = null;
      setSubmitting(false);
    }
  }

  async function beginCapacityCheckout(offer: CapacityOffer) {
    if (submitting) return;
    const normalizedCountry = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      setCheckoutError("Enter a valid two-letter billing country code before adding capacity.");
      return;
    }

    const key = crypto.randomUUID();
    setSubmitting(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/payments/copilot/add-capacity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({ offerId: offer.id, countryCode: normalizedCountry }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.order) throw new Error(data.error || "Unable to start add-capacity checkout.");

      const order = data.order;
      if (!order.checkoutUrl || typeof order.checkoutUrl !== "string" || !order.checkoutUrl.startsWith("http")) {
        throw new Error("Payment provider did not return a valid checkout destination.");
      }

      if (order.gateway === "PAYU" && order.checkoutParams && typeof order.checkoutParams === "object") {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = order.checkoutUrl;
        for (const [keyName, value] of Object.entries(order.checkoutParams)) {
          if (value === undefined || value === null) continue;
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = keyName;
          input.value = String(value);
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }

      window.location.assign(order.checkoutUrl);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to start add-capacity checkout.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-[#141418] p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[#7FB0FF]">HireGo Copilot</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Automation for the hiring work after sourcing.</h1>
            <p className="mt-4 text-sm leading-6 text-[#B8C2D1]">
              Copilot is a separate product from paid job posting. It can assist with screening, shortlist recommendations,
              assessments, interview scheduling, candidate notifications, virtual interviews, proctoring evidence and interview reports.
              Final hiring decisions remain with your team.
            </p>
          </div>

          <div className="w-full max-w-xs">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Billing country</label>
            <div className="flex gap-2">
              <input
                value={country}
                maxLength={2}
                onChange={(event) => setCountry(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold uppercase text-white outline-none focus:border-[#448AFF]"
                aria-label="Two-letter billing country code"
              />
              <button
                onClick={() => void load(country)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white hover:bg-white/10"
              >
                Update
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#64748B]">Use the two-letter country code, such as IN, US, GB or DE.</p>
          </div>
        </div>
      </section>

      {capacity?.active && (
        <section className="rounded-[24px] border border-white/10 bg-[#16161B] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Current Copilot plan</p>
              <h2 className="mt-1 text-2xl font-extrabold text-white">{capacity.plan?.name}</h2>
              {capacity.billingCycle && (
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Current plan period ends {new Date(capacity.billingCycle.endsAt).toLocaleDateString()}.
                </p>
              )}
            </div>
            <div className="w-full md:max-w-sm">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold text-white">{levelCopy(capacity.level)}</span>
                <span className="text-[#94A3B8]">{capacity.percentageUsed}% of included plan capacity used</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#448AFF]" style={{ width: `${Math.min(100, Math.max(0, capacity.percentageUsed))}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-[#64748B]">Hire counts are not capped. Expensive automation pauses only when the plan capacity is reached.</p>
            </div>
          </div>
        </section>
      )}

      {capacity?.active && offers.length > 0 && (
        <section className="rounded-[24px] border border-white/10 bg-[#16161B] p-6">
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#7FB0FF]">Add Capacity</p>
            <h2 className="mt-1 text-xl font-extrabold text-white">Add capacity for the current plan period</h2>
            <p className="mt-2 text-xs leading-5 text-[#94A3B8]">
              Add-ons increase automation capacity only until the current Copilot billing period ends. Internal usage units remain hidden.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {offers.map((offer) => (
              <article key={offer.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-extrabold text-white">{offer.name}</h3>
                <p className="mt-2 min-h-10 text-xs leading-5 text-[#94A3B8]">{offer.description}</p>
                <p className="mt-4 text-2xl font-extrabold text-white">{money(offer.price.amount, offer.price.currency)}</p>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  {offer.price.taxesMayApplyAtCheckout ? "Applicable tax may be added at checkout." : "Configured tax treatment is included."}
                </p>
                <button
                  disabled={submitting || !offer.price.checkoutAvailable}
                  onClick={() => void beginCapacityCheckout(offer)}
                  className="mt-4 w-full rounded-xl border border-[#448AFF]/40 bg-[#448AFF]/10 px-4 py-3 text-xs font-extrabold text-[#A8C7FF] hover:bg-[#448AFF]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {offer.price.checkoutAvailable ? "Add capacity" : "International checkout pending compliance provider"}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Choose your Copilot plan</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">No customer-facing AI credits or token counters. Usage is managed as plan capacity.</p>
          </div>
          <div className="rounded-xl border border-[#448AFF]/20 bg-[#448AFF]/10 px-4 py-2 text-xs font-semibold text-[#A8C7FF]">
            JD generation is included and does not reduce Copilot capacity.
          </div>
        </div>

        {checkoutError && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{checkoutError}</div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#16161B] p-10 text-center text-sm text-[#94A3B8]">Loading Copilot plans…</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              return (
                <article key={plan.id} className={`flex min-h-[430px] flex-col rounded-[24px] border bg-[#16161B] p-6 ${isCurrent ? "border-[#4CAF50]/60" : "border-white/10"}`}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#7FB0FF]">{plan.name}</p>
                        <p className="mt-2 text-3xl font-extrabold text-white">{money(plan.price.amount, plan.price.currency)}</p>
                        <p className="text-xs text-[#94A3B8]">per {plan.validityMonths === 1 ? "month" : `${plan.validityMonths} months`}</p>
                      </div>
                      {isCurrent && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-300">Current</span>}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#AAB4C3]">{plan.description}</p>
                    <ul className="mt-6 space-y-3">
                      {plan.featuresAllowed.map((feature) => (
                        <li key={feature} className="flex gap-2 text-xs leading-5 text-[#D5DBE5]">
                          <span className="material-symbols-outlined mt-0.5 text-[16px] text-emerald-400">check_circle</span>
                          <span>{FEATURE_LABELS[feature] || feature.replaceAll("_", " ")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-6">
                    <p className="mb-3 text-[11px] leading-4 text-[#64748B]">
                      {plan.price.taxInclusive ? "Displayed price includes configured transaction taxes." : "Applicable transaction tax, if required, may be added by the checkout provider."}
                    </p>
                    <button
                      disabled={!plan.price.checkoutAvailable}
                      onClick={() => {
                        checkoutKey.current = crypto.randomUUID();
                        setCheckoutPlan(plan);
                        setCheckoutError("");
                      }}
                      className="w-full rounded-xl bg-[#448AFF] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#5B97FF] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {!plan.price.checkoutAvailable
                        ? "International checkout pending compliance provider"
                        : isCurrent
                          ? "Renew this Copilot plan"
                          : "Choose this Copilot plan"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#16161B] p-5">
          <h3 className="font-bold text-white">Job posting stays separate</h3>
          <p className="mt-2 text-xs leading-5 text-[#94A3B8]">Buying Copilot does not silently bundle or consume paid job-posting inventory.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#16161B] p-5">
          <h3 className="font-bold text-white">Hiring volume can scale</h3>
          <p className="mt-2 text-xs leading-5 text-[#94A3B8]">The system meters costly automation, not the number of people you eventually hire.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#16161B] p-5">
          <h3 className="font-bold text-white">Human approval remains final</h3>
          <p className="mt-2 text-xs leading-5 text-[#94A3B8]">Copilot can recommend and automate workflow steps, but selection and rejection remain controlled by authorized humans.</p>
        </div>
      </section>

      {checkoutPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Confirm Copilot purchase">
          <div className="w-full max-w-lg rounded-[24px] border border-white/10 bg-[#17171D] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7FB0FF]">Confirm Copilot</p>
                <h2 className="mt-1 text-2xl font-extrabold text-white">{checkoutPlan.name}</h2>
              </div>
              <button onClick={() => setCheckoutPlan(null)} className="rounded-lg p-2 text-[#94A3B8] hover:bg-white/10 hover:text-white" aria-label="Close checkout confirmation">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#94A3B8]">Plan price</span>
                <span className="text-lg font-extrabold text-white">{money(checkoutPlan.price.amount, checkoutPlan.price.currency)}</span>
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                Billing country: {country}. {checkoutPlan.price.taxesMayApplyAtCheckout ? "Applicable local tax may be calculated at checkout." : "Tax treatment is included in the configured checkout route."}
              </p>
            </div>
            <button
              disabled={submitting}
              onClick={() => void beginCheckout()}
              className="mt-5 w-full rounded-xl bg-[#448AFF] px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Starting secure checkout…" : "Continue to secure checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
