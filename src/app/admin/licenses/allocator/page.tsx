"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLicenseAllocatorPage() {
  const [licenses, setLicenses] = useState([
    { company: "Vanguard Systems", tier: "Enterprise", seatsAllocated: 50, seatsUsed: 38 },
    { company: "Pulse AI Studio", tier: "Pro Tier", seatsAllocated: 15, seatsUsed: 14 },
    { company: "Glitch Creative", tier: "Starter Tier", seatsAllocated: 5, seatsUsed: 5 },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Enterprise License & Seat Allocator (LM03)" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs">
              {toast}
            </div>
          )}

          <div>
            <h1 className="font-display-lg text-display-lg text-white">Enterprise License & Seat Allocator (LM03)</h1>
            <p className="text-text-muted text-sm">Provision corporate recruiter seats, candidate search tokens, and sub-organization licenses.</p>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs text-text-secondary">
              <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Corporate Client</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Seat Allocation</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {licenses.map((l) => (
                  <tr key={l.company} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-bold">{l.company}</td>
                    <td className="p-4 text-gold-payment font-bold">{l.tier}</td>
                    <td className="p-4 text-text-secondary">{l.seatsUsed} / {l.seatsAllocated} seats</td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setToast(`Allocated +5 seats to ${l.company}`);
                          setTimeout(() => setToast(null), 3000);
                        }}
                        className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                      >
                        + Grant 5 Seats
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
