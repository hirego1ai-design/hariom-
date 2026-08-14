"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/utils";
import { PageContainer, PageHeader, Card, Modal, StatusBadge } from "@/components/employer/LayoutSystem";

export default function EmployerBillingManagementPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [paymentMode, setPaymentMode] = useState<"none" | "online" | "bank">("none");
  const [bankRef, setBankRef] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePayOnline = async (invoiceId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Online payment processed successfully!");
        setSelectedInvoice(null);
        setPaymentMode("none");
        // Reload invoices
        fetch("/api/admin/invoices")
          .then((res) => res.json())
          .then((d) => {
            if (d.success) setInvoices(d.invoices || []);
          });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayBank = async (invoiceId: string) => {
    if (!bankRef.trim()) {
      alert("Please enter your bank transfer reference/transaction ID.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_receipt",
          invoiceId,
          bankTransferRef: bankRef,
          bankTransferReceiptUrl: receiptUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Bank transfer details and screenshot submitted for validation!");
        setSelectedInvoice(null);
        setPaymentMode("none");
        setBankRef("");
        setReceiptUrl("");
        // Reload invoices
        fetch("/api/admin/invoices")
          .then((res) => res.json())
          .then((d) => {
            if (d.success) setInvoices(d.invoices || []);
          });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/invoices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.invoices || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((acc, i) => acc + i.totalAmount, 0);

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Billing Management" 
        subtitle="Manage your company billing, commercial invoices, and payment receipts" 
      />

      <PageContainer>
          {/* Commercial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card>
              <span className="text-[10px] uppercase font-bold text-slate-500">Commercial Plan</span>
              <div className="text-xl font-bold text-white mt-1">HireGo Managed Hiring™</div>
              <div className="text-xs text-[#26A69A] mt-1">Active Master Service Agreement</div>
            </Card>

            <Card>
              <span className="text-[10px] uppercase font-bold text-slate-500">Outstanding Balance</span>
              <div className="text-xl font-extrabold text-[#FFCA28] font-mono mt-1">{formatCurrency(totalOutstanding)}</div>
              <div className="text-xs text-slate-400 mt-1">Net 15 Days Credit Terms</div>
            </Card>

            <Card>
              <span className="text-[10px] uppercase font-bold text-slate-500">Payment Method</span>
              <div className="text-xl font-bold text-white mt-1">Bank Wire / NEFT</div>
              <div className="text-xs text-slate-400 mt-1">Automated Receipt Matching</div>
            </Card>
          </div>

          {/* Invoices List */}
          <Card className="space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#29B6F6]">receipt</span> Placement Invoices History
            </h2>

            {loading ? (
              <div className="text-center py-12 text-xs text-slate-400">Loading billing records...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 space-y-3">
                <span className="material-symbols-outlined text-4xl">receipt_long</span>
                <p className="text-sm font-bold text-white">No invoices generated yet</p>
                <p>Commercial invoices will appear here once candidates are placed.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#FFCA28]">{inv.invoiceNumber}</span>
                        <StatusBadge 
                          status={inv.status} 
                          variant={inv.status === "PAID" ? "success" : "warning"}
                        />
                      </div>
                      <p className="text-xs text-white">
                        Placement: <strong className="text-slate-200">{inv.candidateName}</strong> ({inv.jobTitle})
                      </p>
                      <p className="text-[10px] text-slate-500">Issued: {formatDate(inv.createdAt)} | Due: {formatDate(inv.dueDate)}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-white font-mono">{formatCurrency(inv.totalAmount)}</div>
                        <div className="text-[10px] text-slate-500">Includes 18% GST</div>
                      </div>

                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 flex items-center gap-1 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span> View Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        {/* Invoice Modal Preview */}
        {selectedInvoice && (
          <React.Fragment>
            <Modal
              isOpen={!!selectedInvoice}
            onClose={() => {
              setSelectedInvoice(null);
              setPaymentMode("none");
            }}
            title={`Commercial Tax Invoice — ${selectedInvoice.invoiceNumber}`}
            size="4xl"
            footerActions={
              <>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setSelectedInvoice(null);
                    setPaymentMode("none");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#29B6F6] text-white text-xs font-bold hover:bg-[#29B6F6]/90 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-2">
                {/* Left Column: Invoice Details */}
                <div className="space-y-4">
                  <div className="border border-white/5 rounded-2xl bg-[#16161B]/80 overflow-hidden divide-y divide-white/5">
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Billed To</span>
                        <span className="font-bold text-white text-sm">{selectedInvoice.companyName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Placement Details</span>
                        <span className="font-bold text-white text-sm">{selectedInvoice.candidateName}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{selectedInvoice.jobTitle}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Base Placement Fee</span>
                        <span className="font-mono text-white font-semibold">{formatCurrency(selectedInvoice.amount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>GST (18% Commercial)</span>
                        <span className="font-mono text-slate-300">+{formatCurrency(selectedInvoice.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold pt-2.5 border-t border-white/5 mt-1.5">
                        <span className="text-white">Total Amount Due</span>
                        <span className="font-mono text-[#26A69A]">{formatCurrency(selectedInvoice.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status-specific alert message */}
                  {selectedInvoice.status === "PENDING_VERIFICATION" && (
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl space-y-1.5 text-yellow text-xs">
                      <p className="font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        NEFT/Bank Receipt Uploaded
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Our HireGo billing desks are auditing the submitted receipt details. Your account balance will clear immediately once verified.
                      </p>
                      {selectedInvoice.bankTransferRef && (
                        <p className="text-[10px] text-slate-400 font-mono">UTR ID: {selectedInvoice.bankTransferRef}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Payment Actions & Details Forms */}
                <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                  {selectedInvoice.status === "PAID" ? (
                    <div className="p-6 text-center space-y-2 my-auto">
                      <span className="material-symbols-outlined text-4xl text-[#26A69A]">check_circle</span>
                      <h4 className="text-sm font-bold text-white">Invoice Paid In Full</h4>
                      <p className="text-xs text-slate-400">Thank you! Your payment has been successfully cleared and settled.</p>
                    </div>
                  ) : selectedInvoice.status === "PENDING_VERIFICATION" ? (
                    <div className="p-6 text-center space-y-2 my-auto">
                      <span className="material-symbols-outlined text-4xl text-[#FFCA28]">pending_actions</span>
                      <h4 className="text-sm font-bold text-white">Audit Verification Pending</h4>
                      <p className="text-xs text-slate-400">Our accounts team is matching your bank deposit records.</p>
                    </div>
                  ) : paymentMode === "none" ? (
                    <div className="space-y-3 my-auto">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Select Payment Action</span>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => setPaymentMode("online")}
                          className="w-full py-3 bg-[#29B6F6] hover:bg-[#29B6F6]/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm">credit_card</span>
                          Pay Instantly Online
                        </button>
                        <button
                          onClick={() => setPaymentMode("bank")}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm">account_balance</span>
                          Bank Transfer / NEFT
                        </button>
                      </div>
                    </div>
                  ) : paymentMode === "online" ? (
                    <div className="space-y-4 my-auto">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#29B6F6]">credit_card</span>
                        Instant Online Checkout
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Pay securely using corporate credit card, wire debit, or instant online bank routing options.
                      </p>
                      <div className="flex gap-2.5 justify-end mt-4">
                        <button
                          onClick={() => setPaymentMode("none")}
                          className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={submitting}
                          onClick={() => handlePayOnline(selectedInvoice.id)}
                          className="px-6 py-2 bg-[#29B6F6] hover:bg-[#29B6F6]/90 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                        >
                          {submitting ? "Processing..." : "Confirm & Pay Online"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#26A69A]">account_balance</span>
                        Bank Transfer Details
                      </h4>
                      <div className="p-2.5 bg-[#121215] border border-white/5 rounded-xl text-[10px] text-slate-300 space-y-1 font-mono">
                        <p>Beneficiary: <strong className="text-white">HireGo Private Ltd</strong></p>
                        <p>Bank: <strong className="text-white">ICICI Bank Ltd</strong></p>
                        <p>IFSC: <strong className="text-white">ICIC0000104</strong> | A/c: <strong className="text-white">1042302302302302</strong></p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">UTR Number / Ref *</label>
                          <input
                            value={bankRef}
                            onChange={(e) => setBankRef(e.target.value)}
                            placeholder="e.g. UTR290230230"
                            className="w-full bg-[#121215] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Attach Transfer Receipt *</label>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={receiptUrl.startsWith("data:") ? "Image Attached (Receipt Loaded)" : receiptUrl}
                                readOnly={true}
                                placeholder="Select receipt screenshot..."
                                className="flex-1 bg-[#121215] border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 outline-none"
                              />
                              <label className="px-3 py-1.5 bg-slate-800 border border-white/10 hover:bg-slate-700 text-white text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors">
                                <span>Attach Receipt</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleFileChange}
                                />
                              </label>
                            </div>
                            {receiptUrl && (
                              <div className="relative mt-1 w-full max-h-24 rounded-lg overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                                <img src={receiptUrl} className="max-h-24 object-contain w-full" alt="Receipt Preview" />
                                <button
                                  type="button"
                                  onClick={() => setReceiptUrl("")}
                                  className="absolute top-1 right-1 p-0.5 bg-red-600/80 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[12px] block">close</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => setPaymentMode("none")}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={submitting}
                          onClick={() => handlePayBank(selectedInvoice.id)}
                          className="px-5 py-1.5 bg-[#26A69A] text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        >
                          {submitting ? "Submitting..." : "Submit Receipt Proof"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </Modal>

              {/* Print Only Styles & Invoice Template with HireGo AI logo */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #print-invoice-area, #print-invoice-area * {
                    visibility: visible;
                  }
                  #print-invoice-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white !important;
                    color: black !important;
                    padding: 40px !important;
                    margin: 0 !important;
                  }
                }
              `}} />

              <div id="print-invoice-area" className="hidden print:block bg-white text-black p-8 font-sans w-full" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
                  <div>
                    {/* Professional Styled Logo mimicking the screenshot */}
                    <div className="flex items-center gap-1 text-2xl font-black tracking-tight mb-1">
                      <span className="text-[#0B84FF]">H</span>
                      <span className="text-[#FF453A]">i</span>
                      <span className="text-[#FF453A]">r</span>
                      <span className="text-[#FF453A]">e</span>
                      <span className="text-[#30D158]">G</span>
                      <span className="text-[#FF9F0A]">o</span>
                      <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-[#FFCA28] text-black rounded font-sans uppercase">AI</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Autonomous Sourcing Engine</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Commercial Tax Invoice</h4>
                    <p>Invoice Number: <strong className="text-slate-900">{selectedInvoice.invoiceNumber}</strong></p>
                    <p>Issue Date: {formatDate(selectedInvoice.createdAt)}</p>
                    <p>Due Date: {formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-xs mb-8">
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Billed To</h5>
                    <p className="font-bold text-slate-900 text-sm">{selectedInvoice.companyName}</p>
                    <p className="text-slate-500 mt-1">Corporate Client Accounts</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Placement Details</h5>
                    <p className="text-slate-900"><span className="font-medium text-slate-500">Candidate:</span> <strong className="text-slate-800">{selectedInvoice.candidateName}</strong></p>
                    <p className="text-slate-900"><span className="font-medium text-slate-500">Designation:</span> <strong className="text-slate-800">{selectedInvoice.jobTitle}</strong></p>
                    <p className="text-slate-500 mt-1">Service Type: HireGo Autonomous Hiring™ placement</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs mb-8 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Base Fee</th>
                      <th className="py-2.5 px-3 text-right">Tax (GST 18%)</th>
                      <th className="py-2.5 px-3 text-right">Total Invoice Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">Professional Talent Sourcing & Placement Fee</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Sourcing and qualification services completed for {selectedInvoice.candidateName}</p>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(selectedInvoice.amount)}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">+{formatCurrency(selectedInvoice.taxAmount)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(selectedInvoice.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-start pt-6 border-t border-slate-200 text-xs">
                  <div className="text-slate-500 max-w-sm space-y-1.5">
                    <h6 className="font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Instructions & Terms:</h6>
                    <p>1. Please quote Invoice ID <strong className="text-slate-700">{selectedInvoice.invoiceNumber}</strong> in NEFT bank wire references.</p>
                    <p>2. Commercial Payment terms are Net 15 days from issue date.</p>
                    <p>3. Wire Details: HireGo Private Ltd | ICICI Bank | IFSC: ICIC0000104 | A/c No: 1042302302302302</p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-sm font-bold text-slate-900">
                      Amount Due: <span className="font-mono text-[#26A69A]">{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="pt-6">
                      <div className="inline-block border-t border-slate-300 pt-1 text-[10px] text-slate-400 font-medium font-mono uppercase tracking-wider">
                        Authorized Signature, HireGo AI
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )}
        </PageContainer>
    </div>
  );
}
