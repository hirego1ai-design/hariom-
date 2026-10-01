"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type CreditPackage = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

type MockInterviewService = {
  id: string;
  serviceKey: string;
  name: string;
  description: string | null;
  creditCost: number;
  isActive: boolean;
};

const emptyForm = {
  id: "",
  code: "",
  name: "",
  description: "",
  credits: "",
  price: "",
  currency: "INR",
  isActive: false,
  sortOrder: "0",
};

export default function AdminCandidateCreditsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mockService, setMockService] = useState<MockInterviewService | null>(null);
  const [mockName, setMockName] = useState("AI Mock Interview");
  const [mockDescription, setMockDescription] = useState("");
  const [mockCreditCost, setMockCreditCost] = useState("");
  const [mockActive, setMockActive] = useState(false);
  const [mockLoading, setMockLoading] = useState(true);
  const [mockSaving, setMockSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/candidate-credits/packages", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load candidate credit packages.");
      setPackages(Array.isArray(data.packages) ? data.packages : []);
    } catch (error) {
      setPackages([]);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not load candidate credit packages." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadMockService = useCallback(async () => {
    setMockLoading(true);
    try {
      const response = await fetch("/api/admin/candidate-credits/mock-interview-service", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load Mock Interview credit configuration.");
      const service = (data.service || null) as MockInterviewService | null;
      setMockService(service);
      if (service) {
        setMockName(service.name);
        setMockDescription(service.description || "");
        setMockCreditCost(String(service.creditCost));
        setMockActive(service.isActive);
      } else {
        setMockName("AI Mock Interview");
        setMockDescription("");
        setMockCreditCost("");
        setMockActive(false);
      }
    } catch (error) {
      setMockService(null);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not load Mock Interview credit configuration." });
    } finally {
      setMockLoading(false);
    }
  }, []);

  useEffect(() => { void loadMockService(); }, [loadMockService]);

  async function saveMockService(event: FormEvent) {
    event.preventDefault();
    if (mockSaving) return;
    setMockSaving(true);
    setMessage(null);
    try {
      const creditCost = Number(mockCreditCost);
      if (!Number.isInteger(creditCost) || creditCost < 0) {
        throw new Error("Mock Interview credit cost must be a non-negative whole number.");
      }
      const response = await fetch("/api/admin/candidate-credits/mock-interview-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mockName.trim(),
          description: mockDescription.trim() || null,
          creditCost,
          isActive: mockActive,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Could not save Mock Interview credit configuration.");
      setMessage({ type: "success", text: "Mock Interview credit configuration saved and audited." });
      await loadMockService();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not save Mock Interview credit configuration." });
    } finally {
      setMockSaving(false);
    }
  }

  function editPackage(pkg: CreditPackage) {
    setForm({
      id: pkg.id,
      code: pkg.code,
      name: pkg.name,
      description: pkg.description || "",
      credits: String(pkg.credits),
      price: String(pkg.price),
      currency: pkg.currency,
      isActive: pkg.isActive,
      sortOrder: String(pkg.sortOrder),
    });
    setMessage(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const credits = Number(form.credits);
      const price = Number(form.price);
      const sortOrder = Number(form.sortOrder);
      if (!Number.isInteger(credits) || credits <= 0) throw new Error("Credits must be a positive whole number.");
      if (!Number.isFinite(price) || price <= 0) throw new Error("Price must be greater than zero.");
      if (!Number.isInteger(sortOrder) || sortOrder < 0) throw new Error("Sort order must be zero or greater.");

      const response = await fetch("/api/admin/candidate-credits/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPSERT",
          ...(form.id ? { id: form.id } : {}),
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          credits,
          price,
          currency: form.currency.trim().toUpperCase(),
          isActive: form.isActive,
          sortOrder,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Could not save candidate credit package.");
      setForm(emptyForm);
      setMessage({ type: "success", text: "Candidate credit package saved and audited." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not save candidate credit package." });
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(pkg: CreditPackage) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/candidate-credits/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DEACTIVATE", id: pkg.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Could not deactivate candidate credit package.");
      setMessage({ type: "success", text: `${pkg.name} deactivated. Existing purchased credits are unchanged.` });
      if (form.id === pkg.id) setForm(emptyForm);
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not deactivate candidate credit package." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Candidate Credit Commerce"
          subtitle="Publish real candidate credit packages. No package becomes purchasable until it is explicitly activated."
        />
        <main className="mx-auto max-w-7xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24">
          {message && (
            <div role={message.type === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${message.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>
              {message.text}
            </div>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#16161B] p-5">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Mock Interview service pricing</p>
              <h2 className="mt-1 text-xl font-extrabold">Credit entitlement</h2>
              <p className="mt-2 text-xs text-slate-400">
                Missing configuration means Mock Interview is unavailable. Set 0 credits only when you explicitly want it free.
              </p>
            </div>

            {mockLoading ? (
              <div role="status" className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">
                Loading authoritative service configuration…
              </div>
            ) : (
              <form onSubmit={saveMockService} className="grid gap-4 md:grid-cols-2">
                <label className="block text-xs font-bold text-slate-300">
                  Candidate-facing name
                  <input
                    value={mockName}
                    onChange={(event) => setMockName(event.target.value)}
                    minLength={2}
                    maxLength={160}
                    required
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-300">
                  Credits per real Mock Interview session
                  <input
                    value={mockCreditCost}
                    onChange={(event) => setMockCreditCost(event.target.value)}
                    inputMode="numeric"
                    placeholder="Enter approved credit cost"
                    required
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-300 md:col-span-2">
                  Description
                  <textarea
                    value={mockDescription}
                    onChange={(event) => setMockDescription(event.target.value)}
                    maxLength={500}
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm md:col-span-2">
                  <span>
                    <strong className="block">Active / available to candidates</strong>
                    <span className="text-xs text-slate-400">
                      {mockService ? `Current stored cost: ${mockService.creditCost} credits.` : "No service record exists yet; candidates are blocked rather than treated as free."}
                    </span>
                  </span>
                  <input type="checkbox" checked={mockActive} onChange={(event) => setMockActive(event.target.checked)} />
                </label>
                <div className="md:col-span-2">
                  <button disabled={mockSaving} className="rounded-xl bg-primary px-5 py-3 text-xs font-extrabold text-white disabled:opacity-40">
                    {mockSaving ? "Saving…" : "Save Mock Interview pricing"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <form onSubmit={save} className="space-y-4 rounded-2xl border border-white/10 bg-[#16161B] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">{form.id ? "Edit package" : "New package"}</p>
                <h2 className="mt-1 text-xl font-extrabold">Commercial configuration</h2>
                <p className="mt-2 text-xs text-slate-400">Use actual approved credits, price and currency. New packages default to inactive.</p>
              </div>

              {[
                ["code", "Package code", "e.g. CAREER_STARTER"],
                ["name", "Package name", "Candidate-facing name"],
                ["credits", "Credits", "Whole number"],
                ["price", "Price", "Gateway charge amount"],
                ["currency", "Currency", "ISO code, e.g. INR"],
                ["sortOrder", "Sort order", "0"],
              ].map(([key, label, placeholder]) => (
                <label key={key} className="block text-xs font-bold text-slate-300">
                  {label}
                  <input
                    value={form[key as keyof typeof form] as string}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    required={key !== "sortOrder"}
                    inputMode={key === "credits" || key === "price" || key === "sortOrder" ? "decimal" : undefined}
                    placeholder={placeholder}
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white"
                  />
                </label>
              ))}

              <label className="block text-xs font-bold text-slate-300">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <span>
                  <strong className="block">Active / purchasable</strong>
                  <span className="text-xs text-slate-400">Only enable after price and gateway configuration are approved.</span>
                </span>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
              </label>

              <div className="flex gap-2">
                <button disabled={saving} className="flex-1 rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-white disabled:opacity-40">
                  {saving ? "Saving…" : form.id ? "Update package" : "Create package"}
                </button>
                {form.id && (
                  <button type="button" onClick={() => setForm(emptyForm)} className="rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-slate-300">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section className="rounded-2xl border border-white/10 bg-[#16161B] p-5">
              <div className="mb-4">
                <h2 className="text-lg font-bold">Published package catalog</h2>
                <p className="mt-1 text-xs text-slate-400">Candidate checkout reads these records directly; historical orders retain their immutable purchase snapshot.</p>
              </div>

              {loading ? (
                <div role="status" className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">Loading authoritative package catalog…</div>
              ) : packages.length === 0 ? (
                <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">No candidate credit package has been configured. Candidate checkout remains unavailable rather than showing invented prices.</div>
              ) : (
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <article key={pkg.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">{pkg.name}</h3>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${pkg.isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-400"}`}>
                              {pkg.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-xs text-slate-500">{pkg.code}</p>
                          <p className="mt-3 text-sm font-bold">{pkg.credits} credits · {pkg.currency} {pkg.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                          {pkg.description && <p className="mt-2 text-xs text-slate-400">{pkg.description}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => editPackage(pkg)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Edit</button>
                          {pkg.isActive && <button type="button" disabled={saving} onClick={() => void deactivate(pkg)} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-40">Deactivate</button>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
