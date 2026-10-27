import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import EmployerPricingPreview from "@/components/marketing/EmployerPricingPreview";
import { marketingMetadata } from "@/lib/marketingMetadata";
import {
  Sparkles,
  ShieldCheck,
  Clock,
  Award,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  DollarSign,
  AlertCircle,
  Users2,
  Calendar,
  Zap,
} from "lucide-react";

export const metadata: Metadata = marketingMetadata({
  path: "/pay-per-hire",
  title: "Pay Per Hire Recruitment Plans | 8.33% & Flat Fix Charge | HireGo AI",
  description:
    "HireGo AI Pay-Per-Hire Managed Recruitment: Job-ready candidates delivered in minutes with video resumes and proctored code. 8.33% success fee, Fixed Flat Charge plan, 45-day replacement warranty, Day 25 invoice, and Net-30 payment terms.",
  image: "/marketing/og/solutions.webp",
});

export default function PayPerHirePage() {
  return (
    <MarketingShell>
      <div className="relative overflow-hidden bg-[#01050b] text-white">
        {/* Luxury Ambient Lighting Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[950px] rounded-full bg-gradient-to-b from-blue-600/15 via-amber-600/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-[1200px] -right-40 h-[600px] w-[600px] rounded-full bg-amber-600/10 blur-[130px]" />
        <div className="pointer-events-none absolute top-[2400px] -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[130px]" />

        {/* ─── 1. HERO SECTION ─── */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md mb-6">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            <span>HIREGO MANAGED HIRING · 100% CONTINGENT RECRUITMENT · PAY ON JOINING</span>
          </div>

          <h1 className="mx-auto max-w-5xl text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-5">
            Pay-Per-Hire Recruitment Plans. <br />
            <span className="text-luxury-gradient">Strictly Pay on Joining — Zero Advance Retainers.</span>
          </h1>

          <p className="mx-auto max-w-3xl text-sm sm:text-base text-slate-300 font-normal leading-relaxed mb-8">
            Skip expensive headhunter retainers and endless resume filtering. HireGo delivers pre-screened, video-verified, and code-proctored candidates in <strong className="text-white font-semibold">just minutes</strong>. Choose our standard <strong className="text-white font-semibold">8.33%</strong> model or a customized <strong className="text-white font-semibold">Fixed Flat Charge</strong>—backed by a 45-day replacement guarantee and Net-30 payment terms.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 font-medium mb-10">
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-full px-3.5 py-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Delivered in Minutes (No 72-Hour Waiting)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-full px-3.5 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>45 to 90 Days Free Replacement Warranty</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-full px-3.5 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span>Invoice on Day 25 · Strictly Due in 30 Days</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-full px-3.5 py-1.5">
              <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
              <span>₹0 Upfront · 8.33% or Flat Fix Charge</span>
            </div>
          </div>
        </section>

        {/* ─── 2. MANAGED HIRING PLAN CARDS CATALOG ─── */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <EmployerPricingPreview defaultTab="managed" hideTabs={true} />
        </section>

        {/* ─── 3. DETAILED PLAN BREAKDOWN & COMMERCIAL TERMS ─── */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300 mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>COMPLETE PLAN DETAILS & GOVERNANCE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Detailed Breakdown of Every Managed Hiring Plan.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Transparent terms, replacement windows, invoicing schedules, and delivery SLAs across all four hiring tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {/* Detail Box 1 */}
            <div className="card-3d p-6 rounded-2xl border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">PLAN 01 DETAILS</span>
                <span className="text-xs font-mono font-bold text-white">8.33% CTC</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Standard Managed Hire (8.33%)</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                The fee is capped at 8.33% of the candidate&apos;s annual gross CTC (equivalent to 1 month salary). Sourcing, video screening, and technical MCQ assessments are executed at zero upfront cost. You pay strictly upon the candidate&apos;s physical joining date.
              </p>
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>45-Day Replacement:</strong> Full free replacement if the hire departs or underperforms in 45 days.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span><strong>Invoicing:</strong> Invoice generated on Day 25 post-joining; payment due within 30 days of joining date.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                  <span><strong>SLA:</strong> Job-ready candidate dossiers delivered in minutes.</span>
                </div>
              </div>
            </div>

            {/* Detail Box 2 */}
            <div className="card-3d p-6 rounded-2xl border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">PLAN 02 DETAILS</span>
                <span className="text-xs font-mono font-bold text-white">10% CTC</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tech & Specialist Hire (10%)</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Specialized recruitment for Software Engineers, PMs, Data Scientists, and Tech Leads. Includes senior tech recruiter review, server-side anti-cheat proctored coding sandbox scoring, and notice period buyout coordination.
              </p>
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>60-Day Replacement:</strong> Extended two-month warranty for specialized engineering roles.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span><strong>Invoicing:</strong> Invoice generated on Day 25 post-joining; payment due within 30 days of joining date.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                  <span><strong>Code Proof:</strong> Live sandbox telemetry & proctoring report delivered to HR.</span>
                </div>
              </div>
            </div>

            {/* Detail Box 3 */}
            <div className="card-3d p-6 rounded-2xl border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">PLAN 03 DETAILS</span>
                <span className="text-xs font-mono font-bold text-white">Fixed Flat Fee</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Fixed Flat Charge Plan</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                For companies hiring cohorts (5+ developers, batch roles) or teams operating under strict recruiting budgets, HireGo offers a predetermined flat fee per hire regardless of candidate CTC negotiations. The exact flat fee is discussed and locked in an introductory 15-minute alignment call.
              </p>
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>45-Day Replacement:</strong> Full free replacement protection included.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span><strong>Invoicing:</strong> Invoice generated on Day 25 post-joining; payment strictly due within 30 days.</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>Consultation:</strong> Tailored by role rarity, tech stack, and volume in meeting.</span>
                </div>
              </div>
            </div>

            {/* Detail Box 4 */}
            <div className="card-3d p-6 rounded-2xl border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">PLAN 04 DETAILS</span>
                <span className="text-xs font-mono font-bold text-white">12.5% CTC</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Executive & Leadership (12.5%)</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Discreet, partner-led headhunting for VP of Engineering, CTO, CXO, and Director roles. Direct partner execution with global candidate mapping across the US, UAE, and India, comprehensive backchannel reference checks, and compensation advisory.
              </p>
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>90-Day Replacement:</strong> Full 3-month executive replacement warranty.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span><strong>Payment Terms:</strong> Strict 30-day payment cycle on milestones.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400 shrink-0" />
                  <span><strong>Executive Advisory:</strong> Senior Managing Partner assigned to requisition.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 4. IMPORTANT COMMERCIAL & PAYMENT POLICY NOTICE ─── */}
          <div className="mt-8 max-w-5xl mx-auto rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-amber-950/20 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Important Managed Hiring Payment Policy (Strict Net-30 Terms)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Clear, disciplined terms that protect both employer cash flow and dedicated talent pipelines.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="rounded-xl bg-black/30 p-3.5 border border-white/5">
                <span className="font-bold text-amber-300 block mb-1">1. Invoice Raised on Day 25</span>
                <span>The invoice is officially generated after 25 days of verified candidate onboarding, providing your accounts team 5 full business days to verify attendance and process payment.</span>
              </div>
              <div className="rounded-xl bg-black/30 p-3.5 border border-white/5">
                <span className="font-bold text-emerald-400 block mb-1">2. Payment Due Within 30 Days</span>
                <span>Payment is strictly due within 30 days of the candidate&apos;s joining date (Net-30). Timely payment keeps talent sourcing pipelines uninterrupted.</span>
              </div>
              <div className="rounded-xl bg-black/30 p-3.5 border border-white/5">
                <span className="font-bold text-red-400 block mb-1">3. Late Payment Condition</span>
                <span>Across all Managed Hiring plans, payment terms are strictly within 30 days. If payment is delayed past 30 days, commercial terms, active searches, and replacement warranties change.</span>
              </div>
            </div>
          </div>

          {/* ─── 5. ACTION CTAS ─── */}
          <div className="mt-12 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact?topic=managed-hiring"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FC] to-[#03BE45] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-[0_0_25px_rgba(0,102,252,0.4)] hover:shadow-[0_0_35px_rgba(3,190,69,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <span>Submit Role Requirement (Zero Risk)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact?topic=flat-charge-hiring"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-6 py-3.5 text-xs sm:text-sm font-bold text-emerald-300 hover:bg-emerald-900/40 transition-all duration-200"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Discuss Fixed Flat Charge Plan</span>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
              >
                <span>Explore Self-Serve Software Plans</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
