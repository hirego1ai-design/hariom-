"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useEmployer } from "@/context/EmployerContext";
import { useTheme } from "@/context/ThemeContext";

interface EmployerHeaderProps {
  title?: string;
  subtitle?: string;
  actionText?: string;
  actionHref?: string;
}

export default function EmployerHeader({
  title = "Employer Dashboard",
  subtitle,
  actionText = "+ Post a Job",
  actionHref = "/employer/create-job-basic-info",
}: EmployerHeaderProps) {
  const { user } = useEmployer();
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const selectTheme = (mode: "light" | "dark" | "system") => {
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(systemTheme);
    } else {
      setTheme(mode);
    }
    setThemeOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-4 sm:px-6 py-4 min-h-20 shadow-md">
      <div className="flex flex-col min-w-0">
        <h1 className="font-display-md text-lg sm:text-headline-md text-white font-bold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-white/60 text-xs mt-1 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto max-w-full pb-1 sm:pb-0">

        <Link
          href={actionHref}
          className="px-4 sm:px-6 py-2.5 rounded-full bg-yellow text-bg-page hover:bg-yellow/90 font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,200,0,0.3)] transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{actionText}</span>
        </Link>

        <Link
          href="/notifications"
          className="relative cursor-pointer p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-text-muted hover:text-white"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </Link>

        {/* Theme Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setThemeOpen(!themeOpen);
              setProfileOpen(false);
            }}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary"
            title="Appearance"
          >
            <span className="material-symbols-outlined text-[20px] text-white">
              {theme === "dark" ? "dark_mode" : "light_mode"}
            </span>
          </button>
          {themeOpen && (
            <div className="absolute right-0 mt-3 w-40 bg-[#17171C] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => selectTheme("light")}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">light_mode</span>
                Light
              </button>
              <button
                onClick={() => selectTheme("dark")}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                Dark
              </button>
              <button
                onClick={() => selectTheme("system")}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
                System
              </button>
            </div>
          )}
        </div>

        {/* Settings Icon */}
        <Link
          href="/employer/employer-company-settings-hub"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary"
          title="Workspace Settings"
        >
          <span className="material-symbols-outlined text-[20px] text-white">settings</span>
        </Link>

        <div className="h-6 w-[1px] bg-white/10 mx-1" />

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setThemeOpen(false);
            }}
            className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-all focus:outline-none"
          >
            <img
              className="w-7 h-7 rounded-full border border-white/20 object-cover"
              alt={user.name}
              src={user.avatar}
            />
            <span className="hidden lg:inline font-bold text-xs text-white whitespace-nowrap">{user.name}</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#17171C] border border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-2.5 py-2">
                <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-text-muted mt-1">Employer Workspace</p>
              </div>
              <div className="h-[1px] bg-white/5 my-2" />
              
              <Link
                href="/employer/dashboard"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                Hiring Workspace
              </Link>
              
              <Link
                href="/employer/employer-company-settings-hub"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Workspace Settings
              </Link>
              
              <button
                onClick={() => {
                  setProfileOpen(false);
                  setThemeOpen(true);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">palette</span>
                Appearance
              </button>
              
              <button
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">notifications</span>
                Notifications
              </button>

              <button
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">help</span>
                Help & Support
              </button>
              
              <div className="h-[1px] bg-white/5 my-2" />
              
              <Link
                href="/employer/employer-sign-in"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-red-500/10 text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
