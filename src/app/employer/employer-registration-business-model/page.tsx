"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function EmployerRegistrationBusinessModelPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      
      <div className="max-w-5xl mx-auto py-4 px-4 overflow-hidden flex-1">
        {/* Registration Progress */}
        <div className="mb-4 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-1 rounded-full bg-primary"></div>
            <div className="w-6 h-1 rounded-full bg-primary"></div>
            <div className="w-6 h-1 rounded-full bg-primary"></div>
            <div className="w-6 h-1 rounded-full bg-white/10"></div>
          </div>
          <p className="font-label-md text-xs text-text-secondary uppercase tracking-widest">Step 3: Commercial Model</p>
        </div>

        <div className="text-center mb-6">
          <h2 className="font-display-xl text-headline-md text-text-primary mb-1">Choose your growth engine.</h2>
          <p className="font-body-lg text-xs text-text-secondary max-w-xl mx-auto">Select the commercial model that aligns with your hiring volume. You can switch plans at any time.</p>
        </div>

        {/* Selection Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Option 1: HireGo Managed Hiring™ */}
          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-yellow transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow/10 rounded-full blur-3xl group-hover:bg-yellow/20 transition-all"></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-surface-container-low p-2.5 rounded-xl border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px] text-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
                </div>
                <div className="bg-surface-container-highest px-3 py-0.5 rounded-full border border-white/10">
                  <span className="font-label-md text-xs text-on-surface">Managed Hiring™</span>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-sm text-text-primary mb-1">HireGo Managed Hiring™</h3>
              <p className="font-body-md text-xs text-text-secondary mb-4">Complete end-to-end recruitment with AI matching, screening, and 90-day replacement warranty.</p>
              <div className="space-y-2 mb-5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-secondary">Platform Upfront Fee</span>
                  <span className="font-bold text-text-primary">$0 / mo</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-secondary">Placement Success Fee</span>
                  <span className="font-bold text-yellow">8.33% to 15% of CTC + GST</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-secondary">Billing Scope</span>
                  <span className="font-bold text-white">Applies for each service placement</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-secondary">AI Proctoring & Screening</span>
                  <span className="font-bold text-text-primary">Included</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-text-secondary">Replacement Warranty</span>
                  <span className="font-bold text-green">Up to 90 Days</span>
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/employer/employer-registration-document-verification?model=managed")} className="btn-3d-red h-12 w-full rounded-2xl font-headline-md text-xs text-white flex items-center justify-center gap-2">
              <span>Activate Managed Hiring™</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Option 2: Subscription */}
          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-tertiary transition-all duration-300 border-primary/30">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-surface-container-low p-2.5 rounded-xl border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <div className="bg-primary/20 px-3 py-0.5 rounded-full border border-primary/30">
                  <span className="font-label-md text-xs text-primary font-bold">Popular Choice</span>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-sm text-text-primary mb-1">Subscription Plans</h3>
              <p className="font-body-md text-xs text-text-secondary mb-4">For high-growth companies. Fixed monthly or annual cost with zero placement fees.</p>
              <div className="space-y-2 mb-5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-secondary">Monthly Rate</span>
                  <div className="text-right">
                    <span className="font-bold text-text-primary">$499</span>
                    <span className="text-[10px] text-tertiary uppercase font-bold ml-1.5">14-Day Free Trial</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-secondary">Placement Fee</span>
                  <span className="font-bold text-green">$0 / hire</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-text-secondary">Analytics Suite</span>
                  <span className="font-bold text-text-primary">Enterprise</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-text-secondary">Priority Support</span>
                  <span className="font-bold text-text-primary">24/7 Dedicated</span>
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/employer/employer-registration-plan-selection?model=subscription")} className="btn-3d-red h-12 w-full rounded-2xl font-headline-md text-xs text-white flex items-center justify-center gap-2">
              <span>Start 14-Day Trial</span>
              <span className="material-symbols-outlined text-[18px]">bolt</span>
            </button>
          </div>
        </div>

        {/* Comparison Badge Section */}
        <div className="p-4 glass-card rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
            </div>
            <div>
              <h4 className="font-bold text-text-primary text-xs">Secure Infrastructure</h4>
              <p className="text-text-secondary text-[11px]">All transactions processed via SOC2-compliant gateways.</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-[11px] text-text-muted">SOC2 Certified • 256-Bit SSL Encryption</span>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="mt-5 flex items-center justify-between">
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-secondary font-label-md text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span>Previous Step</span>
          </button>
          <p className="font-label-md text-xs text-text-muted hidden md:block">Need a custom enterprise plan? <a className="text-primary hover:underline font-bold" href="#">Contact Sales</a></p>
        </div>
      </div>
    </div>
  );
}
