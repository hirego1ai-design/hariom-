"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Platform" },
  { href: "/pricing", label: "Pricing" },
  { href: "/enterprise", label: "For employers" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image src="/marketing/hirego-logo.png" alt="HireGo AI" width={132} height={36} className="h-9 w-auto object-contain" priority />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-700 transition hover:text-blue-600">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5">Sign in</Link>
          <Link href="/register" className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">Sign up</Link>
        </div>

        <button
          type="button"
          className="rounded-lg border border-white/15 p-2 text-slate-200 md:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">{open ? "close" : "menu"}</span>
        </button>
      </div>

      {open && (
          <nav className="border-t border-slate-200 bg-white px-5 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-center text-sm font-bold text-white">Sign in</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="flex-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-center text-sm font-bold text-white">Sign up</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
