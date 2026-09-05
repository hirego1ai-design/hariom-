"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
}

export default function AdminHeader({ title, subtitle, onSearch }: AdminHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [themeOpen, setThemeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [admin, setAdmin] = useState({ name: "Administrator", email: "" });

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => {
        if (active && result.user?.role === "ADMIN") {
          setAdmin({ name: result.user.name || "Administrator", email: result.user.email || "" });
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  };

  const notifications = [
    { id: 1, title: "Risk Flag Detected", text: "Candidate 'Rahul S.' triggered plagiarism alert in Coding Test.", time: "5m ago", type: "error" },
    { id: 2, title: "New Enterprise Employer", text: "TechCorp Global upgraded to Enterprise tier (₹12L/yr).", time: "1h ago", type: "success" },
    { id: 3, title: "System Maintenance", text: "Database backup scheduled for 02:00 UTC tonight.", time: "3h ago", type: "info" },
  ];

  const selectTheme = (mode: "light" | "dark" | "system") => {
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(systemTheme);
    } else {
      setTheme(mode);
    }
    setThemeOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
      <div className="flex items-center gap-6">
        {title ? (
          <div>
            <h1 className="font-headline-md text-headline-md text-white font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-white/60 text-xs mt-1 font-medium">{subtitle}</p>}
          </div>
        ) : (
          <div className="relative w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-10 rounded-full bg-[#1E1E1E] border border-white/10 pl-11 pr-4 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Global search across candidates, employers, logs..."
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary relative"
            title="System Alerts"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-[#17171C] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">notifications_active</span>
                  System Alerts
                </h4>
                <button
                  onClick={() => setUnreadCount(0)}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Mark all read
                </button>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${n.type === "error" ? "text-red-400" : n.type === "success" ? "text-green" : "text-blue-400"}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-text-muted">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">{n.text}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/settings/audit-log"
                className="block text-center mt-3 pt-2 border-t border-white/5 text-xs text-primary font-bold hover:underline"
              >
                View Full Audit Logs →
              </Link>
            </div>
          )}
        </div>

        {/* Support Quick Link */}
        <Link
          href="/admin/system-health"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary"
          title="System Health"
        >
          <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
        </Link>

        {/* Theme Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setThemeOpen(!themeOpen);
              setProfileOpen(false);
              setNotificationsOpen(false);
            }}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary"
            title="Appearance"
          >
            <span className="material-symbols-outlined text-[20px]">
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

        {/* Settings */}
        <Link
          href="/admin/settings/hub"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary"
          title="Platform Settings"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </Link>

        <div className="h-6 w-[1px] bg-white/10 mx-1" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setThemeOpen(false);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-3 pl-1 cursor-pointer select-none focus:outline-none"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-none">{admin.name}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
              <div className="w-full h-full rounded-full bg-[#141418] flex items-center justify-center font-bold text-primary text-sm">
                {admin.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "A"}
              </div>
            </div>
          </button>
          
          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#17171C] border border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-2.5 py-2">
                <p className="text-xs font-bold text-white leading-none">{admin.name}</p>
                <p className="text-[10px] text-text-muted mt-1">{admin.email}</p>
              </div>
              <div className="h-[1px] bg-white/5 my-2" />
              
              <Link
                href="/admin/dashboard"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                My Profile
              </Link>
              
              <Link
                href="/admin/settings/hub"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Account Settings
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
                <span className="material-symbols-outlined text-[16px]">keyboard</span>
                Keyboard Shortcuts
              </button>

              <button
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-text-secondary hover:text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">help</span>
                Help & Support
              </button>
              
              <div className="h-[1px] bg-white/5 my-2" />
              
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-red-500/10 text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
