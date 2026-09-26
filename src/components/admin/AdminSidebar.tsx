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
  { id: "users", label: "Candidate Users", href: "/admin/users", icon: "group" },
  { id: "employers", label: "Employers & Companies", href: "/admin/employers", icon: "domain" },
  { id: "jobs", label: "Job Listings", href: "/admin/jobs", icon: "work" },
  { id: "skill-validation", label: "Universal Skill Validation", href: "/admin/assessment/skill-validation", icon: "fact_check" },
  { id: "signups", label: "New Signups", href: "/admin/signups", icon: "person_add" },
  { id: "document-verification", label: "KYC Document Review", href: "/admin/document-verification", icon: "verified_user" },
  { id: "revenue", label: "Revenue & Billing", href: "/admin/revenue", icon: "payments" },
  { id: "invoices", label: "Invoices", href: "/admin/invoices", icon: "receipt_long" },
  { id: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: "autorenew" },
  { id: "copilot-commerce", label: "Copilot Commerce", href: "/admin/copilot-commerce", icon: "smart_toy" },
  { id: "managed-requests", label: "Managed Hiring Requests", href: "/admin/managed-hiring/requests", icon: "assignment" },
  { id: "managed-pipeline", label: "Managed Hiring Pipeline", href: "/admin/managed-hiring/pipeline", icon: "account_tree" },
  { id: "managed-hiring", label: "Managed Hiring Operations", href: "/admin/managed-hiring/operations", icon: "business_center" },
  { id: "agreements", label: "Agreements & Templates", href: "/admin/agreements/templates", icon: "description" },
  { id: "referrals", label: "Referrals", href: "/admin/referrals", icon: "share" },
  { id: "pricing-engine", label: "Pricing Engine", href: "/admin/pricing-engine", icon: "sell" },
  { id: "payment-gateways", label: "Payment Gateways", href: "/admin/payment-gateways", icon: "account_balance" },
  { id: "communications", label: "Communications", href: "/admin/communications", icon: "forum" },
  { id: "settings", label: "Admin Settings Hub", href: "/admin/settings/hub", icon: "settings" },
  { id: "ai-command-centre", label: "AI Control Centre", href: "/admin/ai-command-centre-dashboard", icon: "neurology" },
  { id: "system-health", label: "System Health", href: "/admin/system-health", icon: "monitoring" },
];

const infrastructureItems: NavRailItem[] = [
  { id: "SI01", label: "System Gateway (SI01)", href: "/admin/system/infrastructure", icon: "router" },
  { id: "SI03", label: "Queue Broker Health (SI03)", href: "/admin/system/queue-broker", icon: "queue" },
  { id: "system-health", label: "System Health", href: "/admin/system-health", icon: "monitoring" },
];

const modelItems: NavRailItem[] = [
  { id: "model-registry", label: "AI Model Registry", href: "/admin/models/registry", icon: "model_training" },
  { id: "LM06", label: "LLM Usage Analytics (LM06)", href: "/admin/settings/llm-usage", icon: "analytics" },
  { id: "LM07", label: "Model & Platform Settings (LM07)", href: "/admin/settings/hub", icon: "tune" },
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
