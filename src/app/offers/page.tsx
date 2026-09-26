"use client";

import { useCallback, useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Offer = {
  id: string;
  title: string;
  status: string;
  currency: string;
  compensationAmount?: string | null;
  startDate?: string | null;
  expiresAt: string;
  terms: {
    roleTitle?: string;
    employmentType?: string;
    location?: string;
    probation?: string;
    noticePeriod?: string;
    benefits?: string[];
    additionalTerms?: string;
  };
  documentFile?: { id: string; originalName: string; mimeType: string; scanStatus: string } | null;
  application: { job: { title: string; company: { name: string } } };
};

export default function CandidateOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/candidate/offers", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Unable to load offers.");
    setOffers(body.offers);
  }, []);

  useEffect(() => { refresh().catch((error) => setMessage(error.message)); }, [refresh]);

  async function respond(offer: Offer, action: "ACCEPT" | "DECLINE") {
    const confirmed = window.confirm(action === "ACCEPT"
      ? "Accept this offer with the displayed terms?"
      : "Decline this offer?");
    if (!confirmed) return;
    const note = action === "DECLINE" ? window.prompt("Optional note to the employer:") || undefined : undefined;
    setBusy(offer.id); setMessage("");
    try {
      const response = await fetch(`/api/candidate/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(note ? { note } : {}) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to save offer response.");
      await refresh();
      setMessage(action === "ACCEPT" ? "Offer accepted. The employer can now proceed to joining confirmation." : "Offer declined.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save offer response.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />
      <main className="flex-1 md:ml-[116px] p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div><h1 className="text-3xl font-bold">Offers</h1><p className="mt-2 text-sm text-text-secondary">Review persisted offer terms and respond directly. Expired or withdrawn offers cannot be accepted.</p></div>
          {message && <p role="status" className="rounded-xl border border-outline bg-bg-card p-3 text-sm">{message}</p>}
          {offers.length === 0 ? <div className="rounded-2xl border border-outline bg-bg-card p-6 text-sm text-text-secondary">No offers are available.</div> : offers.map((offer) => (
            <article key={offer.id} className="rounded-3xl border border-outline bg-bg-card p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs uppercase tracking-wider text-primary">{offer.application.job.company.name}</p><h2 className="text-xl font-bold">{offer.application.job.title}</h2><p className="text-sm text-text-secondary">{offer.title}</p></div>
                <span className="rounded-full border border-outline px-3 py-1 text-xs font-bold">{offer.status}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {offer.compensationAmount && <p><strong>Compensation:</strong> {offer.currency} {offer.compensationAmount}</p>}
                {offer.startDate && <p><strong>Start:</strong> {new Date(offer.startDate).toLocaleString()}</p>}
                <p><strong>Expires:</strong> {new Date(offer.expiresAt).toLocaleString()}</p>
                {offer.terms.employmentType && <p><strong>Employment:</strong> {offer.terms.employmentType}</p>}
                {offer.terms.location && <p><strong>Location:</strong> {offer.terms.location}</p>}
                {offer.terms.probation && <p><strong>Probation:</strong> {offer.terms.probation}</p>}
                {offer.terms.noticePeriod && <p><strong>Notice:</strong> {offer.terms.noticePeriod}</p>}
              </div>
              {offer.terms.benefits?.length ? <div><strong className="text-sm">Benefits</strong><ul className="mt-2 list-disc pl-5 text-sm text-text-secondary">{offer.terms.benefits.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
              {offer.terms.additionalTerms && <div><strong className="text-sm">Additional terms</strong><p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{offer.terms.additionalTerms}</p></div>}
              {offer.documentFile && <p className="text-xs text-text-secondary">Attached private document: {offer.documentFile.originalName} · {offer.documentFile.scanStatus}</p>}
              {offer.status === "SENT" && <div className="flex flex-wrap gap-3 pt-2">
                <button disabled={busy === offer.id} onClick={() => void respond(offer, "ACCEPT")} className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black disabled:opacity-50">Accept offer</button>
                <button disabled={busy === offer.id} onClick={() => void respond(offer, "DECLINE")} className="rounded-full border border-red-400/30 px-5 py-2.5 text-xs font-bold text-red-300 disabled:opacity-50">Decline</button>
              </div>}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
