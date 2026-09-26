"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

function OfferCreateContent() {
  const params = useSearchParams();
  const [form, setForm] = useState({
    applicationId: "",
    positionTitle: "",
    annualCompensation: "",
    currency: "INR",
    joiningDate: "",
    summary: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [documentFileId, setDocumentFileId] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const applicationId = params.get("applicationId");
    if (applicationId) setForm((current) => ({ ...current, applicationId }));
  }, [params]);

  const uploadDocument = async () => {
    if (documentFileId) return documentFileId;
    if (!file) throw new Error("Choose the private offer document before sending.");
    const data = new FormData();
    data.set("file", file);
    data.set("category", "offer-documents");
    const response = await fetch("/api/upload", { method: "POST", body: data });
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error || "Offer document upload failed.");
    setDocumentFileId(body.file.id);
    return body.file.id as string;
  };

  const submit = async (action: "DRAFT" | "SEND") => {
    if (saving) return;
    setSaving(true);
    setStatus("");
    try {
      const privateDocumentId = action === "SEND"
        ? await uploadDocument()
        : documentFileId || (file ? await uploadDocument() : null);
      const response = await fetch("/api/employer/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: form.applicationId,
          action,
          positionTitle: form.positionTitle,
          annualCompensation: Number(form.annualCompensation),
          currency: form.currency,
          joiningDate: form.joiningDate ? new Date(form.joiningDate).toISOString() : null,
          terms: { summary: form.summary },
          documentFileId: privateDocumentId,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Unable to save offer.");
      setStatus(action === "SEND"
        ? "Offer sent. The candidate can now review the private document and accept or decline it."
        : "Offer draft saved.");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Unable to save offer.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Offer lifecycle</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Create and send offer</h1>
        <p className="mt-2 text-sm text-text-muted">Only real shortlisted applications can receive an offer. Sending requires a malware-scanned private offer document.</p>
      </header>

      <section className="glass-card rounded-3xl border border-white/10 p-6 space-y-4">
        <label className="block text-sm">Application ID
          <input required className={inputClass} value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })} />
        </label>
        <label className="block text-sm">Position title
          <input required className={inputClass} value={form.positionTitle} onChange={(e) => setForm({ ...form, positionTitle: e.target.value })} />
        </label>
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <label className="block text-sm">Annual compensation
            <input required type="number" min="1" step="0.01" className={inputClass} value={form.annualCompensation} onChange={(e) => setForm({ ...form, annualCompensation: e.target.value })} />
          </label>
          <label className="block text-sm">Currency
            <input required maxLength={3} className={inputClass} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
          </label>
        </div>
        <label className="block text-sm">Planned joining date
          <input type="datetime-local" className={inputClass} value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
        </label>
        <label className="block text-sm">Offer terms summary
          <textarea required rows={6} className={inputClass} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </label>
        <label className="block text-sm">Private offer document (PDF/DOCX)
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className={inputClass}
            onChange={(e) => { setFile(e.target.files?.[0] || null); setDocumentFileId(""); }}
          />
        </label>

        {status && <div role="status" className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-text-secondary">{status}</div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" disabled={saving} onClick={() => void submit("DRAFT")} className="rounded-full border border-white/15 px-6 py-3 text-xs font-bold disabled:opacity-50">
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button type="button" disabled={saving || !file && !documentFileId} onClick={() => void submit("SEND")} className="rounded-full bg-primary px-7 py-3 text-xs font-bold text-white disabled:opacity-50">
            {saving ? "Sending…" : "Send offer to candidate"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function OfferCreatePage() {
  return <PageContainer><Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}><OfferCreateContent /></Suspense></PageContainer>;
}
