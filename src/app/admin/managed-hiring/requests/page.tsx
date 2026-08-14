"use client";
import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useRouter } from "next/navigation";

export default function AdminManagedHiringRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("/api/agreements/requirements");
        const data = await res.json();
        if (data.success) {
          setRequests(data.requirements);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "REVIEWING": return "bg-yellow/10 text-yellow border-yellow/20";
      case "DRAFTING_AGREEMENT": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "AGREEMENT_SENT": return "bg-green/10 text-green border-green/20";
      case "CLOSED": return "bg-white/5 text-white/40 border-white/10";
      default: return "bg-white/10 text-white border-white/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <AdminSidebar />
      <div className="flex-1 p-6 md:p-8 ml-0 md:ml-64 transition-all duration-300">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display-md text-3xl font-bold text-white mb-2">Hiring Mandates Pipeline</h1>
            <p className="text-sm text-text-secondary">Review employer requirements and initiate commercial agreements.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/admin/managed-hiring/templates")}
              className="px-4 py-2 bg-surface-container border border-white/10 hover:bg-white/5 transition-colors rounded-lg text-sm text-white flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">library_books</span>
              Templates Library
            </button>
            <button
              onClick={() => router.push("/admin/managed-hiring/agreements/builder")}
              className="px-4 py-2 bg-primary hover:bg-primary/90 transition-colors rounded-lg text-sm text-white font-bold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Draft Agreement
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-high border-b border-white/10">
                  <tr>
                    <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Reference / Company</th>
                    <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Roles & Volume</th>
                    <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Timeline & Priority</th>
                    <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Status</th>
                    <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.length > 0 ? requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <p className="font-mono text-xs text-primary mb-1">{req.referenceCode}</p>
                        <p className="font-bold text-white text-base">{req.companyName}</p>
                        <p className="text-xs text-text-secondary">{req.contactPerson} | {req.email}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {req.jobTitles.map((t: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/80">{t}</span>
                          ))}
                        </div>
                        <p className="text-xs text-text-secondary">{req.numberOfPositions} Position(s) • {req.experienceYears}</p>
                        <p className="text-xs text-text-secondary">{req.currency === "INR" ? "₹" : "$"}{req.salaryRangeMax} Max CTC</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-white mb-1">{req.joiningTimeline}</p>
                        <p className="text-xs text-text-secondary mb-1">Warranty: {req.replacementExpectation}</p>
                        {req.hiringPriority.includes("Urgent") && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red/20 text-red uppercase">
                            <span className="material-symbols-outlined text-[10px]">local_fire_department</span>
                            Urgent
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(req.status)}`}>
                          {req.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => router.push(`/admin/managed-hiring/agreements/builder?reqId=${req.id}`)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Draft Agreement
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary">
                        No hiring mandates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
