import type { ReactNode } from "react";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { PUBLIC_BUSINESS_DETAILS } from "@/lib/publicBusinessDetails";

export type LegalNavItem = { href: string; label: string };

export function LegalSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-[28px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-7 text-slate-300 [&_a]:font-medium [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-white">
        {children}
      </div>
    </section>
  );
}

export function LegalHighlight({
  title,
  children,
  tone = "cyan",
}: {
  title: string;
  children: ReactNode;
  tone?: "cyan" | "violet" | "amber";
}) {
  const toneClass =
    tone === "violet"
      ? "border-violet-400/20 bg-violet-400/[0.08]"
      : tone === "amber"
        ? "border-amber-300/20 bg-amber-300/[0.08]"
        : "border-cyan-300/20 bg-cyan-300/[0.08]";

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${toneClass}`}>
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-2 text-sm leading-6 text-slate-300">{children}</div>
    </div>
  );
}

export default function LegalPageLayout({
  eyebrow,
  title,
  summary,
  updated,
  nav,
  badges,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  updated: string;
  nav: LegalNavItem[];
  badges: string[];
  children: ReactNode;
}) {
  return (
    <MarketingShell>
      <div className="relative isolate overflow-hidden bg-[#02060d] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:48px_48px]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-48 h-[30rem] w-[30rem] rounded-full bg-violet-500/10 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[42rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-blue-500/[0.08] blur-[130px]" />

        <div className="relative mx-auto max-w-[1280px] px-5 pb-24 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent p-6 shadow-[0_30px_120px_rgba(0,0,0,0.38)] sm:p-9 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.45fr_.75fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
                  {eyebrow}
                </div>
                <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">{summary}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-300">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last updated</p>
                  <p className="mt-2 text-lg font-semibold text-white">{updated}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Questions</p>
                  <a href={`mailto:${PUBLIC_BUSINESS_DETAILS.supportEmail}`} className="mt-2 inline-block text-sm font-semibold text-cyan-300 hover:underline">
                    {PUBLIC_BUSINESS_DETAILS.supportEmail}
                  </a>
                  <p className="mt-3 text-xs leading-5 text-slate-500">{PUBLIC_BUSINESS_DETAILS.postalAddress}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">On this page</p>
                <nav className="mt-4" aria-label="Legal page sections">
                  <ul className="space-y-1.5">
                    {nav.map((item, index) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                        >
                          <span className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-black/20 text-[10px] text-slate-500 transition group-hover:border-cyan-300/30 group-hover:text-cyan-300">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span>{item.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-5 border-t border-white/10 pt-5 text-sm leading-6 text-slate-400">
                  <p>Related policies</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link href="/legal" className="text-cyan-300 hover:underline">Legal & Trust Center</Link>
                    <Link href="/privacy" className="text-cyan-300 hover:underline">Privacy Policy</Link>
                    <Link href="/terms" className="text-cyan-300 hover:underline">Terms & Conditions</Link>
                    <Link href="/refund-cancellation" className="text-cyan-300 hover:underline">Refund & Cancellation</Link>
                    <Link href="/service-delivery" className="text-cyan-300 hover:underline">Service Delivery</Link>
                  </div>
                </div>
              </div>
            </aside>

            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
