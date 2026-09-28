"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployerCommercialPlansPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAgreements() {
      try {
        const res = await fetch("/api/agreements/contracts", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load agreements.");
        setAgreements(Array.isArray(data.agreements) ? data.agreements : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agreements.");
      } finally {
        setLoading(false);
      }
    }
    fetchAgreements();
  }, []);

  const activeAgreements = agreements.filter(a => a.status === "ACTIVE");
  const pendingAgreements = agreements.filter(a => a.status === "SENT_TO_EMPLOYER" || a.status === "AMENDMENT_REQUESTED");

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      
      <div className="flex-1 p-6 max-w-7xl mx-auto overflow-y-auto">
        <header className="mb-10">
          <h2 className="font-display-xl text-3xl font-bold mb-2 text-text-primary">Commercial Agreements</h2>
          <p className="font-body-md text-text-secondary text-sm">
            Manage your HireGo Managed Hiring™ commercial partnerships, billing terms, and placement warranties.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Active & Pending Agreements */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Action Banner to initiate new mandate */}
              <div className="glass-card rounded-2xl p-8 border border-primary/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 bg-primary/20 rounded-full border border-primary/30 mb-3">
                    <span className="text-primary text-[10px] font-bold uppercase tracking-wider">New Requirement</span>
                  </div>
                  <h3 className="font-headline-md text-xl text-white mb-2">Initiate Managed Hiring™ Mandate</h3>
                  <p className="text-sm text-text-secondary max-w-md">
                    Need to scale your team? Submit a structured hiring requirement. Our executive team will tailor a commercial agreement to match your volume and SLA needs.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/employer/managed-hiring/request")}
                  className="btn-3d-blue px-6 py-3 rounded-xl font-headline-md text-sm text-white flex-shrink-0 relative z-10 whitespace-nowrap"
                >
                  Create Hiring Request
                </button>
              </div>

              {/* Pending Agreements */}
              {pendingAgreements.length > 0 && (
                <div>
                  <h4 className="font-headline-md text-lg text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow">pending_actions</span>
                    Awaiting Your Signature
                  </h4>
                  <div className="space-y-4">
                    {pendingAgreements.map(agr => (
                      <div key={agr.id} className="glass-card rounded-xl p-5 border border-yellow/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-bold text-yellow uppercase tracking-wider">{agr.agreementNumber}</span>
                            <span className="px-2 py-0.5 rounded bg-yellow/10 text-yellow text-[10px] border border-yellow/20">Review Required</span>
                          </div>
                          <p className="text-sm font-semibold text-white mb-1">Commercial Agreement: {agr.feeValue}% Placement Fee</p>
                          <p className="text-xs text-text-secondary">Warranty: {agr.replacementDays} Days • Invoicing: {agr.invoiceRule.replace("_", " ")}</p>
                        </div>
                        <button
                          onClick={() => router.push(`/employer/managed-hiring/agreements/${agr.id}`)}
                          className="px-5 py-2 rounded-lg bg-yellow text-[#1a1a1a] font-bold text-xs hover:bg-yellow/90 transition-colors"
                        >
                          Review & Sign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Agreements */}
              <div>
                <h4 className="font-headline-md text-lg text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green">verified_user</span>
                  Active Agreements
                </h4>
                {activeAgreements.length > 0 ? (
                  <div className="space-y-4">
                    {activeAgreements.map(agr => (
                      <div key={agr.id} className="glass-card rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{agr.agreementNumber}</span>
                            <span className="px-2 py-0.5 rounded bg-green/10 text-green text-[10px] border border-green/20">ACTIVE</span>
                          </div>
                          <p className="text-sm font-semibold text-white mb-1">{agr.feeValue}% Placement Fee Structure</p>
                          <p className="text-xs text-text-secondary">Valid until {new Date(agr.validityEndDate).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => router.push(`/employer/managed-hiring/agreements/${agr.id}`)}
                          className="px-4 py-2 rounded-lg bg-surface-container-high text-white text-xs hover:bg-white/10 transition-colors border border-white/10"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container rounded-xl p-8 text-center border border-white/5">
                    <span className="material-symbols-outlined text-text-muted text-3xl mb-2">description</span>
                    <p className="text-sm text-text-secondary">No active commercial agreements.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Platform Capabilities Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Agreement-specific terms</h3>
                <div className="space-y-4 text-sm text-text-secondary">
                  <p>
                    Placement fee, replacement window, invoicing rule, tax and credit terms are defined by each persisted commercial agreement. This page does not add benefits or guarantees that are absent from the signed record.
                  </p>
                  {activeAgreements.length > 0 ? (
                    activeAgreements.slice(0, 3).map((agreement) => (
                      <div key={agreement.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                        <p className="font-bold text-white">{agreement.agreementNumber}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {agreement.feeValue}% placement fee · {agreement.replacementDays} day replacement window · {String(agreement.invoiceRule || "Invoice rule not recorded").replaceAll("_", " ")}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted">No active agreement terms are available to summarize.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
