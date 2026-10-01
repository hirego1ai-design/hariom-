"use client";

import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Offer = {
  id: string; applicationId: string; title: string; status: string; currency: string;
  compensationAmount?: string | null; expiresAt: string; sentAt?: string | null; acceptedAt?: string | null;
  application: {
    status: string;
    job: {
      title: string;
      managedAgreementId?: string | null;
      managedRequirementId?: string | null;
      company: { name: string };
    };
    candidateProfile: { user: { name?: string | null; email?: string | null } };
  };
};

export default function OfferManagementDashboardPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [pendingSend, setPendingSend] = useState<{ offer: Offer; approvalId: string; workflowId: string } | null>(null);
  const [pendingWithdraw, setPendingWithdraw] = useState<Offer | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/employer/offers?limit=50", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.success) throw new Error(body.error || "Unable to load offers.");
    setOffers(Array.isArray(body.offers) ? body.offers : []);
    setNextCursor(body.pagination?.nextCursor ?? null);
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ limit: "50", cursor: nextCursor });
      const response = await fetch(`/api/employer/offers?${params.toString()}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to load more offers.");
      const more = Array.isArray(body.offers) ? body.offers as Offer[] : [];
      setOffers((current) => {
        const seen = new Set(current.map((offer) => offer.id));
        return [...current, ...more.filter((offer) => !seen.has(offer.id))];
      });
      setNextCursor(body.pagination?.nextCursor ?? null);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to load more offers.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  useEffect(() => {
    refresh()
      .catch((error) => {
        setMessageType("error");
        setMessage(error instanceof Error ? error.message : "Unable to load offers.");
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  async function prepareSend(offer: Offer) {
    setBusy(offer.id);
    setMessage("");
    setMessageType("success");
    try {
      const response = await fetch(`/api/employer/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to prepare offer approval.");

      if (response.status === 202 && body.requiresConfirmation) {
        setPendingSend({ offer, approvalId: body.approvalId, workflowId: body.workflowId });
        return;
      }

      await refresh();
      setMessage("Offer is already sent and available to the candidate.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to prepare offer approval.");
    } finally {
      setBusy("");
    }
  }

  async function confirmSend() {
    if (!pendingSend || busy) return;
    const { offer, approvalId, workflowId } = pendingSend;
    setBusy(offer.id);
    setMessage("");
    try {
      const response = await fetch(`/api/employer/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND", approvalId, workflowId, confirmApproval: true }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to send offer.");
      await refresh();
      setPendingSend(null);
      setMessageType("success");
      setMessage("Offer sent and made available to the candidate.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to send offer.");
    } finally {
      setBusy("");
    }
  }

  async function confirmWithdraw() {
    if (!pendingWithdraw || busy) return;
    const offer = pendingWithdraw;
    setBusy(offer.id);
    setMessage("");
    try {
      const response = await fetch(`/api/employer/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "WITHDRAW", ...(withdrawReason.trim() ? { reason: withdrawReason.trim() } : {}) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to withdraw offer.");
      await refresh();
      setPendingWithdraw(null);
      setWithdrawReason("");
      setMessageType("success");
      setMessage("Offer withdrawn.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to withdraw offer.");
    } finally {
      setBusy("");
    }
  }

  return <PageContainer><div className="mx-auto max-w-5xl py-8 px-4 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-white">Offer Management</h1><p className="mt-2 text-sm text-text-secondary">Draft, approve, send and track candidate responses from persisted offer records.</p></div><a href="/employer/offer-letter-create-and-send" className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">Create offer</a></div>
    {message && (
      <p role={messageType === "error" ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${
        messageType === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-white/10 text-text-secondary"
      }`}>{message}</p>
    )}
    <div className="space-y-3">
      {loading ? <div className="glass-card rounded-2xl p-6 text-sm text-text-secondary">Loading offers…</div> : offers.length === 0 ? <div className="glass-card rounded-2xl p-6 text-sm text-text-secondary">No offer records found.</div> : offers.map((offer) => <article key={offer.id} className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold text-white">{offer.application.candidateProfile.user.name || "Candidate"} · {offer.application.job.title}</h2><p className="text-xs text-text-secondary">{offer.title} · expires {new Date(offer.expiresAt).toLocaleString()}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold">{offer.status}</span></div>
        {offer.compensationAmount && <p className="text-sm">{offer.currency} {offer.compensationAmount}</p>}
        <div className="flex flex-wrap gap-3">
          {offer.status === "DRAFT" && <button disabled={busy === offer.id} onClick={() => void prepareSend(offer)} className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-black">Approve & send</button>}
          {["DRAFT","SENT"].includes(offer.status) && <button disabled={busy === offer.id} onClick={() => { setWithdrawReason(""); setPendingWithdraw(offer); }} className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-bold text-red-300">Withdraw</button>}
          {offer.status === "ACCEPTED" && (
            <a
              href={
                offer.application.job.managedAgreementId || offer.application.job.managedRequirementId
                  ? `/employer/managed-hiring/join?applicationId=${encodeURIComponent(offer.applicationId)}`
                  : `/employer/joining-confirmation?applicationId=${encodeURIComponent(offer.applicationId)}`
              }
              className="rounded-full border border-emerald-400/30 px-4 py-2 text-xs font-bold text-emerald-300"
            >
              {offer.application.job.managedAgreementId || offer.application.job.managedRequirementId
                ? "Confirm PPH joining"
                : "Confirm joining"}
            </a>
          )}
        </div>
      </article>)}
    </div>

    {nextCursor && !loading && (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="min-h-11 rounded-xl border border-white/10 px-5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more offers"}
        </button>
      </div>
    )}

    {pendingSend && (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="send-offer-title">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
          <h2 id="send-offer-title" className="text-xl font-bold text-white">Approve and send this offer?</h2>
          <p className="mt-2 text-sm text-text-secondary">{pendingSend.offer.application.candidateProfile.user.name || "Candidate"} · {pendingSend.offer.application.job.title}</p>
          <p className="mt-4 text-sm text-text-muted">This is the final human confirmation. The persisted offer will become visible to the candidate.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" disabled={Boolean(busy)} onClick={() => setPendingSend(null)} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs font-bold text-white disabled:opacity-50">Cancel</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => void confirmSend()} className="min-h-11 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-black disabled:opacity-50">{busy ? "Sending…" : "Confirm send"}</button>
          </div>
        </div>
      </div>
    )}

    {pendingWithdraw && (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="withdraw-offer-title">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
          <h2 id="withdraw-offer-title" className="text-xl font-bold text-white">Withdraw this offer?</h2>
          <p className="mt-2 text-sm text-text-secondary">{pendingWithdraw.application.candidateProfile.user.name || "Candidate"} · {pendingWithdraw.application.job.title}</p>
          <label className="mt-4 block text-sm text-text-secondary">Reason (optional)
            <textarea value={withdrawReason} onChange={(event) => setWithdrawReason(event.target.value)} maxLength={1000} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" disabled={Boolean(busy)} onClick={() => { setPendingWithdraw(null); setWithdrawReason(""); }} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs font-bold text-white disabled:opacity-50">Cancel</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => void confirmWithdraw()} className="min-h-11 rounded-xl bg-red-600 px-4 text-xs font-bold text-white disabled:opacity-50">{busy ? "Withdrawing…" : "Confirm withdraw"}</button>
          </div>
        </div>
      </div>
    )}
  </div></PageContainer>;
}
