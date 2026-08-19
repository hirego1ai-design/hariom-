"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const queues = [
  ["Requirement", "/admin/managed-hiring/requests"],
  ["Agreement", "/admin/managed-hiring/requests"],
  ["Sourcing", "/admin/managed-hiring/requests"],
  ["Screening", "/admin/managed-hiring/requests"],
  ["Shortlist", "/admin/managed-hiring/requests"],
  ["Interviews", "/admin/managed-hiring/requests"],
  ["Joined", "/admin/invoices"],
  ["Invoice", "/admin/invoices"],
] as const;

export default function ManagedHiringOperationsPage() {
  const [config, setConfig] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/managed-hiring/config").then((response) => response.json()),
      fetch("/api/admin/invoices").then((response) => response.json()),
    ]).then(([configData, invoiceData]) => {
      setConfig(configData.config);
      setInvoices(invoiceData.invoices || []);
    }).finally(() => setLoading(false));
  }, []);

  return <main className="min-h-screen bg-[#0A0A0C] text-white p-6 md:p-10"><div className="max-w-7xl mx-auto space-y-7"><div className="flex flex-col md:flex-row md:items-end justify-between gap-3"><div><p className="text-yellow text-xs font-bold uppercase tracking-[0.2em] mb-2">Admin operations</p><h1 className="text-3xl font-bold">Managed Hiring control center</h1><p className="text-sm text-slate-400 mt-2">Operate requirements, interview delivery, invoices, and replacement warranty decisions.</p></div><Link href="/admin/settings/managed-hiring" className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold">Open commercial configuration</Link></div>{loading ? <p className="text-slate-400">Loading operations...</p> : <><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[["Active SLA", config?.warranty?.guaranteeWindowDays ? `${config.warranty.guaranteeWindowDays} days` : "—"], ["Invoice trigger", config?.invoicing?.invoiceTrigger || "—"], ["Payment terms", config?.invoicing?.paymentTermsDays ? `Net ${config.invoicing.paymentTermsDays}` : "—"], ["Open invoices", String(invoices.filter((invoice) => invoice.status !== "PAID").length)]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="text-lg font-bold mt-2">{value}</p></div>)}</div><section className="rounded-2xl border border-white/10 bg-[#121215] p-6"><h2 className="font-bold mb-4">Managed-hiring operating stages</h2><div className="grid md:grid-cols-4 lg:grid-cols-8 gap-2">{queues.map(([stage, href], index) => <div key={stage} className="rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-3 text-center"><span className="text-indigo-300 text-xs font-bold">{index + 1}</span><p className="text-[11px] font-bold mt-2">{stage}</p><Link href={href} className="mt-3 inline-block text-[10px] text-indigo-300 hover:text-white">Open queue</Link></div>)}</div></section><section className="rounded-2xl border border-white/10 bg-[#121215] p-6"><div className="flex items-center justify-between mb-4"><h2 className="font-bold">Recent invoices</h2><Link href="/admin/invoices" className="text-xs text-indigo-300">View all</Link></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr><th className="p-2">Invoice</th><th className="p-2">Company</th><th className="p-2">Candidate</th><th className="p-2">Total</th><th className="p-2">Status</th></tr></thead><tbody>{invoices.slice(0, 8).map((invoice) => <tr key={invoice.id} className="border-t border-white/5"><td className="p-2 font-mono">{invoice.invoiceNumber}</td><td className="p-2">{invoice.companyName}</td><td className="p-2">{invoice.candidateName || "—"}</td><td className="p-2">{invoice.currency} {invoice.totalAmount}</td><td className="p-2">{invoice.status}</td></tr>)}</tbody></table></div></section></>}</div></main>;
}
