"use client";

import React, { useState, useMemo } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { calculateCommercialFee, formatCurrency, CommercialPricingModel } from "@/utils";

export default function AdminPricingEnginePage() {
  const [ctcAnnual, setCtcAnnual] = useState(2400000);
  const [pricingModel, setPricingModel] = useState<CommercialPricingModel>("PERCENTAGE");
  const [feeValue, setFeeValue] = useState(8.33);
  const [retainerAmount, setRetainerAmount] = useState(30000);
  const [discountPct, setDiscountPct] = useState(0);
  const [replacementDays, setReplacementDays] = useState(90);
  const [taxRatePct, setTaxRatePct] = useState(18);

  const calc = useMemo(() => {
    return calculateCommercialFee({
      ctcAnnual,
      pricingModel,
      feeValue,
      retainerAmount,
      discountPct,
      taxRatePct,
      replacementDays,
    });
  }, [ctcAnnual, pricingModel, feeValue, retainerAmount, discountPct, taxRatePct, replacementDays]);

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
        <div className="border-b border-white/10 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#FFCA28]/10 text-[#FFCA28] border border-[#FFCA28]/20 mb-1">
            COMMERCIAL ENGINE
          </div>
          <h1 className="text-2xl font-bold text-white">Commercial Pricing & Replacement Engine</h1>
          <p className="text-xs text-slate-400">Configure fee models, replacement warranties & simulate real-time commercial deal values</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Form (Left Column) */}
          <div className="lg:col-span-7 bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#29B6F6]">tune</span> Commercial Simulator Controls
            </h2>

            {/* CTC Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300">Annual CTC (INR)</label>
                <span className="text-sm font-mono font-bold text-[#FFCA28]">{formatCurrency(ctcAnnual)}</span>
              </div>
              <input
                type="range"
                min={300000}
                max={10000000}
                step={100000}
                value={ctcAnnual}
                onChange={(e) => setCtcAnnual(Number(e.target.value))}
                className="w-full h-2 bg-[#16161B] rounded-lg appearance-none cursor-pointer accent-[#29B6F6]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>₹3 LPA</span>
                <span>₹50 LPA</span>
                <span>₹1 Cr</span>
              </div>
            </div>

            {/* Pricing Model Selector */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block">Pricing Model</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "PERCENTAGE", name: "Percentage CTC", icon: "percent" },
                  { id: "FIXED", name: "Fixed Fee", icon: "payments" },
                  { id: "HYBRID", name: "Hybrid Model", icon: "widgets" },
                  { id: "SLAB", name: "Slab-based CTC", icon: "stacked_bar_chart" },
                ].map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setPricingModel(model.id as CommercialPricingModel);
                      if (model.id === "PERCENTAGE") setFeeValue(8.33);
                      if (model.id === "FIXED") setFeeValue(75000);
                    }}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                      pricingModel === model.id
                        ? "bg-[#29B6F6]/10 border-[#29B6F6] text-white"
                        : "bg-[#16161B] border-white/5 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{model.icon}</span>
                    <span className="text-[10px] font-bold">{model.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {pricingModel === "PERCENTAGE" && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Placement Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={feeValue}
                    onChange={(e) => setFeeValue(Number(e.target.value))}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              )}

              {pricingModel === "FIXED" && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Fixed Placement Fee (₹)</label>
                  <input
                    type="number"
                    value={feeValue}
                    onChange={(e) => setFeeValue(Number(e.target.value))}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              )}

              {pricingModel === "HYBRID" && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Retainer Amount (₹)</label>
                    <input
                      type="number"
                      value={retainerAmount}
                      onChange={(e) => setRetainerAmount(Number(e.target.value))}
                      className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Success Fee Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={feeValue}
                      onChange={(e) => setFeeValue(Number(e.target.value))}
                      className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Replacement Warranty Period</label>
                <select
                  value={replacementDays}
                  onChange={(e) => setReplacementDays(Number(e.target.value))}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value={15}>15 Calendar Days</option>
                  <option value={30}>30 Calendar Days</option>
                  <option value={60}>60 Calendar Days</option>
                  <option value={90}>90 Calendar Days</option>
                  <option value={120}>120 Calendar Days</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Special Discount (%)</label>
                <input
                  type="number"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Card (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#26A69A]">receipt_long</span> Commercial Fee Breakdown
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Target Candidate CTC</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(ctcAnnual)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Gross Placement Fee</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(calc.grossFee)}</span>
                </div>
                {calc.discountAmount > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/5 text-[#FF5252]">
                    <span>Discount ({calc.discountPct}%)</span>
                    <span className="font-mono font-bold">-{formatCurrency(calc.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(calc.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">GST ({calc.taxRatePct}%)</span>
                  <span className="font-mono font-bold text-slate-300">+{formatCurrency(calc.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-3 border-t border-white/10 text-sm">
                  <span className="font-bold text-white">Total Payable Commercial</span>
                  <span className="font-mono font-extrabold text-[#26A69A]">{formatCurrency(calc.totalAmount)}</span>
                </div>
              </div>

              <div className="bg-[#16161B] p-4 rounded-xl border border-white/5 text-xs space-y-1">
                <div className="flex justify-between text-[#FFCA28] font-bold">
                  <span>Effective Fee Percentage:</span>
                  <span>{calc.effectivePct}% of CTC</span>
                </div>
                <div className="flex justify-between text-[#29B6F6] font-bold">
                  <span>Replacement Warranty:</span>
                  <span>{calc.replacementWarrantyDays} Days SLA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
