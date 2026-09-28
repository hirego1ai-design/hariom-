"use client";

import React, { useCallback, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AgreementTemplateRecord } from "@/types";
import { formatCurrency } from "@/utils";

type TemplateEditor = {
  id?: string;
  expectedUpdatedAt?: string;
  name: string;
  description: string;
  category: string;
  feeType: "" | "PERCENTAGE" | "FIXED";
  feeValue: string;
  invoiceRule: "" | "ON_OFFER" | "ON_JOINING" | "DAY_25" | "DAY_30" | "SPLIT_50_50";
  replacementDays: string;
  validityMonths: string;
  advancePayment: string;
  creditTermsDays: string;
  standardDiscountPct: string;
  taxRatePct: string;
  specialClauses: string;
  commercialNotes: string;
  changeReason: string;
};

const EMPTY_TEMPLATE: TemplateEditor = {
  name: "",
  description: "",
  category: "",
  feeType: "",
  feeValue: "",
  invoiceRule: "",
  replacementDays: "",
  validityMonths: "",
  advancePayment: "",
  creditTermsDays: "",
  standardDiscountPct: "",
  taxRatePct: "",
  specialClauses: "",
  commercialNotes: "",
  changeReason: "",
};

function toEditor(template: AgreementTemplateRecord): TemplateEditor {
  return {
    id: template.id,
    expectedUpdatedAt: template.updatedAt,
    name: template.name,
    description: template.description,
    category: template.category,
    feeType: template.feeType === "FIXED" ? "FIXED" : "PERCENTAGE",
    feeValue: String(template.feeValue),
    invoiceRule: ["ON_OFFER", "ON_JOINING", "DAY_25", "DAY_30", "SPLIT_50_50"].includes(template.invoiceRule)
      ? template.invoiceRule as TemplateEditor["invoiceRule"]
      : "",
    replacementDays: String(template.replacementDays),
    validityMonths: template.validityMonths === undefined ? "" : String(template.validityMonths),
    advancePayment: template.advancePayment === undefined ? "" : String(template.advancePayment),
    creditTermsDays: template.creditTermsDays === undefined ? "" : String(template.creditTermsDays),
    standardDiscountPct: template.standardDiscountPct === undefined ? "" : String(template.standardDiscountPct),
    taxRatePct: template.taxRatePct === undefined ? "" : String(template.taxRatePct),
    specialClauses: (template.specialClauses || []).join("\n"),
    commercialNotes: template.commercialNotes || "",
    changeReason: "",
  };
}

