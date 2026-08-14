"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AgreementTemplateRecord } from "@/types";
import { formatCurrency } from "@/utils";

export default function AdminAgreementTemplatesPage() {
  const [templates, setTemplates] = useState<AgreementTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Partial<AgreementTemplateRecord> | null>(null);

  useEffect(() => {
    fetch("/api/agreements/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTemplates(data.templates || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name) return;
    try {
      const res = await fetch("/api/agreements/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemplate),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) => [...prev, data.template]);
        setEditingTemplate(null);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#AB47BC]/10 text-[#AB47BC] border border-[#AB47BC]/20 mb-1">
              INTERNAL USE ONLY
            </div>
            <h1 className="text-2xl font-bold text-white">Agreement Template Library</h1>
            <p className="text-xs text-slate-400">Configure internal commercial agreement templates for sales teams</p>
          </div>

          <button
            onClick={() =>
              setEditingTemplate({
                name: "New Custom Template",
                category: "Custom",
                feeType: "PERCENTAGE",
                feeValue: 8.33,
                invoiceRule: "ON_JOINING",
                replacementDays: 60,
                creditDays: 15,
                specialClauses: ["Standard replacement warranty applies."],
              })
            }
            className="px-4 py-2.5 rounded-xl bg-[#29B6F6] text-white text-xs font-bold hover:bg-[#29B6F6]/90 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span> Create Template
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl hover:border-white/20 transition-all">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-[#AB47BC]/20 text-[#AB47BC] border border-[#AB47BC]/40">
                    {tpl.category}
                  </span>
                  {tpl.isDefault && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FFCA28]/20 text-[#FFCA28]">Default</span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{tpl.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#16161B] p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Fee Structure</span>
                    <span className="font-bold text-[#26A69A]">
                      {tpl.feeType === "PERCENTAGE" ? `${tpl.feeValue}% of CTC` : formatCurrency(tpl.feeValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Replacement Warranty</span>
                    <span className="font-bold text-[#29B6F6]">{tpl.replacementDays} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Invoice Rule</span>
                    <span className="font-bold text-slate-300">{tpl.invoiceRule}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Credit Terms</span>
                    <span className="font-bold text-slate-300">{tpl.creditDays || tpl.creditTermsDays || 15} Days</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => setEditingTemplate(tpl)}
                    className="text-xs text-[#29B6F6] font-bold hover:underline"
                  >
                    Edit Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Template Modal Configurator */}
        {editingTemplate && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-lg font-bold text-white">Configure Agreement Template</h3>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Template Name</label>
                <input
                  value={editingTemplate.name || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Fee Type</label>
                  <select
                    value={editingTemplate.feeType || "PERCENTAGE"}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, feeType: e.target.value })}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="PERCENTAGE">Percentage of Annual CTC</option>
                    <option value="FIXED">Fixed Commercial Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Fee Value</label>
                  <input
                    type="number"
                    value={editingTemplate.feeValue || 8.33}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, feeValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Replacement (Days)</label>
                  <input
                    type="number"
                    value={editingTemplate.replacementDays || 60}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, replacementDays: parseInt(e.target.value) || 30 })}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Credit Terms (Days)</label>
                  <input
                    type="number"
                    value={editingTemplate.creditDays || 15}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, creditDays: parseInt(e.target.value) || 15 })}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 rounded-xl text-xs text-slate-400">
                  Cancel
                </button>
                <button onClick={handleSaveTemplate} className="px-5 py-2 rounded-xl bg-[#29B6F6] text-white text-xs font-bold">
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
