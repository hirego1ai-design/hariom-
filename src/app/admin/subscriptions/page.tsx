"use client";

import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"plans" | "services" | "promos">("plans");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // Form states - Plans
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [jobPostsQuota, setJobPostsQuota] = useState("");
  const [resumeUnlocksQuota, setResumeUnlocksQuota] = useState("");
  const [aiInterviewsQuota, setAiInterviewsQuota] = useState("");
  const [applicationsQuota, setApplicationsQuota] = useState("100");
  const [resumeDownloadsQuota, setResumeDownloadsQuota] = useState("50");
  const [backgroundVerificationsQuota, setBackgroundVerificationsQuota] = useState("5");
  const [validityMonths, setValidityMonths] = useState("1");
  const [featuresAllowed, setFeaturesAllowed] = useState<string[]>([]);

  // Form states - Promos
  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUsage, setMaxUsage] = useState("100");
  const [validUntil, setValidUntil] = useState("");

  // Edit states - AI Services
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceCost, setServiceCost] = useState("");
  const [serviceBillingType, setServiceBillingType] = useState<"INCLUDED" | "CREDIT_BASED" | "PAID_ADDON">("CREDIT_BASED");

  async function loadData() {
    try {
      const plansRes = await fetch("/api/admin/subscription-plans?includeArchived=true");
      const plansData = await plansRes.json();
      
      const settingsRes = await fetch("/api/admin/subscriptions/settings");
      const settingsData = await settingsRes.json();

      if (plansData.success) setPlans(plansData.plans);
      if (settingsData.success) {
        setPromos(settingsData.promos || []);
        setServices(settingsData.services || []);
      }
    } catch (err) {
      console.error("Failed to load subscription data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const isEdit = !!editingPlan;
      const url = "/api/admin/subscription-plans";
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        id: editingPlan?.id,
        name,
        description,
        price: parseFloat(price),
        currency: "INR",
        jobPostsQuota: parseInt(jobPostsQuota),
        resumeUnlocksQuota: parseInt(resumeUnlocksQuota),
        aiInterviewsQuota: parseInt(aiInterviewsQuota),
        applicationsQuota: parseInt(applicationsQuota),
        resumeDownloadsQuota: parseInt(resumeDownloadsQuota),
        backgroundVerificationsQuota: parseInt(backgroundVerificationsQuota),
        featuresAllowed,
        validityMonths: parseInt(validityMonths),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        resetPlanForm();
        await loadData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/subscriptions/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode,
          discountType,
          discountValue: parseFloat(discountValue),
          maxUsage: parseInt(maxUsage),
          validUntil: validUntil || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPromoCode("");
        setDiscountValue("");
        setMaxUsage("100");
        setValidUntil("");
        await loadData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/subscriptions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceKey: editingService.serviceKey,
          creditCost: parseInt(serviceCost),
          billingType: serviceBillingType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingService(null);
        await loadData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchivePlan = async (id: string) => {
    if (!confirm("Are you sure you want to archive this plan? It will no longer be visible to employers.")) return;
    try {
      const res = await fetch(`/api/admin/subscription-plans?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchivePromo = async (code: string) => {
    if (!confirm(`Are you sure you want to archive promo code ${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/subscriptions/settings?code=${code}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPlanClick = (plan: any) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description);
    setPrice(plan.price.toString());
    setJobPostsQuota(plan.jobPostsQuota.toString());
    setResumeUnlocksQuota(plan.resumeUnlocksQuota.toString());
    setAiInterviewsQuota(plan.aiInterviewsQuota.toString());
    setApplicationsQuota(plan.applicationsQuota.toString());
    setResumeDownloadsQuota(plan.resumeDownloadsQuota.toString());
    setBackgroundVerificationsQuota(plan.backgroundVerificationsQuota.toString());
    setFeaturesAllowed(plan.featuresAllowed || []);
    setValidityMonths(plan.validityMonths.toString());
  };

  const toggleFeatureSelection = (key: string) => {
    setFeaturesAllowed(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const resetPlanForm = () => {
    setEditingPlan(null);
    setName("");
    setDescription("");
    setPrice("");
    setJobPostsQuota("");
    setResumeUnlocksQuota("");
    setAiInterviewsQuota("");
    setApplicationsQuota("100");
    setResumeDownloadsQuota("50");
    setBackgroundVerificationsQuota("5");
    setFeaturesAllowed([]);
    setValidityMonths("1");
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F8FAFC] flex font-[family-name:var(--font-body)]">
      <AdminSidebar />

      {/* Main Admin Config Panel */}
      <main className="flex-1 pl-[130px] pr-8 py-10 max-w-7xl overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-[#448AFF] text-3xl">settings_applications</span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-white">
              Recruitment Operating System Configurator
            </h1>
          </div>
          <p className="text-[#CBD5E1] text-sm">
            Control subscription plans, trial parameters, coupon promotions, and AI service credit values globally.
          </p>
        </header>

        {/* Console Tab Selector */}
        <div className="flex gap-4 border-b border-white/10 mb-8">
          <button
            onClick={() => setActiveTab("plans")}
            className={`py-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "plans" ? "border-[#448AFF] text-[#448AFF]" : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">card_membership</span>
            Plans Manager
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`py-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "services" ? "border-[#448AFF] text-[#448AFF]" : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            AI Services Cost Matrix
          </button>
          <button
            onClick={() => setActiveTab("promos")}
            className={`py-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "promos" ? "border-[#448AFF] text-[#448AFF]" : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">local_activity</span>
            Promotion Engine
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* TABS VIEW CONTROLLER */}
            {activeTab === "plans" && (
              <>
                {/* Plans Form */}
                <div className="lg:col-span-5">
                  <div className="glass-card p-6 bg-[#16161B] border border-white/10 rounded-2xl shadow-xl">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#448AFF]">
                        {editingPlan ? "edit_note" : "add_card"}
                      </span>
                      {editingPlan ? "Modify Plan Parameters" : "Provision Plan Template"}
                    </h2>

                    <form onSubmit={handleCreateOrUpdatePlan} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                          Plan Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Free Trial, Unicorn Mode"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#448AFF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                          Description
                        </label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Describe details and quotas included..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#448AFF] resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                            Price (INR)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Price"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#448AFF]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                            Validity
                          </label>
                          <select
                            value={validityMonths}
                            onChange={(e) => setValidityMonths(e.target.value)}
                            className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                          >
                            <option value="1">1 Month</option>
                            <option value="3">3 Months</option>
                            <option value="6">6 Months</option>
                            <option value="12">12 Months</option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <p className="text-xs font-bold text-[#FF5252] uppercase mb-4 tracking-wider">
                          Quotas Configurator
                        </p>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div>
                            <label className="block text-[10px] text-[#CBD5E1] uppercase mb-1">Jobs Post Cap</label>
                            <input
                              type="number"
                              required
                              value={jobPostsQuota}
                              onChange={(e) => setJobPostsQuota(e.target.value)}
                              className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#CBD5E1] uppercase mb-1">Profile Unlocks</label>
                            <input
                              type="number"
                              required
                              value={resumeUnlocksQuota}
                              onChange={(e) => setResumeUnlocksQuota(e.target.value)}
                              className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#CBD5E1] uppercase mb-1">AI Interviews</label>
                            <input
                              type="number"
                              required
                              value={aiInterviewsQuota}
                              onChange={(e) => setAiInterviewsQuota(e.target.value)}
                              className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div>
                            <label className="block text-[10px] text-[#CBD5E1] uppercase mb-1">Apps Cap</label>
                            <input
                              type="number"
                              required
                              value={applicationsQuota}
                              onChange={(e) => setApplicationsQuota(e.target.value)}
                              className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#CBD5E1] uppercase mb-1">CV Downloads</label>
                            <input
                              type="number"
                              required
                              value={resumeDownloadsQuota}
                              onChange={(e) => setResumeDownloadsQuota(e.target.value)}
                              className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#CBD5E1] uppercase mb-1">BG Verifies</label>
                            <input
                              type="number"
                              required
                              value={backgroundVerificationsQuota}
                              onChange={(e) => setBackgroundVerificationsQuota(e.target.value)}
                              className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <p className="text-xs font-bold text-[#40C4FF] uppercase mb-3 tracking-wider">
                          Allowed AI Features Matrix
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {services.map(s => (
                            <label key={s.serviceKey} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white/5">
                              <input
                                type="checkbox"
                                checked={featuresAllowed.includes(s.serviceKey)}
                                onChange={() => toggleFeatureSelection(s.serviceKey)}
                                className="rounded text-[#448AFF] focus:ring-0 focus:ring-offset-0 bg-[#1A1A20] border-white/15"
                              />
                              <span className="text-[#CBD5E1]">{s.serviceName}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 btn-3d-blue text-sm rounded-xl py-2.5 font-bold text-white transition-all"
                        >
                          {submitting ? "Saving..." : editingPlan ? "Update Plan" : "Publish Plan"}
                        </button>
                        {(editingPlan || name !== "") && (
                          <button
                            type="button"
                            onClick={resetPlanForm}
                            className="px-4 py-2.5 border border-white/15 hover:bg-white/5 rounded-xl text-xs font-semibold"
                          >
                            Reset Form
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                {/* Plans List */}
                <div className="lg:col-span-7 space-y-4">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      className={`glass-card p-5 bg-[#16161B] border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-white/15 ${
                        p.isArchived ? "opacity-60 border-dashed border-white/10" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <h3 className="font-bold text-white text-base font-[family-name:var(--font-display)]">{p.name}</h3>
                          {p.price === 0 && (
                            <span className="px-2 py-0.5 rounded bg-green/10 text-green border border-green/20 text-[9px] uppercase tracking-wider font-extrabold">
                              Dynamic Trial Mode
                            </span>
                          )}
                          {p.isArchived && (
                            <span className="px-2 py-0.5 rounded bg-white/5 text-[#94A3B8] text-[9px] uppercase tracking-wider font-semibold">
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#CBD5E1] mb-3 leading-relaxed">{p.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-[10px] text-[#94A3B8] border-t border-white/5 pt-3">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">work</span>
                            Jobs Limit: {p.jobPostsQuota === 9999 ? "Unlimited" : p.jobPostsQuota}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">person_search</span>
                            Unlocks: {p.resumeUnlocksQuota === 9999 ? "Unlimited" : p.resumeUnlocksQuota}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">psychology</span>
                            Interviews: {p.aiInterviewsQuota === 9999 ? "Unlimited" : p.aiInterviewsQuota}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">manage_search</span>
                            CV Downloads: {p.resumeDownloadsQuota}
                          </span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-end gap-2 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                        <p className="font-semibold text-lg text-[#FF5252] tracking-tight">
                          ₹{p.price}
                          <span className="text-[10px] text-[#94A3B8]"> /mo</span>
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPlanClick(p)}
                            className="p-2 border border-white/10 hover:bg-white/5 rounded-lg text-[#448AFF] hover:border-[#448AFF] transition-all"
                            title="Edit Plan Settings"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          {!p.isArchived && (
                            <button
                              onClick={() => handleArchivePlan(p.id)}
                              className="p-2 border border-white/10 hover:bg-white/5 rounded-lg text-[#FF5252] hover:border-[#FF5252] transition-all"
                              title="Archive Plan"
                            >
                              <span className="material-symbols-outlined text-[16px]">archive</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "services" && (
              <div className="lg:col-span-12">
                <div className="glass-card bg-[#16161B] border border-white/10 rounded-2xl p-6">
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#448AFF]">list_alt</span>
                    AI Services Credits Configurator Table
                  </h2>
                  <p className="text-xs text-[#94A3B8] mb-6">
                    Define the credit values consumed per transaction for all custom AI screening, proctoring, matching, and payroll services.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-[#94A3B8] uppercase tracking-wider font-semibold">
                          <th className="px-6 py-4">Service Key</th>
                          <th className="px-6 py-4">Service Display Name</th>
                          <th className="px-6 py-4">Billing Framework</th>
                          <th className="px-6 py-4">Credit Cost</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {services.map(s => {
                          const isEditing = editingService?.serviceKey === s.serviceKey;
                          return (
                            <tr key={s.serviceKey} className="hover:bg-white/2 transition-colors">
                              <td className="px-6 py-4 font-mono text-[#CBD5E1]">{s.serviceKey}</td>
                              <td className="px-6 py-4 font-bold text-white">{s.serviceName}</td>
                              <td className="px-6 py-4">
                                {isEditing ? (
                                  <select
                                    value={serviceBillingType}
                                    onChange={(e: any) => setServiceBillingType(e.target.value)}
                                    className="bg-[#1A1A20] border border-white/10 rounded px-2.5 py-1 text-white text-xs"
                                  >
                                    <option value="INCLUDED">Included</option>
                                    <option value="CREDIT_BASED">Credit Based</option>
                                    <option value="PAID_ADDON">Paid Add-on</option>
                                  </select>
                                ) : (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                    s.billingType === "INCLUDED" 
                                      ? "bg-green/10 text-green border-green/20"
                                      : s.billingType === "CREDIT_BASED"
                                      ? "bg-[#448AFF]/15 text-[#448AFF] border-[#448AFF]/20"
                                      : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  }`}>
                                    {s.billingType.replace("_", " ")}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-bold">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={serviceCost}
                                    onChange={(e) => setServiceCost(e.target.value)}
                                    className="w-16 bg-[#1A1A20] border border-white/10 rounded px-2.5 py-1 text-white text-xs"
                                  />
                                ) : (
                                  <span>{s.creditCost} Credits</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isEditing ? (
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={handleUpdateService}
                                      disabled={submitting}
                                      className="px-3 py-1 rounded bg-[#4CAF50] text-[#1a1a1a] font-bold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingService(null)}
                                      className="px-3 py-1 rounded bg-white/5 border border-white/10"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingService(s);
                                      setServiceCost(s.creditCost.toString());
                                      setServiceBillingType(s.billingType);
                                    }}
                                    className="text-[#448AFF] hover:underline flex items-center gap-1.5 ml-auto"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                    Modify Costs
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "promos" && (
              <>
                {/* Coupon Form */}
                <div className="lg:col-span-5">
                  <div className="glass-card p-6 bg-[#16161B] border border-white/10 rounded-2xl">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#40C4FF]">local_activity</span>
                      Create Promo Discount Code
                    </h2>

                    <form onSubmit={handleCreatePromo} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                          Promo Code String
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. WELCOME50"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                            Discount Type
                          </label>
                          <select
                            value={discountType}
                            onChange={(e: any) => setDiscountType(e.target.value)}
                            className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                          >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FLAT">Flat Amount (INR)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="e.g. 50"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                            Usage Limit
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={maxUsage}
                            onChange={(e) => setMaxUsage(e.target.value)}
                            className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                            Expiration Date
                          </label>
                          <input
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="w-full bg-[#1A1A20] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full btn-3d-blue py-2.5 rounded-xl font-bold text-white text-sm shadow-[var(--shadow-btn-blue)] transition-all"
                      >
                        {submitting ? "Publishing..." : "Launch Coupon"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Coupons List */}
                <div className="lg:col-span-7">
                  <div className="glass-card bg-[#16161B] border border-white/10 rounded-2xl p-6">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#FF5252]">local_activity</span>
                      Campaign Discount Coupons
                    </h2>

                    <div className="space-y-4">
                      {promos.map((pr) => (
                        <div
                          key={pr.id}
                          className="p-4 rounded-xl border border-white/5 bg-white/2 flex justify-between items-center"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-black text-sm text-[#448AFF] bg-[#448AFF]/15 px-3 py-0.5 rounded border border-[#448AFF]/20">
                                {pr.code}
                              </span>
                              <span className="text-[10px] text-[#94A3B8]">
                                {pr.discountType === "PERCENTAGE" ? `${pr.discountValue}% Discount` : `Flat ₹${pr.discountValue} Off`}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#CBD5E1] mt-2">
                              Max Limit: {pr.maxUsage} • Used: {pr.usageCount}
                            </p>
                          </div>

                          <button
                            onClick={() => handleArchivePromo(pr.code)}
                            className="p-2 border border-white/10 hover:bg-white/5 rounded-lg text-[#FF5252]"
                            title="Deactivate Coupon"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
