"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Sparkles, Briefcase, Clock, Users, ArrowRight, Zap, Award, CheckCircle2 } from "lucide-react";

type PricingTab = "subscriptions" | "managed";

const DEFAULT_PLANS = [
  {
    id: "plan-bootstrapped",
    name: "Free Trial",
    description: "Experience HireGo with three job posts.",
    price: 0,
    currency: "INR",
    jobPostsQuota: 3,
    jobValidityDays: 7,
    marketingBenefits: [
      "3 job posts (7-day validity)",
      "AI JD generation & matching score",
      "Applicant dashboard & assessment suite",
      "Virtual interview & proctoring report",
    ],
    firstTimeOnly: true,
    copilotIncluded: false,
    copilotJobLimit: 0,
    isFeatured: false,
    badgeText: "First-time users",
    displayOrder: 10,
  },
  {
    id: "plan-hypergrowth",
    name: "Hire One",
    description: "Package for one immediate hiring requirement.",
    price: 299,
    currency: "INR",
    jobPostsQuota: 1,
    jobValidityDays: 7,
    marketingBenefits: [
      "1 job post (7-day validity)",
      "AI matching & candidate scoring",
      "Role assessments & interview suite",
      "Proctoring integrity evidence report",
    ],
    firstTimeOnly: false,
    copilotIncluded: false,
    copilotJobLimit: 0,
    isFeatured: false,
    badgeText: "Quick hire",
    displayOrder: 20,
  },
  {
    id: "plan-enterprise",
    name: "Hiring Desk",
    description: "Volume hiring for expanding engineering teams.",
    price: 1999,
    currency: "INR",
    jobPostsQuota: 10,
    jobValidityDays: 30,
    marketingBenefits: [
      "10 job posts (30-day validity)",
      "Automated sourcing & pre-screening",
      "Coding sandbox & MCQ evaluations",
      "Calendar coordination & team dashboard",
    ],
    firstTimeOnly: false,
    copilotIncluded: false,
    copilotJobLimit: 0,
    isFeatured: true,
    badgeText: "Most Popular",
    displayOrder: 30,
  },
];

const DEFAULT_COPILOT = {
  enabled: true,
  title: "Add HireGo AI Co-Pilot",
  badgeText: "AI Automation Add-On",
  description: "Execute sourcing, video pre-screening, and calendar dispatch autonomously.",
  addonPrice: 4999,
  currency: "INR",
  billingUnit: "per active role / mo",
  benefits: [
    "Autonomous candidate discovery across tech pools",
    "Automated video resume pre-screening & analysis",
    "Anti-cheat proctored coding assessments",
    "Zero-clash multi-calendar interview orchestration",
  ],
};

