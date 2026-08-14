"use client";
import React, { useState, useEffect, Suspense } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useRouter, useSearchParams } from "next/navigation";

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqId = searchParams.get("reqId");

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [requirement, setRequirement] = useState<any>(null);

  const [formData, setFormData] = useState({
    templateId: "",
    companyName: "",
    clientLegalName: "",
    clientEmail: "",
    contactPerson: "",
    feeValue: "",
    feeType: "PERCENTAGE",
    replacementDays: "90",
    invoiceRule: "ON_JOINING",
    creditDays: "15",
    customClauses: "",
    salesExecutiveNotes: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [tplRes, reqRes] = await Promise.all([
          fetch("/api/agreements/templates"),
          reqId ? fetch(`/api/agreements/requirements/${reqId}`) : Promise.resolve(null),
        ]);

        const tplData = await tplRes.json();
        if (tplData.success) {
          setTemplates(tplData.templates);
        }

        if (reqRes) {
          const rData = await reqRes.json();
          if (rData.success) {
            setRequirement(rData.requirement);
            setFormData(prev => ({
              ...prev,
              companyName: rData.requirement.companyName,
              clientLegalName: rData.requirement.companyName,
              clientEmail: rData.requirement.email,
              contactPerson: rData.requirement.contactPerson,
            }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [reqId]);

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tid = e.target.value;
    const tpl = templates.find(t => t.id === tid);
    if (tpl) {
      setFormData(prev => ({
        ...prev,
        templateId: tid,
        feeValue: tpl.feeValue.toString(),
        feeType: tpl.feeType,
        replacementDays: tpl.replacementDays.toString(),
        invoiceRule: tpl.invoiceRule,
        creditDays: tpl.creditTermsDays.toString(),
        customClauses: tpl.specialClauses.join("\n"),
      }));
    } else {
      setFormData(prev => ({ ...prev, templateId: tid }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDraftAndSend = async () => {
    if (!formData.companyName || !formData.clientEmail || !formData.templateId) {
      alert("Please fill required fields (Company, Email, Template)");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        requirementId: reqId || undefined,
        customClauses: formData.customClauses.split("\n").filter((c: string) => c.trim() !== ""),
      };

      const res = await fetch("/api/agreements/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        
        // Auto send it to employer
        await fetch(`/api/agreements/contracts/${data.agreement.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send_to_employer", performedBy: "Sales Admin" })
        });

        if (reqId) {
          // Link requirement
          await fetch(`/api/agreements/requirements/${reqId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "AGREEMENT_SENT", activeAgreementId: data.agreement.id })
          });
        }

        alert("Agreement Drafted & Sent Successfully!");
        router.push("/admin/managed-hiring/requests");
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to draft agreement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 ml-0 md:ml-64 transition-all duration-300">
      
      <header className="mb-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-display-md text-3xl font-bold text-white">Draft Commercial Agreement</h1>
          <p className="text-sm text-text-secondary">Configure terms and send digital contract to employer.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        <div className="xl:col-span-8 space-y-6">
          
          {/* Client Info section */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <h3 className="font-headline-md text-lg text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">business</span>
              Client Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Company Display Name *</label>
                <input required name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Client Legal Name (for contract) *</label>
                <input required name="clientLegalName" value={formData.clientLegalName} onChange={handleChange} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Signatory Email *</label>
                <input required type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Signatory Name (Attn)</label>
                <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none" />
              </div>
            </div>
          </div>

          {/* Template & Terms */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="font-headline-md text-lg text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">handshake</span>
              Commercial Terms Configuration
            </h3>
            
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text-secondary mb-1">Apply Baseline Template *</label>
              <select name="templateId" value={formData.templateId} onChange={handleTemplateSelect} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none">
                <option value="">-- Select Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.feeValue}%)</option>
                ))}
              </select>
            </div>

            {formData.templateId && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Placement Fee</label>
                    <div className="flex gap-2">
                      <input type="number" name="feeValue" value={formData.feeValue} onChange={handleChange} className="flex-1 bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white font-mono" />
                      <select name="feeType" value={formData.feeType} onChange={handleChange} className="w-24 bg-surface-container border border-white/10 rounded px-2 py-2 text-xs text-white">
                        <option value="PERCENTAGE">% CTC</option>
                        <option value="FLAT">Flat Rate</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Replacement Warranty (Days)</label>
                    <input type="number" name="replacementDays" value={formData.replacementDays} onChange={handleChange} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Invoicing Rule</label>
                    <select name="invoiceRule" value={formData.invoiceRule} onChange={handleChange} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white">
                      <option value="ON_JOINING">On Joining Date</option>
                      <option value="ON_OFFER_ACCEPTANCE">On Offer Acceptance</option>
                      <option value="POST_PROBATION">Post Probation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Credit Terms (Days)</label>
                    <input type="number" name="creditDays" value={formData.creditDays} onChange={handleChange} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1 flex justify-between">
                    Custom Clauses / Additions
                    <span className="text-[10px] text-text-muted font-normal">One per line</span>
                  </label>
                  <textarea name="customClauses" value={formData.customClauses} onChange={handleChange} rows={5} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none resize-none font-mono text-xs leading-relaxed"></textarea>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Internal Sales Notes (Not visible to client)</label>
                  <textarea name="salesExecutiveNotes" value={formData.salesExecutiveNotes} onChange={handleChange} rows={2} className="w-full bg-surface-container border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none resize-none"></textarea>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={() => router.back()} className="px-6 py-2 rounded-lg text-sm text-white font-semibold hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleDraftAndSend}
              disabled={loading || !formData.templateId}
              className="px-8 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : "Generate & Send to Employer"}
              {!loading && <span className="material-symbols-outlined text-[18px]">send</span>}
            </button>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          {requirement ? (
            <div className="glass-card rounded-2xl p-6 border border-white/5 sticky top-8">
              <h3 className="font-headline-md text-base text-white mb-4 border-b border-white/10 pb-2">Linked Requirement Context</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider mb-1">Roles Needed</p>
                  <div className="flex flex-wrap gap-1">
                    {requirement.jobTitles.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/80">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider mb-1">Volume & Salary</p>
                  <p className="text-white">{requirement.numberOfPositions} Positions • Max CTC: {requirement.currency === "INR" ? "₹" : "$"}{requirement.salaryRangeMax}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider mb-1">Expected Warranty</p>
                  <p className="text-yellow font-bold">{requirement.replacementExpectation}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider mb-1">Employer Notes</p>
                  <p className="text-text-secondary text-xs italic">{requirement.additionalNotes || "None provided."}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container rounded-xl p-6 text-center border border-white/5">
              <span className="material-symbols-outlined text-text-muted text-3xl mb-2">link_off</span>
              <p className="text-sm text-text-secondary">No specific requirement linked. This will create a general retainer agreement.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default function AdminAgreementBuilderPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <AdminSidebar />
      <Suspense fallback={
        <div className="flex-1 flex justify-center py-20 ml-0 md:ml-64">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
      }>
        <BuilderContent />
      </Suspense>
    </div>
  );
}
