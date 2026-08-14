"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AgreementTemplateRecord, HiringRequirementRecord } from "@/types";

export default function SalesAgreementBuilderPage() {
  const router = useRouter();
  const [requirements, setRequirements] = useState<HiringRequirementRecord[]>([]);
  const [templates, setTemplates] = useState<AgreementTemplateRecord[]>([]);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [selectedTplId, setSelectedTplId] = useState("");
  const [loading, setLoading] = useState(false);

  // Customization fields
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [feeType, setFeeType] = useState("PERCENTAGE");
  const [feeValue, setFeeValue] = useState(8.33);
  const [replacementDays, setReplacementDays] = useState(90);
  const [invoiceRule, setInvoiceRule] = useState("ON_JOINING");
  const [creditDays, setCreditDays] = useState(15);
  const [hiringQuantity, setHiringQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/agreements/requirements").then((r) => r.json()),
      fetch("/api/agreements/templates").then((r) => r.json()),
    ]).then(([reqData, tplData]) => {
      if (reqData.success) setRequirements(reqData.requirements || []);
      if (tplData.success) setTemplates(tplData.templates || []);
    });
  }, []);

  const handleSelectRequirement = (reqId: string) => {
    setSelectedReqId(reqId);
    const req = requirements.find((r) => r.id === reqId);
    if (req) {
      setCompanyName(req.companyName);
      setContactPerson(req.contactPerson);
      setEmail(req.email);
      setHiringQuantity(req.numberOfPositions);
    }
  };

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTplId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setFeeType(tpl.feeType);
      setFeeValue(tpl.feeValue);
      setReplacementDays(tpl.replacementDays);
      setInvoiceRule(tpl.invoiceRule);
      setCreditDays(tpl.creditDays || 15);
    }
  };

  const handleGenerateAgreement = async () => {
    if (!companyName || !contactPerson || !email) {
      alert("Please fill in company name, contact person, and email.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        requirementId: selectedReqId || undefined,
        templateId: selectedTplId || undefined,
        companyName,
        contactPerson,
        clientEmail: email,
        email,
        feeType,
        feeValue: Number(feeValue),
        replacementDays: Number(replacementDays),
        invoiceRule,
        creditDays: Number(creditDays),
        hiringQuantity: Number(hiringQuantity),
        notes,
      };

      const res = await fetch("/api/agreements/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Agreement generated! Number: ${data.agreement.agreementNumber}`);
        router.push("/admin/managed-hiring/pipeline");
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-5xl mx-auto">
        <div className="border-b border-white/10 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#29B6F6]/10 text-[#29B6F6] border border-[#29B6F6]/20 mb-1">
            SALES WORKSPACE
          </div>
          <h1 className="text-2xl font-bold text-white">Commercial Agreement Builder</h1>
          <p className="text-xs text-slate-400">Customize terms and generate master commercial contract for employer review</p>
        </div>

        <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 lg:p-8 space-y-6 shadow-2xl">
          {/* Step 1: Select Requirement */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Select Hiring Requirement (Optional)</label>
            <select
              value={selectedReqId}
              onChange={(e) => handleSelectRequirement(e.target.value)}
              className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
            >
              <option value="">-- Manual Commercial Agreement (No Requirement) --</option>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.referenceCode} — {r.companyName} ({r.numberOfPositions} Pos)
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Template */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">2. Select Internal Template Blueprint</label>
            <select
              value={selectedTplId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
            >
              <option value="">-- Custom Template Configuration --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.feeType === "PERCENTAGE" ? `${t.feeValue}%` : `₹${t.feeValue}`}, {t.replacementDays}d warranty)
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Customization Controls */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Commercial Terms Customization</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Company Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Contact Person</label>
                <input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Client Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fee Type</label>
                <select
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="PERCENTAGE">Percentage of CTC (%)</option>
                  <option value="FIXED">Fixed Amount per Hire (INR)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fee Value ({feeType === "PERCENTAGE" ? "%" : "₹"})</label>
                <input
                  type="number"
                  value={feeValue}
                  onChange={(e) => setFeeValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Replacement Warranty (Days)</label>
                <select
                  value={replacementDays}
                  onChange={(e) => setReplacementDays(parseInt(e.target.value) || 60)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value={30}>30 Days Replacement</option>
                  <option value={60}>60 Days Replacement</option>
                  <option value={90}>90 Days Replacement</option>
                  <option value={120}>120 Days Replacement</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Invoice Rule</label>
                <select
                  value={invoiceRule}
                  onChange={(e) => setInvoiceRule(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="ON_OFFER">On Offer Acceptance</option>
                  <option value="ON_JOINING">On Joining Date</option>
                  <option value="DAY_30">30 Days Post Joining</option>
                  <option value="SPLIT_50_50">50% On Offer / 50% On Joining</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Credit Days</label>
                <input
                  type="number"
                  value={creditDays}
                  onChange={(e) => setCreditDays(parseInt(e.target.value) || 15)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              disabled={loading}
              onClick={handleGenerateAgreement}
              className="px-8 py-3 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90 shadow-xl"
            >
              {loading ? "Generating Contract..." : "Generate Master Agreement"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
