"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

interface DocumentVerificationRecord {
  id: string;
  employerName: string;
  companyName: string;
  docType: string;
  declaredIdentifier: string | null;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  status: "Pending Audit" | "Verified" | "Rejected";
}

export default function AdminDocumentVerificationRoute() {
  const [documents, setDocuments] = useState<DocumentVerificationRecord[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setMessage("");

    const query =
      filter === "All"
        ? "?limit=100"
        : `?limit=100&status=${encodeURIComponent(filter)}`;

    fetch(`/api/admin/document-verification${query}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load KYC submissions.");
        }
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setMessageType("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load KYC submissions.",
          );
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filter]);

  async function handleAction(
    id: string,
    action: "Verified" | "Rejected",
  ) {
    if (busyId) return;
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/document-verification/${encodeURIComponent(id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update KYC review.");
      }
      setDocuments((previous) =>
        previous.map((document) =>
          document.id === id ? { ...document, status: action } : document,
        ),
      );
      setMessageType("success");
      setMessage(`KYC document marked ${action.toLowerCase()}.`);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update KYC review.",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="pl-[116px] flex-1 flex flex-col min-h-screen">
        <AdminHeader
          title="Document Verification Audit"
          subtitle="Manual review of employer KYC documents and declared identifiers"
        />
        <main className="p-6 lg:p-8 space-y-6 flex-1">
          {message && (
            <div
              role={messageType === "error" ? "alert" : "status"}
              className={`rounded-xl border p-3 text-sm ${
                messageType === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex items-center gap-2 bg-surface-container-low/40 p-1 rounded-xl border border-white/10 w-fit">
            {["All", "Pending Audit", "Verified", "Rejected"].map(
              (statusOption) => (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => setFilter(statusOption)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === statusOption
                      ? "bg-primary text-white shadow-md"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  {statusOption}
                </button>
              ),
            )}
          </div>

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {loading ? (
              <div role="status" className="p-10 text-center text-sm text-text-muted">
                Loading KYC submissions…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-text-secondary uppercase tracking-wider text-[10px]">
                      <th className="p-4">Employer & Company</th>
                      <th className="p-4">Document</th>
                      <th className="p-4">Declared Identifier</th>
                      <th className="p-4">Submitted</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-text-primary">{doc.employerName}</div>
                          <div className="text-text-secondary text-[11px]">{doc.companyName}</div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-white">{doc.docType}</p>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-[11px] font-bold text-primary hover:underline"
                          >
                            Review {doc.fileName}
                          </a>
                        </td>
                        <td className="p-4 font-mono text-text-secondary">
                          {doc.declaredIdentifier || "Not recorded"}
                        </td>
                        <td className="p-4 text-text-secondary">
                          {new Date(doc.submittedAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              doc.status === "Verified"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : doc.status === "Rejected"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {doc.status === "Pending Audit" && (
                            <>
                              <button
                                type="button"
                                disabled={busyId === doc.id}
                                onClick={() => void handleAction(doc.id, "Verified")}
                                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              >
                                Verify
                              </button>
                              <button
                                type="button"
                                disabled={busyId === doc.id}
                                onClick={() => void handleAction(doc.id, "Rejected")}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-text-muted">
                          No KYC submissions found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
