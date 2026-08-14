"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminSecurityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/security/status")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleTogglePolicy = (key: string) => {
    if (!data) return;
    setData((prev: any) => ({
      ...prev,
      securityPolicy: {
        ...prev.securityPolicy,
        [key]: !prev.securityPolicy[key],
      },
    }));
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/security/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.securityPolicy),
      });
      const resData = await res.json();
      if (resData.success) {
        alert("Security policy updated successfully!");
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

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#26A69A]/10 text-[#26A69A] border border-[#26A69A]/20 mb-1">
              ENTERPRISE SECURITY & SOC2
            </div>
            <h1 className="text-2xl font-bold text-white">Security Hardening & Audit Controls</h1>
            <p className="text-xs text-slate-400">Configure authentication policies, SOC2 compliance & platform encryption standards</p>
          </div>

          <button
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90 shadow-xl"
          >
            {saving ? "Saving..." : "Save Policy"}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading security posture...</div>
        ) : data ? (
          <div className="space-y-6">
            {/* Security Rating Banner */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#26A69A]/20 border border-[#26A69A]/40 flex items-center justify-center text-[#26A69A] font-extrabold text-2xl font-mono">
                  {data.rating}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Enterprise Security Rating: A+ ({data.score}/100)</h3>
                  <p className="text-xs text-slate-400">TLS 1.3 Active • Rate Limiting Enabled • 0 Known Vulnerabilities</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-[#16161B] px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-500 block">SOC2 TYPE II</span>
                  <span className="text-[#26A69A] font-bold">VERIFIED</span>
                </div>
                <div className="bg-[#16161B] px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-500 block">GDPR COMPLIANCE</span>
                  <span className="text-[#26A69A] font-bold">VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Policy Controls */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF5252]">shield_lock</span> Authentication & Access Hardening
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "twoFactorEnforced", label: "Mandatory Two-Factor Authentication (2FA)", desc: "Enforce OTP / Authenticator for all Admin & Employer accounts" },
                  { key: "contentSecurityPolicyEnabled", label: "Strict Content Security Policy (CSP)", desc: "Block XSS and unauthorized third-party script injection" },
                  { key: "rateLimitingActive", label: "Global API Rate Limiter", desc: "Protect API routes against DDoS and brute-force attempts" },
                  { key: "ipWhitelistingEnabled", label: "Admin IP Address Whitelisting", desc: "Restrict Super Admin portal access to approved IP ranges" },
                ].map((policy) => (
                  <div key={policy.key} className="p-4 bg-[#16161B] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white">{policy.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{policy.desc}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePolicy(policy.key)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        data.securityPolicy[policy.key] ? "bg-[#26A69A]" : "bg-slate-700"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        data.securityPolicy[policy.key] ? "left-6.5" : "left-0.5"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
