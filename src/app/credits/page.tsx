"use client";

import { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Service = { serviceKey: string; name: string; description: string | null; creditCost: number };
type Ledger = { id: string; type: string; amount: number; balanceAfter: number; serviceKey: string | null; reference: string | null; createdAt: string };

export default function CandidateCreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState("");

  const load = () => fetch("/api/candidate/credits")
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load candidate credits.");
      setBalance(data.wallet.balance);
      setServices(data.services || []);
      setLedger(data.ledger || []);
    })
    .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load candidate credits."));

  useEffect(() => { void load(); }, []);

  const requestService = async (service: Service) => {
    setRequesting(service.serviceKey);
    setError("");
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
      <header className="mb-8"><p className="text-primary text-xs font-bold uppercase tracking-wider">Candidate account</p><h1 className="mt-2 text-3xl font-extrabold">Career Credits</h1><p className="mt-3 max-w-3xl text-sm text-text-secondary">Credits are separate from employer credits. They can request an administrator-configured career service; they cannot buy a pass, score, badge, or job outcome.</p></header>
      {error && <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      <section className="mb-8 glass-card rounded-3xl border border-white/10 p-6"><p className="text-xs uppercase font-bold text-text-muted">Available credits</p><p className="mt-2 text-4xl font-extrabold text-primary">{balance === null ? "—" : balance}</p><p className="mt-2 text-xs text-text-secondary">Purchasing is not enabled until a payment provider and verified webhook are configured. There is no simulated checkout.</p></section>
      <section><h2 className="text-lg font-bold">Available career services</h2><div className="mt-4 grid gap-5 md:grid-cols-2">{services.map((service) => <article key={service.serviceKey} className="glass-card rounded-3xl border border-white/10 p-6"><h3 className="font-bold">{service.name}</h3>{service.description && <p className="mt-2 text-sm text-text-secondary">{service.description}</p>}<p className="mt-4 text-xs text-text-muted">Cost: {service.creditCost} credits</p><button onClick={() => requestService(service)} disabled={requesting !== "" || balance === null || balance < service.creditCost} className="mt-5 w-full rounded-xl btn-3d-red px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{requesting === service.serviceKey ? "Requesting…" : balance !== null && balance < service.creditCost ? "Insufficient credits" : "Request service"}</button></article>)}</div>{balance !== null && services.length === 0 && <p className="mt-4 text-sm text-text-secondary">No paid career service has been published by an administrator.</p>}</section>
      <section className="mt-10"><h2 className="text-lg font-bold">Credit history</h2><div className="mt-4 overflow-hidden rounded-2xl border border-white/10">{ledger.length === 0 ? <p className="p-5 text-sm text-text-secondary">No credit activity yet.</p> : ledger.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 border-b border-white/10 p-4 last:border-0"><div><p className="text-sm font-semibold">{entry.reference || entry.type}</p><p className="text-xs text-text-muted">{new Date(entry.createdAt).toLocaleString()}</p></div><div className="text-right"><p className={entry.amount < 0 ? "text-red-300 font-bold" : "text-green font-bold"}>{entry.amount > 0 ? "+" : ""}{entry.amount}</p><p className="text-xs text-text-muted">Balance {entry.balanceAfter}</p></div></div>)}</div></section>
    </main>
  </div>;
}
