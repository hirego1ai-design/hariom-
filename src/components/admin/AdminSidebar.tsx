"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavRailItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

const mainNavItems: NavRailItem[] = [
  { id: "dashboard", label: "System Overview", href: "/admin/dashboard", icon: "dashboard" },
  { id: "users", label: "Candidate Users", href: "/admin/users", icon: "group", badge: "12.4k" },
  { id: "employers", label: "Employers & Companies", href: "/admin/employers", icon: "domain", badge: "2.4k" },
  { id: "revenue", label: "Revenue & Billing", href: "/admin/revenue", icon: "payments" },
  { id: "roles", label: "Roles & Permissions", href: "/admin/roles", icon: "admin_panel_settings" },
  { id: "system-health", label: "System Health", href: "/admin/system-health", icon: "monitoring", badge: "Live", badgeColor: "bg-green text-black" },
];

const infrastructureItems: NavRailItem[] = [
  { id: "SI01", label: "System Gateway (SI01)", href: "/admin/system/infrastructure", icon: "router" },
  { id: "SI02", label: "DB Connection Pool (SI02)", href: "/admin/system/db-pool", icon: "database" },
  { id: "SI03", label: "Queue Broker Health (SI03)", href: "/admin/system/queue-broker", icon: "queue" },
];

const modelItems: NavRailItem[] = [
  { id: "LM01", label: "LLM Model Registry (LM01)", href: "/admin/models/registry", icon: "model_training" },
  { id: "LM02", label: "Prompt Playground (LM02)", href: "/admin/models/playground", icon: "terminal" },
  { id: "LM03", label: "License Allocator (LM03)", href: "/admin/licenses/allocator", icon: "badge" },
  { id: "LM04", label: "Real-Time Log Stream (LM04)", href: "/admin/logs/stream", icon: "wysiwyg" },
  { id: "LM05", label: "Security Inspector (LM05)", href: "/admin/security/vulnerability-inspector", icon: "bug_report" },
  { id: "LM06", label: "SLA Uptime Monitor (LM06)", href: "/admin/sla/monitor", icon: "speed" },
  { id: "LM07", label: "Backup & PITR (LM07)", href: "/admin/system/backup-recovery", icon: "cloud_download" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [activeTabGroup, setActiveTabGroup] = useState<"main" | "si" | "lm">("main");

  const currentNavItems =
    activeTabGroup === "main" ? mainNavItems : activeTabGroup === "si" ? infrastructureItems : modelItems;

  return (
    <>
      {/* Floating Vertical Navigation Rail */}
      <aside className="fixed top-4 left-4 h-[calc(100vh-32px)] w-[78px] z-50 flex flex-col items-center justify-between py-5 bg-[#141418]/90 backdrop-blur-xl border border-white/10 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] select-none transition-all duration-300">
        
        {/* Top: Brand Capsule */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="w-[48px] h-[48px] rounded-2xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center shadow-[0_0_20px_rgba(255,180,170,0.35)] hover:scale-105 transition-transform duration-200 relative group"
            title="HireGo Platform Control Center"
          >
            <span className="material-symbols-outlined text-white text-[24px]">shield_person</span>

            {/* Hover Tooltip */}
            <div className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/10 text-white text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
              HireGo AI Admin
            </div>
          </Link>

          {/* Group Switcher Pills */}
          <div className="flex flex-col items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTabGroup("main")}
              className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-200 relative group ${
                activeTabGroup === "main"
                  ? "bg-primary text-white shadow-md"
                  : "text-text-muted hover:text-white hover:bg-white/10"
              }`}
              title="Main Console"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <div className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/10 text-white text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
                Main Console
              </div>
            </button>

            <button
              onClick={() => setActiveTabGroup("si")}
              className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-200 relative group ${
                activeTabGroup === "si"
                  ? "bg-primary text-white shadow-md"
                  : "text-text-muted hover:text-white hover:bg-white/10"
              }`}
              title="Infrastructure (SI1-SI3)"
            >
              <span className="material-symbols-outlined text-[16px]">router</span>
              <div className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/10 text-white text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
                Infrastructure (SI1–SI3)
              </div>
            </button>

            <button
              onClick={() => setActiveTabGroup("lm")}
              className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-200 relative group ${
                activeTabGroup === "lm"
                  ? "bg-primary text-white shadow-md"
                  : "text-text-muted hover:text-white hover:bg-white/10"
              }`}
              title="Models & Licenses (LM1-LM7)"
            >
              <span className="material-symbols-outlined text-[16px]">model_training</span>
              <div className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/10 text-white text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
                Models & Ops (LM1–LM7)
              </div>
            </button>
          </div>
        </div>

        {/* Middle: Centered Navigation Rail Icons */}
        <nav className="flex flex-col items-center gap-2.5 my-auto overflow-y-auto py-2 px-2 custom-scrollbar">
          {currentNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith("/admin/") && pathname.includes(item.id));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center transition-all duration-200 relative group ${
                  isActive
                    ? "bg-gradient-to-tr from-primary to-primary-light text-white shadow-[0_0_20px_rgba(255,180,170,0.4)] scale-105"
                    : "text-text-muted hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>

                {/* Badge Indicator Dot */}
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green animate-pulse" />
                )}

                {/* Floating Tooltip */}
                <div className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/10 text-white text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/20 text-primary font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Vertical Separation Line */}
      <div className="fixed top-0 left-[110px] w-[1px] h-screen bg-white/5 pointer-events-none z-40 hidden md:block" />
    </>
  );
}
