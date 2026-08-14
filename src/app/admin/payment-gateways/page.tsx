"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPaymentGatewaysPage() {
  const [config, setConfig] = useState<any>({
    mode: "AUTO",
    primaryGateway: "RAZORPAY",
    autoFailover: true,
    allowEmployerSelection: true,
    gatewaysStatus: {
      RAZORPAY: "HEALTHY",
      PAYU: "HEALTHY",
      PHONEPE: "HEALTHY",
    },
    priorities: ["RAZORPAY", "PAYU", "PHONEPE"],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/admin/payment-gateway/config");
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error("Failed to load gateway config", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/payment-gateway/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Multi-gateway payment configuration saved!");
        setTimeout(() => setToast(null), 3000);
      } else {
        alert("Failed to save: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleGatewayStatus = (gw: string) => {
    const current = config.gatewaysStatus[gw] || "HEALTHY";
    const next = current === "HEALTHY" ? "DEGRADED" : current === "DEGRADED" ? "DISABLED" : "HEALTHY";
    setConfig({
      ...config,
      gatewaysStatus: {
        ...config.gatewaysStatus,
        [gw]: next,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-white p-6 font-[family-name:var(--font-body)]">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black font-extrabold px-5 py-3 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#448AFF] text-3xl">payments</span>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
                Payment Gateway Management Hub
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Admin Controller for Razorpay, PayU, and PhonePe with Safe Failover and Health Monitoring
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#448AFF] text-white font-extrabold text-xs shadow-lg hover:bg-[#2979FF] transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined animate-spin text-3xl text-[#448AFF]">progress_activity</span>
            <p className="text-xs mt-2 font-mono">Loading Payment Gateway Configuration...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Global Controller Config Panel */}
            <div className="md:col-span-4 glass-card p-6 bg-[#16161B] border border-white/10 rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#448AFF]">tune</span>
                Routing Controller
              </h2>

              {/* Mode */}
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Routing Mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setConfig({ ...config, mode: "AUTO" })}
                    className={`py-2 rounded-lg font-bold transition-all ${
                      config.mode === "AUTO" ? "bg-[#448AFF] text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    AUTO (Health)
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, mode: "MANUAL" })}
                    className={`py-2 rounded-lg font-bold transition-all ${
                      config.mode === "MANUAL" ? "bg-[#448AFF] text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    MANUAL (Fixed)
                  </button>
                </div>
              </div>

              {/* Primary Gateway */}
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Primary Gateway
                </label>
                <select
                  value={config.primaryGateway}
                  onChange={(e) => setConfig({ ...config, primaryGateway: e.target.value })}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-xs text-white font-bold"
                >
                  <option value="RAZORPAY">Razorpay (Default)</option>
                  <option value="PAYU">PayU Money</option>
                  <option value="PHONEPE">PhonePe PG</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-4 border-t border-white/5 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">Auto Failover</p>
                    <p className="text-[10px] text-slate-400">Switch gateway on order-creation failure</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, autoFailover: !config.autoFailover })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      config.autoFailover ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.autoFailover ? "translate-x-6" : ""}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">Employer Selection</p>
                    <p className="text-[10px] text-slate-400 font-normal">Allow employers to pick gateway at checkout</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, allowEmployerSelection: !config.allowEmployerSelection })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      config.allowEmployerSelection ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.allowEmployerSelection ? "translate-x-6" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Provider Health & Metrics Cards */}
            <div className="md:col-span-8 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">ecg</span>
                Provider Health &amp; Priority Stack
              </h2>

              {["RAZORPAY", "PAYU", "PHONEPE"].map((gw) => {
                const status = config.gatewaysStatus[gw] || "HEALTHY";
                return (
                  <div
                    key={gw}
                    className="glass-card p-5 bg-[#16161B] border border-white/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-extrabold text-white font-mono">{gw}</h3>
                        {config.primaryGateway === gw && (
                          <span className="px-2 py-0.5 rounded-full bg-[#448AFF]/20 text-[#448AFF] border border-[#448AFF]/30 text-[9px] font-extrabold uppercase">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Priority Rank: #{config.priorities.indexOf(gw) + 1} • Webhook HMAC Verified
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Health Status Toggle */}
                      <button
                        onClick={() => toggleGatewayStatus(gw)}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border flex items-center gap-1.5 transition-all ${
                          status === "HEALTHY"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                            : status === "DEGRADED"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                            : "bg-red-500/15 text-red-400 border-red-500/20"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span>{status}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
