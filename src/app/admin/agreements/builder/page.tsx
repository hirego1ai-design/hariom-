"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AgreementTemplateRecord, HiringRequirementRecord } from "@/types";

export default function SalesAgreementBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRequirementId = searchParams.get("reqId") || "";
  const [requirements, setRequirements] = useState<HiringRequirementRecord[]>([]);
  const [templates, setTemplates] = useState<AgreementTemplateRecord[]>([]);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [selectedTplId, setSelectedTplId] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [clientLegalName, setClientLegalName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [feeType, setFeeType] = useState("");
  const [feeValue, setFeeValue] = useState("");
  const [replacementDays, setReplacementDays] = useState("");
  const [invoiceRule, setInvoiceRule] = useState("");
  const [creditDays, setCreditDays] = useState("");
  const [notes, setNotes] = useState("");
  const [draftReason, setDraftReason] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/agreements/requirements").then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load hiring requirements.");
        return data;
      }),
      fetch("/api/agreements/templates").then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load agreement templates.");
        return data;
      }),
    ])
      .then(([reqData, tplData]) => {
        const loadedRequirements = Array.isArray(reqData.requirements) ? reqData.requirements : [];
        const loadedTemplates = Array.isArray(tplData.templates) ? tplData.templates : [];
        setRequirements(loadedRequirements);
        setTemplates(loadedTemplates);

        if (requestedRequirementId) {
          const requested = loadedRequirements.find(
            (record: HiringRequirementRecord) => record.id === requestedRequirementId,
          );
          if (requested) {
            setSelectedReqId(requested.id);
            setCompanyName(requested.companyName);
            setClientLegalName("");
            setContactPerson(requested.contactPerson);
            setEmail(requested.email);
          } else {
            setActionMessage({
              type: "error",
              text: "The requested hiring requirement is unavailable or no longer accessible.",
            });
          }
        }
      })
      .catch((error) => {
        setActionMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Unable to load authoritative agreement data.",
        });
      });
  }, [requestedRequirementId]);

  const handleSelectRequirement = (reqId: string) => {
    setSelectedReqId(reqId);
    setActionMessage(null);
    const req = requirements.find((record) => record.id === reqId);
    if (!req) {
      setCompanyName("");
      setClientLegalName("");
      setContactPerson("");
      setEmail("");
      return;
    }

    setCompanyName(req.companyName);
    setClientLegalName("");
    setContactPerson(req.contactPerson);
    setEmail(req.email);
  };

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTplId(tplId);
    setActionMessage(null);
    const tpl = templates.find((record) => record.id === tplId);
    if (!tpl) {
      setFeeType("");
      setFeeValue("");
      setReplacementDays("");
      setInvoiceRule("");
      setCreditDays("");
      return;
    }

    setFeeType(tpl.feeType);
    setFeeValue(String(tpl.feeValue));
    setReplacementDays(String(tpl.replacementDays));
    setInvoiceRule(tpl.invoiceRule);
    const configuredCreditDays = tpl.creditTermsDays ?? tpl.creditDays;
    setCreditDays(configuredCreditDays === undefined ? "" : String(configuredCreditDays));
  };

  const handleGenerateAgreement = async () => {
    setActionMessage(null);

    const requirement = requirements.find((record) => record.id === selectedReqId);
    const template = templates.find((record) => record.id === selectedTplId);
    if (!requirement || !requirement.companyId) {
      setActionMessage({ type: "error", text: "Select a hiring requirement that is bound to an authoritative company." });
      return;
    }
    if (!template) {
      setActionMessage({ type: "error", text: "Select a current agreement template before generating a contract." });
      return;
    }
    if (!template.updatedAt || !requirement.updatedAt) {
      setActionMessage({ type: "error", text: "Requirement or template version evidence is missing. Reload before drafting the agreement." });
      return;
    }
    if (draftReason.trim().length < 3) {
      setActionMessage({ type: "error", text: "Enter a specific reason for drafting this commercial agreement." });
      return;
    }
    if (!clientLegalName.trim() || !contactPerson.trim() || !email.trim()) {
      setActionMessage({ type: "error", text: "Client legal name, contact person, and email are required." });
      return;
    }
    if (feeType !== "PERCENTAGE" && feeType !== "FIXED") {
      setActionMessage({ type: "error", text: "The selected template must use a supported placement fee type." });
      return;
    }

    const numericFeeValue = Number(feeValue);
    const numericReplacementDays = Number(replacementDays);
    const numericCreditDays = creditDays.trim() === "" ? undefined : Number(creditDays);
    if (!Number.isFinite(numericFeeValue) || numericFeeValue <= 0 || (feeType === "PERCENTAGE" && numericFeeValue > 100)) {
      setActionMessage({ type: "error", text: "Enter a valid approved placement fee." });
      return;
    }
    if (!Number.isInteger(numericReplacementDays) || numericReplacementDays < 0 || numericReplacementDays > 3650) {
      setActionMessage({ type: "error", text: "Enter a valid replacement warranty period." });
      return;
    }
    if (numericCreditDays !== undefined && (!Number.isInteger(numericCreditDays) || numericCreditDays < 0 || numericCreditDays > 365)) {
      setActionMessage({ type: "error", text: "Enter valid credit days or leave the field blank to use the template value." });
      return;
    }
    if (invoiceRule !== "DAY_25") {
      setActionMessage({
        type: "error",
        text: "The selected template does not use the DAY_25 invoice rule required by the current managed-hiring billing workflow.",
      });
      return;
    }
    if (template.advancePayment !== undefined && template.advancePayment !== 0) {
      setActionMessage({
        type: "error",
        text: "The selected template includes an advance payment that the current managed-hiring billing workflow does not support.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        companyId: requirement.companyId,
        requirementId: requirement.id,
        templateId: template.id,
        expectedTemplateUpdatedAt: new Date(template.updatedAt).toISOString(),
        expectedRequirementUpdatedAt: new Date(requirement.updatedAt).toISOString(),
        reason: draftReason.trim(),
        clientLegalName: clientLegalName.trim(),
        contactPerson: contactPerson.trim(),
        clientEmail: email.trim(),
        feeType,
        feeValue: numericFeeValue,
        replacementDays: numericReplacementDays,
        invoiceRule,
        ...(numericCreditDays === undefined ? {} : { creditDays: numericCreditDays }),
        ...(notes.trim() ? { commercialNotes: notes.trim() } : {}),
      };

      const res = await fetch("/api/agreements/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDraftReason("");
        router.push("/admin/managed-hiring/pipeline");
      } else {
        setActionMessage({ type: "error", text: data.error || "Agreement generation failed." });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: "error", text: "Agreement generation failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader title="Commercial Agreement Builder" subtitle="Draft from a versioned requirement and approved template" />

      <main className="mx-auto max-w-5xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 md:ml-[116px] lg:p-8 lg:pt-24">
        {actionMessage && <div role={actionMessage.type === "error" ? "alert" : "status"} aria-live={actionMessage.type === "error" ? "assertive" : "polite"} className={`rounded-xl border px-4 py-3 text-sm ${actionMessage.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>{actionMessage.text}</div>}
        <div className="border-b border-white/10 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#29B6F6]/10 text-[#29B6F6] border border-[#29B6F6]/20 mb-1">
            SALES WORKSPACE
          </div>
          <h1 className="text-2xl font-bold text-white">Commercial Agreement Builder</h1>
          <p className="text-xs text-slate-400">Create a managed-hiring agreement from an authoritative requirement and approved template.</p>
        </div>

        <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 lg:p-8 space-y-6 shadow-2xl">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Select Hiring Requirement</label>
            <select
              value={selectedReqId}
              onChange={(e) => handleSelectRequirement(e.target.value)}
              className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
            >
              <option value="">-- Select a company-bound hiring requirement --</option>
              {requirements.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.referenceCode} — {record.companyName} ({record.numberOfPositions} Pos)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">2. Select Approved Template</label>
            <select
              value={selectedTplId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
            >
              <option value="">-- Select an agreement template --</option>
              {templates.map((templateRecord) => (
                <option key={templateRecord.id} value={templateRecord.id}>
                  {templateRecord.name} ({templateRecord.feeType === "PERCENTAGE" ? `${templateRecord.feeValue}%` : `${requirements.find((record) => record.id === selectedReqId)?.currency || "currency"} ${templateRecord.feeValue}`}, {templateRecord.replacementDays}d warranty)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Commercial Terms</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Company</label>
                <input value={companyName} readOnly className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Client Legal Name</label>
                <input value={clientLegalName} onChange={(e) => setClientLegalName(e.target.value)} className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Contact Person</label>
                <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Client Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fee Type</label>
                <select value={feeType} onChange={(e) => setFeeType(e.target.value)} className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white">
                  <option value="">Select fee type</option>
                  <option value="PERCENTAGE">Percentage of CTC (%)</option>
                  <option value="FIXED">Fixed Amount per Hire</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fee Value ({feeType === "PERCENTAGE" ? "%" : (requirements.find((record) => record.id === selectedReqId)?.currency || "currency")})</label>
                <input type="number" min="0" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Replacement Warranty (Days)</label>
                <input type="number" min="0" max="3650" value={replacementDays} onChange={(e) => setReplacementDays(e.target.value)} className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Invoice Rule</label>
                <input value={invoiceRule} readOnly className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Credit Days</label>
                <input type="number" min="0" max="365" value={creditDays} onChange={(e) => setCreditDays(e.target.value)} placeholder="Use template value" className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Commercial Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Draft reason</label>
                <textarea
                  value={draftReason}
                  onChange={(e) => setDraftReason(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Why is this agreement being drafted from the reviewed requirement and template?"
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              disabled={loading || draftReason.trim().length < 3}
              onClick={handleGenerateAgreement}
              className="px-8 py-3 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90 shadow-xl disabled:opacity-50"
            >
              {loading ? "Generating Contract..." : "Generate Master Agreement"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
