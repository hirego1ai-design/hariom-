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
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [admin, setAdmin] = useState({ name: "Administrator", email: "" });
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load administrator session.");
        return response.json();
      })
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    onSearch?.(event.target.value);
  };

  return (
    <header className="fixed left-[116px] right-0 top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#0E0E0E]/90 px-6 shadow-md backdrop-blur-xl">
      <div className="min-w-0">
        {title ? (
          <>
            <h1 className="truncate text-lg font-bold text-white">{title}</h1>
            {subtitle && <p className="mt-1 truncate text-xs text-white/60">{subtitle}</p>}
          </>
        ) : (
          <div className="relative w-[min(24rem,45vw)]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-white/40">search</span>
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-10 w-full rounded-full border border-white/10 bg-[#1E1E1E] pl-11 pr-4 text-xs text-white outline-none placeholder:text-white/40 focus:border-primary/50"
              placeholder="Search this admin view…"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/admin/settings/audit-log" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-secondary hover:bg-white/10" title="Audit logs">
          <span className="material-symbols-outlined text-[20px]">fact_check</span>
        </Link>
        <Link href="/admin/system-health" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-secondary hover:bg-white/10" title="System health">
          <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
        </Link>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-secondary hover:bg-white/10"
          title="Toggle appearance"
        >
          <span className="material-symbols-outlined text-[20px]">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
        </button>
        <Link href="/admin/settings/hub" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-secondary hover:bg-white/10" title="Platform settings">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </Link>

        <div className="mx-1 h-6 w-px bg-white/10" />

        <div className="relative">
          <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-white/5">
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold text-white">{admin.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">Administrator</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {admin.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "A"}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-[#17171C] p-3 shadow-2xl">
              <p className="px-2 text-xs font-bold text-white">{admin.name}</p>
              <p className="px-2 pt-1 text-[10px] text-text-muted">{admin.email || "Authenticated administrator"}</p>
              <div className="my-3 h-px bg-white/5" />
              <Link href="/admin/settings/hub" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-text-secondary hover:bg-white/5 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">settings</span>Settings
              </Link>
              <button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10">
                <span className="material-symbols-outlined text-[16px]">logout</span>Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
