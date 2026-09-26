"use client";

import { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Service = { serviceKey: string; name: string; description: string | null; creditCost: number };
type Ledger = { id: string; type: string; amount: number; balanceAfter: number; serviceKey: string | null; reference: string | null; createdAt: string };

type CreditPack = { id: string; credits: number; price: number; currency: string; name: string };

export default function CandidateCreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<CreditPack[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [requesting, setRequesting] = useState("");
  const [purchasing, setPurchasing] = useState("");

  const load = () => fetch("/api/candidate/credits")
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load candidate credits.");
      setBalance(data.wallet.balance);
      setServices(data.services || []);
      setPackages(data.packages || []);
      setLedger(data.ledger || []);
    })
    .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load candidate credits."));

  useEffect(() => { void load(); }, []);

  const purchasePackage = async (pack: CreditPack) => {
    setPurchasing(pack.id);
    setError("");
    setSuccessNotice("");
    try {
      const response = await fetch("/api/candidate/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pack.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to purchase credits.");
      setSuccessNotice(data.message || `Purchased ${pack.name}!`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to purchase credits.");
    } finally {
      setPurchasing("");
    }
  };

  const requestService = async (service: Service) => {
    setRequesting(service.serviceKey);
    setError("");
    setSuccessNotice("");
    try {
      const response = await fetch(`/api/candidate/services/${encodeURIComponent(service.serviceKey)}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not request this service.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request this service.");
    } finally {
      setRequesting("");
    }
  };

  return <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
    <CandidateSidebar />
    <main className="flex-1 ml-[100px] lg:ml-[116px] max-w-5xl p-6 lg:p-10">
      <header className="mb-8"><p className="text-primary text-xs font-bold uppercase tracking-wider">Candidate account</p><h1 className="mt-2 text-3xl font-extrabold">Career Credits</h1><p className="mt-3 max-w-3xl text-sm text-text-secondary">Credits are separate from employer credits. They can be used for AI Mock Interviews and career services; they cannot buy an artificial score, badge, or job outcome.</p></header>
      {error && <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {successNotice && <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{successNotice}</div>}
      <section className="mb-8 glass-card rounded-3xl border border-white/10 p-6">
        <p className="text-xs uppercase font-bold text-text-muted">Available credits</p>
        <p className="mt-2 text-4xl font-extrabold text-primary">{balance === null ? "—" : balance}</p>
      </section>

      {packages.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold">Purchase Practice Credits</h2>
          <p className="mt-1 text-xs text-text-secondary">Instant top-up to practice role-targeted AI mock interviews and career coaching.</p>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {packages.map((pack) => (
              <article key={pack.id} className="glass-card rounded-3xl border border-white/10 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white">{pack.name}</h3>
                  <p className="mt-2 text-2xl font-extrabold text-primary">₹{pack.price}</p>
                  <p className="mt-1 text-xs text-text-secondary">{pack.credits} Practice Credits (₹{Math.round(pack.price / pack.credits)}/credit)</p>
                </div>
                <button
                  onClick={() => purchasePackage(pack)}
                  disabled={purchasing !== ""}
                  className="mt-6 w-full rounded-xl btn-3d-red px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {purchasing === pack.id ? "Processing…" : `Buy ${pack.credits} Credits`}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section><h2 className="text-lg font-bold">Available career services</h2><div className="mt-4 grid gap-5 md:grid-cols-2">{services.map((service) => <article key={service.serviceKey} className="glass-card rounded-3xl border border-white/10 p-6"><h3 className="font-bold">{service.name}</h3>{service.description && <p className="mt-2 text-sm text-text-secondary">{service.description}</p>}<p className="mt-4 text-xs text-text-muted">Cost: {service.creditCost} credits</p><button onClick={() => requestService(service)} disabled={requesting !== "" || balance === null || balance < service.creditCost} className="mt-5 w-full rounded-xl btn-3d-red px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{requesting === service.serviceKey ? "Requesting…" : balance !== null && balance < service.creditCost ? "Insufficient credits" : "Request service"}</button></article>)}</div>{balance !== null && services.length === 0 && <p className="mt-4 text-sm text-text-secondary">No paid career service has been published by an administrator.</p>}</section>
      <section className="mt-10"><h2 className="text-lg font-bold">Credit history</h2><div className="mt-4 overflow-hidden rounded-2xl border border-white/10">{ledger.length === 0 ? <p className="p-5 text-sm text-text-secondary">No credit activity yet.</p> : ledger.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 border-b border-white/10 p-4 last:border-0"><div><p className="text-sm font-semibold">{entry.reference || entry.type}</p><p className="text-xs text-text-muted">{new Date(entry.createdAt).toLocaleString()}</p></div><div className="text-right"><p className={entry.amount < 0 ? "text-red-300 font-bold" : "text-green font-bold"}>{entry.amount > 0 ? "+" : ""}{entry.amount}</p><p className="text-xs text-text-muted">Balance {entry.balanceAfter}</p></div></div>)}</div></section>
    </main>
  </div>;
}
