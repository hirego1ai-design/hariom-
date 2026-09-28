"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Agreement = {
  id: string;
  agreementNumber: string;
  companyId?: string;
  requirementId?: string;
  templateId?: string;
  companyName: string;
  clientLegalName: string;
  contactPerson: string;
  clientEmail: string;
  clientPhone: string;
  status:
    | "DRAFT"
    | "INTERNAL_REVIEW"
    | "SENT_TO_EMPLOYER"
    | "AMENDMENT_REQUESTED"
    | "ACTIVE"
    | "REJECTED"
    | "EXPIRED";
  feeType: "PERCENTAGE" | "FIXED";
  feeValue: number;
  invoiceRule: string;
  replacementDays: number;
  validityStartDate: string;
  validityEndDate: string;
  advancePaymentAmount: number;
  discountPercentage: number;
  creditDays: number;
  taxRatePct: number;
  customClauses?: string[];
  commercialNotes?: string | null;
  salesExecutiveNotes?: string | null;
  amendmentNotes?: string | null;
  signedByName?: string | null;
  signedByDesignation?: string | null;
  signedAt?: string | null;
  updatedAt: string;
};

type Requirement = {
  id: string;
  referenceCode: string;
  companyId?: string;
  companyName: string;
  currency: string;
  status: string;
  updatedAt: string;
};

type AgreementEvent = {
  id: string;
  eventType: string;
  performedBy: string;
  notes?: string;
  timestamp: string;
};

type EditForm = {
  clientLegalName: string;
  contactPerson: string;
  clientEmail: string;
  clientPhone: string;
  feeType: "PERCENTAGE" | "FIXED";
  feeValue: string;
  invoiceRule: string;
  replacementDays: string;
  creditDays: string;
  taxRatePct: string;
  discountPercentage: string;
  advancePaymentAmount: string;
  commercialNotes: string;
  salesExecutiveNotes: string;
  reason: string;
};

function editable(status: Agreement["status"]) {
  return ["DRAFT", "INTERNAL_REVIEW", "AMENDMENT_REQUESTED"].includes(status);
}

function statusClass(status: Agreement["status"]) {
  if (status === "ACTIVE") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "SENT_TO_EMPLOYER") return "border-sky-400/20 bg-sky-500/10 text-sky-300";
  if (status === "AMENDMENT_REQUESTED") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (status === "REJECTED" || status === "EXPIRED") return "border-red-400/20 bg-red-500/10 text-red-300";
  return "border-white/10 bg-white/5 text-slate-300";
}

