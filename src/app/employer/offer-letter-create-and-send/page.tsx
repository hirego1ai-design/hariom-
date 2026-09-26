"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

export default function OfferLetterCreatePage() {
  const params = useSearchParams();
  const [form, setForm] = useState({
    applicationId: "",
    title: "Employment Offer",
    compensationAmount: "",
    currency: "INR",
    startDate: "",
    expiresAt: "",
    roleTitle: "",
    employmentType: "Full-time",
    location: "",
    probation: "",
    noticePeriod: "",
    benefits: "",
    additionalTerms: "",
    documentFileId: "",
  });
  const [status, setStatus] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const applicationId = params.get("applicationId");
    if (applicationId) setForm((current) => ({ ...current, applicationId }));
  }, [params]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/employer/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: form.applicationId,
          title: form.title,
          compensationAmount: form.compensationAmount ? Number(form.compensationAmount) : undefined,
          currency: form.currency.toUpperCase(),
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
          expiresAt: new Date(form.expiresAt).toISOString(),
          terms: {
            roleTitle: form.roleTitle,
            employmentType: form.employmentType,
            ...(form.location ? { location: form.location } : {}),
            ...(form.probation ? { probation: form.probation } : {}),
            ...(form.noticePeriod ? { noticePeriod: form.noticePeriod } : {}),
            benefits: form.benefits.split("\n").map((item) => item.trim()).filter(Boolean),
            ...(form.additionalTerms ? { additionalTerms: form.additionalTerms } : {}),
          },
          ...(form.documentFileId ? { documentFileId: form.documentFileId } : {}),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to create offer.");
      setCreatedId(body.offer.id);
      setStatus("Offer draft saved. Review it in Offer Management, then explicitly approve and send it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create offer.");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white";
  return <PageContainer><div className="mx-auto max-w-3xl py-8 px-4 space-y-6">
    <div><h1 className="text-3xl font-bold text-white">Create offer</h1><p className="mt-2 text-sm text-text-secondary">Create a persisted offer draft for a selected candidate. Sending requires a separate human approval confirmation.</p></div>
    <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
      <label className="block text-sm">Application ID<input required className={input} value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })} /></label>
      <label className="block text-sm">Offer title<input required className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">Role title<input required className={input} value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} /></label>
        <label className="block text-sm">Employment type<input required className={input} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} /></label>
        <label className="block text-sm">Compensation amount<input type="number" min="0.01" step="0.01" className={input} value={form.compensationAmount} onChange={(e) => setForm({ ...form, compensationAmount: e.target.value })} /></label>
        <label className="block text-sm">Currency<input required maxLength={3} className={input} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></label>
        <label className="block text-sm">Proposed start date<input type="datetime-local" className={input} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
        <label className="block text-sm">Offer expires<input required type="datetime-local" className={input} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></label>
      </div>
      <label className="block text-sm">Location<input className={input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
      <label className="block text-sm">Probation<input className={input} value={form.probation} onChange={(e) => setForm({ ...form, probation: e.target.value })} /></label>
      <label className="block text-sm">Notice period<input className={input} value={form.noticePeriod} onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })} /></label>
      <label className="block text-sm">Benefits — one per line<textarea className={input} rows={4} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} /></label>
      <label className="block text-sm">Additional terms<textarea className={input} rows={6} value={form.additionalTerms} onChange={(e) => setForm({ ...form, additionalTerms: e.target.value })} /></label>
      <label className="block text-sm">Optional clean private file ID<input className={input} value={form.documentFileId} onChange={(e) => setForm({ ...form, documentFileId: e.target.value })} /><span className="mt-1 block text-xs text-text-secondary">Only an existing private file that passed malware scanning can be attached.</span></label>
      <button disabled={saving} className="w-full rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save offer draft"}</button>
    </form>
    {status && <p role="status" className="text-sm text-text-secondary">{status}</p>}
    {createdId && <a href="/employer/offer-management-dashboard" className="inline-flex rounded-full border border-white/10 px-5 py-2 text-sm font-bold">Open Offer Management</a>}
  </div></PageContainer>;
}
