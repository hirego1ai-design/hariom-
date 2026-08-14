"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { formatCurrency, formatDate } from "@/utils";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<any>(null);

  const [companyName, setCompanyName] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [amount, setAmount] = useState(150000);

  const handleRejectReceipt = async (invoiceId: string) => {
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_receipt", invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Bank transfer receipt rejected. Status reverted to UNPAID.");
        setSelectedReceiptInvoice(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = () => {
    fetch("/api/admin/invoices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.invoices || []);
          setSummary(data.summary || null);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, candidateName, jobTitle, amount }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Invoice & Revenue Operations</h1>
            <p className="text-xs text-slate-400">Track commercial invoices, payment receipts & collection automation</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">post_add</span> Create Invoice
          </button>
        </div>

        {/* Summary Metric Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Billed Commercial</span>
              <div className="text-xl font-extrabold text-white font-mono">{formatCurrency(summary.totalBilled)}</div>
            </div>
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Collected Revenue</span>
              <div className="text-xl font-extrabold text-[#26A69A] font-mono">{formatCurrency(summary.totalCollected)}</div>
            </div>
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Outstanding / Pending</span>
              <div className="text-xl font-extrabold text-[#FFCA28] font-mono">{formatCurrency(summary.totalOverdue)}</div>
            </div>
          </div>
        )}

        {/* Invoices Queue */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading invoices...</div>
        ) : (
          <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Commercial Invoices</h3>

            <div className="divide-y divide-white/5">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FFCA28]">{inv.invoiceNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === "PAID"
                          ? "bg-[#26A69A]/20 text-[#26A69A]"
                          : inv.status === "PENDING_VERIFICATION"
                          ? "bg-[#FFCA28]/20 text-[#FFCA28] border border-[#FFCA28]/30"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {inv.status === "PENDING_VERIFICATION" ? "AWAITING AUDIT" : inv.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{inv.companyName}</h4>
                    <p className="text-xs text-slate-400">
                      Placed: <strong className="text-white">{inv.candidateName}</strong> ({inv.jobTitle})
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white font-mono">{formatCurrency(inv.totalAmount)}</div>
                      <div className="text-[10px] text-slate-500">Due: {formatDate(inv.dueDate)}</div>
                    </div>

                    {inv.status === "PENDING_VERIFICATION" && (
                      <button
                        onClick={() => setSelectedReceiptInvoice(inv)}
                        className="px-4 py-2 rounded-xl bg-[#FFCA28] text-black text-xs font-bold hover:bg-[#FFCA28]/90 flex items-center gap-1 shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">verified_user</span>
                        Verify Transfer
                      </button>
                    )}

                    {inv.status === "UNPAID" && (
                      <button
                        onClick={() => handleMarkPaid(inv.id)}
                        className="px-4 py-2 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Generate Commercial Invoice</h3>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Company Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Placed Candidate Name</label>
                <input
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Job Title</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Base Placement Fee (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button onClick={handleCreateInvoice} className="px-5 py-2 bg-[#26A69A] text-white text-xs font-bold rounded-xl">Generate</button>
              </div>
            </div>
          </div>
        )}

        {/* Verify Receipt Modal */}
        {selectedReceiptInvoice && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <span className="font-mono text-xs text-[#FFCA28] font-bold">{selectedReceiptInvoice.invoiceNumber}</span>
                  <h3 className="text-lg font-bold text-white">Verify NEFT / Bank Receipt</h3>
                </div>
                <button onClick={() => setSelectedReceiptInvoice(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#16161B] rounded-xl border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Company Billed:</span>
                    <span className="font-bold text-white">{selectedReceiptInvoice.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Placement Fee:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(selectedReceiptInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                    <span className="text-slate-400">Transaction Ref / UTR:</span>
                    <span className="font-mono text-[#FFCA28] font-bold">{selectedReceiptInvoice.bankTransferRef || "(No Ref Provided)"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Submitted Payment Receipt Screenshot</span>
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-black max-h-56 flex items-center justify-center">
                    {selectedReceiptInvoice.bankTransferReceiptUrl ? (
                      <img
                        src={selectedReceiptInvoice.bankTransferReceiptUrl}
                        alt="Receipt Screenshot"
                        className="max-h-56 object-contain"
                      />
                    ) : (
                      <div className="p-8 text-xs text-slate-500 italic">No receipt image attached</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  onClick={() => handleRejectReceipt(selectedReceiptInvoice.id)}
                  className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-xl text-xs font-bold transition-all"
                >
                  Reject & Revert to UNPAID
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedReceiptInvoice(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleMarkPaid(selectedReceiptInvoice.id);
                      setSelectedReceiptInvoice(null);
                    }}
                    className="px-5 py-2 bg-[#26A69A] text-white text-xs font-bold rounded-xl shadow-lg hover:bg-[#26A69A]/90 transition-all"
                  >
                    Approve & Mark Paid
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
