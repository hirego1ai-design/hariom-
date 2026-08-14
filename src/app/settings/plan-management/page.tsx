"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export default function PlanManagementPage() {
  const [plans, setPlans] = useState([
    { name: "Starter Tier", price: "₹14,999/mo", jobs: 5, seats: 2 },
    { name: "Pro Tier", price: "₹49,999/mo", jobs: 25, seats: 10 },
    { name: "Enterprise Tier", price: "Custom (₹12L/yr)", jobs: "Unlimited", seats: "Unlimited" },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">Plan & Pricing Tier Management (G11)</h1>
        <p className="text-text-muted text-sm">Configure subscription plans, job posting quotas, and candidate candidate search limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {plans.map((p) => (
          <div key={p.name} className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-bold text-lg text-white">{p.name}</h3>
            <p className="text-2xl font-bold text-gold-payment">{p.price}</p>
            <div className="space-y-1 text-xs text-text-muted">
              <p>Job Quota: {p.jobs}</p>
              <p>Recruiter Seats: {p.seats}</p>
            </div>
            <button
              onClick={() => {
                setToast(`Configured tier: ${p.name}`);
                setTimeout(() => setToast(null), 3000);
              }}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors"
            >
              Edit Tier Limits
            </button>
          </div>
        ))}
      </div>
    </div>
    </div>
);
}