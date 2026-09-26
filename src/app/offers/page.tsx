"use client";

import React, { useCallback, useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Offer = {
  id: string;
  status: string;
  positionTitle: string;
  currency: string;
  annualCompensation: string;
  joiningDate: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  company: { name: string };
  application: { job: { title: string } };
  documentFile: { id: string; originalName: string } | null;
};

export default function CandidateOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/candidate/offers", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error || "Unable to load offers.");
    setOffers(body.offers);
  }, []);

  useEffect(() => { refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load offers.")); }, [refresh]);

  const decide = async (offerId: string, action: "ACCEPT" | "DECLINE") => {
    const note = action === "DECLINE" ? window.prompt("Optional note to the employer:") || undefined : undefined;
    setBusy(offerId);
    setError("");
    try {
      const response = await fetch("/api/candidate/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, action, note }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to record your response.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record your response.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />
      <main className="flex-1 md:ml-[116px] p-6 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your offers</p>
            <h1 className="mt-2 text-3xl font-bold">Review employment offers</h1>
            <p className="mt-2 text-sm text-text-secondary">Review the private document and terms before accepting. Acceptance is recorded separately from your actual joining date.</p>
          </header>

          {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          {!offers.length && !error && <div className="rounded-3xl border border-outline bg-bg-card p-8 text-center text-sm text-text-muted">You do not have any sent offers.</div>}

          <div className="space-y-4">
            {offers.map((offer) => (
              <article key={offer.id} className="rounded-3xl border border-outline bg-bg-card p-6 space-y-4">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold">{offer.positionTitle}</p>
                    <p className="text-sm text-text-secondary">{offer.company.name} · {offer.application.job.title}</p>
                  </div>
                  <span className="rounded-full border border-outline bg-surface-container px-3 py-1 text-xs font-bold">{offer.status}</span>
                </div>
                <p className="text-lg font-semibold">{offer.currency} {Number(offer.annualCompensation).toLocaleString()} / year</p>
                {offer.joiningDate && <p className="text-sm text-text-secondary">Planned joining: {new Date(offer.joiningDate).toLocaleString()}</p>}
                {offer.documentFile && <a className="inline-flex text-sm font-bold text-primary underline" href={`/api/files/${offer.documentFile.id}`}>Review private offer document · {offer.documentFile.originalName}</a>}
                {offer.status === "SENT" && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button disabled={busy === offer.id} onClick={() => void decide(offer.id, "ACCEPT")} className="rounded-full bg-green-500 px-6 py-3 text-xs font-bold text-black disabled:opacity-50">Accept offer</button>
                    <button disabled={busy === offer.id} onClick={() => void decide(offer.id, "DECLINE")} className="rounded-full border border-red-400/40 px-6 py-3 text-xs font-bold text-red-300 disabled:opacity-50">Decline offer</button>
                  </div>
                )}
                {offer.responseNote && <p className="text-xs text-text-muted">Recorded note: {offer.responseNote}</p>}
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
