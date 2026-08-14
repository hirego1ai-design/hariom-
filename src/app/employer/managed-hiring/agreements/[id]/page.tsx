"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import EmployerHeader from "@/components/employer/EmployerHeader";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import { formatCurrency, formatDate } from "@/utils";

export default function EmployerAgreementReviewPage() {
  const router = useRouter();
  const params = useParams();
  const agreementId = params.id as string;

  const [agreement, setAgreement] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureDesignation, setSignatureDesignation] = useState("");
  const [amendmentNotes, setAmendmentNotes] = useState("");
  const [showAmendmentBox, setShowAmendmentBox] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agreements/contracts/${agreementId}`);
        const data = await res.json();
        if (data.success) {
          setAgreement(data.agreement);
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (agreementId) load();
  }, [agreementId]);

  const handleSign = async () => {
    if (!signatureName || !signatureDesignation) {
      alert("Please enter your full name and designation to complete digital execution.");
      return;
    }
    setSigning(true);
    try {
      const res = await fetch(`/api/agreements/contracts/${agreementId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          signedByName: signatureName,
          signedByDesignation: signatureDesignation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgreement(data.agreement);
        alert("Commercial Agreement officially signed and activated!");
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  const handleAmendmentRequest = async () => {
    if (!amendmentNotes.trim()) return;
    try {
      const res = await fetch(`/api/agreements/contracts/${agreementId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_amendment",
          amendmentNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgreement(data.agreement);
        setShowAmendmentBox(false);
        alert("Amendment request submitted to your dedicated Sales Account Manager.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0A0A0C] text-white min-h-screen relative flex items-center justify-center">
        <EmployerSidebar />
        <p className="text-xs text-slate-400">Loading Commercial Agreement Document...</p>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="bg-[#0A0A0C] text-white min-h-screen relative flex flex-col items-center justify-center p-6">
        <EmployerSidebar />
        <span className="material-symbols-outlined text-4xl text-[#FF5252] mb-2">error</span>
        <h2 className="text-lg font-bold">Agreement Document Not Found</h2>
        <button onClick={() => router.push("/employer/dashboard")} className="mt-4 px-4 py-2 bg-[#29B6F6] text-white text-xs font-bold rounded-xl">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isAccepted = agreement.status === "ACCEPTED" || agreement.status === "ACTIVE";

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <EmployerSidebar />
      <EmployerHeader title="Commercial Agreement Workspace" subtitle="Review and execute your HireGo Managed Hiring™ contract" />

      <main className="md:ml-[116px] p-6 lg:p-10 max-w-5xl mx-auto pt-24 space-y-8">
        {/* Document Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-[#FFCA28] bg-[#FFCA28]/10 px-3 py-1 rounded-full border border-[#FFCA28]/20">
                {agreement.agreementNumber}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isAccepted ? "bg-[#26A69A]/20 text-[#26A69A] border border-[#26A69A]/40" : "bg-[#29B6F6]/20 text-[#29B6F6] border border-[#29B6F6]/40"
              }`}>
                {agreement.status}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Master Commercial Services Agreement</h1>
            <p className="text-xs text-slate-400 mt-1">Legal contracting record for {agreement.companyName}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">print</span> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Master Document Body */}
        <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 lg:p-10 space-y-8 shadow-2xl">
          {/* Section 1: Parties */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#29B6F6] uppercase tracking-wider">1. Contracting Parties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-[#16161B] p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Service Provider</span>
                <span className="font-bold text-white text-sm">HireGo AI Platform Services</span>
                <p className="text-slate-400 mt-1">Enterprise Hiring Operating System</p>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Employer Client</span>
                <span className="font-bold text-white text-sm">{agreement.companyName}</span>
                <p className="text-slate-400 mt-1">Contact: {agreement.contactPerson} ({agreement.email || agreement.clientEmail})</p>
              </div>
            </div>
          </div>

          {/* Section 2: Commercial Schedule */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#29B6F6] uppercase tracking-wider">2. Commercial & Placement Schedule</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-[#16161B] p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Success Fee Rate</span>
                <span className="text-base font-extrabold text-[#26A69A]">
                  {agreement.feeType === "PERCENTAGE" ? `${agreement.feeValue}% of CTC` : formatCurrency(agreement.feeValue)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Replacement Warranty</span>
                <span className="text-base font-extrabold text-[#29B6F6]">{agreement.replacementDays} Calendar Days</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Invoice Trigger</span>
                <span className="text-sm font-bold text-slate-200">{agreement.invoiceRule}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Credit Terms</span>
                <span className="text-sm font-bold text-slate-200">{agreement.creditDays || 15} Net Credit Days</span>
              </div>
            </div>
          </div>

          {/* Section 3: Warranties & Terms */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#29B6F6] uppercase tracking-wider">3. Terms & Replacement Guarantee</h3>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-[#16161B] p-4 rounded-xl border border-white/5">
              <p>
                <strong>3.1 Replacement Warranty:</strong> If any candidate hired under this agreement leaves or is terminated within{" "}
                <span className="text-white font-bold">{agreement.replacementDays} calendar days</span> of joining, HireGo AI will provide a single 100% free candidate replacement.
              </p>
              <p>
                <strong>3.2 Invoicing & Payment:</strong> Invoices are generated upon the selected trigger rule (
                <span className="text-white font-bold">{agreement.invoiceRule}</span>) with net <span className="text-white font-bold">{agreement.creditDays || 15} days</span> payment terms.
              </p>
              <p>
                <strong>3.3 Confidentiality & Non-Solicitation:</strong> Both parties agree to maintain strict confidentiality regarding candidate profiles, compensation details, and business intelligence.
              </p>
            </div>
          </div>

          {/* E-Sign Box / Execution Status */}
          {isAccepted ? (
            <div className="p-6 rounded-2xl bg-[#26A69A]/10 border border-[#26A69A]/40 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-[#26A69A]">verified_user</span>
              <h4 className="text-lg font-bold text-white">Agreement Digitally Executed</h4>
              <p className="text-xs text-slate-300">
                Signed by <strong className="text-white">{agreement.signedByName}</strong> ({agreement.signedByDesignation}) on {formatDate(agreement.signedAt || agreement.updatedAt)}.
              </p>
              <div className="text-[10px] font-mono text-slate-500">Audit IP Stamp: {agreement.signerIpAddress || "127.0.0.1"}</div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#16161B] border border-white/10 space-y-6">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#26A69A]">draw</span> Digital Contract Execution & Acceptance
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Full Legal Name *</label>
                  <input
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full bg-[#121215] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#26A69A]"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Designation / Title *</label>
                  <input
                    value={signatureDesignation}
                    onChange={(e) => setSignatureDesignation(e.target.value)}
                    placeholder="e.g. Director of Human Resources"
                    className="w-full bg-[#121215] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#26A69A]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAmendmentBox(!showAmendmentBox)}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  Request Terms Amendment
                </button>

                <button
                  disabled={signing}
                  onClick={handleSign}
                  className="px-8 py-3 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90 shadow-xl flex items-center gap-2"
                >
                  {signing ? "Processing Signature..." : "Digitally Accept & Execute Contract"}
                </button>
              </div>

              {showAmendmentBox && (
                <div className="pt-4 space-y-2 border-t border-white/10">
                  <textarea
                    rows={3}
                    placeholder="Specify requested commercial term adjustments..."
                    value={amendmentNotes}
                    onChange={(e) => setAmendmentNotes(e.target.value)}
                    className="w-full bg-[#121215] border border-white/10 rounded-xl p-3 text-xs text-white"
                  />
                  <button
                    onClick={handleAmendmentRequest}
                    className="px-4 py-2 rounded-xl bg-[#FFCA28] text-slate-950 font-bold text-xs"
                  >
                    Submit Amendment Request
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
