"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";

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
  application: {
    id: string;
    status: string;
    job: { title: string };
    candidateProfile: { user: { name: string; email: string } };
  };
  documentFile: { id: string; originalName: string } | null;
};

export default function OfferManagementDashboardPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/employer/offers", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error || "Unable to load offers.");
    setOffers(body.offers);
  }, []);

  useEffect(() => { refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load offers.")); }, [refresh]);

  const withdraw = async (offerId: string) => {
    const reason = window.prompt("Reason for withdrawing this pending offer (minimum 5 characters):");
    if (!reason) return;
    setBusy(offerId);
    setError("");
    try {
      const response = await fetch("/api/employer/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, action: "WITHDRAW", reason }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to withdraw offer.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to withdraw offer.");
    } finally {
      setBusy("");
    }
  };

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Offer lifecycle</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Offer management</h1>
          <p className="mt-2 text-sm text-text-muted">Track the persisted candidate response. Accepted offers remain separate from joining confirmation.</p>
        </header>

        {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {!offers.length && !error && <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-text-muted">No offers have been created yet.</div>}

        <div className="space-y-4">
          {offers.map((offer) => (
            <article key={offer.id} className="glass-card rounded-2xl border border-white/10 p-5 space-y-3">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="text-lg font-bold">{offer.application.candidateProfile.user.name}</p>
                  <p className="text-sm text-text-muted">{offer.positionTitle} · {offer.application.job.title}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold">{offer.status}</span>
              </div>
              <p className="text-sm">{offer.currency} {Number(offer.annualCompensation).toLocaleString()}</p>
              {offer.joiningDate && <p className="text-xs text-text-muted">Planned joining: {new Date(offer.joiningDate).toLocaleString()}</p>}
              {offer.documentFile && <a className="text-xs text-primary underline" href={`/api/files/${offer.documentFile.id}`}>Open private offer document · {offer.documentFile.originalName}</a>}
              {offer.responseNote && <p className="text-xs text-text-muted">Candidate/withdrawal note: {offer.responseNote}</p>}
              <div className="flex flex-wrap gap-3">
                {offer.status === "DRAFT" && <a className="text-xs font-bold underline" href={`/employer/offer-letter-create-and-send?applicationId=${offer.application.id}`}>Edit draft</a>}
                {offer.status === "SENT" && <button disabled={busy === offer.id} onClick={() => void withdraw(offer.id)} className="text-xs font-bold text-red-300">Withdraw pending offer</button>}
                {offer.status === "ACCEPTED" && <a className="text-xs font-bold text-green-300 underline" href={`/employer/managed-hiring/join?applicationId=${offer.application.id}`}>Record joining</a>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
