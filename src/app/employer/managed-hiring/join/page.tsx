"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Placement = { id: string; applicationId: string; status: string; invoiceEligibleAt: string; totalAmount: string; holdReason?: string; invoice?: { invoiceNumber: string } | null };
type Agreement = { id: string; agreementNumber: string; status: string; invoiceRule: string; feeType: string; feeValue: number; taxRatePct: number; creditDays: number };
export default function ManagedHiringJoinPage() {
  const params = useSearchParams();
  const [form, setForm] = useState({ applicationId: "", agreementId: "", annualCtc: "", joinedAt: "" });
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/employer/managed-hiring/join");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load placements.");
    setPlacements(data.placements);
  }, []);
  useEffect(() => { setForm(current => ({ ...current, applicationId: params.get("applicationId") || current.applicationId })); }, [params]);
  useEffect(() => {
    refresh().catch(error => setStatus(error.message));
    fetch("/api/agreements/contracts?status=ACTIVE").then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load agreements.");
      setAgreements(data.agreements.filter((agreement: Agreement) => agreement.invoiceRule === "DAY_25"));
    }).catch(error => setStatus(error.message));
  }, [refresh]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setStatus("");
    try {
      const response = await fetch("/api/employer/managed-hiring/join", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, annualCtc: Number(form.annualCtc), joinedAt: new Date(form.joinedAt).toISOString(), termsAccepted: accepted }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to confirm joining.");
      setStatus(`Joining recorded. Status: ${data.placement.status}. Invoice eligible: ${new Date(data.placement.invoiceEligibleAt).toLocaleString()}. No immediate invoice was created.`);
      await refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save."); }
    finally { setSaving(false); }
  }
  async function changeStatus(placement: Placement, action: "HOLD" | "CANCEL" | "RESUME") {
    const reason = window.prompt("Reason for this billing change (minimum 5 characters):");
    if (!reason) return;
    setSaving(true);
    try {
      const response = await fetch("/api/employer/managed-hiring/join", { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placementId: placement.id, action, reason }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update placement.");
      await refresh(); setStatus("Placement billing status updated.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to update."); }
    finally { setSaving(false); }
  }
  const selected = agreements.find(agreement => agreement.id === form.agreementId);
  const inputClass = "w-full rounded-lg bg-black/30 border border-white/10 p-3 text-sm text-white";
  return <PageContainer><div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
    <h1 className="text-3xl font-bold text-white">Confirm PPH joining</h1>
    <p className="text-text-secondary text-sm">The owning employer or HireGo administrator approves salary and joining. An invoice becomes eligible 25 full days after the confirmed joining time. Payment credit days start when the invoice is issued.</p>
    <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
      <label className="block">Application ID<input required className={inputClass} value={form.applicationId} onChange={e => setForm({ ...form, applicationId: e.target.value })} /></label>
      <label className="block">Accepted DAY_25 agreement<select required className={inputClass} value={form.agreementId} onChange={e => { setForm({ ...form, agreementId: e.target.value }); setAccepted(false); }}>
        <option value="">Select agreement</option>{agreements.map(a => <option key={a.id} value={a.id}>{a.agreementNumber}</option>)}
      </select></label>
      {!agreements.length && <p>No active DAY_25 agreement is available. Ask HireGo to prepare the agreement for acceptance.</p>}
      {selected && <p className="text-sm">Fee: {selected.feeValue} {selected.feeType === "PERCENTAGE" ? "%" : "INR"}; tax: {selected.taxRatePct}%; payment period: {selected.creditDays} days. <a className="underline" href={`/employer/managed-hiring/agreements/${selected.id}`}>Review full signed terms</a>.</p>}
      <label className="block">Approved annual CTC (INR)<input required type="number" min="0.01" max="1000000000" step="0.01" className={inputClass} value={form.annualCtc} onChange={e => { setForm({ ...form, annualCtc: e.target.value }); setAccepted(false); }} /></label>
      <label className="block">Actual joining time (your local timezone)<input required type="datetime-local" className={inputClass} value={form.joinedAt} onChange={e => { setForm({ ...form, joinedAt: e.target.value }); setAccepted(false); }} /></label>
      <label className="flex gap-3 text-sm"><input required type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />I am authorised to approve this salary and confirm actual joining under the signed agreement, including automatic invoicing after 25 days.</label>
      <button disabled={saving || !accepted} className="w-full rounded-xl bg-emerald-500 text-black font-bold py-3 disabled:opacity-50">{saving ? "Saving..." : "Approve joining & schedule invoice"}</button>
    </form>
    {status && <p role="status" className="text-sm text-emerald-300">{status}</p>}
    <h2 className="text-xl font-bold">Recent placement billing records (up to 50)</h2>
    {placements.map(p => <div key={p.id} className="glass-card p-4 rounded-xl space-y-2"><p>Application: {p.applicationId}</p><p>{p.status} · INR {p.totalAmount}</p><p>Eligible: {new Date(p.invoiceEligibleAt).toLocaleString()}</p>{p.invoice && <p>Invoice: {p.invoice.invoiceNumber}</p>}{p.holdReason && <p>Hold: {p.holdReason}</p>}
      {["SCHEDULED", "HOLD"].includes(p.status) && <div className="flex gap-4">
        {p.status === "SCHEDULED" && <button disabled={saving} onClick={() => changeStatus(p, "HOLD")}>Hold billing</button>}
        {p.status === "HOLD" && <button disabled={saving} onClick={() => changeStatus(p, "RESUME")}>Resume (HireGo admin only)</button>}
        <button disabled={saving} onClick={() => changeStatus(p, "CANCEL")}>Cancel billing</button></div>}
    </div>)}
  </div></PageContainer>;
}
