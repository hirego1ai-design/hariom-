import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";
import {
  Globe,
  ShieldCheck,
  Cpu,
  Zap,
  Award,
  CheckCircle2,
  ArrowRight,
  Users,
  Lock,
  Server,
  Flame,
  MapPin,
  Building2,
  Sparkles,
  Clock,
  Bot,
  Layers,
  Send,
  Check,
  TrendingUp,
  Video,
  Code2,
} from "lucide-react";

export const metadata: Metadata = marketingMetadata({
  path: "/about",
  title: "HireGo AI | About Us · The Global Autonomous Hiring Operating System",
  description:
    "HireGo AI operates as the world's autonomous Hiring Operating System, connecting talent pipelines across USA, Canada, Australia, UAE, India, and the UK with verified video resumes, proctored testing, and human decision governance.",
  image: "/marketing/og/about.webp",
});

const globalHubs = [
  {
    flag: "🇺🇸 / 🇨🇦",
    region: "North America (USA & Canada)",
    cities: "San Francisco, New York, Austin, Seattle, Toronto, Vancouver",
    domains: "AI/ML, Distributed Systems, Cloud Architecture, Staff+ Leadership",
    badge: "GLOBAL CORRIDOR 01",
  },
  {
    flag: "🇦🇪 / 🇸🇦",
    region: "Middle East & GCC (UAE & Saudi Arabia)",
    cities: "Dubai, Abu Dhabi, Riyadh",
    domains: "Fintech, Web3, Enterprise Digital Transformation, Executive Search",
    badge: "GLOBAL CORRIDOR 02",
  },
  {
    flag: "🇦🇺",
    region: "Australia & APAC",
    cities: "Sydney, Melbourne, Brisbane",
    domains: "Enterprise Cloud, Mobile Engineering, Full-Stack Architecture",
    badge: "GLOBAL CORRIDOR 03",
  },
  {
    flag: "🇮🇳",
    region: "India (Global Engineering Capital)",
    cities: "Bengaluru, Hyderabad, Pune, Mumbai, Delhi-NCR",
    domains: "World's Highest-Density Engineering, Product & AI Talent Engine",
    badge: "GLOBAL CORRIDOR 04",
  },
  {
    flag: "🇬🇧 / 🇪🇺",
    region: "United Kingdom & Europe",
    cities: "London, Berlin, Amsterdam",
    domains: "Quant Finance, Deep Tech, Cybersecurity & Cloud Infrastructure",
    badge: "GLOBAL CORRIDOR 05",
  },
];



const audiences = [
  {
    role: "For CTOs & Engineering Leads",
    headline: "Cut Time-to-Hire from 45 Days to Minutes",
    desc: "Stop wasting engineering cycles on unvetted keyword resumes. Your engineers only interview the top 0.5% of pre-screened candidates who have already passed proctored code benchmarks and video communication reviews.",
    badge: "ENGINEERING VELOCITY",
    cardClass: "card-3d-blue",
  },
  {
    role: "For People Leaders & In-House HR",
    headline: "Automate 90% of Coordination Friction",
    desc: "Eliminate recruiter burnout from endless messaging, scheduling chaos, and no-shows. HireGo's autonomous dispatch coordinates availability and reminders while your team retains 100% final interview authority.",
    badge: "OPERATIONAL EXCELLENCE",
    cardClass: "card-3d",
  },
  {
    role: "For Global MNCs & Unicorns",
    headline: "₹0 Upfront Risk on Managed Hiring",
    desc: "85%+ of our enterprise clients choose Managed Hiring. Zero upfront retainers, 100% contingent billing payable only on joining date, backed by a 30 to 90 days replacement warranty and enterprise security.",
    badge: "MNC PREFERRED",
    cardClass: "card-3d-amber",
  },
  {
    role: "For Elite Technical Candidates",
    headline: "Zero Ghosting, Pure Meritocratic Proof",
    desc: "Present your real capabilities through structured 2-minute video resumes and fair, proctored technical evaluations. Get direct access to vetted high-growth companies without dealing with agency resume gatekeepers.",
    badge: "CANDIDATE EXPERIENCE",
    cardClass: "card-3d",
  },
];

