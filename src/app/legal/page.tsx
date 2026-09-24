import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/legal",
  title: "Legal & Trust Center | HireGo AI",
  description: "HireGo AI legal, privacy, refund, service delivery and trust information for candidates, employers and payment-provider reviews.",
});

const policies = [
  {
    href: "/terms",
    number: "01",
    title: "Terms & Conditions",
    copy: "Platform rules for candidates and employers, AI-assisted workflows, managed hiring, subscriptions, payments and acceptable use.",
    tag: "Platform",
  },
  {
    href: "/privacy",
    number: "02",
    title: "Privacy Policy",
    copy: "How candidate, employer, assessment, video, payment, communications and technical data are handled.",
    tag: "Data",
  },
  {
    href: "/refund-cancellation",
    number: "03",
    title: "Refund & Cancellation",
    copy: "Clear rules for subscriptions, credits, failed payments, duplicate charges, managed services and refund timelines.",
    tag: "Payments",
  },
  {
    href: "/service-delivery",
    number: "04",
    title: "Service Delivery",
    copy: "When digital access, credits, assessments, interviews and managed hiring services are delivered after payment.",
    tag: "Fulfilment",
  },
];

export default function LegalCenterPage() {
  return (
    <MarketingShell>
      <div className="relative isolate overflow-hidden bg-[#02060d] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-64 h-[30rem] w-[30rem] rounded-full bg-violet-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-[1280px] px-5 pb-24 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
          <section className="overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-white/[0.09] via-white/[0.045] to-transparent p-7 shadow-[0_30px_120px_rgba(0,0,0,0.38)] sm:p-10 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-[1.35fr_.75fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
                  Legal & Trust Center
                </div>
                <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-7xl">
                  Clear rules. Safer hiring. Better trust.
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                  A single place for HireGo AI’s platform terms, privacy commitments, payment protections and digital service fulfilment rules.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {["Candidates", "Employers", "AI transparency", "Payment readiness", "Data protection"].map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Trust principle</p>
                <p className="mt-3 text-xl font-semibold leading-8">Automation supports the workflow. People remain responsible for consequential hiring decisions.</p>
                <div className="mt-5 h-px bg-white/10" />
                <a href="mailto:support@hiregoai.com" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:underline">
                  support@hiregoai.com <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-5 md:grid-cols-2">
            {policies.map((policy) => (
              <Link
                key={policy.href}
                href={policy.href}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.065] sm:p-8"
              >
                <div aria-hidden="true" className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-300/[0.06] blur-3xl transition group-hover:bg-cyan-300/[0.12]" />
                <div className="relative flex items-start justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-xs text-cyan-300">{policy.number}</span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{policy.tag}</span>
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{policy.title}</h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400 sm:text-[15px]">{policy.copy}</p>
                  </div>
                  <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition group-hover:border-cyan-300/30 group-hover:text-cyan-300">↗</span>
                </div>
              </Link>
            ))}
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-cyan-300/[0.08] to-transparent p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Payments</p>
              <h2 className="mt-3 text-xl font-semibold">Gateway-review ready structure</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Public terms, privacy, refund/cancellation and service-delivery pages are separated so payment providers can review each policy directly.
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-violet-400/[0.08] to-transparent p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Communications</p>
              <h2 className="mt-3 text-xl font-semibold">Transactional by design</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Account verification, security, interviews, assessments and workflow notices are treated as transactional communications rather than unsolicited bulk marketing.
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-amber-300/[0.08] to-transparent p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Identity</p>
              <h2 className="mt-3 text-xl font-semibold">Verified facts only</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Legal entity name, tax details, postal address and support phone should be published only after they are confirmed and should match KYC, checkout and invoice records.
              </p>
            </div>
          </section>

          <section className="mt-10 rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-9">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Need help?</p>
                <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Questions about a policy, payment or account?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                  Contact HireGo AI support and include the relevant account or order reference. Never send passwords, OTPs, CVV values or full card numbers by email.
                </p>
              </div>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/15">
                Contact HireGo AI
              </Link>
            </div>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}
