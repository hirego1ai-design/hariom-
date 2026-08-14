"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export default function PaymentGatewayConfigPage() {
  const [razorpayKey, setRazorpayKey] = useState("rzp_live_8910239102");
  const [stripeKey, setStripeKey] = useState("pk_live_51M01923091");
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
        <h1 className="font-display-lg text-display-lg text-white">Payment Gateways Configuration (G06)</h1>
        <p className="text-text-muted text-sm">Manage Razorpay, Stripe, and Bank Transfer checkout webhooks.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Razorpay Live Key ID</label>
          <input
            type="text"
            value={razorpayKey}
            onChange={(e) => setRazorpayKey(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">Stripe Publishable Key</label>
          <input
            type="text"
            value={stripeKey}
            onChange={(e) => setStripeKey(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <button
          onClick={() => {
            setToast("Payment credentials updated!");
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-6 py-2.5 rounded-full bg-gold-payment text-black font-bold text-xs hover:bg-gold-payment/90 shadow-lg transition-all"
        >
          Save Gateway Keys
        </button>
      </div>
    </div>
    </div>
);
}