export default function EmployerPricingPreview({ defaultTab = "managed", hideTabs = false }: { defaultTab?: PricingTab; hideTabs?: boolean } = {}) {
  const [tab, setTab] = useState<PricingTab>(defaultTab);
  const [data, setData] = useState<any>({ plans: DEFAULT_PLANS, copilotConfig: DEFAULT_COPILOT });

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("subscriptions")) {
      setTab("subscriptions");
    }

    fetch("/api/public/employer-pricing", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (response.ok && body.success && body.plans && body.plans.length > 0) {
          setData(body);
        }
      })
      .catch(() => {
        // Fallback already pre-set to DEFAULT_PLANS
      });
  }, []);

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      {/* ─── Compact 3D Glowing Tab Switcher ─── */}
      {!hideTabs && (
        <div className="flex flex-col items-center justify-center">
        <div className="inline-flex rounded-xl border border-white/15 bg-gradient-to-b from-[#0c182e] to-[#060c18] p-1 shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setTab("managed")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
              tab === "managed"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-[1.01]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} />
            <span>HireGo Managed Hiring</span>
            <span className="rounded-full bg-amber-400/25 px-1.5 py-0.5 text-[9px] text-amber-200 font-extrabold uppercase">
              100% Pay on Joining
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("subscriptions")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
              tab === "subscriptions"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-[1.01]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Briefcase size={14} />
            <span>Self-Serve Subscriptions</span>
          </button>
        </div>
      </div>
      )}

      {/* ─── TAB 1: HIREGO MANAGED HIRING (DEFAULT / PRIMARY) ─── */}
      {tab === "managed" && (
        <div className="space-y-5">
          {/* Compact Top Ribbon Banner */}
          <div className="rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/30 px-4 py-2.5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Award size={15} className="text-amber-400 shrink-0" />
              <span>100% Outcome-Based Recruitment · Pay Strictly When Candidate Joins</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-400" />
                45–90 Days Warranty
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-cyan-400" />
                Shortlists in Minutes
              </span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">Invoice Day 25 · Net 30 Terms (Delay Modifies Terms)</span>
            </div>
          </div>

          {/* 4 Compact Managed Hiring Cards (Fits in Viewport without Scrolling) */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Standard Managed Hire */}
            <div className="google-card-wrapper transition-all duration-200 hover:scale-[1.01]">
              <div className="google-card-inner flex flex-col justify-between p-4.5 rounded-2xl bg-slate-950/90 border border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-slate-300 border border-white/10">
                      Starter / Growth
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">₹0 Upfront</span>
                  </div>

                  <h4 className="text-base font-black text-white">Standard Managed Hire</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    Sales, operations, and general roles.
                  </p>

                  {/* Pricing Block */}
                  <div className="my-2.5 py-2 border-y border-white/10 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black text-amber-400">8.33%</span>
                      <span className="text-[10px] font-bold text-slate-300 ml-1">of Annual CTC</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">(1 mo. gross)</span>
                  </div>

                  {/* Warranty & SLA */}
                  <div className="space-y-1 text-[10px] mb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                      <span>45-Day Free Replacement Warranty</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock size={12} className="text-cyan-400 shrink-0" />
                      <span>Invoice Day 25 · Due in 30 Days</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-1 text-[10px] text-slate-300 border-t border-slate-800/80 pt-2">
                    {[
                      "Pre-screened talent discovery in minutes",
                      "Video resume & communication review",
                      "Company HR coordinates & takes interviews",
                      "Strict Net-30 payment schedule",
                      "45-day full replacement guarantee",
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-amber-400" />
                        <span className="leading-snug text-slate-200">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Action */}
                <div className="mt-3.5 pt-2.5 border-t border-white/10 space-y-1 text-center">
                  <Link
                    href="/contact?topic=managed-hiring"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-950 transition hover:bg-slate-100 shadow-md"
                  >
                    <span>Submit Role</span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link href="/pay-per-hire" className="block text-[9px] text-slate-400 hover:text-white">
                    Read terms →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Tech & Specialist Hire (Featured / Most Popular) */}
            <div className="google-card-wrapper google-active transition-all duration-200 hover:scale-[1.01]">
              <div className="google-card-inner flex flex-col justify-between p-4.5 rounded-2xl bg-gradient-to-b from-[#161208] via-slate-950 to-slate-950 border border-amber-500/40 shadow-xl shadow-amber-500/10">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black text-slate-950 shadow-sm">
                      MOST POPULAR
                    </span>
                    <span className="text-[9px] font-mono text-amber-300 font-bold">Tech Roles</span>
                  </div>

                  <h4 className="text-base font-black text-white">Tech & Specialist Hire</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    Engineers, PMs, Data & Tech Leads.
                  </p>

                  {/* Pricing Block */}
                  <div className="my-2.5 py-2 border-y border-amber-500/20 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black text-amber-300">10%</span>
                      <span className="text-[10px] font-bold text-slate-200 ml-1">of Annual CTC</span>
                    </div>
                    <span className="text-[9px] text-amber-400/90 font-mono font-semibold">Pay on Joining</span>
                  </div>

                  {/* Warranty & SLA */}
                  <div className="space-y-1 text-[10px] mb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-200">
                      <ShieldCheck size={12} className="text-amber-400 shrink-0" />
                      <span>60-Day Free Replacement Warranty</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock size={12} className="text-cyan-400 shrink-0" />
                      <span>Invoice Day 25 · Due in 30 Days</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-1 text-[10px] text-slate-300 border-t border-amber-500/20 pt-2">
                    {[
                      "Everything in Standard Managed Hire",
                      "Specialized tech recruiter & code sandbox",
                      "Video proctoring & integrity evidence report",
                      "Strict 30-day payment term policy",
                      "Notice period buyout & offer follow-up",
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-amber-300" />
                        <span className="leading-snug text-slate-100">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Action */}
                <div className="mt-3.5 pt-2.5 border-t border-amber-500/20 space-y-1 text-center">
                  <Link
                    href="/contact?topic=tech-hiring"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 shadow-lg shadow-amber-500/30"
                  >
                    <span>Submit Tech Role</span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link href="/pay-per-hire" className="block text-[9px] text-amber-400 hover:text-white">
                    Read terms →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 3: Fixed Flat Charge Plan (NEW) */}
            <div className="google-card-wrapper transition-all duration-200 hover:scale-[1.01]">
              <div className="google-card-inner flex flex-col justify-between p-4.5 rounded-2xl bg-gradient-to-b from-[#081711] via-slate-950 to-slate-950 border border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                      FLAT CHARGE
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 font-semibold">Cohort / Fixed Cap</span>
                  </div>

                  <h4 className="text-base font-black text-white">Fixed Flat Charge Plan</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    Predictable flat fee per hire, role-dependent.
                  </p>

                  {/* Pricing Block */}
                  <div className="my-2.5 py-2 border-y border-emerald-500/20 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black text-emerald-400">Flat Fee</span>
                      <span className="text-[10px] font-bold text-slate-300 ml-1">Per Hire</span>
                    </div>
                    <span className="text-[9px] text-emerald-300/90 font-mono font-semibold">(Discuss in meeting)</span>
                  </div>

                  {/* Warranty & SLA */}
                  <div className="space-y-1 text-[10px] mb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                      <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                      <span>45-Day Free Replacement Warranty</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock size={12} className="text-cyan-400 shrink-0" />
                      <span>Invoice Day 25 · Due in 30 Days</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-1 text-[10px] text-slate-300 border-t border-emerald-500/20 pt-2">
                    {[
                      "Fixed flat fee immune to salary negotiation spikes",
                      "Rate calibrated by role rarity & hiring volume",
                      "HireGo team discusses & sets rate on 15-min call",
                      "Strict 30-day payment term policy",
                      "Full 45-day replacement protection guarantee",
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span className="leading-snug text-slate-200">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Action */}
                <div className="mt-3.5 pt-2.5 border-t border-emerald-500/20 space-y-1 text-center">
                  <Link
                    href="/contact?topic=flat-charge-hiring"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-950 transition shadow-md shadow-emerald-500/20"
                  >
                    <span>Discuss Flat Charge</span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link href="/pay-per-hire" className="block text-[9px] text-emerald-400 hover:text-white">
                    Read terms →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 4: Executive & Leadership */}
            <div className="google-card-wrapper transition-all duration-200 hover:scale-[1.01]">
              <div className="google-card-inner flex flex-col justify-between p-4.5 rounded-2xl bg-slate-950/90 border border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-slate-300 border border-white/10">
                      Leadership
                    </span>
                    <span className="text-[10px] font-mono text-purple-400 font-semibold">CXO & VP</span>
                  </div>

                  <h4 className="text-base font-black text-white">Executive & Leadership</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    VP, CTO, CXO, and C-Suite leaders.
                  </p>

                  {/* Pricing Block */}
                  <div className="my-2.5 py-2 border-y border-white/10 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black text-amber-400">12.5%</span>
                      <span className="text-[10px] font-bold text-slate-300 ml-1">of Annual CTC</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">(Milestone terms)</span>
                  </div>

                  {/* Warranty & SLA */}
                  <div className="space-y-1 text-[10px] mb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                      <span>90-Day Free Replacement Warranty</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Award size={12} className="text-cyan-400 shrink-0" />
                      <span>Strict 30-Day Payment Terms</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-1 text-[10px] text-slate-300 border-t border-slate-800/80 pt-2">
                    {[
                      "Confidential executive mapping & headhunting",
                      "In-depth background & reference checks",
                      "Leadership competency & culture dossier",
                      "Strict 30-day payment term policy",
                      "Direct partner access with HireGo leadership",
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-amber-400" />
                        <span className="leading-snug text-slate-200">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Action */}
                <div className="mt-3.5 pt-2.5 border-t border-white/10 space-y-1 text-center">
                  <Link
                    href="/contact?topic=executive-search"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-950 transition hover:bg-slate-100 shadow-md"
                  >
                    <span>Discuss Search</span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link href="/pay-per-hire" className="block text-[9px] text-slate-400 hover:text-white">
                    Read terms →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Workflow Ribbon */}
          <div className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              How Managed Hiring Operates:
            </span>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300 font-mono">
              <span>01. Role Calibrated</span>
              <span>→</span>
              <span>02. Vetted Video & Sourcing in Minutes</span>
              <span>→</span>
              <span className="text-emerald-400 font-bold">03. Company HR Interviews</span>
              <span>→</span>
              <span>04. Join & Day 25 Invoice (Net 30)</span>
              <span>→</span>
              <span className="text-amber-400 font-bold">05. 45–90 Day Warranty</span>
            </div>
            <Link href="/contact?topic=managed-hiring" className="text-[11px] font-bold text-amber-400 hover:underline">
              Submit a Role →
            </Link>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SELF-SERVE SUBSCRIPTIONS ─── */}
      {tab === "subscriptions" && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {data.plans.map((plan: any) => (
              <div
                key={plan.id}
                className={`google-card-wrapper transition-all duration-200 hover:scale-[1.01] ${plan.isFeatured ? "google-active" : ""}`}
              >
                <div className="google-card-inner flex flex-col justify-between p-5 rounded-2xl bg-slate-950/90 border border-slate-800">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      {plan.badgeText ? (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm ${
                          plan.isFeatured ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950" : "bg-white/10 text-white border border-white/10"
                        }`}>
                          {plan.badgeText}
                        </span>
                      ) : <span />}
                      <span className="text-[10px] font-bold text-slate-400">{plan.jobValidityDays} days validity</span>
                    </div>

                    <h4 className="text-lg font-black text-white">{plan.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{plan.description}</p>

                    <div className="my-3 py-2 border-y border-white/10 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-white">{money(plan.price, plan.currency)}</span>
                      <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1">
                        <Zap size={12} className="text-cyan-400" />
                        {plan.jobPostsQuota} Job Post{plan.jobPostsQuota === 1 ? "" : "s"}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                      {(plan.marketingBenefits || []).slice(0, 4).map((benefit: string) => (
                        <li key={benefit} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                          <span className="leading-snug">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 space-y-1">
                    <Link
                      href={`/register/employer?plan=${encodeURIComponent(plan.id)}`}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                        plan.isFeatured
                          ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-md shadow-cyan-500/20"
                          : "bg-white text-slate-950 hover:bg-slate-100"
                      }`}
                    >
                      <span>Get Started</span>
                      <ArrowRight size={13} />
                    </Link>
                    <Link
                      href={`/employer/subscriptions?planId=${encodeURIComponent(plan.id)}`}
                      className="block text-center text-[10px] text-slate-400 hover:text-cyan-300"
                    >
                      Existing employer? Subscribe →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compact AI Hiring Co-Pilot Addon Card */}
          {data.copilotConfig && data.copilotConfig.enabled && (
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#0a162b] via-[#050b17] to-[#0a162b] p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 mb-1">
                    <Zap size={12} />
                    <span>{data.copilotConfig.badgeText || "Recommended Add-On"}</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{data.copilotConfig.title || "Add HireGo AI Co-Pilot"}</h4>
                  <p className="text-[11px] text-slate-300 leading-snug max-w-xl">{data.copilotConfig.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-black text-white">{money(data.copilotConfig.addonPrice, data.copilotConfig.currency)}</div>
                    <div className="text-[10px] text-slate-400">{data.copilotConfig.billingUnit}</div>
                  </div>
                  <Link
                    href="/ai-hiring-copilot"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110 shadow-md"
                  >
                    <span>Add Co-Pilot</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
