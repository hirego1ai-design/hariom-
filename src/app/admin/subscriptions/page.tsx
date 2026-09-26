"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { SUBSCRIPTION_FEATURE_OPTIONS } from "@/lib/subscriptionFeatures";

type PlanType = "FREE_TRIAL" | "STANDARD" | "COPILOT";
type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  jobPostsQuota: number;
  validityMonths: number;
  jobValidityDays: number;
  planType: PlanType;
  firstTimeOnly: boolean;
  copilotJobsQuota: number;
  copilotAutoActivate: boolean;
  badge?: string | null;
  isFeatured: boolean;
  displayOrder: number;
  displayBenefits: string[];
  featuresAllowed: string[];
  isArchived: boolean;
};

type Promo = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxUsage: number;
  usageCount: number;
  validUntil?: string;
};

type ServiceCost = {
  id: string;
  serviceKey: string;
  serviceName: string;
  creditCost: number;
  billingType: "CREDIT_BASED" | "INCLUDED" | "PAID_ADDON";
};

type Notice = { tone: "success" | "error"; text: string } | null;

const emptyPlan = {
  name: "",
  description: "",
  price: "",
  currency: "INR",
  jobPostsQuota: "",
  validityMonths: "1",
  jobValidityDays: "7",
  planType: "STANDARD" as PlanType,
  firstTimeOnly: false,
  copilotJobsQuota: "0",
  copilotAutoActivate: false,
  badge: "",
  isFeatured: false,
  displayOrder: "0",
  benefitsText: "",
  featuresAllowed: [] as string[],
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<"plans" | "promos" | "internal-ai">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [services, setServices] = useState<ServiceCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [pendingArchivePlan, setPendingArchivePlan] = useState<string | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUsage, setMaxUsage] = useState("100");
  const [validUntil, setValidUntil] = useState("");
  const [pendingArchivePromo, setPendingArchivePromo] = useState<string | null>(null);

  const [editingService, setEditingService] = useState<ServiceCost | null>(null);
  const [serviceCost, setServiceCost] = useState("");
  const [serviceBillingType, setServiceBillingType] = useState<ServiceCost["billingType"]>("INCLUDED");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansResponse, settingsResponse] = await Promise.all([
        fetch("/api/admin/subscription-plans?includeArchived=true", { cache: "no-store" }),
        fetch("/api/admin/subscriptions/settings", { cache: "no-store" }),
      ]);
      const [plansBody, settingsBody] = await Promise.all([plansResponse.json(), settingsResponse.json()]);
      if (!plansResponse.ok || !plansBody.success) throw new Error(plansBody.error || "Unable to load plans.");
      if (!settingsResponse.ok || !settingsBody.success) throw new Error(settingsBody.error || "Unable to load subscription settings.");

      setPlans(plansBody.plans || []);
      setPromos(settingsBody.promos || []);
      setServices(settingsBody.services || []);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to load subscription configuration." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.displayOrder - b.displayOrder || a.price - b.price),
    [plans],
  );

  const resetPlan = () => {
    setEditingPlanId(null);
    setPlanForm(emptyPlan);
    setPendingArchivePlan(null);
  };

  const editPlan = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      currency: plan.currency,
      jobPostsQuota: String(plan.jobPostsQuota),
      validityMonths: String(plan.validityMonths),
      jobValidityDays: String(plan.jobValidityDays),
      planType: plan.planType,
      firstTimeOnly: plan.firstTimeOnly,
      copilotJobsQuota: String(plan.copilotJobsQuota),
      copilotAutoActivate: plan.copilotAutoActivate,
      badge: plan.badge || "",
      isFeatured: plan.isFeatured,
      displayOrder: String(plan.displayOrder),
      benefitsText: plan.displayBenefits.join("\n"),
      featuresAllowed: plan.featuresAllowed,
    });
    setActiveTab("plans");
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFeature = (key: string) => {
    setPlanForm(current => ({
      ...current,
      featuresAllowed: current.featuresAllowed.includes(key)
        ? current.featuresAllowed.filter(feature => feature !== key)
        : [...current.featuresAllowed, key],
    }));
  };

  const setPlanType = (value: PlanType) => {
    setPlanForm(current => ({
      ...current,
      planType: value,
      price: value === "FREE_TRIAL" ? "0" : current.price,
      firstTimeOnly: value === "FREE_TRIAL" ? true : current.firstTimeOnly,
      copilotJobsQuota: value === "COPILOT" && Number(current.copilotJobsQuota) < 1 ? "1" : current.copilotJobsQuota,
      copilotAutoActivate: value === "COPILOT" ? true : current.copilotAutoActivate,
    }));
  };

  const savePlan = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    try {
      const payload = {
        ...(editingPlanId ? { id: editingPlanId } : {}),
        name: planForm.name.trim(),
        description: planForm.description.trim(),
        price: Number(planForm.price),
        currency: planForm.currency.trim().toUpperCase(),
        jobPostsQuota: Number(planForm.jobPostsQuota),
        validityMonths: Number(planForm.validityMonths),
        jobValidityDays: Number(planForm.jobValidityDays),
        planType: planForm.planType,
        firstTimeOnly: planForm.firstTimeOnly,
        copilotJobsQuota: Number(planForm.copilotJobsQuota),
        copilotAutoActivate: planForm.copilotAutoActivate,
        badge: planForm.badge.trim() || null,
        isFeatured: planForm.isFeatured,
        displayOrder: Number(planForm.displayOrder),
        displayBenefits: planForm.benefitsText
          .split("\n")
          .map(value => value.trim())
          .filter(Boolean),
        featuresAllowed: planForm.featuresAllowed,
      };

      const response = await fetch("/api/admin/subscription-plans", {
        method: editingPlanId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Plan could not be saved.");

      setNotice({ tone: "success", text: editingPlanId ? "Plan updated successfully." : "Plan created successfully." });
      resetPlan();
      await loadData();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Plan could not be saved." });
    } finally {
      setSubmitting(false);
    }
  };

  const archivePlan = async (id: string) => {
    setSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/subscription-plans?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Plan could not be archived.");
      setNotice({ tone: "success", text: "Plan archived. Existing purchased snapshots remain unchanged." });
      setPendingArchivePlan(null);
      await loadData();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Plan could not be archived." });
    } finally {
      setSubmitting(false);
    }
  };

  const createPromo = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/subscriptions/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          maxUsage: Number(maxUsage),
          validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Promo code could not be created.");
      setPromoCode("");
      setDiscountValue("");
      setMaxUsage("100");
      setValidUntil("");
      setNotice({ tone: "success", text: "Promo code created." });
      await loadData();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Promo code could not be created." });
    } finally {
      setSubmitting(false);
    }
  };

  const archivePromo = async (code: string) => {
    setSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/subscriptions/settings?code=${encodeURIComponent(code)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Promo code could not be archived.");
      setPendingArchivePromo(null);
      setNotice({ tone: "success", text: "Promo code archived." });
      await loadData();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Promo code could not be archived." });
    } finally {
      setSubmitting(false);
    }
  };

  const saveInternalCost = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingService) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/subscriptions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceKey: editingService.serviceKey,
          creditCost: Number(serviceCost),
          billingType: serviceBillingType,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Internal AI cost setting could not be updated.");
      setEditingService(null);
      setNotice({ tone: "success", text: "Internal AI cost metadata updated. Customer plans are unchanged." });
      await loadData();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Internal AI cost setting could not be updated." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B12] text-slate-100">
      <AdminSidebar />
      <main className="min-h-screen pl-[130px]">
        <div className="mx-auto max-w-[1500px] px-6 py-8">
          <header className="mb-7">
            <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-200">
              Authoritative commercial configuration
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Subscription & Co-Pilot Catalog</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Manage the exact plans shown to employers. Prices, benefits, job validity, feature access and Co-Pilot inclusion are read from these database records.
            </p>
          </header>

          {notice && (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${notice.tone === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>
              {notice.text}
            </div>
          )}

          <div className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/[.035] p-2">
            {[
              ["plans", "Plans", "view_carousel"],
              ["promos", "Promotions", "sell"],
              ["internal-ai", "Internal AI Cost", "monitoring"],
            ].map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${activeTab === id ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-[17px]">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid min-h-[420px] place-items-center rounded-3xl border border-white/8 bg-white/[.025]">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="material-symbols-outlined animate-spin text-blue-400">progress_activity</span>
                Loading production configuration…
              </div>
            </div>
          ) : activeTab === "plans" ? (
            <div className="grid gap-6 xl:grid-cols-[520px_1fr]">
              <form onSubmit={savePlan} className="h-fit rounded-3xl border border-white/10 bg-[#111521] p-6 shadow-2xl shadow-black/20">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-300">{editingPlanId ? "Editing live plan" : "New plan"}</p>
                    <h2 className="mt-1 text-xl font-black">{editingPlanId ? "Update plan" : "Create plan"}</h2>
                  </div>
                  {editingPlanId && (
                    <button type="button" onClick={resetPlan} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">
                      Cancel edit
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-300">
                      Plan name
                      <input required value={planForm.name} onChange={event => setPlanForm({ ...planForm, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400" />
                    </label>
                    <label className="text-xs font-bold text-slate-300">
                      Plan type
                      <select value={planForm.planType} onChange={event => setPlanType(event.target.value as PlanType)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0C1019] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400">
                        <option value="FREE_TRIAL">Free Trial</option>
                        <option value="STANDARD">Standard</option>
                        <option value="COPILOT">Co-Pilot</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-slate-300">
                    Description
                    <textarea required rows={3} value={planForm.description} onChange={event => setPlanForm({ ...planForm, description: event.target.value })} className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400" />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-xs font-bold text-slate-300">
                      Price
                      <input required min="0" step="0.01" type="number" disabled={planForm.planType === "FREE_TRIAL"} value={planForm.price} onChange={event => setPlanForm({ ...planForm, price: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white disabled:opacity-60" />
                    </label>
                    <label className="text-xs font-bold text-slate-300">
                      Currency
                      <input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={planForm.currency} onChange={event => setPlanForm({ ...planForm, currency: event.target.value.toUpperCase() })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm uppercase text-white" />
                    </label>
                    <label className="text-xs font-bold text-slate-300">
                      Display order
                      <input required type="number" value={planForm.displayOrder} onChange={event => setPlanForm({ ...planForm, displayOrder: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-xs font-bold text-slate-300">
                      Job posts
                      <input required min="0" type="number" value={planForm.jobPostsQuota} onChange={event => setPlanForm({ ...planForm, jobPostsQuota: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                    </label>
                    <label className="text-xs font-bold text-slate-300">
                      Validity / job (days)
                      <input required min="1" max="365" type="number" value={planForm.jobValidityDays} onChange={event => setPlanForm({ ...planForm, jobValidityDays: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                    </label>
                    <label className="text-xs font-bold text-slate-300">
                      Plan access (months)
                      <input required min="1" max="120" type="number" value={planForm.validityMonths} onChange={event => setPlanForm({ ...planForm, validityMonths: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[.045] p-4">
                    <div className="flex items-center gap-2 text-sm font-black text-cyan-100">
                      <span className="material-symbols-outlined text-lg">auto_awesome</span>
                      Co-Pilot allocation
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold text-slate-300">
                        Co-Pilot jobs included
                        <input required min="0" type="number" value={planForm.copilotJobsQuota} onChange={event => setPlanForm({ ...planForm, copilotJobsQuota: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                      </label>
                      <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-3 py-3 text-xs font-bold text-slate-300">
                        <input type="checkbox" checked={planForm.copilotAutoActivate} onChange={event => setPlanForm({ ...planForm, copilotAutoActivate: event.target.checked })} />
                        Auto-start Co-Pilot when a job is published
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-300">
                      Card badge
                      <input maxLength={80} value={planForm.badge} onChange={event => setPlanForm({ ...planForm, badge: event.target.value })} placeholder="e.g. Most Popular" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                    </label>
                    <div className="grid gap-2">
                      <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-3 py-2.5 text-xs font-bold text-slate-300">
                        <input type="checkbox" checked={planForm.isFeatured} onChange={event => setPlanForm({ ...planForm, isFeatured: event.target.checked })} />
                        Featured 3D card
                      </label>
                      <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-3 py-2.5 text-xs font-bold text-slate-300">
                        <input type="checkbox" checked={planForm.firstTimeOnly} disabled={planForm.planType === "FREE_TRIAL"} onChange={event => setPlanForm({ ...planForm, firstTimeOnly: event.target.checked })} />
                        First-time companies only
                      </label>
                    </div>
                  </div>

                  <label className="block text-xs font-bold text-slate-300">
                    Public benefits <span className="font-normal text-slate-500">(one benefit per line)</span>
                    <textarea rows={7} value={planForm.benefitsText} onChange={event => setPlanForm({ ...planForm, benefitsText: event.target.value })} className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-blue-400" />
                  </label>

                  <div>
                    <p className="text-xs font-bold text-slate-300">Authoritative feature entitlements</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">These keys control server-side access. Public benefit copy above is display-only.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {SUBSCRIPTION_FEATURE_OPTIONS.map(feature => (
                        <label key={feature.key} className="flex cursor-pointer items-start gap-2 rounded-xl border border-white/8 bg-black/15 p-3 hover:bg-white/[.035]">
                          <input className="mt-0.5" type="checkbox" checked={planForm.featuresAllowed.includes(feature.key)} onChange={() => toggleFeature(feature.key)} />
                          <span>
                            <span className="block text-xs font-bold text-slate-200">{feature.label}</span>
                            <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{feature.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button disabled={submitting} type="submit" className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 disabled:opacity-50">
                    {submitting ? "Saving…" : editingPlanId ? "Save plan changes" : "Create live plan"}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {sortedPlans.map(plan => (
                  <article key={plan.id} className={`rounded-3xl border p-5 ${plan.isArchived ? "border-white/6 bg-white/[.02] opacity-60" : plan.planType === "COPILOT" ? "border-cyan-300/25 bg-gradient-to-br from-cyan-400/[.07] to-violet-500/[.07]" : "border-white/9 bg-white/[.035]"}`}>
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black">{plan.name}</h3>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-extrabold text-slate-300">{plan.planType}</span>
                          {plan.badge && <span className="rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-bold text-blue-200">{plan.badge}</span>}
                          {plan.isArchived && <span className="rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-bold text-red-200">ARCHIVED</span>}
                        </div>
                        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">{plan.description}</p>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-2xl font-black">{money(plan.price, plan.currency)}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Order {plan.displayOrder}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-black/15 p-3"><p className="text-[10px] text-slate-500">Jobs</p><p className="mt-1 font-black">{plan.jobPostsQuota}</p></div>
                      <div className="rounded-xl bg-black/15 p-3"><p className="text-[10px] text-slate-500">Per job</p><p className="mt-1 font-black">{plan.jobValidityDays} days</p></div>
                      <div className="rounded-xl bg-black/15 p-3"><p className="text-[10px] text-slate-500">Co-Pilot jobs</p><p className="mt-1 font-black">{plan.copilotJobsQuota}</p></div>
                      <div className="rounded-xl bg-black/15 p-3"><p className="text-[10px] text-slate-500">Plan period</p><p className="mt-1 font-black">{plan.validityMonths} mo</p></div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {plan.featuresAllowed.map(feature => <span key={feature} className="rounded-lg border border-white/8 bg-white/[.03] px-2 py-1 text-[10px] font-semibold text-slate-400">{feature}</span>)}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="button" onClick={() => editPlan(plan)} className="rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-bold text-blue-200 hover:bg-blue-400/15">Edit</button>
                      {!plan.isArchived && (
                        pendingArchivePlan === plan.id ? (
                          <>
                            <button type="button" disabled={submitting} onClick={() => void archivePlan(plan.id)} className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white">Confirm archive</button>
                            <button type="button" onClick={() => setPendingArchivePlan(null)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300">Cancel</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => setPendingArchivePlan(plan.id)} className="rounded-xl border border-red-400/15 bg-red-400/5 px-4 py-2 text-xs font-bold text-red-200">Archive</button>
                        )
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : activeTab === "promos" ? (
            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <form onSubmit={createPromo} className="h-fit rounded-3xl border border-white/10 bg-[#111521] p-6">
                <h2 className="text-xl font-black">Create promotion</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Discounts apply only through verified paid checkout and are capacity-reserved before provider initiation.</p>
                <div className="mt-5 space-y-4">
                  <label className="block text-xs font-bold text-slate-300">Code<input required minLength={3} maxLength={64} value={promoCode} onChange={event => setPromoCode(event.target.value.toUpperCase())} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" /></label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-slate-300">Type<select value={discountType} onChange={event => setDiscountType(event.target.value as typeof discountType)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0C1019] px-3 py-2.5 text-sm text-white"><option value="PERCENTAGE">Percentage</option><option value="FLAT">Flat</option></select></label>
                    <label className="text-xs font-bold text-slate-300">Value<input required min="0.01" step="0.01" type="number" value={discountValue} onChange={event => setDiscountValue(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" /></label>
                  </div>
                  <label className="block text-xs font-bold text-slate-300">Maximum uses<input required min="1" type="number" value={maxUsage} onChange={event => setMaxUsage(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" /></label>
                  <label className="block text-xs font-bold text-slate-300">Valid until<input type="datetime-local" value={validUntil} onChange={event => setValidUntil(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" /></label>
                  <button disabled={submitting} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Create promo</button>
                </div>
              </form>

              <div className="space-y-3">
                {promos.length === 0 && <div className="rounded-2xl border border-white/8 bg-white/[.025] p-8 text-center text-sm text-slate-500">No active promotions.</div>}
                {promos.map(promo => (
                  <div key={promo.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/8 bg-white/[.03] p-5 sm:flex-row sm:items-center">
                    <div><p className="font-black">{promo.code}</p><p className="mt-1 text-xs text-slate-500">{promo.discountType === "PERCENTAGE" ? `${promo.discountValue}%` : promo.discountValue} · {promo.usageCount}/{promo.maxUsage} used</p></div>
                    {pendingArchivePromo === promo.code ? (
                      <div className="flex gap-2"><button type="button" onClick={() => void archivePromo(promo.code)} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold">Confirm</button><button type="button" onClick={() => setPendingArchivePromo(null)} className="rounded-xl border border-white/10 px-3 py-2 text-xs">Cancel</button></div>
                    ) : <button type="button" onClick={() => setPendingArchivePromo(promo.code)} className="rounded-xl border border-red-400/15 px-3 py-2 text-xs font-bold text-red-200">Archive</button>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.055] p-4 text-xs leading-5 text-amber-100">
                <strong>Internal operations only:</strong> these values are not customer per-AI-call prices. Employer billing is controlled exclusively by Subscription Plans and Co-Pilot job allocations above.
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {services.map(service => (
                  <div key={service.id} className="rounded-2xl border border-white/8 bg-white/[.03] p-5">
                    <p className="text-sm font-black">{service.serviceName}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">{service.serviceKey}</p>
                    <div className="mt-4 flex items-center justify-between text-xs"><span className="text-slate-500">Internal weight</span><span className="font-black">{service.creditCost}</span></div>
                    <div className="mt-2 flex items-center justify-between text-xs"><span className="text-slate-500">Tracking mode</span><span className="font-bold text-slate-300">{service.billingType}</span></div>
                    <button type="button" onClick={() => { setEditingService(service); setServiceCost(String(service.creditCost)); setServiceBillingType(service.billingType); }} className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/8">Edit internal metadata</button>
                  </div>
                ))}
              </div>

              {editingService && (
                <form onSubmit={saveInternalCost} className="max-w-xl rounded-2xl border border-white/10 bg-[#111521] p-5">
                  <div className="flex justify-between gap-4"><div><p className="font-black">{editingService.serviceName}</p><p className="text-[10px] text-slate-500">{editingService.serviceKey}</p></div><button type="button" onClick={() => setEditingService(null)} className="text-xs text-slate-400">Close</button></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-300">Internal weight<input required min="0" type="number" value={serviceCost} onChange={event => setServiceCost(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" /></label>
                    <label className="text-xs font-bold text-slate-300">Tracking mode<select value={serviceBillingType} onChange={event => setServiceBillingType(event.target.value as ServiceCost["billingType"])} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0C1019] px-3 py-2.5 text-sm text-white"><option value="INCLUDED">INCLUDED</option><option value="CREDIT_BASED">CREDIT_BASED</option><option value="PAID_ADDON">PAID_ADDON</option></select></label>
                  </div>
                  <button disabled={submitting} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">Save internal metadata</button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