export default function AdminAgreementTemplatesPage() {
  const [templates, setTemplates] = useState<AgreementTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateEditor | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: "duplicate" | "archive";
    template: AgreementTemplateRecord;
  } | null>(null);
  const [pendingActionReason, setPendingActionReason] = useState("");
  const [pendingActionSaving, setPendingActionSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agreements/templates", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load agreement templates.");
      setTemplates(data.templates || []);
    } catch (error) {
      setActionMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load agreement templates." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const setField = (field: keyof TemplateEditor, value: string) => {
    setEditingTemplate((current) => current ? { ...current, [field]: value } : current);
  };

  const buildPayload = (editor: TemplateEditor) => {
    const numeric = {
      feeValue: Number(editor.feeValue),
      replacementDays: Number(editor.replacementDays),
      validityMonths: Number(editor.validityMonths),
      advancePayment: Number(editor.advancePayment),
      creditTermsDays: Number(editor.creditTermsDays),
      standardDiscountPct: Number(editor.standardDiscountPct),
      taxRatePct: Number(editor.taxRatePct),
    };

    if (!editor.name.trim() || !editor.category.trim() || !editor.feeType || !editor.invoiceRule) {
      throw new Error("Name, category, fee type, and invoice rule are required.");
    }
    if (Object.values(numeric).some((value) => !Number.isFinite(value))) {
      throw new Error("Every commercial numeric field must contain an explicit valid number.");
    }
    if (numeric.feeValue <= 0 || (editor.feeType === "PERCENTAGE" && numeric.feeValue > 100)) {
      throw new Error("Enter a valid approved fee value.");
    }
    if (!Number.isInteger(numeric.replacementDays) || numeric.replacementDays < 0 || numeric.replacementDays > 3650) {
      throw new Error("Replacement warranty must be an integer from 0 to 3650 days.");
    }
    if (!Number.isInteger(numeric.validityMonths) || numeric.validityMonths < 1 || numeric.validityMonths > 120) {
      throw new Error("Validity must be an integer from 1 to 120 months.");
    }
    if (numeric.advancePayment < 0 || numeric.advancePayment > 1_000_000_000) {
      throw new Error("Advance payment is outside the allowed range.");
    }
    if (!Number.isInteger(numeric.creditTermsDays) || numeric.creditTermsDays < 0 || numeric.creditTermsDays > 365) {
      throw new Error("Credit terms must be an integer from 0 to 365 days.");
    }
    if (numeric.standardDiscountPct < 0 || numeric.standardDiscountPct > 100 || numeric.taxRatePct < 0 || numeric.taxRatePct > 100) {
      throw new Error("Discount and tax percentages must be between 0 and 100.");
    }

    return {
      name: editor.name.trim(),
      description: editor.description.trim(),
      category: editor.category.trim(),
      feeType: editor.feeType,
      feeValue: numeric.feeValue,
      invoiceRule: editor.invoiceRule,
      replacementDays: numeric.replacementDays,
      validityMonths: numeric.validityMonths,
      advancePayment: numeric.advancePayment,
      creditTermsDays: numeric.creditTermsDays,
      standardDiscountPct: numeric.standardDiscountPct,
      taxRatePct: numeric.taxRatePct,
      specialClauses: editor.specialClauses.split("\n").map((clause) => clause.trim()).filter(Boolean),
      ...(editor.commercialNotes.trim() ? { commercialNotes: editor.commercialNotes.trim() } : {}),
    };
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setActionMessage(null);
    setSaving(true);
    try {
      const payload = buildPayload(editingTemplate);
      if (editingTemplate.changeReason.trim().length < 3) {
        throw new Error("Enter a specific reason for this commercial template change.");
      }
      const isEdit = Boolean(editingTemplate.id);
      if (isEdit && !editingTemplate.expectedUpdatedAt) {
        throw new Error("Template version is missing. Refresh before editing.");
      }
      const response = await fetch(
        isEdit ? `/api/agreements/templates/${editingTemplate.id}` : "/api/agreements/templates",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? {
                  ...payload,
                  expectedUpdatedAt: editingTemplate.expectedUpdatedAt,
                  reason: editingTemplate.changeReason.trim(),
                }
              : {
                  ...payload,
                  reason: editingTemplate.changeReason.trim(),
                },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save agreement template.");
      setEditingTemplate(null);
      setActionMessage({ type: "success", text: isEdit ? "Agreement template updated." : "Agreement template created." });
      await loadTemplates();
    } catch (error) {
      setActionMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save agreement template." });
    } finally {
      setSaving(false);
    }
  };

  const handlePendingAction = async () => {
    if (
      !pendingAction ||
      pendingActionSaving ||
      pendingActionReason.trim().length < 3
    ) {
      return;
    }

    setActionMessage(null);
    setPendingActionSaving(true);
    try {
      const isDuplicate = pendingAction.action === "duplicate";
      const response = await fetch(
        `/api/agreements/templates/${pendingAction.template.id}`,
        {
          method: isDuplicate ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isDuplicate
              ? {
                  action: "duplicate",
                  expectedUpdatedAt: pendingAction.template.updatedAt,
                  reason: pendingActionReason.trim(),
                }
              : {
                  expectedUpdatedAt: pendingAction.template.updatedAt,
                  reason: pendingActionReason.trim(),
                },
          ),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            (isDuplicate
              ? "Unable to clone template."
              : "Unable to archive template."),
        );
      }

      setActionMessage({
        type: "success",
        text: isDuplicate
          ? "Template cloned from the reviewed source version."
          : "Template archived. Existing agreements remain unchanged.",
      });
      setPendingAction(null);
      setPendingActionReason("");
      await loadTemplates();
    } catch (error) {
      setActionMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to complete template action.",
      });
    } finally {
      setPendingActionSaving(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6">
        {actionMessage && <div role={actionMessage.type === "error" ? "alert" : "status"} aria-live={actionMessage.type === "error" ? "assertive" : "polite"} className={`rounded-xl border px-4 py-3 text-sm ${actionMessage.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>{actionMessage.text}</div>}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#AB47BC]/10 text-[#AB47BC] border border-[#AB47BC]/20 mb-1">INTERNAL USE ONLY</div>
            <h1 className="text-2xl font-bold text-white">Agreement Template Library</h1>
            <p className="text-xs text-slate-400">Commercial terms are explicit and persisted; no fee, tax, warranty, credit, or invoice defaults are invented by this screen.</p>
          </div>
          <button onClick={() => { setActionMessage(null); setEditingTemplate({ ...EMPTY_TEMPLATE }); }} className="px-4 py-2.5 rounded-xl bg-[#29B6F6] text-white text-xs font-bold hover:bg-[#29B6F6]/90 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Create Template
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-slate-400">No active agreement templates are configured.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl hover:border-white/20 transition-all">
                <div className="flex justify-between items-start gap-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-[#AB47BC]/20 text-[#AB47BC] border border-[#AB47BC]/40">{template.category}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{template.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{template.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#16161B] p-3 rounded-xl border border-white/5">
                  <div><span className="text-slate-500 block text-[10px]">Fee Structure</span><span className="font-bold text-[#26A69A]">{template.feeType === "PERCENTAGE" ? `${template.feeValue}% of CTC` : formatCurrency(template.feeValue)}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Warranty</span><span className="font-bold text-[#29B6F6]">{template.replacementDays} Days</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Invoice Rule</span><span className="font-bold text-slate-300">{template.invoiceRule}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Credit Terms</span><span className="font-bold text-slate-300">{template.creditTermsDays} Days</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Tax</span><span className="font-bold text-slate-300">{template.taxRatePct}%</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Validity</span><span className="font-bold text-slate-300">{template.validityMonths} Months</span></div>
                </div>
                <div className="pt-2 border-t border-white/5 flex flex-wrap justify-end gap-2">
                  <button onClick={() => setEditingTemplate(toEditor(template))} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#29B6F6] hover:bg-white/5">Edit</button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingActionReason("");
                      setPendingAction({ action: "duplicate", template });
                    }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/5"
                  >
                    Clone
                  </button>
                  {!template.isArchived && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingActionReason("");
                        setPendingAction({ action: "archive", template });
                      }}
                      className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {editingTemplate && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" role="presentation">
            <div role="dialog" aria-modal="true" aria-labelledby="template-editor-title" className="bg-[#121215] border border-white/10 rounded-2xl p-6 max-w-3xl w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 id="template-editor-title" className="text-lg font-bold text-white">{editingTemplate.id ? "Edit Agreement Template" : "Create Agreement Template"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs text-slate-400">Template Name<input value={editingTemplate.name} onChange={(e) => setField("name", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400">Category<input value={editingTemplate.category} onChange={(e) => setField("category", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400 md:col-span-2">Description<textarea value={editingTemplate.description} onChange={(e) => setField("description", e.target.value)} rows={2} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400">Fee Type<select value={editingTemplate.feeType} onChange={(e) => setField("feeType", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"><option value="">Select</option><option value="PERCENTAGE">Percentage of Annual CTC</option><option value="FIXED">Fixed Commercial Amount</option></select></label>
                <label className="text-xs text-slate-400">Fee Value<input type="number" min="0" value={editingTemplate.feeValue} onChange={(e) => setField("feeValue", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400">Invoice Rule<select value={editingTemplate.invoiceRule} onChange={(e) => setField("invoiceRule", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"><option value="">Select</option><option value="DAY_25">25 days after confirmed joining</option><option value="ON_OFFER">On Offer</option><option value="ON_JOINING">On Joining</option><option value="DAY_30">30 days after joining</option><option value="SPLIT_50_50">50% / 50%</option></select></label>
                <label className="text-xs text-slate-400">Replacement Warranty (Days)<input type="number" min="0" max="3650" value={editingTemplate.replacementDays} onChange={(e) => setField("replacementDays", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400">Validity (Months)<input type="number" min="1" max="120" value={editingTemplate.validityMonths} onChange={(e) => setField("validityMonths", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400">Advance Payment<input type="number" min="0" value={editingTemplate.advancePayment} onChange={(e) => setField("advancePayment", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400">Credit Terms (Days)<input type="number" min="0" max="365" value={editingTemplate.creditTermsDays} onChange={(e) => setField("creditTermsDays", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400">Standard Discount (%)<input type="number" min="0" max="100" value={editingTemplate.standardDiscountPct} onChange={(e) => setField("standardDiscountPct", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400">Tax Rate (%)<input type="number" min="0" max="100" value={editingTemplate.taxRatePct} onChange={(e) => setField("taxRatePct", e.target.value)} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400 md:col-span-2">Special Clauses — one per line<textarea value={editingTemplate.specialClauses} onChange={(e) => setField("specialClauses", e.target.value)} rows={4} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400 md:col-span-2">Commercial Notes<textarea value={editingTemplate.commercialNotes} onChange={(e) => setField("commercialNotes", e.target.value)} rows={3} className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></label>
                <label className="text-xs text-slate-400 md:col-span-2">
                  Change reason
                  <textarea
                    value={editingTemplate.changeReason}
                    onChange={(e) => setField("changeReason", e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Why is this commercial template being created or changed?"
                    className="mt-1 w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>
              <p className="text-xs text-amber-200/80">Managed-hiring requirements currently support DAY_25 invoicing and no advance payment; the agreement builder will reject incompatible templates instead of silently overriding them.</p>
              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button type="button" disabled={saving} onClick={() => setEditingTemplate(null)} className="px-4 py-2 rounded-xl text-xs text-slate-400 disabled:opacity-50">Cancel</button>
                <button type="button" disabled={saving || editingTemplate.changeReason.trim().length < 3} onClick={() => void handleSaveTemplate()} className="px-5 py-2 rounded-xl bg-[#29B6F6] text-white text-xs font-bold disabled:opacity-50">{saving ? "Saving..." : "Save audited template"}</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {pendingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="template-action-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <h2 id="template-action-title" className="text-lg font-bold text-white">
              {pendingAction.action === "duplicate" ? "Clone template?" : "Archive template?"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {pendingAction.action === "duplicate"
                ? "The reviewed source version will be copied with the same explicit commercial terms. The copy can then be edited separately."
                : "This version will no longer be available for new agreements. Existing agreements keep their snapshotted terms."}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {pendingAction.template.name} · version observed {pendingAction.template.updatedAt ? new Date(pendingAction.template.updatedAt).toLocaleString() : "timestamp unavailable"}
            </p>
            <label className="mt-5 block text-xs text-slate-400">
              Action reason
              <textarea
                value={pendingActionReason}
                onChange={(event) => setPendingActionReason(event.target.value)}
                rows={4}
                maxLength={1000}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={pendingActionSaving}
                onClick={() => {
                  setPendingAction(null);
                  setPendingActionReason("");
                }}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pendingActionSaving || pendingActionReason.trim().length < 3}
                onClick={() => void handlePendingAction()}
                className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40 ${
                  pendingAction.action === "archive" ? "bg-red-600" : "bg-indigo-600"
                }`}
              >
                {pendingActionSaving
                  ? "Saving…"
                  : pendingAction.action === "duplicate"
                    ? "Clone reviewed version"
                    : "Archive reviewed version"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
