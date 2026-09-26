"use client";

import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Offer = {
  id: string; applicationId: string; title: string; status: string; currency: string;
  compensationAmount?: string | null; expiresAt: string; sentAt?: string | null; acceptedAt?: string | null;
  application: { status: string; job: { title: string; company: { name: string } }; candidateProfile: { user: { name?: string | null; email?: string | null } } };
};

export default function OfferManagementDashboardPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/employer/offers", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Unable to load offers.");
    setOffers(body.offers);
  }, []);

  useEffect(() => { refresh().catch((error) => setMessage(error.message)); }, [refresh]);

  async function sendOffer(offer: Offer) {
    setBusy(offer.id); setMessage("");
    try {
      const first = await fetch(`/api/employer/offers/${offer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "SEND" }) });
      const firstBody = await first.json().catch(() => ({}));
      if (!first.ok) throw new Error(firstBody.error || "Unable to prepare offer approval.");
      if (first.status === 202 && firstBody.requiresConfirmation) {
        const confirmed = window.confirm("Send this persisted offer to the candidate? This is the final human approval step.");
        if (!confirmed) { setMessage("Offer send approval was not confirmed."); return; }
        const second = await fetch(`/api/employer/offers/${offer.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SEND", approvalId: firstBody.approvalId, workflowId: firstBody.workflowId, confirmApproval: true }),
        });
        const secondBody = await second.json().catch(() => ({}));
        if (!second.ok) throw new Error(secondBody.error || "Unable to send offer.");
      }
      await refresh(); setMessage("Offer sent and made available to the candidate.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send offer."); }
    finally { setBusy(""); }
  }

  async function withdraw(offer: Offer) {
    const reason = window.prompt("Reason for withdrawing this offer:");
    if (reason === null) return;
    setBusy(offer.id);
    try {
      const response = await fetch(`/api/employer/offers/${offer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "WITHDRAW", reason }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to withdraw offer.");
      await refresh(); setMessage("Offer withdrawn.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to withdraw offer."); }
    finally { setBusy(""); }
  }

  return <PageContainer><div className="mx-auto max-w-5xl py-8 px-4 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-white">Offer Management</h1><p className="mt-2 text-sm text-text-secondary">Draft, approve, send and track candidate responses from persisted offer records.</p></div><a href="/employer/offer-letter-create-and-send" className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">Create offer</a></div>
    {message && <p role="status" className="rounded-xl border border-white/10 p-3 text-sm text-text-secondary">{message}</p>}
    <div className="space-y-3">
      {offers.length === 0 ? <div className="glass-card rounded-2xl p-6 text-sm text-text-secondary">No offer records found.</div> : offers.map((offer) => <article key={offer.id} className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold text-white">{offer.application.candidateProfile.user.name || "Candidate"} · {offer.application.job.title}</h2><p className="text-xs text-text-secondary">{offer.title} · expires {new Date(offer.expiresAt).toLocaleString()}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold">{offer.status}</span></div>
        {offer.compensationAmount && <p className="text-sm">{offer.currency} {offer.compensationAmount}</p>}
        <div className="flex flex-wrap gap-3">
          {offer.status === "DRAFT" && <button disabled={busy === offer.id} onClick={() => void sendOffer(offer)} className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-black">Approve & send</button>}
          {["DRAFT","SENT"].includes(offer.status) && <button disabled={busy === offer.id} onClick={() => void withdraw(offer)} className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-bold text-red-300">Withdraw</button>}
          {offer.status === "ACCEPTED" && <a href={`/employer/managed-hiring/join?applicationId=${encodeURIComponent(offer.applicationId)}`} className="rounded-full border border-emerald-400/30 px-4 py-2 text-xs font-bold text-emerald-300">Confirm joining</a>}
        </div>
      </article>)}
    </div>
  </div></PageContainer>;
}
