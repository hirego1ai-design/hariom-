"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

export default function ManagedHiringJoinPage() {
  const params = useSearchParams();
  const [form, setForm] = useState({ applicationId: "", agreementId: "", candidateName: "", jobTitle: "", annualCtc: "", feePercentage: "8.33", taxRatePct: "18" });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      applicationId: params.get("applicationId") || current.applicationId,
      candidateName: params.get("candidateName") || current.candidateName,
      jobTitle: params.get("jobTitle") || current.jobTitle,
    }));
  }, [params]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const response = await fetch("/api/employer/managed-hiring/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        annualCtc: Number(form.annualCtc),
        feePercentage: Number(form.feePercentage),
        taxRatePct: Number(form.taxRatePct),
        idempotencyKey: `${form.applicationId}-${form.candidateName}-${form.jobTitle}`,
      }),
    });
    const data = await response.json();
    setSaving(false);
    setStatus(response.ok ? `Invoice ${data.invoice?.invoiceNumber || "created"} generated successfully.` : (data.error || "Unable to generate invoice."));
  }

  return <PageContainer><div className="max-w-3xl mx-auto py-8 px-4"><p className="text-yellow text-xs font-bold uppercase tracking-[0.2em] mb-2">Managed Hiring</p><h1 className="text-3xl font-bold text-white">Mark candidate joined</h1><p className="text-text-secondary text-sm mt-2 mb-7">Confirm joining details. The invoice is created once and repeated submissions are safely treated as duplicates.</p><form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">{(["applicationId", "agreementId", "candidateName", "jobTitle", "annualCtc", "feePercentage", "taxRatePct"] as const).map((field) => <label key={field} className="block"><span className="block text-xs text-text-secondary mb-1">{field === "annualCtc" ? "Annual CTC (INR)" : field === "feePercentage" ? "Placement fee (%)" : field === "taxRatePct" ? "Tax (%)" : field.replaceAll(/([A-Z])/g, " $1")}</span><input required={field !== "taxRatePct" && field !== "feePercentage"} type={field === "annualCtc" || field === "feePercentage" || field === "taxRatePct" ? "number" : "text"} step="0.01" value={form[field]} onChange={(event) => update(field, event.target.value)} className="w-full rounded-lg bg-black/30 border border-white/10 p-3 text-sm text-white" /></label>)}<button disabled={saving} className="w-full rounded-xl bg-emerald-500 text-black font-bold py-3 disabled:opacity-50">{saving ? "Generating..." : "Confirm joining & generate invoice"}</button>{status && <p className="text-sm text-emerald-300">{status}</p>}</form></div></PageContainer>;
}
