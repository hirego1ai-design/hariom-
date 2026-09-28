"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type PricingModel = "PERCENTAGE" | "FIXED" | "HYBRID" | "SLAB";

type Calculation = {
  baseFee: number;
  retainerFee: number;
  successFee: number;
  grossFee: number;
  discountPct: number;
  discountAmount: number;
  subtotal: number;
  taxRatePct: number;
  taxAmount: number;
  totalAmount: number;
  effectivePct: number;
  replacementWarrantyDays: number;
};

type SlabInput = {
  upperBound: string;
  feePct: string;
};

function parseRequiredNumber(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid number.`);
  return parsed;
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function AdminPricingEnginePage() {
  const [currency, setCurrency] = useState("");
  const [ctcAnnual, setCtcAnnual] = useState("");
  const [pricingModel, setPricingModel] = useState<PricingModel>("PERCENTAGE");
  const [feeValue, setFeeValue] = useState("");
  const [retainerAmount, setRetainerAmount] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [replacementDays, setReplacementDays] = useState("");
  const [taxRatePct, setTaxRatePct] = useState("");
  const [slabs, setSlabs] = useState<SlabInput[]>([{ upperBound: "", feePct: "" }]);

  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [calculatedCurrency, setCalculatedCurrency] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCalculation(null);
    setCalculatedCurrency("");
    setError("");
  }, [
    currency,
    ctcAnnual,
    pricingModel,
    feeValue,
    retainerAmount,
    discountPct,
    replacementDays,
    taxRatePct,
    slabs,
  ]);

  function addFiniteSlab() {
    setSlabs((current) => [
      ...current.slice(0, -1),
      { upperBound: "", feePct: "" },
      current[current.length - 1] || { upperBound: "", feePct: "" },
    ]);
  }

  function updateSlab(index: number, patch: Partial<SlabInput>) {
    setSlabs((current) =>
      current.map((slab, slabIndex) => (slabIndex === index ? { ...slab, ...patch } : slab)),
    );
  }

  function removeFiniteSlab(index: number) {
    setSlabs((current) => current.filter((_, slabIndex) => slabIndex !== index));
  }

  async function calculate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCalculation(null);

    try {
      const normalizedCurrency = currency.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
        throw new Error("Enter a valid 3-letter currency code.");
      }

      const body: Record<string, unknown> = {
        ctcAnnual: parseRequiredNumber(ctcAnnual, "Annual CTC"),
        currency: normalizedCurrency,
        pricingModel,
        discountPct: discountPct.trim() ? parseRequiredNumber(discountPct, "Discount") : 0,
        taxRatePct: parseRequiredNumber(taxRatePct, "Tax rate"),
        replacementDays: parseRequiredNumber(replacementDays, "Replacement warranty"),
      };

      if (pricingModel === "PERCENTAGE" || pricingModel === "FIXED") {
        body.feeValue = parseRequiredNumber(
          feeValue,
          pricingModel === "PERCENTAGE" ? "Placement rate" : "Fixed fee",
        );
      } else if (pricingModel === "HYBRID") {
        body.feeValue = parseRequiredNumber(feeValue, "Success fee rate");
        body.retainerAmount = parseRequiredNumber(retainerAmount, "Retainer amount");
      } else {
        body.slabs = slabs.map((slab, index) => ({
          upToCtcAnnual:
            index === slabs.length - 1
              ? null
              : parseRequiredNumber(slab.upperBound, `Slab ${index + 1} upper bound`),
          feePct: parseRequiredNumber(slab.feePct, `Slab ${index + 1} fee rate`),
        }));
      }

      setCalculating(true);
      const response = await fetch("/api/admin/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.calculation) {
        throw new Error(payload.error || "Unable to calculate commercial fee.");
      }

      setCalculation(payload.calculation);
      setCalculatedCurrency(normalizedCurrency);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to calculate commercial fee.");
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Commercial Pricing Calculator"
          subtitle="Non-persistent scenario calculator; signed managed-hiring agreements remain authoritative."
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            This screen does not load or save commercial terms. Enter every scenario input explicitly. A calculation is not a quote, invoice, or signed agreement.
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
            <form onSubmit={calculate} className="space-y-6 rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6">
              <div>
                <h1 className="text-xl font-bold">Scenario inputs</h1>
                <p className="mt-1 text-xs text-slate-400">No production commercial defaults are prefilled.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs text-slate-400">
                  Currency
                  <input
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                    maxLength={3}
                    placeholder="e.g. INR"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-4 py-2.5 text-sm uppercase text-white"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Annual CTC
                  <input
                    value={ctcAnnual}
                    onChange={(event) => setCtcAnnual(event.target.value)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter annual CTC"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-4 py-2.5 text-sm text-white"
                  />
                </label>
              </div>

              <fieldset>
                <legend className="mb-2 text-xs font-bold text-slate-400">Pricing model</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([
                    ["PERCENTAGE", "Percentage"],
                    ["FIXED", "Fixed fee"],
                    ["HYBRID", "Hybrid"],
                    ["SLAB", "Slab"],
                  ] as const).map(([model, label]) => (
                    <button
                      key={model}
                      type="button"
                      aria-pressed={pricingModel === model}
                      onClick={() => setPricingModel(model)}
                      className={`rounded-xl border p-3 text-xs font-bold transition ${
                        pricingModel === model
                          ? "border-[#29B6F6] bg-[#29B6F6]/10 text-white"
                          : "border-white/10 bg-[#16161B] text-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {(pricingModel === "PERCENTAGE" || pricingModel === "FIXED") && (
                <label className="block text-xs text-slate-400">
                  {pricingModel === "PERCENTAGE" ? "Placement rate (%)" : "Fixed fee amount"}
                  <input
                    value={feeValue}
                    onChange={(event) => setFeeValue(event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-4 py-2.5 text-sm text-white"
                  />
                </label>
              )}

              {pricingModel === "HYBRID" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs text-slate-400">
                    Retainer amount
                    <input
                      value={retainerAmount}
                      onChange={(event) => setRetainerAmount(event.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-4 py-2.5 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Success fee rate (%)
                    <input
                      value={feeValue}
                      onChange={(event) => setFeeValue(event.target.value)}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-4 py-2.5 text-sm text-white"
                    />
                  </label>
                </div>
              )}

              {pricingModel === "SLAB" && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">CTC slabs</p>
                      <p className="mt-1 text-[11px] text-slate-500">Final slab is always open-ended.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addFiniteSlab}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold"
                    >
                      Add finite slab
                    </button>
                  </div>

                  {slabs.map((slab, index) => {
                    const final = index === slabs.length - 1;
                    return (
                      <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="text-xs text-slate-400">
                          {final ? "Upper bound" : "Up to annual CTC"}
                          <input
                            value={final ? "" : slab.upperBound}
                            onChange={(event) => updateSlab(index, { upperBound: event.target.value })}
                            disabled={final}
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder={final ? "Open-ended" : "Enter upper bound"}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-sm text-white disabled:opacity-60"
                          />
                        </label>
                        <label className="text-xs text-slate-400">
                          Fee rate (%)
                          <input
                            value={slab.feePct}
                            onChange={(event) => updateSlab(index, { feePct: event.target.value })}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            required
                            className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-sm text-white"
                          />
                        </label>
                        {!final && (
                          <button
                            type="button"
                            onClick={() => removeFiniteSlab(index)}
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-xs text-slate-400">
                  Discount (%)
                  <input
                    value={discountPct}
                    onChange={(event) => setDiscountPct(event.target.value)}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0 if none"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Tax rate (%)
                  <input
                    value={taxRatePct}
                    onChange={(event) => setTaxRatePct(event.target.value)}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Replacement warranty (days)
                  <input
                    value={replacementDays}
                    onChange={(event) => setReplacementDays(event.target.value)}
                    type="number"
                    min="0"
                    max="3650"
                    step="1"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#16161B] px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={calculating}
                className="rounded-xl bg-[#29B6F6] px-5 py-3 text-xs font-bold text-white disabled:opacity-40"
              >
                {calculating ? "Calculating…" : "Calculate scenario"}
              </button>
            </form>

            <section className="rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6" aria-labelledby="pricing-result-heading">
              <h2 id="pricing-result-heading" className="text-lg font-bold">Calculation result</h2>
              {!calculation || !calculatedCurrency ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                  Enter the complete scenario and calculate. No result is inferred before server validation.
                </div>
              ) : (
                <div className="mt-5 space-y-3 text-sm">
                  {[
                    ["Gross fee", calculation.grossFee],
                    ["Discount", -calculation.discountAmount],
                    ["Subtotal", calculation.subtotal],
                    ["Tax", calculation.taxAmount],
                    ["Total", calculation.totalAmount],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex items-center justify-between gap-4 border-b border-white/5 py-2">
                      <span className="text-slate-400">{label}</span>
                      <strong>{money(Number(value), calculatedCurrency)}</strong>
                    </div>
                  ))}
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300">
                    <p>Effective fee: <strong>{calculation.effectivePct}%</strong> of supplied CTC</p>
                    <p className="mt-1">Replacement warranty: <strong>{calculation.replacementWarrantyDays} days</strong></p>
                    <p className="mt-2 text-slate-500">Scenario only. Nothing on this page is persisted.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
