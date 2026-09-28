"use client";

import React, { useCallback, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type PlatformConfig = Record<string, unknown> & {
  managedHiringEnabled?: boolean;
  aiCopilotEnabled?: boolean;
  proctoringEnabled?: boolean;
  autoInvoicingEnabled?: boolean;
  replacementWarrantyEnabled?: boolean;
  slabPricingEnabled?: boolean;
  defaultPlacementFeePct?: number;
  defaultReplacementDays?: number;
  defaultCreditDays?: number;
  taxRatePct?: number;
  slaResponseHours?: number;
  maxActiveRequirementsPerCompany?: number;
};

const FEATURE_FLAGS = [
  { key: "managedHiringEnabled", label: "HireGo Managed Hiring™ Engine", desc: "Enable 6-step requirement wizard & sales pipeline" },
  { key: "aiCopilotEnabled", label: "AI Screening & Copilot", desc: "Enable automated candidate scoring & ranking" },
  { key: "proctoringEnabled", label: "Proctoring & Security Engine", desc: "Enable live proctoring monitoring & risk alerts" },
  { key: "autoInvoicingEnabled", label: "Automated Commercial Invoicing", desc: "Trigger automatic placement fee invoices on joining" },
  { key: "replacementWarrantyEnabled", label: "Replacement Warranty Engine", desc: "Track candidate replacement claims & credit notes" },
  { key: "slabPricingEnabled", label: "Tiered Slab Pricing Engine", desc: "Enable automated CTC slab pricing rules" },
] as const;

const NUMERIC_FIELDS = [
  { name: "defaultPlacementFeePct", label: "Default Placement Fee (%)", step: "0.01", min: 0, max: 100 },
  { name: "defaultReplacementDays", label: "Default Replacement SLA (Days)", step: "1", min: 0, max: 3650 },
  { name: "defaultCreditDays", label: "Default Net Credit Terms (Days)", step: "1", min: 0, max: 3650 },
  { name: "taxRatePct", label: "GST Rate (%)", step: "0.01", min: 0, max: 100 },
  { name: "slaResponseHours", label: "Sales SLA Response (Hours)", step: "1", min: 1, max: 8760 },
  { name: "maxActiveRequirementsPerCompany", label: "Max Reqs Per Employer", step: "1", min: 1, max: 100000 },
] as const;

export default function AdminManagedHiringSettingsPage() {
  const [config, setConfig] = useState<PlatformConfig>({});
  const [loading, setLoading] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/admin/config", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.config || typeof data.config !== "object") {
        throw new Error(data.error || "Unable to load authoritative platform configuration.");
      }
      setConfig(data.config);
      setConfigLoaded(true);
    } catch (error) {
      setConfig({});
      setConfigLoaded(false);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to load authoritative platform configuration.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleToggle = (key: (typeof FEATURE_FLAGS)[number]["key"]) => {
    if (!configLoaded) return;
    setConfig((previous) => ({ ...previous, [key]: !Boolean(previous[key]) }));
  };

  const handleNumberChange = (name: (typeof NUMERIC_FIELDS)[number]["name"], rawValue: string) => {
    if (!configLoaded || rawValue.trim() === "") return;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    setConfig((previous) => ({ ...previous, [name]: value }));
  };

  const handleSave = async () => {
    if (!configLoaded) {
      setSaveMessage({ type: "error", text: "Load the authoritative server configuration before making changes." });
      return;
    }

    setSaveMessage(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.config) {
        throw new Error(data.error || "Unable to update platform configuration.");
      }
      setConfig(data.config);
      setConfigLoaded(true);
      setSaveMessage({ type: "success", text: "Platform configuration updated successfully." });
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to update platform configuration. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-5xl mx-auto">
        {saveMessage && (
          <div
            role={saveMessage.type === "error" ? "alert" : "status"}
            aria-live={saveMessage.type === "error" ? "assertive" : "polite"}
            className={`rounded-xl border px-4 py-3 text-sm ${saveMessage.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}
          >
            {saveMessage.text}
          </div>
        )}

        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#FFCA28]/10 text-[#FFCA28] border border-[#FFCA28]/20 mb-1">
              SYSTEM CONTROL PANEL
            </div>
            <h1 className="text-2xl font-bold text-white">Feature Flags & Platform Defaults</h1>
            <p className="text-xs text-slate-400">Edit only configuration loaded from the authoritative server record.</p>
          </div>

          <button
            type="button"
            disabled={saving || loading || !configLoaded}
            onClick={() => void handleSave()}
            className="px-6 py-2.5 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90 shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading authoritative system settings...</div>
        ) : !configLoaded ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
            <p className="font-bold">Authoritative platform configuration is unavailable.</p>
            <p className="mt-2 text-red-200/80">No local fallback can be edited or saved while the server configuration is unavailable.</p>
            <button
              type="button"
              onClick={() => void fetchConfig()}
              className="mt-4 rounded-xl border border-red-300/30 px-4 py-2 text-xs font-bold hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#29B6F6]">toggle_on</span> Module Feature Flags
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURE_FLAGS.map((flag) => (
                  <div key={flag.key} className="p-4 bg-[#16161B] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white">{flag.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{flag.desc}</p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={Boolean(config[flag.key])}
                      aria-label={`${flag.label}: ${config[flag.key] ? "enabled" : "disabled"}`}
                      onClick={() => handleToggle(flag.key)}
                      className={`w-12 h-6 rounded-full transition-all relative ${config[flag.key] ? "bg-[#26A69A]" : "bg-slate-700"}`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${config[flag.key] ? "left-6" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FFCA28]">settings_suggest</span> Commercial Configuration
                </h3>
                <p className="mt-1 text-[11px] text-slate-400">Blank values mean no value is currently configured; this page does not invent a commercial default.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {NUMERIC_FIELDS.map((field) => (
                  <div key={field.name}>
                    <label className="text-xs text-slate-400 mb-1 block" htmlFor={field.name}>{field.label}</label>
                    <input
                      id={field.name}
                      type="number"
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      name={field.name}
                      value={typeof config[field.name] === "number" ? String(config[field.name]) : ""}
                      onChange={(event) => handleNumberChange(field.name, event.target.value)}
                      className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
