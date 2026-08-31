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
  isAi?: boolean;
}

const mainNavItems: NavRailItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { id: "profile", label: "My Profile", href: "/profile", icon: "person" },
  { id: "readiness", label: "Job-Ready Assessment", href: "/assessment/readiness", icon: "verified" },
  { id: "jobs", label: "Browse Opportunities", href: "/jobs", icon: "work" },
  { id: "applications", label: "Applications", href: "/applications", icon: "description" },
  { id: "credits", label: "Career Credits", href: "/credits", icon: "account_balance_wallet" },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: "notifications" },
];

const aiCopilotNavItems: NavRailItem[] = [
  { id: "mcq", label: "Assigned Assessments", href: "/assessment/mcq", icon: "fact_check", isAi: true },
  { id: "typing", label: "Typing Practice", href: "/assessment/typing/active", icon: "keyboard", isAi: true },
];

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/onboarding/welcome",
  "/onboarding/role-select",
  "/employer/employer-sign-in",
  "/admin/login",
];

export default function CandidateSidebar() {
  const pathname = usePathname();

  // Hide sidebar rail on public / auth routes
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/employer") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Floating Vertical Navigation Rail */}
      <aside
        className="fixed top-4 left-4 h-[calc(100vh-32px)] w-[78px] z-50 flex flex-col items-center py-4 backdrop-blur-xl rounded-[26px] select-none transition-all duration-300"
        style={{
          backgroundColor: "var(--surface-container-low)",
          border: "1px solid var(--outline)",
          boxShadow: "var(--shadow-sidebar)",
        }}
      >
        {/* Top: Brand Capsule */}
        <div
          className="flex flex-col items-center gap-2 pb-2 w-full px-3"
          style={{ borderBottom: "1px solid var(--outline)" }}
        >
          <Link
            href="/dashboard"
            className="w-[48px] h-[48px] rounded-2xl bg-gradient-to-tr from-primary to-primary-dim flex items-center justify-center hover:scale-105 transition-transform duration-200"
            style={{ boxShadow: "var(--shadow-btn-red)" }}
          >
            <span className="material-symbols-outlined text-white text-[24px]">rocket_launch</span>
          </Link>
        </div>

        {/* Middle: Navigation Rail Icons */}
        <nav className="flex flex-col items-center gap-2 my-auto overflow-y-auto py-2 px-2 custom-scrollbar w-full">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                className="w-[48px] h-[48px] rounded-2xl flex items-center justify-center transition-all duration-200 relative group"
                style={{
                  color: isActive ? "#ffffff" : "var(--text-muted)",
                  backgroundColor: isActive ? "var(--primary)" : "transparent",
                  boxShadow: isActive ? "var(--shadow-btn-red)" : "none",
                }}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>

                {/* Notification Badge Dot */}
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}

                {/* Floating Tooltip */}
                <div
                  className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 flex items-center gap-2"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-500 font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* AI Divider Line */}
          <div
            className="w-8 h-[1px] my-2"
            style={{ backgroundColor: "var(--outline)" }}
          />

          {/* AI Copilot Subsections */}
          {aiCopilotNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className="w-[48px] h-[48px] rounded-2xl flex items-center justify-center transition-all duration-200 relative group"
                style={{
                  color: isActive ? "var(--color-yellow)" : "var(--text-muted)",
                  backgroundColor: isActive ? "rgba(234,179,8,0.15)" : "transparent",
                  border: isActive ? "1px solid var(--color-yellow)" : "none",
                }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ color: isActive ? "var(--color-yellow)" : "var(--text-muted)" }}>
                  {item.icon}
                </span>

                {/* Floating Tooltip */}
                <div
                  className="absolute left-[64px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 flex items-center gap-2"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Vertical Separation Line */}
      <div
        className="fixed top-0 left-[110px] w-[1px] h-screen pointer-events-none z-40 hidden md:block"
        style={{ backgroundColor: "var(--outline)" }}
      />
    </>
  );
}
