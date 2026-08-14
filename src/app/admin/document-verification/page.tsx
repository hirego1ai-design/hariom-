"use client";
import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

interface DocumentVerificationRecord {
  id: string;
  employerName: string;
  company: string;
  docType: "GST Certificate" | "Certificate of Incorporation" | "PAN Card" | "Tax Residency";
  submittedAt: string;
  status: "Pending Audit" | "Verified" | "Rejected";
  riskScore: "Low" | "Medium" | "High";
}

export default function AdminDocumentVerificationRoute() {
  const [documents, setDocuments] = useState<DocumentVerificationRecord[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/admin/document-verification?status=${filter}`);
        if (response.ok) {
          const data = await response.json();
          if (data.documents) {
            setDocuments(data.documents);
          }
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [filter]);

  const handleAction = async (id: string, action: "Verified" | "Rejected") => {
    try {
      const response = await fetch(`/api/admin/document-verification/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: action } : d))
        );
      }
    } catch (err) {
      console.error("Failed to update document:", err);
    }
  };

  const filteredDocs = documents.filter((d) => filter === "All" || d.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
        <AdminSidebar />
        <div className="pl-[116px] flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">progress_activity</span>
            <p className="text-sm font-bold text-text-primary">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="pl-[116px] flex-1 flex flex-col min-h-screen">
        <AdminHeader title="Document Verification Audit" subtitle="Review and approve employer compliance & KYC documents" />
        <main className="p-6 lg:p-8 space-y-6 flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-surface-container-low/40 p-1 rounded-xl border border-white/10">
              {["All", "Pending Audit", "Verified", "Rejected"].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => setFilter(statusOption)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === statusOption ? "bg-primary text-white shadow-md" : "text-text-secondary hover:text-white"
                  }`}
                >
                  {statusOption}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-text-secondary uppercase tracking-wider text-[10px">
                    <th className="p-4">Doc ID</th>
                    <th className="p-4">Employer & Company</th>
                    <th className="p-4">Document Type</th>
                    <th className="p-4">Submitted</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-primary font-bold">{doc.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-text-primary">{doc.employerName}</div>
                        <div className="text-text-secondary text-[11px]">{doc.company}</div>
                      </td>
                      <td className="p-4 font-medium">{doc.docType}</td>
                      <td className="p-4 text-text-secondary">{doc.submittedAt}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          doc.riskScore === "High" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {doc.riskScore}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          doc.status === "Verified" ? "bg-emerald-500/20 text-emerald-400" : doc.status === "Rejected" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400 animate-pulse"
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {doc.status === "Pending Audit" && (
                          <>
                            <button onClick={() => handleAction(doc.id, "Verified")} className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-all">
                              Approve
                            </button>
                            <button onClick={() => handleAction(doc.id, "Rejected")} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-all">
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-text-muted">
                        No documents found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

