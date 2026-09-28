"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/utils";
import { PageContainer, PageHeader, Card, Modal, StatusBadge } from "@/components/employer/LayoutSystem";

type Invoice = {
  id: string;
  invoiceNumber: string;
  agreementId: string;
  companyName: string;
  candidateName: string;
  jobTitle: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  taxRatePct: number | null;
  creditDays: number | null;
  invoiceRule: string | null;
  status: string;
  createdAt: string;
  dueDate: string;
  bankTransferRef?: string;
};

function taxLabel(invoice: Invoice) {
  return typeof invoice.taxRatePct === "number"
    ? `Tax (${invoice.taxRatePct}% per signed agreement)`
    : "Tax";
}

function creditLabel(days: number | null) {
  return typeof days === "number" && Number.isFinite(days)
    ? `Net ${days} days`
    : "Per signed agreement";
}

export default function EmployerBillingManagementPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMode, setPaymentMode] = useState<"none" | "bank">("none");
  const [bankRef, setBankRef] = useState("");
  const [receiptData, setReceiptData] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const loadInvoices = useCallback(async () => {
    const response = await fetch("/api/employer/billing/invoices", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to load billing records.");
    }
    setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadInvoices()
      .catch((error) => {
        if (!cancelled) {
          setMessageType("error");
          setMessage(error instanceof Error ? error.message : "Failed to load billing records.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadInvoices]);

  const totalOutstanding = useMemo(
    () =>
      invoices
        .filter((invoice) => !["PAID", "CANCELLED", "VOID"].includes(invoice.status))
        .reduce((total, invoice) => total + Number(invoice.totalAmount || 0), 0),
    [invoices],
  );

  const outstandingCreditTerms = useMemo(() => {
    const values = Array.from(
      new Set(
        invoices
          .filter((invoice) => !["PAID", "CANCELLED", "VOID"].includes(invoice.status))
          .map((invoice) => invoice.creditDays)
          .filter((value): value is number => typeof value === "number"),
      ),
    );
    return values.length === 1 ? creditLabel(values[0]) : "Per signed agreement";
  }, [invoices]);

  function resetReceiptForm() {
    setPaymentMode("none");
    setBankRef("");
    setReceiptData("");
    setReceiptFileName("");
  }

  function closeInvoice() {
    setSelectedInvoice(null);
    resetReceiptForm();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "application/pdf"].includes(file.type)) {
      setMessageType("error");
      setMessage("Only PNG, JPEG, or PDF receipts are accepted.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessageType("error");
      setMessage("Receipt files must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        setMessageType("error");
        setMessage("Unable to read the selected receipt file.");
        return;
      }
      setReceiptData(reader.result);
      setReceiptFileName(file.name);
      setMessage("");
    };
    reader.onerror = () => {
      setMessageType("error");
      setMessage("Unable to read the selected receipt file.");
    };
    reader.readAsDataURL(file);
  }

  async function handlePayBank(invoiceId: string) {
    if (submitting) return;
    if (bankRef.trim().length < 5) {
      setMessageType("error");
      setMessage("Enter a valid bank transfer reference/UTR ID.");
      return;
    }
    if (!receiptData) {
      setMessageType("error");
      setMessage("Attach the bank transfer receipt before submitting.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/employer/billing/invoices/${invoiceId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankTransferRef: bankRef.trim(),
          bankTransferReceiptUrl: receiptData,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Receipt submission failed.");
      }

      await loadInvoices();
      closeInvoice();
      setMessageType("success");
      setMessage("Bank transfer receipt submitted for verification.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Failed to submit bank receipt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Billing Management"
        subtitle="Authoritative commercial invoices and payment-receipt verification"
      />

      <PageContainer>
        {message && (
          <p
            role={messageType === "error" ? "alert" : "status"}
            className={`rounded-xl border p-3 text-sm ${
              messageType === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card>
            <span className="text-[10px] font-bold uppercase text-slate-500">Billing Source</span>
            <div className="mt-1 text-xl font-bold text-white">Signed Commercial Agreement</div>
            <div className="mt-1 text-xs text-[#26A69A]">Invoice terms are read from persisted agreement records</div>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase text-slate-500">Outstanding Balance</span>
            <div className="mt-1 font-mono text-xl font-extrabold text-[#FFCA28]">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="mt-1 text-xs text-slate-400">Credit terms: {outstandingCreditTerms}</div>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase text-slate-500">Current Portal Payment Flow</span>
            <div className="mt-1 text-xl font-bold text-white">Bank Transfer Receipt</div>
            <div className="mt-1 text-xs text-slate-400">Submitted proof remains pending until verified by billing operations</div>
          </Card>
        </div>

        <Card className="space-y-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <span className="material-symbols-outlined text-[#29B6F6]">receipt</span>
            Placement Invoice History
          </h2>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading billing records…</div>
          ) : invoices.length === 0 ? (
            <div className="space-y-3 py-12 text-center text-xs text-slate-400">
              <span className="material-symbols-outlined text-4xl">receipt_long</span>
              <p className="text-sm font-bold text-white">No invoices generated yet</p>
              <p>Invoices will appear only after the configured commercial billing event occurs.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col justify-between gap-4 py-4 md:flex-row md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FFCA28]">{invoice.invoiceNumber}</span>
                      <StatusBadge
                        status={invoice.status}
                        variant={invoice.status === "PAID" ? "success" : "warning"}
                      />
                    </div>
                    <p className="text-xs text-white">
                      Placement: <strong className="text-slate-200">{invoice.candidateName}</strong> ({invoice.jobTitle})
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Issued: {formatDate(invoice.createdAt)} | Due: {formatDate(invoice.dueDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-mono text-sm font-extrabold text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {typeof invoice.taxRatePct === "number"
                          ? `Includes ${invoice.taxRatePct}% tax per signed agreement`
                          : "Tax per persisted invoice"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        resetReceiptForm();
                      }}
                      className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-white/5 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {selectedInvoice && (
          <>
            <Modal
              isOpen
              onClose={closeInvoice}
              title={`Commercial Invoice — ${selectedInvoice.invoiceNumber}`}
              size="4xl"
              footerActions={
                <>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/5"
                  >
                    Print / Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={closeInvoice}
                    className="rounded-xl bg-[#29B6F6] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#29B6F6]/90"
                  >
                    Close
                  </button>
                </>
              }
            >
              <div className="my-2 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-[#16161B]/80">
                    <div className="grid grid-cols-2 gap-4 p-4 text-xs">
                      <div>
                        <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-500">Billed To</span>
                        <span className="text-sm font-bold text-white">{selectedInvoice.companyName}</span>
                      </div>
                      <div>
                        <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-500">Placement Details</span>
                        <span className="block text-sm font-bold text-white">{selectedInvoice.candidateName}</span>
                        <span className="mt-0.5 block text-[10px] text-slate-400">{selectedInvoice.jobTitle}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 p-4 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Base Placement Fee</span>
                        <span className="font-mono font-semibold text-white">{formatCurrency(selectedInvoice.amount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>{taxLabel(selectedInvoice)}</span>
                        <span className="font-mono text-slate-300">+{formatCurrency(selectedInvoice.taxAmount)}</span>
                      </div>
                      <div className="mt-1.5 flex justify-between border-t border-white/5 pt-2.5 text-sm font-extrabold">
                        <span className="text-white">Total Amount Due</span>
                        <span className="font-mono text-[#26A69A]">{formatCurrency(selectedInvoice.totalAmount)}</span>
                      </div>
                      <div className="border-t border-white/5 pt-2 text-[10px] text-slate-500">
                        Credit terms: {creditLabel(selectedInvoice.creditDays)}
                        {selectedInvoice.invoiceRule ? ` · Billing rule: ${selectedInvoice.invoiceRule.replaceAll("_", " ")}` : ""}
                      </div>
                    </div>
                  </div>

                  {selectedInvoice.status === "PENDING_VERIFICATION" && (
                    <div className="space-y-1.5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow">
                      <p className="flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Bank receipt submitted
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        Payment is not marked paid until billing operations verify the submitted transfer evidence.
                      </p>
                      {selectedInvoice.bankTransferRef && (
                        <p className="font-mono text-[10px] text-slate-400">UTR ID: {selectedInvoice.bankTransferRef}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                  {selectedInvoice.status === "PAID" ? (
                    <div className="my-auto space-y-2 p-6 text-center">
                      <span className="material-symbols-outlined text-4xl text-[#26A69A]">check_circle</span>
                      <h4 className="text-sm font-bold text-white">Invoice Paid</h4>
                      <p className="text-xs text-slate-400">This invoice is recorded as settled.</p>
                    </div>
                  ) : selectedInvoice.status === "PENDING_VERIFICATION" ? (
                    <div className="my-auto space-y-2 p-6 text-center">
                      <span className="material-symbols-outlined text-4xl text-[#FFCA28]">pending_actions</span>
                      <h4 className="text-sm font-bold text-white">Verification Pending</h4>
                      <p className="text-xs text-slate-400">A submitted bank-transfer receipt is awaiting billing review.</p>
                    </div>
                  ) : paymentMode === "none" ? (
                    <div className="my-auto space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Portal Action</span>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          Online invoice payment is not configured in this portal. After making the transfer using the beneficiary details supplied in your executed commercial agreement or official finance instructions, submit the transfer proof here.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPaymentMode("bank")}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 py-3 text-xs font-bold text-white transition-all hover:bg-slate-700 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">account_balance</span>
                        Submit Bank Transfer Proof
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span className="material-symbols-outlined text-sm text-[#26A69A]">account_balance</span>
                        Bank Transfer Receipt
                      </h4>
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-slate-300">
                        For safety, this screen does not invent or hardcode beneficiary bank details. Use only account details from the executed commercial agreement or an official HireGo finance instruction.
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">UTR Number / Reference *</label>
                          <input
                            value={bankRef}
                            onChange={(event) => setBankRef(event.target.value)}
                            maxLength={150}
                            placeholder="Enter transfer reference"
                            className="w-full rounded-xl border border-white/10 bg-[#121215] px-3 py-2 text-xs text-white outline-none focus:border-[#29B6F6]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Transfer Receipt *</label>
                          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-slate-800 px-3 text-xs font-bold text-white transition-colors hover:bg-slate-700">
                            {receiptFileName || "Attach PNG, JPEG, or PDF receipt"}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,application/pdf"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                          {receiptFileName && (
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptData("");
                                setReceiptFileName("");
                              }}
                              className="text-[10px] font-bold text-red-300 hover:text-red-200"
                            >
                              Remove attached receipt
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={resetReceiptForm}
                          className="rounded-xl px-3 py-2 text-xs text-slate-400 transition-colors hover:text-white disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submitting || bankRef.trim().length < 5 || !receiptData}
                          onClick={() => void handlePayBank(selectedInvoice.id)}
                          className="rounded-xl bg-[#26A69A] px-5 py-2 text-xs font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submitting ? "Submitting…" : "Submit Receipt Proof"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Modal>

            <style
              dangerouslySetInnerHTML={{
                __html: `
                  @media print {
                    body * { visibility: hidden; }
                    #print-invoice-area, #print-invoice-area * { visibility: visible; }
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
                `,
              }}
            />

            <div
              id="print-invoice-area"
              className="hidden w-full bg-white p-8 font-sans text-black print:block"
              style={{ color: "#000000", backgroundColor: "#ffffff" }}
            >
              <div className="mb-6 flex items-start justify-between border-b-2 border-slate-200 pb-6">
                <div>
                  <div className="mb-1 text-2xl font-black tracking-tight text-slate-900">HireGo AI</div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Commercial Billing</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <h4 className="mb-1 text-lg font-bold text-slate-900">Commercial Invoice</h4>
                  <p>Invoice Number: <strong className="text-slate-900">{selectedInvoice.invoiceNumber}</strong></p>
                  <p>Issue Date: {formatDate(selectedInvoice.createdAt)}</p>
                  <p>Due Date: {formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <h5 className="mb-2 border-b border-slate-200 pb-1 font-bold uppercase tracking-wider text-slate-800">Billed To</h5>
                  <p className="text-sm font-bold text-slate-900">{selectedInvoice.companyName}</p>
                </div>
                <div>
                  <h5 className="mb-2 border-b border-slate-200 pb-1 font-bold uppercase tracking-wider text-slate-800">Placement Details</h5>
                  <p className="text-slate-900"><span className="font-medium text-slate-500">Candidate:</span> <strong>{selectedInvoice.candidateName}</strong></p>
                  <p className="text-slate-900"><span className="font-medium text-slate-500">Designation:</span> <strong>{selectedInvoice.jobTitle}</strong></p>
                </div>
              </div>

              <table className="mb-8 w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 font-bold text-slate-700">
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5 text-right">Base Fee</th>
                    <th className="px-3 py-2.5 text-right">
                      {typeof selectedInvoice.taxRatePct === "number" ? `Tax (${selectedInvoice.taxRatePct}%)` : "Tax"}
                    </th>
                    <th className="px-3 py-2.5 text-right">Total Due</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  <tr>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-900">Talent placement fee</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">Placement for {selectedInvoice.candidateName}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{formatCurrency(selectedInvoice.amount)}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">+{formatCurrency(selectedInvoice.taxAmount)}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(selectedInvoice.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-start justify-between border-t border-slate-200 pt-6 text-xs">
                <div className="max-w-md space-y-1.5 text-slate-500">
                  <h6 className="mb-1 font-bold uppercase tracking-wider text-slate-700">Payment Terms</h6>
                  <p>Quote invoice ID <strong className="text-slate-700">{selectedInvoice.invoiceNumber}</strong> in the transfer reference.</p>
                  <p>Credit terms: {creditLabel(selectedInvoice.creditDays)}.</p>
                  <p>Use beneficiary bank details only from the executed commercial agreement or official finance instructions.</p>
                </div>
                <div className="text-right text-sm font-bold text-slate-900">
                  Amount Due: <span className="font-mono text-[#26A69A]">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
