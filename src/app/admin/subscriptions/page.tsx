"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

const emptyPlan = {
  id: "",
  name: "",
  description: "",
  price: "",
  currency: "INR",
  jobPostsQuota: "",
  resumeUnlocksQuota: "0",
  aiInterviewsQuota: "0",
  applicationsQuota: "0",
  resumeDownloadsQuota: "0",
  backgroundVerificationsQuota: "0",
  validityMonths: "1",
  jobValidityDays: "7",
  firstTimeOnly: false,
  copilotIncluded: false,
  copilotJobLimit: "0",
  isFeatured: false,
  badgeText: "",
  displayOrder: "0",
  featuresAllowed: "",
  marketingBenefits: "",
};

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [copilotConfig, setCopilotConfig] = useState<any>(null);
  const [tab, setTab] = useState<"plans" | "copilot" | "promos" | "internal-ai">("plans");
  const [plan, setPlan] = useState<any>(emptyPlan);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [promo, setPromo] = useState({ code: "", discountType: "PERCENTAGE", discountValue: "", maxUsage: "100", validUntil: "" });

  async function load() {
    try {
      setMessage(null);
      const [plansRes, settingsRes] = await Promise.all([
        fetch("/api/admin/subscription-plans?includeArchived=true", { cache: "no-store" }),
        fetch("/api/admin/subscriptions/settings", { cache: "no-store" }),
      ]);
      const plansBody = await plansRes.json();
      const settingsBody = await settingsRes.json();
      if (!plansRes.ok || !plansBody.success) throw new Error(plansBody.error || "Unable to load plans.");
      if (!settingsRes.ok || !settingsBody.success) throw new Error(settingsBody.error || "Unable to load subscription settings.");
      setPlans(plansBody.plans || []);
      setPromos(settingsBody.promos || []);
      setServices(settingsBody.services || []);
      setCopilotConfig(settingsBody.copilotConfig || null);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to load subscription settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function editPlan(item: any) {
    setPlan({
      ...item,
      price: String(item.price),
      jobPostsQuota: String(item.jobPostsQuota),
      resumeUnlocksQuota: String(item.resumeUnlocksQuota),
      aiInterviewsQuota: String(item.aiInterviewsQuota),
      applicationsQuota: String(item.applicationsQuota),
      resumeDownloadsQuota: String(item.resumeDownloadsQuota),
      backgroundVerificationsQuota: String(item.backgroundVerificationsQuota),
      validityMonths: String(item.validityMonths),
      jobValidityDays: String(item.jobValidityDays),
      copilotJobLimit: String(item.copilotJobLimit),
      displayOrder: String(item.displayOrder),
      badgeText: item.badgeText || "",
      featuresAllowed: (item.featuresAllowed || []).join("\n"),
      marketingBenefits: (item.marketingBenefits || []).join("\n"),
    });
    setTab("plans");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function savePlan(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = {
        name: plan.name.trim(),
        description: plan.description.trim(),
        price: Number(plan.price),
        currency: plan.currency.trim().toUpperCase(),
        jobPostsQuota: Number(plan.jobPostsQuota),
        resumeUnlocksQuota: Number(plan.resumeUnlocksQuota),
        aiInterviewsQuota: Number(plan.aiInterviewsQuota),
        applicationsQuota: Number(plan.applicationsQuota),
        resumeDownloadsQuota: Number(plan.resumeDownloadsQuota),
        backgroundVerificationsQuota: Number(plan.backgroundVerificationsQuota),
        featuresAllowed: plan.featuresAllowed.split("\n").map((v: string) => v.trim()).filter(Boolean),
        marketingBenefits: plan.marketingBenefits.split("\n").map((v: string) => v.trim()).filter(Boolean),
        validityMonths: Number(plan.validityMonths),
        jobValidityDays: Number(plan.jobValidityDays),
        firstTimeOnly: Boolean(plan.firstTimeOnly),
        copilotIncluded: Boolean(plan.copilotIncluded),
        copilotJobLimit: Number(plan.copilotIncluded ? plan.copilotJobLimit : 0),
        isFeatured: Boolean(plan.isFeatured),
        badgeText: plan.badgeText.trim() || null,
        displayOrder: Number(plan.displayOrder),
      };
      if (plan.id) payload.id = plan.id;
      const response = await fetch("/api/admin/subscription-plans", {
        method: plan.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to save plan.");
      setPlan(emptyPlan);
      setMessage(plan.id ? "Plan updated." : "Plan created.");
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save plan.");
    } finally {
      setSaving(false);
    }
  }

  async function archivePlan(id: string) {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/subscription-plans?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to archive plan.");
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to archive plan.");
    } finally { setSaving(false); }
  }

  async function saveCopilot(event: React.FormEvent) {
    event.preventDefault();
    if (!copilotConfig) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/subscriptions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "COPILOT_CONFIG",
          config: {
            enabled: Boolean(copilotConfig.enabled),
            addonPrice: Number(copilotConfig.addonPrice),
            currency: String(copilotConfig.currency).toUpperCase(),
            addonJobLimit: Number(copilotConfig.addonJobLimit),
            title: copilotConfig.title,
            description: copilotConfig.description,
            badgeText: copilotConfig.badgeText || null,
            benefits: Array.isArray(copilotConfig.benefits)
              ? copilotConfig.benefits
              : String(copilotConfig.benefits || "").split("\n").map((v: string) => v.trim()).filter(Boolean),
          },
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to save Co-Pilot configuration.");
      setCopilotConfig(body.copilotConfig);
      setMessage("Co-Pilot offer updated.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save Co-Pilot configuration.");
    } finally { setSaving(false); }
  }

  async function savePromo(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/subscriptions/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promo.code,
          discountType: promo.discountType,
          discountValue: Number(promo.discountValue),
          maxUsage: Number(promo.maxUsage),
          validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString() : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to create promo.");
      setPromo({ code: "", discountType: "PERCENTAGE", discountValue: "", maxUsage: "100", validUntil: "" });
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to create promo.");
    } finally { setSaving(false); }
  }

  async function archivePromo(code: string) {
    const response = await fetch(`/api/admin/subscriptions/settings?code=${encodeURIComponent(code)}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok || !body.success) setMessage(body.error || "Unable to archive promo.");
    await load();
  }

  async function saveService(service: any, creditCost: number, billingType: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/subscriptions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceKey: service.serviceKey, creditCost, billingType }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to save internal AI cost.");
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save internal AI cost.");
    } finally { setSaving(false); }
  }

  const input = "w-full rounded-xl border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50";
  const label = "mb-1.5 block text-[10px] font-black uppercase tracking-[.14em] text-slate-400";

  return (
    <div className="min-h-screen bg-[#070a14] text-white">
      <AdminSidebar />
      <main className="pl-[130px] pr-6 py-8">
        <div className="mx-auto max-w-7xl">
          <header className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,185,255,.18),transparent_30%),linear-gradient(135deg,#121936,#0b1021)] p-6 shadow-[0_24px_70px_rgba(0,0,0,.35)]">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Commercial Control Center</p>
            <h1 className="mt-2 text-3xl font-black">Hiring plans, Co-Pilot & promotions</h1>
            <p className="mt-2 text-sm text-slate-400">All employer-facing pricing and benefits are authoritative database configuration. Internal AI costs are separate from customer billing.</p>
          </header>

          {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">{message}</div> : null}

          <nav className="mt-6 flex flex-wrap gap-2">
            {[
              ["plans","Plans"],
              ["copilot","Co-Pilot"],
              ["promos","Promos"],
              ["internal-ai","Internal AI Cost"],
            ].map(([key, text]) => (
              <button key={key} onClick={() => setTab(key as any)} className={`rounded-xl px-4 py-2 text-xs font-black ${tab === key ? "bg-cyan-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"}`}>{text}</button>
            ))}
          </nav>

          {loading ? <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">Loading live configuration…</div> : null}

          {!loading && tab === "plans" ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[430px_1fr]">
              <form onSubmit={savePlan} className="h-fit rounded-[28px] border border-white/10 bg-[#0e1428] p-5 shadow-[0_20px_50px_rgba(0,0,0,.3)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black">{plan.id ? "Edit plan" : "Create plan"}</h2>
                  {plan.id ? <button type="button" onClick={() => setPlan(emptyPlan)} className="text-xs font-bold text-slate-400">Cancel</button> : null}
                </div>

                <div className="mt-5 space-y-4">
                  <div><label className={label}>Plan name</label><input required className={input} value={plan.name} onChange={e => setPlan({ ...plan, name: e.target.value })} /></div>
                  <div><label className={label}>Description</label><textarea required rows={3} className={input} value={plan.description} onChange={e => setPlan({ ...plan, description: e.target.value })} /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className={label}>Price</label><input required type="number" min="0" className={input} value={plan.price} onChange={e => setPlan({ ...plan, price: e.target.value })} /></div>
                    <div><label className={label}>Currency</label><input required maxLength={3} className={input} value={plan.currency} onChange={e => setPlan({ ...plan, currency: e.target.value.toUpperCase() })} /></div>
                    <div><label className={label}>Order</label><input required type="number" min="0" className={input} value={plan.displayOrder} onChange={e => setPlan({ ...plan, displayOrder: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className={label}>Job credits</label><input required type="number" min="0" className={input} value={plan.jobPostsQuota} onChange={e => setPlan({ ...plan, jobPostsQuota: e.target.value })} /></div>
                    <div><label className={label}>Days / job</label><input required type="number" min="1" className={input} value={plan.jobValidityDays} onChange={e => setPlan({ ...plan, jobValidityDays: e.target.value })} /></div>
                    <div><label className={label}>Plan months</label><input required type="number" min="1" className={input} value={plan.validityMonths} onChange={e => setPlan({ ...plan, validityMonths: e.target.value })} /></div>
                  </div>
                  <details className="rounded-2xl border border-white/10 p-3">
                    <summary className="cursor-pointer text-xs font-black text-slate-300">Operational quotas</summary>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ["resumeUnlocksQuota","Profile unlocks"],
                        ["aiInterviewsQuota","Interview allowance"],
                        ["applicationsQuota","Applications"],
                        ["resumeDownloadsQuota","CV downloads"],
                        ["backgroundVerificationsQuota","BG verifies"],
                      ].map(([key, text]) => <div key={key}><label className={label}>{text}</label><input type="number" min="0" className={input} value={plan[key]} onChange={e => setPlan({ ...plan, [key]: e.target.value })} /></div>)}
                    </div>
                  </details>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-xl border border-white/10 p-3 text-xs font-bold"><input type="checkbox" checked={plan.firstTimeOnly} onChange={e => setPlan({ ...plan, firstTimeOnly: e.target.checked, price: e.target.checked ? "0" : plan.price })} /> First-time only</label>
                    <label className="flex items-center gap-2 rounded-xl border border-white/10 p-3 text-xs font-bold"><input type="checkbox" checked={plan.isFeatured} onChange={e => setPlan({ ...plan, isFeatured: e.target.checked })} /> Featured card</label>
                    <label className="col-span-2 flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-xs font-bold"><input type="checkbox" checked={plan.copilotIncluded} onChange={e => setPlan({ ...plan, copilotIncluded: e.target.checked, copilotJobLimit: e.target.checked ? (plan.copilotJobLimit === "0" ? "1" : plan.copilotJobLimit) : "0" })} /> Co-Pilot included</label>
                  </div>
                  {plan.copilotIncluded ? <div><label className={label}>Included Co-Pilot jobs</label><input type="number" min="1" className={input} value={plan.copilotJobLimit} onChange={e => setPlan({ ...plan, copilotJobLimit: e.target.value })} /></div> : null}
                  <div><label className={label}>Badge</label><input className={input} value={plan.badgeText} onChange={e => setPlan({ ...plan, badgeText: e.target.value })} /></div>
                  <div><label className={label}>Public benefits — one per line</label><textarea rows={8} className={input} value={plan.marketingBenefits} onChange={e => setPlan({ ...plan, marketingBenefits: e.target.value })} /></div>
                  <div><label className={label}>Internal feature keys — one per line</label><textarea rows={5} className={input} value={plan.featuresAllowed} onChange={e => setPlan({ ...plan, featuresAllowed: e.target.value })} /></div>
                  <button disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{saving ? "Saving…" : plan.id ? "Update plan" : "Create plan"}</button>
                </div>
              </form>

              <section className="space-y-3">
                {plans.map(item => (
                  <article key={item.id} className={`rounded-[24px] border p-5 ${item.isArchived ? "border-white/5 bg-white/[.025] opacity-60" : item.copilotIncluded ? "border-cyan-300/25 bg-cyan-300/[.055]" : "border-white/10 bg-white/[.045]"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">{item.name}</h3>
                          {item.badgeText ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black">{item.badgeText}</span> : null}
                          {item.isArchived ? <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-[9px] font-black text-red-300">Archived</span> : null}
                        </div>
                        <p className="mt-1 max-w-2xl text-xs text-slate-400">{item.description}</p>
                      </div>
                      <p className="text-xl font-black">{new Intl.NumberFormat("en-IN",{style:"currency",currency:item.currency,maximumFractionDigits:0}).format(item.price)}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
                      <span className="rounded-lg bg-white/5 px-2 py-1">{item.jobPostsQuota} jobs</span>
                      <span className="rounded-lg bg-white/5 px-2 py-1">{item.jobValidityDays} days/job</span>
                      <span className="rounded-lg bg-white/5 px-2 py-1">{item.validityMonths} month access</span>
                      {item.firstTimeOnly ? <span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-emerald-300">First-time only</span> : null}
                      {item.copilotIncluded ? <span className="rounded-lg bg-cyan-300/10 px-2 py-1 text-cyan-200">Co-Pilot × {item.copilotJobLimit}</span> : null}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => editPlan(item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black">Edit</button>
                      {!item.isArchived ? <button onClick={() => void archivePlan(item.id)} className="rounded-xl border border-red-400/20 px-3 py-2 text-xs font-black text-red-300">Archive</button> : null}
                    </div>
                  </article>
                ))}
              </section>
            </div>
          ) : null}

          {!loading && tab === "copilot" && copilotConfig ? (
            <form onSubmit={saveCopilot} className="mt-6 max-w-3xl rounded-[28px] border border-cyan-300/20 bg-[linear-gradient(145deg,#101b35,#12102e)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="text-xl font-black">Co-Pilot checkout offer</h2><p className="mt-1 text-xs text-slate-400">This config powers the employer checkout upsell and Co-Pilot benefits UI.</p></div>
                <label className="flex items-center gap-2 text-xs font-black"><input type="checkbox" checked={copilotConfig.enabled} onChange={e => setCopilotConfig({ ...copilotConfig, enabled: e.target.checked })} /> Enabled</label>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div><label className={label}>Add-on price</label><input type="number" min="0" className={input} value={copilotConfig.addonPrice} onChange={e => setCopilotConfig({ ...copilotConfig, addonPrice: e.target.value })} /></div>
                <div><label className={label}>Currency</label><input className={input} value={copilotConfig.currency} onChange={e => setCopilotConfig({ ...copilotConfig, currency: e.target.value.toUpperCase() })} /></div>
                <div><label className={label}>Jobs granted</label><input type="number" min="1" className={input} value={copilotConfig.addonJobLimit} onChange={e => setCopilotConfig({ ...copilotConfig, addonJobLimit: e.target.value })} /></div>
              </div>
              <div className="mt-4"><label className={label}>Title</label><input className={input} value={copilotConfig.title} onChange={e => setCopilotConfig({ ...copilotConfig, title: e.target.value })} /></div>
              <div className="mt-4"><label className={label}>Description</label><textarea rows={3} className={input} value={copilotConfig.description} onChange={e => setCopilotConfig({ ...copilotConfig, description: e.target.value })} /></div>
              <div className="mt-4"><label className={label}>Badge</label><input className={input} value={copilotConfig.badgeText || ""} onChange={e => setCopilotConfig({ ...copilotConfig, badgeText: e.target.value })} /></div>
              <div className="mt-4"><label className={label}>Benefits — one per line</label><textarea rows={8} className={input} value={(copilotConfig.benefits || []).join("\n")} onChange={e => setCopilotConfig({ ...copilotConfig, benefits: e.target.value.split("\n") })} /></div>
              <button disabled={saving} className="mt-5 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Save Co-Pilot offer</button>
            </form>
          ) : null}

          {!loading && tab === "promos" ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
              <form onSubmit={savePromo} className="rounded-[24px] border border-white/10 bg-white/[.04] p-5">
                <h2 className="font-black">Create promo</h2>
                <div className="mt-4 space-y-3">
                  <div><label className={label}>Code</label><input required className={input} value={promo.code} onChange={e => setPromo({ ...promo, code: e.target.value.toUpperCase() })} /></div>
                  <div><label className={label}>Type</label><select className={input} value={promo.discountType} onChange={e => setPromo({ ...promo, discountType: e.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FLAT">Flat amount</option></select></div>
                  <div><label className={label}>Discount</label><input required type="number" min="1" className={input} value={promo.discountValue} onChange={e => setPromo({ ...promo, discountValue: e.target.value })} /></div>
                  <div><label className={label}>Usage limit</label><input required type="number" min="1" className={input} value={promo.maxUsage} onChange={e => setPromo({ ...promo, maxUsage: e.target.value })} /></div>
                  <div><label className={label}>Valid until</label><input type="date" className={input} value={promo.validUntil} onChange={e => setPromo({ ...promo, validUntil: e.target.value })} /></div>
                  <button disabled={saving} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-black">Create promo</button>
                </div>
              </form>
              <section className="space-y-3">
                {promos.map(item => <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 flex items-center justify-between gap-4"><div><p className="font-mono font-black text-cyan-300">{item.code}</p><p className="mt-1 text-xs text-slate-400">{item.discountType} · {item.discountValue} · {item.usageCount}/{item.maxUsage} used</p></div><button onClick={() => void archivePromo(item.code)} className="text-xs font-black text-red-300">Archive</button></div>)}
              </section>
            </div>
          ) : null}

          {!loading && tab === "internal-ai" ? (
            <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.04] p-5">
              <h2 className="text-lg font-black">Internal AI cost controls</h2>
              <p className="mt-1 text-xs text-slate-400">Operational cost metadata only. Normal subscription AI assistance is not customer-metered by these values.</p>
              <div className="mt-5 space-y-3">
                {services.map(service => <ServiceRow key={service.serviceKey} service={service} saving={saving} onSave={saveService} />)}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function ServiceRow({ service, saving, onSave }: { service: any; saving: boolean; onSave: (service: any, cost: number, type: string) => Promise<void> }) {
  const [cost, setCost] = useState(String(service.creditCost));
  const [type, setType] = useState(service.billingType);
  return <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#0d1224] p-4 md:grid-cols-[1fr_160px_160px_auto] md:items-center">
    <div><p className="font-black">{service.serviceName}</p><p className="text-xs font-mono text-slate-500">{service.serviceKey}</p></div>
    <select value={type} onChange={e => setType(e.target.value)} className="rounded-xl border border-white/10 bg-[#090d19] px-3 py-2 text-xs"><option value="INCLUDED">Included</option><option value="CREDIT_BASED">Internal metered</option><option value="PAID_ADDON">Paid add-on</option></select>
    <input type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} className="rounded-xl border border-white/10 bg-[#090d19] px-3 py-2 text-xs" />
    <button disabled={saving} onClick={() => void onSave(service, Number(cost), type)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Save</button>
  </div>;
}
