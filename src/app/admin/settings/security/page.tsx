"use client";

import React, { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type SecurityStatus = {
  success: boolean;
  observedAt: string;
  summary: string;
  applicationControls: {
    edgeProxy: boolean;
    contentSecurityPolicy: { configured: boolean; mode: string; value: string };
    hsts: { configured: boolean; value: string };
    clickjackingProtection: boolean;
    mimeSniffingProtection: boolean;
    crossOriginIsolation: boolean;
  };
  measurements: Record<string, { status: string; reason: string }>;
};

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/security/status")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
        <div className="border-b border-white/10 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20 mb-1">
            CONFIGURATION EVIDENCE
          </div>
          <h1 className="text-2xl font-bold text-white">Security Posture</h1>
          <p className="text-xs text-slate-400">Application controls only. External TLS, vulnerability, and compliance evidence is shown separately when connected.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading observed controls...</div>
        ) : data ? (
          <div className="space-y-6">
            <div className="bg-[#121215] border border-amber-400/20 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white">No simulated security score</h3>
              <p className="text-xs text-slate-400 mt-2">{data.summary}</p>
              <p className="text-[10px] text-slate-500 mt-3">Observed {new Date(data.observedAt).toLocaleString()}</p>
            </div>

            <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Application-configured controls</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Edge request proxy", data.applicationControls.edgeProxy],
                  ["Content Security Policy", data.applicationControls.contentSecurityPolicy.configured],
                  ["HSTS", data.applicationControls.hsts.configured],
                  ["Clickjacking protection", data.applicationControls.clickjackingProtection],
                  ["MIME-sniffing protection", data.applicationControls.mimeSniffingProtection],
                  ["Cross-origin isolation", data.applicationControls.crossOriginIsolation],
                ].map(([label, enabled]) => (
                  <div key={String(label)} className="p-4 bg-[#16161B] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-white">{label}</span>
                    <span className={`text-[10px] font-bold ${enabled ? "text-[#26A69A]" : "text-red-400"}`}>{enabled ? "CONFIGURED" : "NOT CONFIGURED"}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 break-all">CSP: {data.applicationControls.contentSecurityPolicy.value}</p>
            </section>

            <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-3 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Measurements awaiting evidence</h2>
              {Object.entries(data.measurements).map(([name, measurement]) => (
                <div key={name} className="p-4 bg-[#16161B] border border-white/5 rounded-xl">
                  <div className="flex justify-between gap-4"><span className="text-xs font-bold text-white capitalize">{name}</span><span className="text-[10px] font-bold text-amber-300">{measurement.status.replaceAll("_", " ")}</span></div>
                  <p className="text-[10px] text-slate-400 mt-1">{measurement.reason}</p>
                </div>
              ))}
            </section>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-red-300">Unable to load security evidence.</div>
        )}
      </main>
    </div>
  );
}