const securityTrust = [
  {
    title: "Multi-Tenant Data Isolation",
    desc: "Strict logical and database-level isolation ensuring employer job pipelines and candidate dossiers are never cross-accessible.",
  },
  {
    title: "Global Privacy & GDPR Compliance",
    desc: "Full compliance with GDPR (Europe), CCPA (US), and international data protection standards with consent-driven video handling.",
  },
  {
    title: "Immutable Proctoring Audit Trails",
    desc: "Tamper-proof logs of all technical challenge runs, webcam verification snapshots, and tab-switching events for audit review.",
  },
  {
    title: "Enterprise NDA & Confidential Search",
    desc: "High-security handling for discreet leadership appointments, executive headhunting, and unreleased project talent mapping.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <div className="relative overflow-hidden bg-[#01050b] text-white">
        {/* Subtle Luxury Ambient Glows (Zero text-blocking clutter) */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-blue-600/15 via-emerald-600/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-[1200px] -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-[2400px] -left-40 h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-[120px]" />

        {/* 1. HERO SECTION */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300 shadow-[0_0_15px_rgba(0,102,252,0.25)] backdrop-blur-md mb-8">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>WHO WE ARE · GLOBAL AUTONOMOUS HIRING OPERATING SYSTEM</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white mb-6">
            Unifying Global Talent Infrastructure. <br />
            <span className="text-luxury-gradient">From Fragmented SaaS to Autonomous OS.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-3xl text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-10">
            HireGo AI is the world’s autonomous Hiring Operating System engineered for modern tech teams and global MNCs. Operating across the <strong className="text-white font-semibold">USA, Canada, Australia, UAE, India, and the UK</strong>, HireGo replaces fractured recruitment point-solutions with an intelligent, proctored talent intelligence layer—while ensuring company leaders retain 100% human hiring governance.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FC] to-[#03BE45] px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-[0_0_25px_rgba(0,102,252,0.4)] hover:shadow-[0_0_35px_rgba(3,190,69,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Explore Global Services</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-8 py-3.5 text-sm sm:text-base font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-200 backdrop-blur-sm"
            >
              <Cpu className="h-5 w-5 text-cyan-400" />
              <span>View Enterprise Pricing</span>
            </Link>
          </div>

          {/* Global Architecture Telemetry Bar (4 3D Glass Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <div className="card-3d p-6 text-left border-l-2 border-l-blue-500">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                6 Hubs
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                Global Corridors
              </div>
              <div className="text-xs text-slate-400">
                Active hiring operations across USA, Canada, Australia, UAE, India & UK
              </div>
            </div>

            <div className="card-3d p-6 text-left border-l-2 border-l-emerald-500">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                1.8M+
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Pre-Vetted Talent
              </div>
              <div className="text-xs text-slate-400">
                Indexed technical footprints, verified GitHub code & video resumes
              </div>
            </div>

            <div className="card-3d p-6 text-left border-l-2 border-l-cyan-500">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                &lt; 45ms
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                Edge Latency
              </div>
              <div className="text-xs text-slate-400">
                Distributed multi-region infrastructure for zero-clash proctored interviews
              </div>
            </div>

            <div className="card-3d p-6 text-left border-l-2 border-l-purple-500">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                100% HR
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                Decision Governance
              </div>
              <div className="text-xs text-slate-400">
                Autonomous pipeline execution with human-controlled final decisions
              </div>
            </div>
          </div>
        </section>

        {/* 2. WORLDWIDE GLOBAL FOOTPRINT & CORRIDORS (Replacing Old Diagrams) */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-300 mb-4">
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              WORLDWIDE TALENT LIQUIDITY
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Global Cross-Border Hiring Corridors
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Whether hiring in Silicon Valley, scaling engineering in Bengaluru, establishing an office in Dubai, or expanding into London and Sydney—HireGo delivers calibrated talent with localized compliance.
            </p>
          </div>

          {/* High-Resolution Global Map Console */}
          <div className="relative rounded-3xl border border-slate-700/80 bg-slate-950/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl overflow-hidden mb-12">
            {/* Console Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>HireGo Global Network // Active Corridors: USA · Canada · Australia · UAE · India · UK</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-cyan-400">
                <span>Multi-Currency Billing: USD / CAD / AUD / AED / INR / GBP</span>
              </div>
            </div>

            {/* Map Frame */}
            <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <Image
                src="/marketing/images/global_hiring_map_hero.png"
                alt="HireGo AI Global Hiring Corridors Across USA, Canada, Australia, UAE, India, UK"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 80vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Overlay Badges */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                <div className="rounded-xl bg-black/70 border border-slate-700 px-3.5 py-1.5 text-xs backdrop-blur-md">
                  <span className="font-bold text-white">Cross-Border Talent Routing:</span>{" "}
                  <span className="text-emerald-400">Follow-The-Sun Sourcing & Dispatch</span>
                </div>
                <div className="rounded-xl bg-black/70 border border-slate-700 px-3.5 py-1.5 text-xs font-mono text-cyan-300 backdrop-blur-md">
                  Zero-Latency Proctored Sessions Active
                </div>
              </div>
            </div>
          </div>

          {/* 5 Global Hub Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {globalHubs.map((hub) => (
              <div key={hub.region} className="card-3d p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{hub.flag}</span>
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded">
                      {hub.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5">{hub.region}</h3>
                  <p className="text-xs text-slate-400 font-mono mb-3">{hub.cities}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{hub.domains}</p>
                </div>
              </div>
            ))}

            {/* 6th Card: Enterprise Mobility & Compliance */}
            <div className="card-3d-amber p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🌐</span>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
                    COMPLIANCE & MOBILITY
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1.5">Global Talent Relocation & Remote</h3>
                <p className="text-xs text-slate-400 font-mono mb-3">Cross-Border Contracts & Tax Advisory</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Support for global remote employment, localized currency billing, and smooth cross-border relocation pipelines for mission-critical engineering leaders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CTO & CEO EXECUTIVE MANIFESTO (Why We Built HireGo OS) */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 7 Columns: The Leadership Manifesto */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-semibold text-purple-300">
                <Cpu className="h-3.5 w-3.5" />
                FROM THE FOUNDERS & LEADERSHIP DESK
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Why We Built an Operating System, <br />
                <span className="text-luxury-gradient">Not Another Job Board.</span>
              </h2>

              <p className="text-base text-slate-300 leading-relaxed">
                Over the past decade, recruitment technology fractured into ten disconnected tools: a job board for listings, an ATS for tracking, a coding test portal for assessments, a video platform for one-way answers, a calendar scheduling app, and endless WhatsApp and LinkedIn threads.
              </p>

              <p className="text-base text-slate-300 leading-relaxed">
                Recruiters became manual data-entry clerks, copy-pasting resumes between systems. Hiring managers spent 40+ hours per month sifting through keyword-stuffed PDFs, only to discover candidates couldn’t write clean code or articulate basic system design.
              </p>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 backdrop-blur-md">
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  The HireGo Operating System Paradigm
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  We engineered HireGo as a single, decoupled, autonomous infrastructure. Sourcing, video resumes, proctored coding sandboxes, and calendar dispatch run on a single unified telemetry bus. Most importantly: <strong className="text-white font-semibold">AI operates the coordination, while your in-house leadership conducts all final interviews and retains 100% hiring authority.</strong>
                </p>
              </div>
            </div>

            {/* Right 5 Columns: The 10-Tool Nightmare vs HireGo OS */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                The Legacy 10-Tool Stack vs. HireGo OS
              </h3>

              <div className="space-y-3">
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3.5">
                  <div className="text-xs font-bold text-red-400 mb-1">
                    ✕ Legacy Fragmented Stack (10 Tools)
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Job Portal + ATS + HackerRank-style testing + Loom/Video + Calendly + Zoom + Agency Brokers + Manual Email Chains. 48 days average cycle, high recruiter burnout, unverified resume spam.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5">
                  <div className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ✓ HireGo Autonomous Hiring OS (1 Cohesive Engine)
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    Unified Autonomous Sourcing $\rightarrow$ Verified Video Resume $\rightarrow$ Anti-Cheat Coding Sandbox $\rightarrow$ Zero-Clash Calendar Dispatch $\rightarrow$ Secure Interview Transfer to Employer. Calibrated shortlist delivered in minutes, ₹0 upfront risk.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-center">
                <span className="text-[11px] font-mono text-cyan-300">
                  Engineered for Velocity, Integrity & Governance
                </span>
              </div>
            </div>
          </div>
        </section>



        {/* 5. MULTI-SIDED ENTERPRISE ECOSYSTEM (Who We Serve) */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
              <Users className="h-3.5 w-3.5" />
              THE MULTI-SIDED ECOSYSTEM
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Engineered for Every Stakeholder in the Talent Chain
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Whether you are an engineering executive needing verified technical rigor or an in-house recruiter seeking relief from manual scheduling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {audiences.map((aud) => (
              <div key={aud.role} className={`${aud.cardClass} p-8 rounded-2xl flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {aud.role}
                    </span>
                    <span className="rounded-full border border-cyan-500/40 bg-cyan-950/60 px-3 py-0.5 text-[10px] font-bold text-cyan-300">
                      {aud.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{aud.headline}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{aud.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. ENTERPRISE SECURITY, COMPLIANCE & DATA PRIVACY */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-semibold text-slate-300 mb-4">
              <Lock className="h-3.5 w-3.5 text-cyan-400" />
              ENTERPRISE SECURITY ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Trust Built into the Architecture
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Recruitment systems process sensitive executive and engineering data. HireGo is engineered with strict isolation, encryption, and auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityTrust.map((item) => (
              <div key={item.title} className="card-3d p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="p-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 w-fit mb-4 text-cyan-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. COMPACT, SLEEK ENTERPRISE CTA */}
        <section className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 via-slate-950 to-black p-6 sm:p-9 text-center shadow-[0_0_35px_rgba(0,102,252,0.18)] backdrop-blur-xl">
            {/* Ambient Background Aura */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-[450px] rounded-full bg-blue-500/15 blur-2xl" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-[11px] font-bold text-emerald-300 mb-4">
                <Flame className="h-3 w-3 text-emerald-400" />
                GLOBAL AUTONOMOUS HIRING OS
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3 leading-snug">
                Ready to Upgrade Your Global <br />
                <span className="text-luxury-gradient">Engineering Talent Pipeline?</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-xl mx-auto leading-relaxed">
                Connect with our executive desk to explore ₹0 upfront risk Managed Hiring or deploy the AI Hiring Co-Pilot directly to your team across the USA, Canada, Australia, UAE, India, and the UK.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0066FC] to-[#03BE45] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_0_20px_rgba(0,102,252,0.4)] hover:shadow-[0_0_30px_rgba(3,190,69,0.5)] hover:scale-[1.02] transition-all duration-200"
                >
                  <span>Schedule Executive Briefing</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-all duration-200"
                >
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span>Explore Services Matrix</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Global Footprint: USA · Canada · Australia · UAE · India · UK
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  100% HR Decision Governance
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-purple-400" />
                  30 to 90 Days Free Replacement Guarantee
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://www.hiregoai.com" },
                  { "@type": "ListItem", position: 2, name: "About Us", item: "https://www.hiregoai.com/about" },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "HireGo AI",
                url: "https://www.hiregoai.com",
                logo: "https://www.hiregoai.com/marketing/hirego-logo-hd.png",
                description:
                  "HireGo AI is the global autonomous Hiring Operating System, connecting talent pipelines across USA, Canada, Australia, UAE, India, and the UK with verified video resumes, proctored code sandboxes, and human hiring governance.",
              },
            ]),
          }}
        />
      </div>
    </MarketingShell>
  );
}
