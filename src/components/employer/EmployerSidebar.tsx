"use client";

import React from "react";
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
  { id: "settings", label: "Company Settings", href: "/employer/employer-company-settings-hub", icon: "settings" },
];

export default function EmployerSidebar() {
  const pathname = usePathname() || "";
  const [mobileMoreOpen, setMobileMoreOpen] = React.useState(false);
  const mobilePrimaryItems = employerNavItems.slice(0, 4);
  const mobileMoreItems = employerNavItems.slice(4);
  const mobileMoreActive = mobileMoreItems.some(
    (item) => pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/employer"),
  );

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

      {mobileMoreOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            aria-label="Close employer navigation"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMoreOpen(false)}
          />
          <aside
            aria-label="More employer tools"
            className="absolute bottom-20 left-3 right-3 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#141418] p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between px-2 py-1">
              <div>
                <p className="text-sm font-bold text-white">More employer tools</p>
                <p className="mt-0.5 text-[10px] text-text-muted">Interviews, managed hiring, billing, analytics and settings.</p>
              </div>
              <button
                type="button"
                aria-label="Close more employer tools"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white"
                onClick={() => setMobileMoreOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <nav className="grid gap-1" aria-label="Employer mobile secondary navigation">
              {mobileMoreItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/employer");
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMoreOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                      isActive ? "bg-secondary text-white" : "text-text-secondary hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <nav className="md:hidden fixed left-3 right-3 bottom-3 z-50 rounded-2xl border border-white/10 bg-[#141418]/95 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.55)] px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          {mobilePrimaryItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/employer");
            return (
              <Link
                key={item.id}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
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
            onClick={() => setMobileMoreOpen((open) => !open)}
            aria-label="More employer tools"
            aria-expanded={mobileMoreOpen}
            className={`h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
              mobileMoreActive || mobileMoreOpen ? "bg-secondary text-white" : "text-text-muted hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="material-symbols-outlined text-[21px]">more_horiz</span>
            <span className="text-[9px] font-bold leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
