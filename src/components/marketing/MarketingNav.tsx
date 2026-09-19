"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/features", label: "Features" },
  { href: "/enterprise", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Resources" },
  { href: "/about", label: "About" },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-40 bg-[#01050b] text-white">
      <div className="mx-auto flex h-24 max-w-[1450px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="HireGo AI home" className="flex shrink-0 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300" onClick={() => setOpen(false)}>
          <Image src="/marketing/hirego-logo-hd.png" alt="HireGo AI" width={660} height={220} className="h-auto w-[180px] object-contain sm:w-[205px]" unoptimized preload />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded text-sm font-medium text-white transition hover:text-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="px-4 py-2 text-sm text-white hover:text-blue-300">Sign in</Link>
          <Link href="/register" className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#0c2551] shadow-lg shadow-blue-500/20 hover:bg-blue-50">Get Started <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>

        <button type="button" className="rounded-lg border border-white/20 p-2 text-white lg:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="marketing-mobile-navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav id="marketing-mobile-navigation" className="border-t border-white/10 bg-[#01050b] px-5 py-4 shadow-xl lg:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-white hover:bg-white/10">{link.label}</Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-full border border-white/25 px-4 py-3 text-center text-sm font-bold text-white">Sign in</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="flex-1 rounded-full bg-white px-4 py-3 text-center text-sm font-bold text-[#0c2551]">Get Started</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

