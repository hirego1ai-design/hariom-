"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminManagedHiringSettingsPage() {
  const [config, setConfig] = useState<any>({
    managedHiringEnabled: true,
    aiCopilotEnabled: true,
    proctoringEnabled: true,
    autoInvoicingEnabled: true,
    replacementWarrantyEnabled: true,
    slabPricingEnabled: true,
    defaultPlacementFeePct: 8.33,
    defaultReplacementDays: 60,
    defaultCreditDays: 15,
    taxRatePct: 18.0,
    maxActiveRequirementsPerCompany: 10,
    slaResponseHours: 24,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setConfig(data.config);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: string) => {
    setConfig((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setConfig((prev: any) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        alert("Platform Configuration & Feature Flags updated successfully!");
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#FFCA28]/10 text-[#FFCA28] border border-[#FFCA28]/20 mb-1">
              SYSTEM CONTROL PANEL
            </div>
            <h1 className="text-2xl font-bold text-white">Feature Flags & Platform Defaults</h1>
            <p className="text-xs text-slate-400">Configure core module feature flags, commercial defaults & SLA parameters</p>
          </div>

          <button
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90 shadow-xl"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading system settings...</div>
        ) : (
          <div className="space-y-8">
            {/* Section 1: Feature Flags */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#29B6F6]">toggle_on</span> Module Feature Flags
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "managedHiringEnabled", label: "HireGo Managed Hiring™ Engine", desc: "Enable 6-step requirement wizard & sales pipeline" },
                  { key: "aiCopilotEnabled", label: "AI Screening & Copilot", desc: "Enable automated candidate scoring & ranking" },
                  { key: "proctoringEnabled", label: "Proctoring & Security Engine", desc: "Enable live proctoring monitoring & risk alerts" },
                  { key: "autoInvoicingEnabled", label: "Automated Commercial Invoicing", desc: "Trigger automatic placement fee invoices on joining" },
                  { key: "replacementWarrantyEnabled", label: "Replacement Warranty Engine", desc: "Track candidate replacement claims & credit notes" },
                  { key: "slabPricingEnabled", label: "Tiered Slab Pricing Engine", desc: "Enable automated CTC slab pricing rules" },
                ].map((flag) => (
                  <div key={flag.key} className="p-4 bg-[#16161B] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white">{flag.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{flag.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(flag.key)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        config[flag.key] ? "bg-[#26A69A]" : "bg-slate-700"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        config[flag.key] ? "left-6.5" : "left-0.5"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Commercial Defaults */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FFCA28]">settings_suggest</span> Commercial Default Parameters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Default Placement Fee (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="defaultPlacementFeePct"
                    value={config.defaultPlacementFeePct}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Default Replacement SLA (Days)</label>
                  <input
                    type="number"
                    name="defaultReplacementDays"
                    value={config.defaultReplacementDays}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Default Net Credit Terms (Days)</label>
                  <input
                    type="number"
                    name="defaultCreditDays"
                    value={config.defaultCreditDays}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">GST Rate (%)</label>
                  <input
                    type="number"
                    name="taxRatePct"
                    value={config.taxRatePct}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Sales SLA Response (Hours)</label>
                  <input
                    type="number"
                    name="slaResponseHours"
                    value={config.slaResponseHours}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Max Reqs Per Employer</label>
                  <input
                    type="number"
                    name="maxActiveRequirementsPerCompany"
                    value={config.maxActiveRequirementsPerCompany}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
