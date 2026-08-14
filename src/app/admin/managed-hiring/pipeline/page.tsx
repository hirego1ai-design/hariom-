"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { RequirementStatus, HiringRequirementRecord } from "@/types";

export default function AdminManagedHiringPipeline() {
  const [requirements, setRequirements] = useState<HiringRequirementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agreements/requirements")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRequirements(data.requirements || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">HireGo Managed Hiring™ Commercial Pipeline</h1>
            <p className="text-xs text-slate-400">Incoming hiring requests, sales assignment & agreement drafting</p>
          </div>
          <span className="px-3 py-1 bg-[#29B6F6]/10 text-[#29B6F6] text-xs font-bold rounded-lg border border-[#29B6F6]/20">
            {requirements.length} Active Requests
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading requirements queue...</div>
        ) : requirements.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 bg-[#121215] border border-white/5 rounded-2xl">
            No hiring requirements submitted yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requirements.map((req) => (
              <div key={req.id} className="bg-[#121215] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#FFCA28]">{req.referenceCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#26A69A]/20 text-[#26A69A]">
                      {req.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{req.companyName} — {req.jobTitles.join(", ")}</h3>
                  <div className="text-xs text-slate-400 flex flex-wrap gap-3">
                    <span>Contact: {req.contactPerson} ({req.email})</span>
                    <span>Positions: {req.numberOfPositions}</span>
                    <span>Location: {req.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-xl bg-[#29B6F6] text-white text-xs font-bold hover:bg-[#29B6F6]/90">
                    Draft Agreement
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
