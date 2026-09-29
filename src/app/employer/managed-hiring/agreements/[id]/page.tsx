"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import EmployerHeader from "@/components/employer/EmployerHeader";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import { formatDate } from "@/utils";

export default function EmployerAgreementReviewPage() {
  const router = useRouter();
  const params = useParams();
  const agreementId = params.id as string;

  const [agreement, setAgreement] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [permissions, setPermissions] = useState({ canExecute: false, canRequestAmendment: false });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureDesignation, setSignatureDesignation] = useState("");
  const [amendmentNotes, setAmendmentNotes] = useState("");
  const [showAmendmentBox, setShowAmendmentBox] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agreements/contracts/${agreementId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Unable to load this commercial agreement.");
        }
        setAgreement(data.agreement);
        setEvents(data.events || []);
        setPermissions({
          canExecute: Boolean(data.permissions?.canExecute),
          canRequestAmendment: Boolean(data.permissions?.canRequestAmendment),
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Unable to load this commercial agreement.");
      } finally {
        setLoading(false);
      }
    }
    if (agreementId) load();
  }, [agreementId]);

  const handleSign = async () => {
    if (!signatureName.trim() || !signatureDesignation.trim()) {
      setActionMessage({ type: "error", text: "Please enter your full name and designation to complete digital execution." });
      return;
    }
    setActionMessage(null);
    setSigning(true);
    try {
      const res = await fetch(`/api/agreements/contracts/${agreementId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          expectedUpdatedAt: new Date(agreement.updatedAt).toISOString(),
          signedByName: signatureName,
          signedByDesignation: signatureDesignation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgreement(data.agreement);
        setActionMessage({ type: "success", text: "Agreement signed successfully." });
      } else {
        setActionMessage({ type: "error", text: data.error || "Unable to sign the agreement." });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: "error", text: "Unable to sign the agreement. Please try again." });
    } finally {
      setSigning(false);
    }
  };

  const handleAmendmentRequest = async () => {
    if (!amendmentNotes.trim()) {
      setActionMessage({ type: "error", text: "Please describe the requested amendment before submitting." });
      return;
    }
    setActionMessage(null);
    try {
      const res = await fetch(`/api/agreements/contracts/${agreementId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_amendment",
          expectedUpdatedAt: new Date(agreement.updatedAt).toISOString(),
          amendmentNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgreement(data.agreement);
        setShowAmendmentBox(false);
        setAmendmentNotes("");
        setActionMessage({ type: "success", text: "Amendment request submitted for review." });
      } else {
        setActionMessage({ type: "error", text: data.error || "Unable to submit the amendment request." });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: "error", text: "Unable to submit the amendment request. Please try again." });
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
        <h2 className="text-lg font-bold">{loadError || "Agreement document not found"}</h2>
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
        {actionMessage && (
          <div
            role={actionMessage.type === "error" ? "alert" : "status"}
            aria-live={actionMessage.type === "error" ? "assertive" : "polite"}
            className={`rounded-xl border px-4 py-3 text-sm ${actionMessage.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-[#26A69A]/30 bg-[#26A69A]/10 text-[#8FE3DA]"}`}
          >
            {actionMessage.text}
          </div>
        )}

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
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Commercial Agreement Record</h1>
            <p className="text-xs text-slate-400 mt-1">
              Persisted commercial terms for {agreement.companyName}. This screen does not add legal clauses that are absent from the stored agreement.
            </p>
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
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Service</span>
                <span className="font-bold text-white text-sm">HireGo AI Managed Hiring</span>
                <p className="text-slate-400 mt-1">Provider legal identity and governing clauses must come from the executed agreement/template record.</p>
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
                  {agreement.feeType === "PERCENTAGE"
                    ? `${agreement.feeValue}% of CTC`
                    : agreement.feeType === "FIXED"
                      ? `Fixed fee ${agreement.feeValue}`
                      : `${agreement.feeValue} (${agreement.feeType || "fee type not recorded"})`}
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
                <span className="text-sm font-bold text-slate-200">{typeof agreement.creditDays === "number" ? `${agreement.creditDays} Net Credit Days` : "Not specified"}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Persisted terms only */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#29B6F6] uppercase tracking-wider">3. Persisted Terms & Clauses</h3>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed bg-[#16161B] p-4 rounded-xl border border-white/5">
              <p>
                <strong>Replacement window:</strong>{" "}
                <span className="text-white font-bold">
                  {typeof agreement.replacementDays === "number" ? `${agreement.replacementDays} calendar days` : "Not recorded"}
                </span>.
                No additional replacement scope or guarantee is inferred by this screen.
              </p>
              <p>
                <strong>Invoice rule:</strong>{" "}
                <span className="text-white font-bold">{agreement.invoiceRule || "Not recorded"}</span>
                {" · "}
                <strong>Credit terms:</strong>{" "}
                <span className="text-white font-bold">
                  {typeof agreement.creditDays === "number" ? `${agreement.creditDays} days` : "Not recorded"}
                </span>.
              </p>
              <p>
                <strong>Tax rate:</strong>{" "}
                <span className="text-white font-bold">
                  {typeof agreement.taxRatePct === "number" ? `${agreement.taxRatePct}%` : "Not recorded"}
                </span>
                {" · "}
                <strong>Discount:</strong>{" "}
                <span className="text-white font-bold">
                  {typeof agreement.discountPercentage === "number" ? `${agreement.discountPercentage}%` : "Not recorded"}
                </span>.
              </p>
              {Array.isArray(agreement.customClauses) && agreement.customClauses.length > 0 ? (
                <div>
                  <strong className="text-white">Custom clauses recorded in this agreement:</strong>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    {agreement.customClauses.map((clause: string, index: number) => (
                      <li key={`${index}:${clause}`}>{clause}</li>
                    ))}
                  </ol>
                </div>
              ) : (
                <p className="text-slate-400">No custom clauses are stored on this agreement record.</p>
              )}
              {agreement.commercialNotes ? (
                <div>
                  <strong className="text-white">Commercial notes:</strong>
                  <p className="mt-1 whitespace-pre-wrap">{agreement.commercialNotes}</p>
                </div>
              ) : null}
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
              <div className="text-[10px] font-mono text-slate-500">{agreement.signerIpAddress ? `Audit IP Stamp: ${agreement.signerIpAddress}` : "Audit IP stamp was not recorded for this execution."}</div>
            </div>
          ) : permissions.canExecute ? (
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
                  disabled={!permissions.canRequestAmendment}
                  className="text-xs font-bold text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#16161B] p-6 text-sm text-slate-300">
              This agreement is currently <strong className="text-white">{String(agreement.status).replaceAll("_", " ")}</strong>.
              Digital execution and amendment actions are available only to an authorized company administrator while the agreement is in <strong className="text-white">SENT TO EMPLOYER</strong> status.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
