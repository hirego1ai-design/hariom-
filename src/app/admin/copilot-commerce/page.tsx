"use client";

import React, { useCallback, useEffect, useState } from "react";

type RegionalPrice = {
  id: string;
  regionCode: string;
  countries: string[];
  currency: string;
  amountMinor: number;
  taxMode: "TAX_EXCLUSIVE" | "TAX_INCLUSIVE" | "MERCHANT_OF_RECORD";
  paymentRoute: "PAYU" | "STRIPE" | "MERCHANT_OF_RECORD";
  isActive: boolean;
};

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string;
  monthlyCapacityUnits: number;
  softWarningPct: number;
  hardWarningPct: number;
  isArchived: boolean;
  regionalPrices: RegionalPrice[];
};

type CapacityOffer = {
  id: string;
  code: string;
  name: string;
  description: string;
  capacityUnits: number;
  isArchived: boolean;
  regionalPrices: RegionalPrice[];
};

type UsageRule = {
  actionKey: string;
  displayName: string;
  unitType: string;
  unitsPerQuantity: number;
  estimatedCostMinor: number;
  estimatedCostCurrency: string;
  expensive: boolean;
  active: boolean;
};

export default function AdminCopilotCommercePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [rules, setRules] = useState<UsageRule[]>([]);
  const [capacityOffers, setCapacityOffers] = useState<CapacityOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [res, offersRes] = await Promise.all([
        fetch("/api/admin/copilot/commerce", { cache: "no-store" }),
        fetch("/api/admin/copilot/capacity-offers", { cache: "no-store" }),
      ]);
      const data = await res.json();
      const offersData = await offersRes.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to load Copilot commerce.");
      if (!offersRes.ok || !offersData.success) throw new Error(offersData.error || "Unable to load Copilot capacity offers.");
      setPlans(data.plans || []);
      setRules(data.usageRules || []);
      setCapacityOffers(offersData.offers || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load Copilot commerce.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createCapacityOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const countries = String(form.get("countries") || "")
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
    const payload = {
      code: String(form.get("code") || "").trim().toUpperCase(),
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim(),
      capacityUnits: Number(form.get("capacityUnits")),
      prices: [{
        regionCode: String(form.get("regionCode") || "").trim().toUpperCase(),
        countries,
        currency: String(form.get("currency") || "").trim().toUpperCase(),
        amountMinor: Number(form.get("amountMinor")),
        taxMode: String(form.get("taxMode") || "TAX_EXCLUSIVE"),
        paymentRoute: String(form.get("paymentRoute") || "STRIPE"),
        isActive: true,
      }],
    };

    setSaving("create-capacity-offer");
    setMessage("");
    try {
      const res = await fetch("/api/admin/copilot/capacity-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to create capacity offer.");
      event.currentTarget.reset();
      setMessage("Capacity offer created.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create capacity offer.");
    } finally {
      setSaving("");
    }
  }

  async function patch(payload: Record<string, unknown>, key: string) {
    setSaving(key);
    setMessage("");
    try {
      const res = await fetch("/api/admin/copilot/commerce", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed.");
      setMessage("Saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="rounded-[28px] border border-white/10 bg-[#141418] p-6 md:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#7FB0FF]">Admin · Global Commerce</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">HireGo Copilot Commerce Control</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#AAB4C3]">
          Configure standalone Copilot plans, regional pricing, tax mode, payment routing and hidden capacity weights.
          These internal units are never exposed to employer-facing APIs.
        </p>
      </header>

      {message && <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#D5DBE5]">{message}</div>}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#16161B] p-10 text-center text-sm text-[#94A3B8]">Loading configuration…</div>
      ) : (
        <>
          <section className="space-y-5">
            <h2 className="text-xl font-extrabold text-white">Plans & regional prices</h2>
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-[24px] border border-white/10 bg-[#16161B] p-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#7FB0FF]">{plan.code}</p>
                    <h3 className="mt-1 text-2xl font-extrabold text-white">{plan.name}</h3>
                    <p className="mt-2 text-xs text-[#94A3B8]">{plan.description}</p>
                  </div>
                  <label className="text-xs text-[#94A3B8]">
                    Internal monthly capacity
                    <input
                      id={`cap-${plan.id}`}
                      type="number"
                      min={1}
                      defaultValue={plan.monthlyCapacityUnits}
                      className="mt-2 block w-36 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                  <label className="text-xs text-[#94A3B8]">
                    Soft warning %
                    <input
                      id={`soft-${plan.id}`}
                      type="number"
                      min={1}
                      max={98}
                      defaultValue={plan.softWarningPct}
                      className="mt-2 block w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    />
                  </label>
                  <button
                    disabled={saving === plan.id}
                    onClick={() => {
                      const cap = Number((document.getElementById(`cap-${plan.id}`) as HTMLInputElement)?.value);
                      const soft = Number((document.getElementById(`soft-${plan.id}`) as HTMLInputElement)?.value);
                      void patch({ type: "PLAN", planId: plan.id, monthlyCapacityUnits: cap, softWarningPct: soft }, plan.id);
                    }}
                    className="rounded-xl bg-[#448AFF] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
                  >
                    Save plan
                  </button>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead className="text-[#64748B]">
                      <tr className="border-b border-white/10">
                        <th className="py-3 pr-3">Region</th>
                        <th className="py-3 pr-3">Countries</th>
                        <th className="py-3 pr-3">Currency</th>
                        <th className="py-3 pr-3">Amount (minor)</th>
                        <th className="py-3 pr-3">Tax mode</th>
                        <th className="py-3 pr-3">Payment route</th>
                        <th className="py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.regionalPrices.map((price) => (
                        <tr key={price.id} className="border-b border-white/5 text-[#D5DBE5]">
                          <td className="py-3 pr-3 font-bold">{price.regionCode}</td>
                          <td className="py-3 pr-3 max-w-[260px] truncate" title={price.countries.join(", ")}>{price.countries.length ? price.countries.join(", ") : "Fallback"}</td>
                          <td className="py-3 pr-3">
                            <input id={`cur-${price.id}`} defaultValue={price.currency} maxLength={3} className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-2 uppercase text-white" />
                          </td>
                          <td className="py-3 pr-3">
                            <input id={`amt-${price.id}`} type="number" min={1} defaultValue={price.amountMinor} className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white" />
                          </td>
                          <td className="py-3 pr-3">
                            <select id={`tax-${price.id}`} defaultValue={price.taxMode} className="rounded-lg border border-white/10 bg-[#1A1A20] px-2 py-2 text-white">
                              <option value="TAX_EXCLUSIVE">Tax exclusive</option>
                              <option value="TAX_INCLUSIVE">Tax inclusive</option>
                              <option value="MERCHANT_OF_RECORD">Merchant of Record</option>
                            </select>
                          </td>
                          <td className="py-3 pr-3">
                            <select id={`route-${price.id}`} defaultValue={price.paymentRoute} className="rounded-lg border border-white/10 bg-[#1A1A20] px-2 py-2 text-white">
                              <option value="PAYU">PayU</option>
                              <option value="STRIPE">Stripe</option>
                              <option value="MERCHANT_OF_RECORD">Merchant of Record</option>
                            </select>
                          </td>
                          <td className="py-3">
                            <button
                              disabled={saving === price.id}
                              onClick={() => {
                                const currency = (document.getElementById(`cur-${price.id}`) as HTMLInputElement)?.value.toUpperCase();
                                const amountMinor = Number((document.getElementById(`amt-${price.id}`) as HTMLInputElement)?.value);
                                const taxMode = (document.getElementById(`tax-${price.id}`) as HTMLSelectElement)?.value;
                                const paymentRoute = (document.getElementById(`route-${price.id}`) as HTMLSelectElement)?.value;
                                void patch({ type: "PRICE", priceId: price.id, currency, amountMinor, taxMode, paymentRoute }, price.id);
                              }}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-bold text-white hover:bg-white/10 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-white">Capacity add-on offers</h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Create customer-facing add-capacity packages while keeping the actual internal capacity units visible only to admins.
              </p>
            </div>

            <form onSubmit={createCapacityOffer} className="grid gap-3 rounded-[24px] border border-white/10 bg-[#16161B] p-5 md:grid-cols-2 lg:grid-cols-4">
              <input name="code" required placeholder="Code, e.g. BOOST_SMALL" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <input name="name" required placeholder="Customer name, e.g. Small Boost" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <input name="description" required placeholder="Customer-facing description" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-2" />
              <input name="capacityUnits" required type="number" min={1} placeholder="Internal capacity units" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <input name="regionCode" required placeholder="Region, e.g. IN" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm uppercase text-white" />
              <input name="countries" required placeholder="Countries, e.g. IN or DE,FR" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm uppercase text-white" />
              <input name="currency" required maxLength={3} placeholder="INR" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm uppercase text-white" />
              <input name="amountMinor" required type="number" min={1} placeholder="Amount in minor units" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <select name="taxMode" defaultValue="TAX_EXCLUSIVE" className="rounded-xl border border-white/10 bg-[#1A1A20] px-3 py-2 text-sm text-white">
                <option value="TAX_EXCLUSIVE">Tax exclusive</option>
                <option value="TAX_INCLUSIVE">Tax inclusive</option>
              </select>
              <select name="paymentRoute" defaultValue="STRIPE" className="rounded-xl border border-white/10 bg-[#1A1A20] px-3 py-2 text-sm text-white">
                <option value="STRIPE">Stripe</option>
                <option value="PAYU">PayU</option>
              </select>
              <button
                disabled={saving === "create-capacity-offer"}
                className="rounded-xl bg-[#448AFF] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
              >
                Create offer
              </button>
            </form>

            {capacityOffers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-xs text-[#94A3B8]">
                No add-capacity offers configured. Employers will not see an Add Capacity purchase option until an offer is created.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {capacityOffers.map((offer) => (
                  <article key={offer.id} className="rounded-[24px] border border-white/10 bg-[#16161B] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#7FB0FF]">{offer.code}</p>
                        <h3 className="mt-1 text-lg font-extrabold text-white">{offer.name}</h3>
                        <p className="mt-2 text-xs text-[#94A3B8]">{offer.description}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                        <p className="text-[10px] uppercase text-[#64748B]">Internal units</p>
                        <p className="font-mono text-lg font-bold text-white">{offer.capacityUnits}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {offer.regionalPrices.map((price) => (
                        <div key={price.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                          <span className="font-bold text-[#D5DBE5]">{price.regionCode} · {price.currency}</span>
                          <span className="text-[#94A3B8]">{price.amountMinor} minor units · {price.paymentRoute}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Hidden usage weights</h2>
              <p className="mt-1 text-xs text-[#94A3B8]">Internal cost-control only. Employer UI sees plan-capacity status, not these units.</p>
            </div>
            <div className="overflow-x-auto rounded-[24px] border border-white/10 bg-[#16161B] p-4">
              <table className="w-full min-w-[850px] text-left text-xs">
                <thead className="text-[#64748B]">
                  <tr className="border-b border-white/10">
                    <th className="py-3">Action</th>
                    <th>Unit type</th>
                    <th>Weight</th>
                    <th>Estimated cost</th>
                    <th>Expensive</th>
                    <th>Enabled</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.actionKey} className="border-b border-white/5 text-[#D5DBE5]">
                      <td className="py-3 pr-3">
                        <div className="font-bold text-white">{rule.displayName}</div>
                        <div className="mt-1 text-[10px] text-[#64748B]">{rule.actionKey}</div>
                      </td>
                      <td>{rule.unitType}</td>
                      <td><input id={`rule-units-${rule.actionKey}`} type="number" min={1} defaultValue={rule.unitsPerQuantity} className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white" /></td>
                      <td><input id={`rule-cost-${rule.actionKey}`} type="number" min={0} defaultValue={rule.estimatedCostMinor} className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white" /></td>
                      <td>{rule.expensive ? "Yes" : "No"}</td>
                      <td>{rule.active ? "Yes" : "No"}</td>
                      <td>
                        <button
                          disabled={saving === rule.actionKey}
                          onClick={() => {
                            const unitsPerQuantity = Number((document.getElementById(`rule-units-${rule.actionKey}`) as HTMLInputElement)?.value);
                            const estimatedCostMinor = Number((document.getElementById(`rule-cost-${rule.actionKey}`) as HTMLInputElement)?.value);
                            void patch({ type: "USAGE_RULE", actionKey: rule.actionKey, unitsPerQuantity, estimatedCostMinor }, rule.actionKey);
                          }}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-bold text-white hover:bg-white/10 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
