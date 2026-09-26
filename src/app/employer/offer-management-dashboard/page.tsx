"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Offer = {
  id: string;
  status: string;
  title: string;
  documentFileId: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  terms: Record<string, string>;
  application: {
    id: string;
    job: { id: string; title: string };
    candidateProfile: { user: { name: string; email: string } };
  };
};

export default function OfferManagementPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/employer/offers", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Could not load offers.");
      setOffers(data.offers || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load offers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const action = async (id: string, value: "SEND" | "REVOKE") => {
    const response = await fetch(`/api/employer/offers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: value }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      setError(data?.error || "Offer action failed.");
      return;
    }
    await load();
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <div>
          <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">HireGo · Offers</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Offer Management</h1>
          <p className="mt-2 text-sm text-slate-400">Track draft, sent, accepted, declined, and revoked offers. Joining is confirmed separately.</p>
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {loading ? <p className="text-sm text-slate-400">Loading offers…</p> : offers.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-slate-400">No offers yet. Open a shortlisted candidate and create an offer.</div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <article key={offer.id} className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-white">{offer.application.candidateProfile.user.name}</p>
                    <p className="text-sm text-slate-400">{offer.application.job.title} · {offer.application.candidateProfile.user.email}</p>
                    <p className="mt-2 text-xs text-slate-500">{offer.title} · {offer.terms.compensation || ""} {offer.terms.currency || ""}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">{offer.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {offer.documentFileId && <a href={`/api/files/${offer.documentFileId}`} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/5">Download document</a>}
                  {offer.status === "DRAFT" && <button onClick={() => void action(offer.id, "SEND")} className="rounded-full bg-yellow px-4 py-2 text-xs font-bold text-black">Send</button>}
                  {["DRAFT", "SENT"].includes(offer.status) && <button onClick={() => void action(offer.id, "REVOKE")} className="rounded-full border border-red-500/30 px-4 py-2 text-xs text-red-300">Revoke</button>}
                  <Link href={`/employer/offer-letter-create-and-send?applicationId=${encodeURIComponent(offer.application.id)}`} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white">Edit draft</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