export default function AdminAgreementReviewPage() {
  const params = useParams();
  const agreementId = String(params.id || "");

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [events, setEvents] = useState<AgreementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const [sendOpen, setSendOpen] = useState(false);
  const [sendReason, setSendReason] = useState("");
  const [sending, setSending] = useState(false);

  const currency = requirement?.currency || "currency";
  const canEdit = agreement ? editable(agreement.status) : false;
  const canSend = canEdit;

  const feeLabel = useMemo(() => {
    if (!agreement) return "";
    return agreement.feeType === "PERCENTAGE"
      ? `${agreement.feeValue}% of annual CTC`
      : `${currency} ${agreement.feeValue.toLocaleString()}`;
  }, [agreement, currency]);

  async function load() {
    if (!agreementId) return;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(
        `/api/agreements/contracts/${encodeURIComponent(agreementId)}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.agreement) {
        throw new Error(payload.error || "Unable to load commercial agreement.");
      }

      setAgreement(payload.agreement);
      setRequirement(payload.linkedRequirement || null);
      setEvents(Array.isArray(payload.events) ? payload.events : []);
    } catch (cause) {
      setAgreement(null);
      setRequirement(null);
      setEvents([]);
      setLoadError(
        cause instanceof Error ? cause.message : "Unable to load commercial agreement.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // agreementId identifies the canonical persisted record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  function openEditor() {
    if (!agreement || !canEdit) return;
    setNotice(null);
    setForm({
      clientLegalName: agreement.clientLegalName || "",
      contactPerson: agreement.contactPerson || "",
      clientEmail: agreement.clientEmail || "",
      clientPhone: agreement.clientPhone || "",
      feeType: agreement.feeType,
      feeValue: String(agreement.feeValue),
      invoiceRule: agreement.invoiceRule,
      replacementDays: String(agreement.replacementDays),
      creditDays: String(agreement.creditDays),
      taxRatePct: String(agreement.taxRatePct),
      discountPercentage: String(agreement.discountPercentage),
      advancePaymentAmount: String(agreement.advancePaymentAmount),
      commercialNotes: agreement.commercialNotes || "",
      salesExecutiveNotes: agreement.salesExecutiveNotes || "",
      reason: "",
    });
    setEditing(true);
  }

  async function saveChanges() {
    if (!agreement || !form || saving) return;

    const feeValue = Number(form.feeValue);
    const replacementDays = Number(form.replacementDays);
    const creditDays = Number(form.creditDays);
    const taxRatePct = Number(form.taxRatePct);
    const discountPercentage = Number(form.discountPercentage);
    const advancePaymentAmount = Number(form.advancePaymentAmount);

    if (
      !form.clientLegalName.trim() ||
      !form.contactPerson.trim() ||
      !form.clientEmail.trim() ||
      form.reason.trim().length < 3
    ) {
      setNotice({ type: "error", text: "Required client fields and a specific change reason are required." });
      return;
    }
    if (
      !Number.isFinite(feeValue) ||
      feeValue <= 0 ||
      (form.feeType === "PERCENTAGE" && feeValue > 100) ||
      !Number.isInteger(replacementDays) ||
      replacementDays < 0 ||
      !Number.isInteger(creditDays) ||
      creditDays < 0 ||
      !Number.isFinite(taxRatePct) ||
      taxRatePct < 0 ||
      taxRatePct > 100 ||
      !Number.isFinite(discountPercentage) ||
      discountPercentage < 0 ||
      discountPercentage > 100 ||
      !Number.isFinite(advancePaymentAmount) ||
      advancePaymentAmount < 0
    ) {
      setNotice({ type: "error", text: "One or more commercial values are outside the allowed range." });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/agreements/contracts/${encodeURIComponent(agreement.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientLegalName: form.clientLegalName.trim(),
            contactPerson: form.contactPerson.trim(),
            clientEmail: form.clientEmail.trim(),
            clientPhone: form.clientPhone.trim(),
            feeType: form.feeType,
            feeValue,
            invoiceRule: form.invoiceRule.trim(),
            replacementDays,
            creditDays,
            taxRatePct,
            discountPercentage,
            advancePaymentAmount,
            commercialNotes: form.commercialNotes.trim(),
            salesExecutiveNotes: form.salesExecutiveNotes.trim(),
            expectedUpdatedAt: new Date(agreement.updatedAt).toISOString(),
            reason: form.reason.trim(),
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.agreement) {
        throw new Error(payload.error || "Unable to save agreement changes.");
      }

      setAgreement(payload.agreement);
      setEditing(false);
      setForm(null);
      setNotice({ type: "success", text: "Agreement changes saved and audited." });
      await load();
    } catch (cause) {
      setNotice({
        type: "error",
        text: cause instanceof Error ? cause.message : "Unable to save agreement changes.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function sendToEmployer() {
    if (!agreement || sending || sendReason.trim().length < 3) return;
    setSending(true);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/agreements/contracts/${encodeURIComponent(agreement.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_to_employer",
            expectedUpdatedAt: new Date(agreement.updatedAt).toISOString(),
            reason: sendReason.trim(),
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.agreement) {
        throw new Error(payload.error || "Unable to send agreement to employer review.");
      }

      const outcomes = Array.isArray(payload.communications)
        ? payload.communications
            .map((item: { channel?: string; status?: string }) =>
              `${item.channel || "channel"}: ${item.status || "unknown"}`,
            )
            .join(" · ")
        : "";

      setAgreement(payload.agreement);
      setSendOpen(false);
      setSendReason("");
      setNotice({
        type: "success",
        text: outcomes
          ? `Agreement moved to employer review. Provider outcomes: ${outcomes}. Provider acceptance is not delivery/read confirmation.`
          : "Agreement moved to employer review. No notification delivery outcome was returned.",
      });
      await load();
    } catch (cause) {
      setNotice({
        type: "error",
        text: cause instanceof Error ? cause.message : "Unable to send agreement to employer review.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Commercial Agreement Review"
          subtitle="Versioned terms, lifecycle transitions and employer-review evidence"
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/managed-hiring/pipeline" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white">
              Back to pipeline
            </Link>
            <Link href="/admin/agreements/templates" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white">
              Agreement templates
            </Link>
          </div>

          {notice && (
            <div
              role={notice.type === "error" ? "alert" : "status"}
              aria-live={notice.type === "error" ? "assertive" : "polite"}
              className={`rounded-xl border p-4 text-sm ${
                notice.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {notice.text}
            </div>
          )}

          {loading ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-slate-400">
              Loading authoritative agreement evidence…
            </div>
          ) : loadError || !agreement ? (
            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
              {loadError || "Agreement is unavailable."}
            </div>
          ) : (
            <>
              <section className="rounded-3xl border border-white/10 bg-[#121215] p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-xs font-bold text-sky-300">{agreement.agreementNumber}</p>
                    <h1 className="mt-2 text-2xl font-bold">{agreement.companyName}</h1>
                    <p className="mt-1 text-sm text-slate-400">
                      {agreement.clientLegalName} · {agreement.contactPerson} · {agreement.clientEmail}
                    </p>
                    {requirement && (
                      <p className="mt-2 text-xs text-slate-500">
                        Requirement {requirement.referenceCode} · {requirement.status.replaceAll("_", " ")} · billing currency {requirement.currency}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(agreement.status)}`}>
                      {agreement.status.replaceAll("_", " ")}
                    </span>
                    {canEdit && (
                      <button type="button" onClick={openEditor} className="rounded-xl border border-sky-400/30 px-4 py-2 text-xs font-bold text-sky-300">
                        Edit reviewed terms
                      </button>
                    )}
                    {canSend && (
                      <button
                        type="button"
                        onClick={() => {
                          setSendReason("");
                          setSendOpen(true);
                        }}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
                      >
                        Send to employer
                      </button>
                    )}
                  </div>
                </div>

                {agreement.status === "AMENDMENT_REQUESTED" && agreement.amendmentNotes && (
                  <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <p className="font-bold">Employer amendment request</p>
                    <p className="mt-1 whitespace-pre-wrap">{agreement.amendmentNotes}</p>
                  </div>
                )}

                {agreement.status === "ACTIVE" && (
                  <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    Signed by {agreement.signedByName || "recorded employer signer"}
                    {agreement.signedByDesignation ? ` · ${agreement.signedByDesignation}` : ""}
                    {agreement.signedAt ? ` · ${new Date(agreement.signedAt).toLocaleString()}` : ""}
                  </div>
                )}
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Agreement commercial snapshot">
                {[
                  ["Placement fee", feeLabel],
                  ["Invoice rule", agreement.invoiceRule],
                  ["Replacement", `${agreement.replacementDays} days`],
                  ["Credit terms", `${agreement.creditDays} days`],
                  ["Tax", `${agreement.taxRatePct}%`],
                  ["Discount", `${agreement.discountPercentage}%`],
                  ["Advance payment", requirement ? `${currency} ${agreement.advancePaymentAmount.toLocaleString()}` : String(agreement.advancePaymentAmount)],
                  ["Validity", `${new Date(agreement.validityStartDate).toLocaleDateString()} → ${new Date(agreement.validityEndDate).toLocaleDateString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-[#121215] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="mt-2 text-sm font-bold">{value}</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#121215] p-5">
                  <h2 className="font-bold">Commercial notes</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400">
                    {agreement.commercialNotes || "No commercial notes recorded."}
                  </p>
                  {agreement.salesExecutiveNotes && (
                    <>
                      <h3 className="mt-5 text-xs font-bold uppercase text-slate-500">Internal sales notes</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{agreement.salesExecutiveNotes}</p>
                    </>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]">
                  <div className="border-b border-white/10 p-5">
                    <h2 className="font-bold">Lifecycle evidence</h2>
                    <p className="mt-1 text-xs text-slate-500">Persisted agreement events, newest first.</p>
                  </div>
                  {events.length === 0 ? (
                    <div className="p-6 text-sm text-slate-400">No agreement events are persisted.</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {events.map((event) => (
                        <article key={event.id} className="p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold">{event.eventType.replaceAll("_", " ")}</span>
                            <span className="text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">Actor: {event.performedBy}</p>
                          {event.notes && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{event.notes}</p>}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {editing && agreement && form && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="agreement-editor-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <h2 id="agreement-editor-title" className="text-lg font-bold">Edit reviewed agreement terms</h2>
            <p className="mt-2 text-xs text-slate-500">Changes are version-checked and audited. Managed Hiring billing remains constrained to the production DAY_25/no-advance workflow.</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-400">Client legal name<input value={form.clientLegalName} onChange={(e) => setForm({ ...form, clientLegalName: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Contact person<input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Client email<input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Client phone<input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Fee type<select value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value as "PERCENTAGE" | "FIXED" })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] p-3 text-white"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed</option></select></label>
              <label className="text-xs text-slate-400">Fee value ({form.feeType === "PERCENTAGE" ? "%" : currency})<input type="number" min="0.01" step="0.01" value={form.feeValue} onChange={(e) => setForm({ ...form, feeValue: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Invoice rule<input value={form.invoiceRule} onChange={(e) => setForm({ ...form, invoiceRule: e.target.value })} readOnly={Boolean(requirement)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white read-only:text-slate-500" /></label>
              <label className="text-xs text-slate-400">Replacement days<input type="number" min="0" max="3650" value={form.replacementDays} onChange={(e) => setForm({ ...form, replacementDays: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Credit days<input type="number" min="0" max="3650" value={form.creditDays} onChange={(e) => setForm({ ...form, creditDays: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Tax rate %<input type="number" min="0" max="100" step="0.01" value={form.taxRatePct} onChange={(e) => setForm({ ...form, taxRatePct: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Discount %<input type="number" min="0" max="100" step="0.01" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400">Advance payment ({currency})<input type="number" min="0" step="0.01" value={form.advancePaymentAmount} onChange={(e) => setForm({ ...form, advancePaymentAmount: e.target.value })} readOnly={Boolean(requirement)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white read-only:text-slate-500" /></label>
              <label className="text-xs text-slate-400 md:col-span-2">Commercial notes<textarea value={form.commercialNotes} onChange={(e) => setForm({ ...form, commercialNotes: e.target.value })} rows={3} maxLength={10000} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400 md:col-span-2">Internal sales notes<textarea value={form.salesExecutiveNotes} onChange={(e) => setForm({ ...form, salesExecutiveNotes: e.target.value })} rows={3} maxLength={10000} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
              <label className="text-xs text-slate-400 md:col-span-2">Change reason<textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} maxLength={2000} placeholder="Why are these reviewed commercial terms changing?" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" /></label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
              <button type="button" disabled={saving} onClick={() => { setEditing(false); setForm(null); }} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40">Cancel</button>
              <button type="button" disabled={saving || form.reason.trim().length < 3} onClick={() => void saveChanges()} className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold disabled:opacity-40">{saving ? "Saving…" : "Save audited changes"}</button>
            </div>
          </div>
        </div>
      )}

      {sendOpen && agreement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="send-agreement-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <h2 id="send-agreement-title" className="text-lg font-bold">Send agreement to employer review?</h2>
            <p className="mt-2 text-sm text-slate-400">
              This transitions the agreement and linked requirement to employer review. Notification provider outcomes are recorded separately from delivery/read confirmation.
            </p>
            <label className="mt-5 block text-xs text-slate-400">
              Review / send reason
              <textarea value={sendReason} onChange={(e) => setSendReason(e.target.value)} rows={4} maxLength={2000} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={sending} onClick={() => { setSendOpen(false); setSendReason(""); }} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40">Cancel</button>
              <button type="button" disabled={sending || sendReason.trim().length < 3} onClick={() => void sendToEmployer()} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold disabled:opacity-40">{sending ? "Sending…" : "Send for employer review"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
