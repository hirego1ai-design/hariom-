"use client";

import { useCallback, useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Offer = {
  id: string;
  status: string;
  title: string;
  terms: Record<string, string>;
  documentFileId: string | null;
  sentAt: string | null;
  responseNote: string | null;
  application: {
    job: { title: string; company: { name: string } };
  };
};

export default function CandidateOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/candidate/offers", { cache: "no-store" });
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

  const respond = async (offerId: string, action: "ACCEPT" | "DECLINE") => {
    const response = await fetch("/api/candidate/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, action, note: note[offerId] || undefined }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      setError(data?.error || "Could not update offer.");
      return;
    }
    await load();
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />
      <main className="flex-1 md:ml-[116px] p-6 lg:p-10 pb-24">
        <div className="mx-auto max-w-5xl space-y-6">
          <header>
            <p className="text-primary text-xs font-bold uppercase tracking-wider">Candidate offers</p>
            <h1 className="mt-2 text-3xl font-extrabold">Employment offers</h1>
            <p className="mt-3 text-sm text-text-secondary">Review private offer documents and accept or decline. Accepting an offer does not mark you joined until the employer completes the joining step.</p>
          </header>

          {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
          {loading ? <p className="text-sm text-text-secondary">Loading offers…</p> : offers.length === 0 ? (
            <div className="rounded-3xl border border-outline bg-bg-card p-8 text-center text-sm text-text-secondary">No offers are available yet.</div>
          ) : (
            <div className="space-y-5">
              {offers.map((offer) => (
                <article key={offer.id} className="rounded-3xl border border-outline bg-bg-card p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{offer.application.job.title}</h2>
                      <p className="text-sm text-text-secondary">{offer.application.job.company.name}</p>
                    </div>
                    <span className="rounded-full border border-outline px-3 py-1 text-xs font-bold">{offer.status}</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <p><span className="text-text-muted">Compensation:</span> {offer.terms.compensation || "—"} {offer.terms.currency || ""}</p>
                    <p><span className="text-text-muted">Employment:</span> {offer.terms.employmentType || "—"}</p>
                    <p><span className="text-text-muted">Start:</span> {offer.terms.startDate || "—"}</p>
                    <p><span className="text-text-muted">Location:</span> {offer.terms.location || "—"}</p>
                  </div>
                  {offer.terms.notes && <p className="text-sm text-text-secondary">{offer.terms.notes}</p>}
                  {offer.documentFileId && <a href={`/api/files/${offer.documentFileId}`} className="inline-flex rounded-full border border-outline px-4 py-2 text-xs font-bold">Download private offer document</a>}

                  {offer.status === "SENT" && (
                    <div className="space-y-3 border-t border-outline pt-4">
                      <textarea
                        value={note[offer.id] || ""}
                        onChange={(event) => setNote((current) => ({ ...current, [offer.id]: event.target.value }))}
                        rows={3}
                        placeholder="Optional response note"
                        className="w-full rounded-xl border border-outline bg-bg-input px-4 py-3 text-sm"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => void respond(offer.id, "ACCEPT")} className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white">Accept offer</button>
                        <button onClick={() => void respond(offer.id, "DECLINE")} className="rounded-full border border-red-500/30 px-5 py-2.5 text-xs font-bold text-red-400">Decline</button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
