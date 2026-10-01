"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Placement = { id: string; applicationId: string; status: string; invoiceEligibleAt: string; totalAmount: string; holdReason?: string; invoice?: { invoiceNumber: string } | null };
type Agreement = { id: string; agreementNumber: string; status: string; invoiceRule: string; feeType: string; feeValue: number; taxRatePct: number; creditDays: number };
type AcceptedOffer = {
  id: string;
  compensationAmount: string | null;
  currency: string;
  acceptedAt: string;
  startDate: string | null;
};
export default function ManagedHiringJoinPage() {
  const params = useSearchParams();
  const [form, setForm] = useState({ applicationId: "", agreementId: "", annualCtc: "", joinedAt: "" });
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ placement: Placement; action: "HOLD" | "CANCEL" | "RESUME" } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [requiredAgreementId, setRequiredAgreementId] = useState<string | null>(null);
  const [acceptedOffer, setAcceptedOffer] = useState<AcceptedOffer | null>(null);
  const refresh = useCallback(async () => {
    const query = params.get("applicationId")
      ? `?applicationId=${encodeURIComponent(params.get("applicationId") || "")}`
      : "";
    const response = await fetch(`/api/employer/managed-hiring/join${query}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.error || "Unable to load placements.");
    setPlacements(Array.isArray(data.placements) ? data.placements : []);
    const linkedAgreementId =
      typeof data.requiredAgreementId === "string" ? data.requiredAgreementId : null;
    const serverAcceptedOffer =
      data.acceptedOffer &&
      typeof data.acceptedOffer.id === "string" &&
      typeof data.acceptedOffer.currency === "string" &&
      typeof data.acceptedOffer.acceptedAt === "string"
        ? data.acceptedOffer as AcceptedOffer
        : null;
    setRequiredAgreementId(linkedAgreementId);
    setAcceptedOffer(serverAcceptedOffer);

    const scopedApplicationId = params.get("applicationId") || "";
    if (scopedApplicationId) {
      setForm((current) => ({
        ...current,
        applicationId: scopedApplicationId,
        agreementId: linkedAgreementId || "",
        annualCtc: serverAcceptedOffer?.compensationAmount || "",
      }));
    }
  }, [params]);
  useEffect(() => {
    const scopedApplicationId = params.get("applicationId");
    if (scopedApplicationId) {
      setForm((current) => ({ ...current, applicationId: scopedApplicationId }));
    }
  }, [params]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      refresh(),
      fetch("/api/agreements/contracts?status=ACTIVE", { cache: "no-store" }).then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load agreements.");
        if (!cancelled) {
          setAgreements(
            (Array.isArray(data.agreements) ? data.agreements : []).filter(
              (agreement: Agreement) => agreement.invoiceRule === "DAY_25",
            ),
          );
        }
      }),
    ])
      .catch(error => {
        if (!cancelled) {
          setStatusType("error");
          setStatus(error instanceof Error ? error.message : "Unable to load managed-hiring joining data.");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setStatus(""); setStatusType("success");
    try {
      const response = await fetch("/api/employer/managed-hiring/join", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, annualCtc: Number(form.annualCtc), joinedAt: new Date(form.joinedAt).toISOString(), termsAccepted: accepted }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to confirm joining.");
      setStatusType("success");
      setStatus(`Joining recorded. Status: ${data.placement.status}. Invoice eligible: ${new Date(data.placement.invoiceEligibleAt).toLocaleString()}. No immediate invoice was created.`);
      await refresh();
    } catch (error) {
      setStatusType("error");
      setStatus(error instanceof Error ? error.message : "Unable to save.");
    }
    finally { setSaving(false); }
  }
  async function confirmPlacementAction() {
    if (!pendingAction || saving) return;
    const reason = actionReason.trim();
    if (reason.length < 5) {
      setStatusType("error");
      setStatus("Add a reason with at least 5 characters.");
      return;
    }

    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/employer/managed-hiring/join", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placementId: pendingAction.placement.id,
          action: pendingAction.action,
          reason,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to update placement.");
      await refresh();
      setPendingAction(null);
      setActionReason("");
      setStatusType("success");
      setStatus("Placement billing status updated.");
    } catch (error) {
      setStatusType("error");
      setStatus(error instanceof Error ? error.message : "Unable to update.");
    } finally {
      setSaving(false);
    }
  }
  const applicationScoped = Boolean(params.get("applicationId"));
  const eligibleAgreements = applicationScoped
    ? requiredAgreementId
      ? agreements.filter((agreement) => agreement.id === requiredAgreementId)
      : []
    : agreements;
  const selected = eligibleAgreements.find(agreement => agreement.id === form.agreementId);
  const acceptedOfferReady =
    !applicationScoped ||
    Boolean(
      acceptedOffer?.compensationAmount &&
      acceptedOffer.currency === "INR",
    );
  const inputClass = "w-full rounded-lg bg-black/30 border border-white/10 p-3 text-sm text-white";
  return <PageContainer><div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
    <h1 className="text-3xl font-bold text-white">Confirm PPH joining</h1>
    <p className="text-text-secondary text-sm">The owning employer or HireGo administrator approves salary and joining. An invoice becomes eligible 25 full days after the confirmed joining time. Payment credit days start when the invoice is issued.</p>
    <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
      <label className="block">Application ID<input required readOnly={applicationScoped} className={inputClass} value={form.applicationId} onChange={e => setForm({ ...form, applicationId: e.target.value })} /></label>
      <label className="block">Accepted DAY_25 agreement<select required disabled={applicationScoped} className={inputClass} value={form.agreementId} onChange={e => { setForm({ ...form, agreementId: e.target.value }); setAccepted(false); }}>
        <option value="">Select agreement</option>{eligibleAgreements.map(a => <option key={a.id} value={a.id}>{a.agreementNumber}</option>)}
      </select></label>
      {!eligibleAgreements.length && (
        <p>
          {applicationScoped
            ? "This application is not linked to an active approved DAY_25 agreement. Complete managed-hiring agreement setup before confirming joining."
            : "No active DAY_25 agreement is available. Ask HireGo to prepare the agreement for acceptance."}
        </p>
      )}
      {selected && <p className="text-sm">Fee: {selected.feeValue} {selected.feeType === "PERCENTAGE" ? "%" : "INR"}; tax: {selected.taxRatePct}%; payment period: {selected.creditDays} days. <a className="underline" href={`/employer/managed-hiring/agreements/${selected.id}`}>Review full signed terms</a>.</p>}
      {applicationScoped && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-text-secondary">
          {acceptedOffer ? (
            <>
              <p><strong className="text-white">Accepted offer:</strong> {acceptedOffer.currency} {acceptedOffer.compensationAmount || "Compensation not stated"}</p>
              <p className="mt-1">Accepted: {new Date(acceptedOffer.acceptedAt).toLocaleString()}</p>
              {acceptedOffer.startDate && <p className="mt-1">Proposed start: {new Date(acceptedOffer.startDate).toLocaleString()}</p>}
            </>
          ) : (
            <p>No accepted offer is recorded for this application.</p>
          )}
        </div>
      )}
      {!acceptedOfferReady && applicationScoped && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          PPH joining requires an accepted INR offer with a stated compensation amount. Amend and re-send the offer before confirming joining.
        </p>
      )}
      <label className="block">Accepted annual CTC (INR)<input required readOnly={applicationScoped} type="number" min="0.01" max="1000000000" step="0.01" className={inputClass} value={form.annualCtc} onChange={e => { setForm({ ...form, annualCtc: e.target.value }); setAccepted(false); }} /></label>
      <label className="block">Actual joining time (your local timezone)<input required type="datetime-local" className={inputClass} value={form.joinedAt} onChange={e => { setForm({ ...form, joinedAt: e.target.value }); setAccepted(false); }} /></label>
      <label className="flex gap-3 text-sm"><input required disabled={!acceptedOfferReady} type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />I am authorised to confirm actual joining under the signed agreement using the candidate-accepted compensation, including automatic invoicing after 25 days.</label>
      <button disabled={saving || !accepted || !acceptedOfferReady} className="w-full rounded-xl bg-emerald-500 text-black font-bold py-3 disabled:opacity-50">{saving ? "Saving..." : "Approve joining & schedule invoice"}</button>
    </form>
    {status && <p role={statusType === "error" ? "alert" : "status"} className={statusType === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"}>{status}</p>}
    {loading && <p className="text-sm text-text-secondary">Loading joining and agreement records…</p>}
    <h2 className="text-xl font-bold">Recent placement billing records (up to 50)</h2>
    {placements.map(p => <div key={p.id} className="glass-card p-4 rounded-xl space-y-2"><p>Application: {p.applicationId}</p><p>{p.status} · INR {p.totalAmount}</p><p>Eligible: {new Date(p.invoiceEligibleAt).toLocaleString()}</p>{p.invoice && <p>Invoice: {p.invoice.invoiceNumber}</p>}{p.holdReason && <p>Hold: {p.holdReason}</p>}
      {["SCHEDULED", "HOLD"].includes(p.status) && <div className="flex gap-4">
        {p.status === "SCHEDULED" && <button disabled={saving} onClick={() => { setPendingAction({ placement: p, action: "HOLD" }); setActionReason(""); }}>Hold billing</button>}
        {p.status === "HOLD" && <button disabled={saving} onClick={() => { setPendingAction({ placement: p, action: "RESUME" }); setActionReason(""); }}>Resume (HireGo admin only)</button>}
        <button disabled={saving} onClick={() => { setPendingAction({ placement: p, action: "CANCEL" }); setActionReason(""); }}>Cancel billing</button></div>}
    </div>)}

    {pendingAction && (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="placement-action-title">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
          <h2 id="placement-action-title" className="text-xl font-bold text-white">{pendingAction.action} placement billing?</h2>
          <p className="mt-2 text-sm text-text-secondary">Application: {pendingAction.placement.applicationId}</p>
          <label className="mt-4 block text-sm text-text-secondary">Reason
            <textarea value={actionReason} onChange={(event) => setActionReason(event.target.value)} maxLength={1000} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" disabled={saving} onClick={() => { setPendingAction(null); setActionReason(""); }} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs font-bold text-white disabled:opacity-50">Cancel</button>
            <button type="button" disabled={saving || actionReason.trim().length < 5} onClick={() => void confirmPlacementAction()} className="min-h-11 rounded-xl bg-primary px-4 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving…" : `Confirm ${pendingAction.action.toLowerCase()}`}</button>
          </div>
        </div>
      </div>
    )}
  </div></PageContainer>;
}
