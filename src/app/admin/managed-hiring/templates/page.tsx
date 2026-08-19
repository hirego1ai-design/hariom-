"use client";
import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useRouter } from "next/navigation";

export default function AdminAgreementTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const res = await fetch(`/api/agreements/templates/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this template?")) return;
    try {
      const res = await fetch(`/api/agreements/templates/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <AdminSidebar />
      <div className="flex-1 p-6 md:p-8 ml-0 md:ml-64 transition-all duration-300">
        
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
                    <button onClick={() => handleArchive(tpl.id)} className="py-2 px-3 bg-red/10 hover:bg-red/20 text-red rounded-lg transition-colors flex justify-center items-center">
                      <span className="material-symbols-outlined text-[14px]">archive</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
