"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type PlatformConfig = {
  managedHiringEnabled?: boolean;
  aiCopilotEnabled?: boolean;
  proctoringEnabled?: boolean;
  autoInvoicingEnabled?: boolean;
  replacementWarrantyEnabled?: boolean;
  slabPricingEnabled?: boolean;
  slaResponseHours?: number;
  maxActiveRequirementsPerCompany?: number;
  lastUpdated: string | null;
};

const FEATURE_FLAGS = [
  {
    key: "managedHiringEnabled",
    label: "Managed Hiring module",
    desc: "Persisted platform control for Managed Hiring surfaces.",
  },
  {
    key: "aiCopilotEnabled",
    label: "AI screening & Copilot",
    desc: "Persisted platform control for AI-assisted workflow features.",
  },
  {
    key: "proctoringEnabled",
    label: "Proctoring",
    desc: "Persisted platform control for proctoring-enabled workflow surfaces.",
  },
  {
    key: "autoInvoicingEnabled",
    label: "Automated invoicing",
    desc: "Persisted platform control for automated invoice workflow availability.",
  },
  {
    key: "replacementWarrantyEnabled",
    label: "Replacement warranty workflow",
    desc: "Persisted platform control for replacement-warranty workflow availability.",
  },
  {
    key: "slabPricingEnabled",
    label: "Slab-pricing workflow",
    desc: "Persisted platform control for slab-pricing workflow availability.",
  },
] as const;

const NUMERIC_CONTROLS = [
  {
    key: "slaResponseHours",
    label: "Sales response SLA (hours)",
    min: 1,
    max: 8760,
  },
  {
    key: "maxActiveRequirementsPerCompany",
    label: "Maximum active requirements per company",
    min: 1,
    max: 100000,
  },
] as const;

type EditableKey =
  | (typeof FEATURE_FLAGS)[number]["key"]
  | (typeof NUMERIC_CONTROLS)[number]["key"];

export default function AdminManagedHiringSettingsPage() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/config", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.config) {
        throw new Error(
          payload.error || "Unable to load authoritative platform controls.",
        );
      }
      setConfig(payload.config);
    } catch (cause) {
      setConfig(null);
      setMessage({
        type: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "Unable to load authoritative platform controls.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(
    key: (typeof FEATURE_FLAGS)[number]["key"],
  ) {
    if (!config) return;
    setConfig({
      ...config,
      [key]: !Boolean(config[key]),
    });
  }

  function setNumber(
    key: (typeof NUMERIC_CONTROLS)[number]["key"],
    raw: string,
  ) {
    if (!config) return;
    if (!raw.trim()) {
      const next = { ...config };
      delete next[key];
      setConfig(next);
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    setConfig({ ...config, [key]: value });
  }

  async function save() {
    if (!config || saving || reason.trim().length < 3) return;

    const editable: Partial<Record<EditableKey, boolean | number>> = {};
    for (const flag of FEATURE_FLAGS) {
      if (typeof config[flag.key] === "boolean") {
        editable[flag.key] = config[flag.key];
      }
    }
    for (const control of NUMERIC_CONTROLS) {
      if (typeof config[control.key] === "number") {
        editable[control.key] = config[control.key];
      }
    }

    if (Object.keys(editable).length === 0) {
      setMessage({
        type: "error",
        text: "Configure at least one platform control before saving.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: editable,
          expectedUpdatedAt: config.lastUpdated,
          reason: reason.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.config) {
        throw new Error(payload.error || "Unable to update platform controls.");
      }

      setConfig(payload.config);
      setReason("");
      setMessage({
        type: "success",
        text: "Platform controls updated and audited.",
      });
    } catch (cause) {
      setMessage({
        type: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "Unable to update platform controls.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Managed Hiring Settings"
          subtitle="Platform controls only; commercial terms live in Agreement Templates"
        />

        <main className="mx-auto w-full max-w-5xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
                Platform controls
              </p>
              <h1 className="mt-2 text-2xl font-bold">
                Managed Hiring feature controls
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                This page does not define placement fees, GST, credit terms or
                replacement days. Those commercial terms are configured per
                Agreement Template and snapshotted into each signed agreement.
              </p>
            </div>
            <Link
              href="/admin/agreements/templates"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white"
            >
              Manage commercial templates
            </Link>
          </header>

          {message && (
            <div
              role={message.type === "error" ? "alert" : "status"}
              aria-live="polite"
              className={`rounded-xl border p-4 text-sm ${
                message.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {loading ? (
            <div role="status" className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-slate-400">
              Loading authoritative platform controls…
            </div>
          ) : !config ? (
            <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
              <h2 className="font-bold">Platform controls are unavailable.</h2>
              <p className="mt-2 text-red-200/80">
                No local fallback is shown or editable.
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 rounded-xl border border-red-300/30 px-4 py-2 text-xs font-bold"
              >
                Retry
              </button>
            </section>
          ) : (
            <>
              <section className="rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="font-bold">Feature controls</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    “Not configured” is shown explicitly instead of assuming a disabled state.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {FEATURE_FLAGS.map((flag) => {
                    const value = config[flag.key];
                    return (
                      <div
                        key={flag.key}
                        className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#16161B] p-4"
                      >
                        <div>
                          <h3 className="text-xs font-bold">{flag.label}</h3>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {flag.desc}
                          </p>
                          <p className="mt-2 text-[10px] font-bold text-slate-300">
                            {typeof value === "boolean"
                              ? value
                                ? "Configured: enabled"
                                : "Configured: disabled"
                              : "Not configured"}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(value)}
                          onClick={() => toggle(flag.key)}
                          className={`relative h-7 w-12 shrink-0 rounded-full ${
                            value ? "bg-emerald-500" : "bg-white/15"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                              value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                          <span className="sr-only">
                            Toggle {flag.label}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="font-bold">Operational caps</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    These are platform controls, not commercial agreement terms.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {NUMERIC_CONTROLS.map((control) => (
                    <label
                      key={control.key}
                      className="text-xs text-slate-400"
                    >
                      {control.label}
                      <input
                        type="number"
                        min={control.min}
                        max={control.max}
                        step={1}
                        value={
                          typeof config[control.key] === "number"
                            ? String(config[control.key])
                            : ""
                        }
                        onChange={(event) =>
                          setNumber(control.key, event.target.value)
                        }
                        placeholder="Not configured"
                        className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 text-sm text-white"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <h2 className="font-bold text-amber-200">
                  Commercial terms source of truth
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Placement fee, invoice rule, replacement period, credit days,
                  tax rate, discounts and clauses are maintained in Agreement
                  Templates. Contract creation snapshots those approved terms
                  into the Commercial Agreement.
                </p>
                <Link
                  href="/admin/agreements/templates"
                  className="mt-4 inline-flex rounded-xl border border-amber-400/30 px-4 py-2 text-xs font-bold text-amber-200"
                >
                  Open Agreement Templates
                </Link>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <label className="block text-xs text-slate-400">
                  Change reason
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Why are these platform controls changing?"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[10px] text-slate-500">
                    Version: {config.lastUpdated || "not yet persisted"}
                  </p>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving || reason.trim().length < 3}
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Save audited platform controls"}
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
