"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

function OfferCreateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get("applicationId") || "";
  const [title, setTitle] = useState("Employment Offer");
  const [compensation, setCompensation] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [startDate, setStartDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [documentFileId, setDocumentFileId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const uploadDocument = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", "offer-docs");
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data.file?.id) throw new Error(data?.error || "Offer document upload failed.");
      setDocumentFileId(data.file.id);
      setMessage("Private offer document uploaded and scanned.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Offer document upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!applicationId) {
      setMessage("Open this page from a shortlisted candidate so applicationId is present.");
      return;
    }
    if (!documentFileId) {
      setMessage("Upload the private offer document before saving/sending.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const createResponse = await fetch("/api/employer/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          title,
          terms: { compensation, currency, employmentType, startDate, location, notes },
          documentFileId,
        }),
      });
      const created = await createResponse.json().catch(() => null);
      if (!createResponse.ok || !created?.success) throw new Error(created?.error || "Could not save offer.");

      const sendResponse = await fetch(`/api/employer/offers/${encodeURIComponent(created.offer.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND" }),
      });
      const sent = await sendResponse.json().catch(() => null);
      if (!sendResponse.ok || !sent?.success) throw new Error(sent?.error || "Offer saved but could not be sent.");
      router.push("/employer/offer-management-dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create offer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl py-8">
        <div className="mb-6">
          <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">HireGo · Offer lifecycle</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Create and send offer</h1>
          <p className="mt-2 text-sm text-slate-400">Offer acceptance is recorded separately from joining. Sending requires a clean private offer document.</p>
        </div>

        {message && <div role="status" className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{message}</div>}

        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-white/10 bg-[#121215] p-6">
          <label className="block text-xs text-slate-300">Offer title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" required />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs text-slate-300">Compensation
              <input value={compensation} onChange={(e) => setCompensation(e.target.value)} placeholder="e.g. 18,00,000 per year" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" required />
            </label>
            <label className="block text-xs text-slate-300">Currency
              <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" required />
            </label>
            <label className="block text-xs text-slate-300">Employment type
              <input value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" required />
            </label>
            <label className="block text-xs text-slate-300">Start date
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
            </label>
          </div>
          <label className="block text-xs text-slate-300">Location
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
          </label>
          <label className="block text-xs text-slate-300">Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
          </label>
          <label className="block text-xs text-slate-300">Private offer document (PDF/DOCX)
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => void uploadDocument(e.target.files?.[0] || null)} className="mt-2 block w-full text-xs text-slate-300" />
            <span className="mt-2 block text-[11px] text-slate-500">{uploading ? "Scanning and uploading…" : documentFileId ? "Document ready." : "Required before sending."}</span>
          </label>
          <button disabled={saving || uploading || !documentFileId} className="rounded-full bg-yellow px-6 py-3 text-xs font-bold text-black disabled:opacity-50">
            {saving ? "Saving and sending…" : "Save & send offer"}
          </button>
        </form>
      </div>
    </PageContainer>
  );
}

export default function OfferCreatePage() {
  return (
    <Suspense fallback={<PageContainer><div className="p-8 text-sm text-slate-400">Loading offer form…</div></PageContainer>}>
      <OfferCreateContent />
    </Suspense>
  );
}
