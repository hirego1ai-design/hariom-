"use client";
import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
export default function EmployerCandidateProfile() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1200px] w-full mx-auto">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">Candidate Profile</h1>
            <p className="text-text-muted text-sm">This screen is undergoing migration to use authoritative backend data.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-amber-400/20 max-w-2xl space-y-3">
            <div className="text-xs font-bold text-amber-300">UNAVAILABLE</div>
            <p className="text-sm text-text-muted">The previous mock candidate profile has been removed to comply with production truthfulness requirements. Authoritative backend integration is required before this view can be enabled.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
