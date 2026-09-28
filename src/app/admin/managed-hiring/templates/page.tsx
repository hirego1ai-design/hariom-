"use client";
import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useRouter } from "next/navigation";

export default function AdminAgreementTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/agreements/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDuplicate = async (id: string) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/agreements/templates/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: "Template cloned successfully." });
        fetchTemplates();
      } else {
        setActionMessage({ type: "error", text: data.error || "Unable to clone template." });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: "error", text: "Unable to clone template. Please try again." });
    }
  };

  const handleArchive = async (id: string) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/agreements/templates/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: "Template archived." });
        setPendingArchiveId(null);
        fetchTemplates();
      } else {
        setActionMessage({ type: "error", text: data.error || "Unable to archive template." });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: "error", text: "Unable to archive template. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <AdminSidebar />
      <div className="flex-1 p-6 md:p-8 ml-0 md:ml-64 transition-all duration-300">
        {actionMessage && <div role={actionMessage.type === "error" ? "alert" : "status"} aria-live={actionMessage.type === "error" ? "assertive" : "polite"} className={`mb-6 rounded-xl border px-4 py-3 text-sm ${actionMessage.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>{actionMessage.text}</div>}
        
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => router.push("/admin/managed-hiring/requests")} className="text-text-secondary hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h1 className="font-display-md text-3xl font-bold text-white">Agreement Templates</h1>
            </div>
            <p className="text-sm text-text-secondary ml-8">Manage baseline commercial structures and fee matrices.</p>
          </div>
          <button onClick={() => router.push("/admin/agreements/builder")} className="px-4 py-2 bg-primary hover:bg-primary/90 transition-colors rounded-lg text-sm text-white font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Template
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(tpl => (
              <div key={tpl.id} className="glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-white/10 text-white/60 uppercase mb-2 inline-block">
                      {tpl.category}
                    </span>
                    <h3 className="font-headline-md text-xl text-white leading-tight">{tpl.name}</h3>
                  </div>
                  {tpl.isArchived && (
                    <span className="px-2 py-1 rounded bg-red/10 text-red border border-red/20 text-[10px] font-bold">ARCHIVED</span>
                  )}
                </div>
                
                <p className="text-sm text-text-secondary mb-6 flex-1 line-clamp-2">
                  {tpl.description}
                </p>

                <div className="bg-surface-container-high rounded-xl p-4 mb-6 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Standard Fee</span>
                    <span className="font-bold text-primary">{tpl.feeValue}{tpl.feeType === "PERCENTAGE" ? "%" : " flat"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Warranty</span>
                    <span className="font-medium text-white">{tpl.replacementDays} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Invoicing</span>
                    <span className="font-medium text-white text-xs text-right max-w-[120px] truncate">{tpl.invoiceRule.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button onClick={() => router.push(`/admin/agreements/builder?templateId=${encodeURIComponent(tpl.id)}`)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-colors flex justify-center items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                  </button>
                  <button onClick={() => handleDuplicate(tpl.id)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-colors flex justify-center items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">content_copy</span> Clone
                  </button>
                  {!tpl.isArchived && (
                    <button onClick={() => setPendingArchiveId(tpl.id)} className="py-2 px-3 bg-red/10 hover:bg-red/20 text-red rounded-lg transition-colors flex justify-center items-center" aria-label={`Archive ${tpl.name}`}>
                      <span className="material-symbols-outlined text-[14px]">archive</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingArchiveId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="archive-template-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
            <h2 id="archive-template-title" className="text-lg font-bold text-white">Archive template?</h2>
            <p className="mt-2 text-sm text-text-secondary">The template will no longer be available for new agreements. Existing agreements are not changed.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setPendingArchiveId(null)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5">Cancel</button>
              <button type="button" onClick={() => void handleArchive(pendingArchiveId)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500">Archive template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
