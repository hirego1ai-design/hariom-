"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PlatformSettingsHubPage() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const prefix = isAdmin ? "/admin/settings" : "/settings";

  const [siteName, setSiteName] = useState("HireGo AI");
  const [supportEmail, setSupportEmail] = useState("support@hirego.ai");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast("Platform settings saved successfully!");
    setTimeout(() => setToast(null), 3000);
  };

  const quickJumpItems = [
    { label: "HireGo Managed Hiring™ Commercial Rules (G14)", slug: "managed-hiring" },
    { label: "Security & Compliance (G02)", slug: "security" },
    { label: "Domain & SSL Settings (G03)", slug: "domain" },
    { label: "SMTP Email Setup (G04)", slug: "smtp" },
    { label: "WhatsApp Gateway (G05)", slug: "whatsapp" },
    { label: "Payment Config (G06)", slug: "payment-gateway" },
    { label: "API Integrations (G07)", slug: "integrations" },
    { label: "LLM Usage Monitor (G08)", slug: "llm-usage" },
    { label: "System Audit Log (G09)", slug: "audit-log" },
    { label: "AI Agent Manager (G10)", slug: "ai-agents" },
    { label: "Plan Tier Config (G11)", slug: "plan-management" },
    { label: "Platform Analytics (G12)", slug: "analytics" },
    { label: "Terms & Privacy (G13)", slug: "terms-privacy" },
  ];

  return (
    <div className="min-h-screen bg-[#090A0F] text-white selection:bg-yellow-500/30 flex">
      {/* Admin Sidebar Rail */}
      {!isAdmin && <AdminSidebar />}

      {/* Main Content Area */}
      <div className="ml-[116px] w-full min-h-screen p-8 space-y-8 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black font-extrabold px-5 py-3 rounded-2xl shadow-2xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {toast}
          </div>
        )}

        {/* Top Header & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                G01 Module
              </span>
              <span className="text-xs text-gray-400">Global Administration</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Platform Settings Hub</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Configure global application defaults, branding, and system-wide governance parameters.
            </p>
          </div>

          <Link
            href={isAdmin ? "/admin/dashboard" : "/dashboard"}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 self-start sm:self-center shadow-md border border-white/10"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Dashboard
          </Link>
        </div>

        {/* Grid Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Form */}
          <form
            onSubmit={handleSave}
            className="lg:col-span-2 bg-[#12131A] p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl"
          >
            <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-400 text-xl">tune</span>
              General System Parameters
            </h3>

            <div>
              <label className="text-xs text-gray-300 font-bold block mb-2">
                Platform Brand Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full h-12 rounded-2xl bg-[#181924] border border-white/10 px-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-400/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 font-bold block mb-2">
                System Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full h-12 rounded-2xl bg-[#181924] border border-white/10 px-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-400/50 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-400 text-lg">warning</span>
                  System Maintenance Mode
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Pause public candidate registrations and enforce maintenance banner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                  maintenanceMode
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "bg-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {maintenanceMode ? "ACTIVE (Maintenance)" : "OFF (Live)"}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold text-xs transition-all shadow-[0_0_20px_rgba(234,179,8,0.35)] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                Save Configuration
              </button>
            </div>
          </form>

          {/* Quick Settings Jump Panel */}
          <div className="bg-[#12131A] p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
            <div className="border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-400 text-xl">bolt</span>
                Quick Settings Jump
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Direct shortcuts to Governance modules (G02–G13)
              </p>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {quickJumpItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`${prefix}/${item.slug}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-yellow-500/10 hover:border-yellow-500/30 border border-white/5 text-xs text-gray-300 hover:text-yellow-400 transition-all group"
                >
                  <span className="font-semibold truncate">{item.label}</span>
                  <span className="material-symbols-outlined text-base text-gray-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}