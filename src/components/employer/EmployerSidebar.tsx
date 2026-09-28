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

const employerNavItems: NavRailItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/employer/dashboard", icon: "dashboard" },
  { id: "jobs", label: "Job Listings", href: "/employer/job-listings-management", icon: "work" },
  { id: "copilot", label: "HireGo Copilot", href: "/employer/ai-hiring-copilot-hub", icon: "smart_toy" },
  { id: "pipeline", label: "Hiring Pipeline", href: "/employer/hiring-pipeline", icon: "view_kanban" },
  { id: "candidate-search", label: "Candidate Search", href: "/employer/proactive-candidate-search", icon: "person_search" },
  { id: "interviews", label: "Live Interviews", href: "/employer/upcoming-interviews-list", icon: "video_call" },
  { id: "managed-hiring", label: "Managed Hiring Tracker", href: "/employer/managed-hiring/candidate-tracking", icon: "track_changes" },
  { id: "analytics", label: "Analytics", href: "/employer/employer-analytics-dashboard", icon: "analytics" },
  { id: "billing", label: "Revenue & Billing", href: "/employer/revenue-and-billing-management", icon: "receipt_long" },
  { id: "subscriptions", label: "Subscriptions & Credits", href: "/employer/subscriptions", icon: "credit_score" },
  { id: "settings", label: "Company Settings", href: "/employer/company-profile-editor", icon: "settings" },
];

export default function EmployerSidebar() {
  const pathname = usePathname() || "";
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  if (
    !pathname.startsWith("/employer") ||
    pathname === "/employer/employer-sign-in" ||
    pathname.includes("employer-registration") ||
    pathname.includes("employer-onboarding") ||
    pathname.includes("forgot-password")
  ) {
    return null;
  }

  return (
    <>
      <aside className="hidden md:flex fixed top-4 left-4 h-[calc(100vh-32px)] w-[78px] z-50 flex-col items-center justify-between py-4 bg-[#141418]/95 backdrop-blur-xl border border-white/10 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] select-none transition-all duration-300">
        <div className="flex flex-col items-center gap-2 pb-2 border-b border-white/10 w-full px-3">
          <Link
            href="/employer/dashboard"
            className="w-[48px] h-[48px] rounded-2xl bg-gradient-to-tr from-secondary to-[#4A90E2] flex items-center justify-center shadow-[0_0_20px_rgba(66,133,244,0.35)] hover:scale-105 transition-transform duration-200 relative group"
            title="HireGo Hiring Workspace"
          >
            <span className="material-symbols-outlined text-white font-bold text-[24px]">corporate_fare</span>
            <div className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/10 text-white text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
              HireGo Employer Workspace
            </div>
          </Link>
        </div>

        <nav className="flex flex-col items-center gap-2.5 my-auto overflow-y-auto py-2 px-2 custom-scrollbar w-full">
          {employerNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/employer");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center transition-all duration-200 relative group flex-shrink-0 ${
                  isActive
                    ? "bg-gradient-to-tr from-secondary to-[#4A90E2] text-white shadow-[0_0_20px_rgba(66,133,244,0.4)] scale-105"
                    : "text-text-muted hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>

                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                )}

                <div className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1C1C22] border border-white/10 text-white text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-500/20 text-yellow-400 font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="fixed top-0 left-[110px] w-[1px] h-screen bg-white/5 pointer-events-none z-40 hidden md:block" />

      <nav className="md:hidden fixed left-3 right-3 bottom-3 z-50 rounded-2xl border border-white/10 bg-[#141418]/95 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.55)] px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          {employerNavItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/employer");
            return (
              <Link
                key={item.id}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                onClick={() => setMobileMoreOpen(false)}
                className={`h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? "bg-secondary text-white" : "text-text-muted hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
                <span className="text-[9px] font-bold leading-none truncate max-w-full px-1">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            type="button"
            aria-expanded={mobileMoreOpen}
            aria-controls="employer-mobile-more"
            onClick={() => setMobileMoreOpen((open) => !open)}
            className={`h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
              mobileMoreOpen ? "bg-secondary text-white" : "text-text-muted hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="material-symbols-outlined text-[21px]">more_horiz</span>
            <span className="text-[9px] font-bold leading-none">More</span>
          </button>
        </div>
      </nav>

      {mobileMoreOpen && (
        <div
          id="employer-mobile-more"
          className="md:hidden fixed inset-0 z-[49] bg-black/60 backdrop-blur-sm px-3 pb-20 pt-20"
          role="dialog"
          aria-modal="true"
          aria-label="More employer navigation"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="absolute left-3 right-3 bottom-[84px] max-h-[65vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#141418] p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2 py-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">More</span>
              <button
                type="button"
                aria-label="Close more navigation"
                onClick={() => setMobileMoreOpen(false)}
                className="h-9 w-9 rounded-xl text-text-muted hover:bg-white/10 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {employerNavItems.slice(4).map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMoreOpen(false)}
                    className={`min-h-16 rounded-2xl border px-3 py-3 flex items-center gap-3 ${
                      isActive
                        ? "border-secondary/50 bg-secondary/15 text-white"
                        : "border-white/10 bg-white/[0.03] text-text-secondary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
                    <span className="text-xs font-bold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
