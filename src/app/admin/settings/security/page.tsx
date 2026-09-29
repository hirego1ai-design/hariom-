"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type SecurityStatus = {
  success: boolean;
  observedAt: string;
  summary: string;
  applicationControls: {
    contentSecurityPolicy: { configured: boolean; mode: string; value: string };
    hsts: { configured: boolean; value: string };
    clickjackingProtection: boolean;
    mimeSniffingProtection: boolean;
    referrerPolicy: { configured: boolean; value: string };
    permissionsPolicy: { configured: boolean; value: string };
    crossOriginPolicies: {
      openerPolicy: string | null;
      resourcePolicy: string | null;
      embedderPolicy: string | null;
      browserIsolationConfigured: boolean;
      reason: string;
    };
  };
  measurements: Record<string, { status: string; reason: string }>;
};

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch("/api/admin/security/status", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load security evidence.");
        }
        return result;
      })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setData(null);
        setError(cause instanceof Error ? cause.message : "Unable to load security evidence.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const controls = data
    ? [
        ["Content Security Policy", data.applicationControls.contentSecurityPolicy.configured],
        ["HSTS", data.applicationControls.hsts.configured],
        ["Clickjacking protection", data.applicationControls.clickjackingProtection],
        ["MIME-sniffing protection", data.applicationControls.mimeSniffingProtection],
        ["Referrer Policy", data.applicationControls.referrerPolicy.configured],
        ["Permissions Policy", data.applicationControls.permissionsPolicy.configured],
        ["Browser cross-origin isolation", data.applicationControls.crossOriginPolicies.browserIsolationConfigured],
      ] as const
    : [];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Security Posture"
          subtitle="Application configuration evidence; external security measurements remain separate"
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <div className="border-b border-white/10 pb-4">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300">
              CONFIGURATION EVIDENCE
            </div>
            <h1 className="text-2xl font-bold">Security posture evidence</h1>
            <p className="mt-1 text-xs text-slate-400">
              No simulated security score, live-WAF claim, vulnerability count, or compliance certification is inferred from application code.
            </p>
          </div>

          {loading ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-slate-400">
              Loading configured security controls…
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
          ) : data ? (
            <div className="space-y-6">
              <section className="rounded-2xl border border-amber-400/20 bg-[#121215] p-6 shadow-xl">
                <h2 className="text-lg font-bold">Evidence scope</h2>
                <p className="mt-2 text-xs text-slate-400">{data.summary}</p>
                <p className="mt-3 text-[10px] text-slate-500">Observed {new Date(data.observedAt).toLocaleString()}</p>
              </section>

              <section className="space-y-4 rounded-2xl border border-white/10 bg-[#121215] p-5 shadow-xl sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider">Application-configured controls</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {controls.map(([label, enabled]) => (
                    <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#16161B] p-4">
                      <span className="text-xs font-bold">{label}</span>
                      <span className={`text-[10px] font-bold ${enabled ? "text-emerald-300" : "text-amber-300"}`}>
                        {enabled ? "CONFIGURED IN APP" : "NOT CLAIMED"}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="break-all text-[10px] text-slate-500">
                  CSP: {data.applicationControls.contentSecurityPolicy.value}
                </p>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[10px] text-slate-400">
                  <p>COOP: {data.applicationControls.crossOriginPolicies.openerPolicy || "Not configured"}</p>
                  <p className="mt-1">CORP: {data.applicationControls.crossOriginPolicies.resourcePolicy || "Not configured"}</p>
                  <p className="mt-1">COEP: {data.applicationControls.crossOriginPolicies.embedderPolicy || "Not configured"}</p>
                  <p className="mt-2">{data.applicationControls.crossOriginPolicies.reason}</p>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-white/10 bg-[#121215] p-5 shadow-xl sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider">Measurements awaiting external evidence</h2>
                {Object.entries(data.measurements).map(([name, measurement]) => (
                  <div key={name} className="rounded-xl border border-white/5 bg-[#16161B] p-4">
                    <div className="flex justify-between gap-4">
                      <span className="text-xs font-bold capitalize">{name.replaceAll("_", " ")}</span>
                      <span className="text-[10px] font-bold text-amber-300">{measurement.status.replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{measurement.reason}</p>
                  </div>
                ))}
              </section>
            </div>
          ) : (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Security evidence is unavailable.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
