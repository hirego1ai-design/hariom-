import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";
import {
  Building2,
  Rocket,
  Users2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  Cpu,
  Award,
  Zap,
  Briefcase,
  Lock,
  Flame,
  TrendingUp,
  Video,
  Code2,
  Check,
  Send,
  Globe,
  MapPin,
} from "lucide-react";

export const metadata: Metadata = marketingMetadata({
  path: "/solutions",
  title: "HireGo AI Solutions | Enterprise Hiring OS for Startups, MNCs & Tech Teams",
  description:
    "Tailored recruitment solutions powered by HireGo's autonomous Hiring Operating System. Managed hiring with zero upfront risk, AI Co-Pilot software, and calibrated tech shortlists for global scale.",
  image: "/marketing/og/solutions.webp",
});

const enterpriseSolutions = [
  {
    id: "enterprise-mncs",
    badge: "MNC PREFERRED",
    target: "Global Enterprises & MNCs",
    title: "Zero-Risk Scaled Hiring",
    desc: "100% contingent recruitment with ₹0 upfront fees. Full funnel automated while company HR conducts final interviews.",
    cardClass: "card-3d-blue",
    perks: [
      "₹0 Upfront · Strictly Pay on Joining",
      "Calibrated 3-5 Shortlist in Minutes",
      "30 to 90 Days Free Replacement",
    ],
    ctaText: "MNC Solutions",
    ctaLink: "/contact?topic=enterprise-hiring",
  },
  {
    id: "startups-scaleups",
    badge: "HIGH VELOCITY",
    target: "Tech Startups & Scaleups",
    title: "Rapid 48-Hour Pipeline",
    desc: "Scale core engineering without building an internal recruiting agency. Pre-screened video proof & proctored code.",
    cardClass: "card-3d",
    perks: [
      "Priority 48-Hour Mobilization",
      "GitHub & Tech Stack Deep-Indexing",
      "Zero Retainer Lock-In or Setup Fees",
    ],
    ctaText: "Startup Pipeline",
    ctaLink: "/contact?topic=startup-hiring",
  },
  {
    id: "inhouse-talent-teams",
    badge: "SOFTWARE PLATFORM",
    target: "In-House Talent Teams",
    title: "AI Co-Pilot Software OS",
    desc: "Empower your recruiting team with autonomous sourcing, 2-minute video screening, and round-robin scheduling.",
    cardClass: "card-3d",
    perks: [
      "Autonomous Multi-Channel Sourcing",
      "Server-Side Code & MCQ Sandbox",
      "Zero-Clash Multi-Calendar Dispatch",
    ],
    ctaText: "Software Plans",
    ctaLink: "/pricing",
  },
  {
    id: "executive-leadership",
    badge: "CONFIDENTIAL SEARCH",
    target: "Leadership & CXO Search",
    title: "Discreet Executive Search",
    desc: "Discreet headhunting for VP Engineering, CTO, and C-Suite leaders led directly by our senior executive partners.",
    cardClass: "card-3d-amber",
    perks: [
      "Global Talent Mapping across US, UAE, India",
      "In-Depth Backchannel Reference Checks",
      "Dedicated Senior Managing Partner",
    ],
    ctaText: "Executive Search",
    ctaLink: "/contact?topic=executive-search",
  },
];

const technicalDomains = [
  {
    title: "AI, Machine Learning & GenAI",
    roles: "LLM Infrastructure, MLOps, Computer Vision, PyTorch/CUDA Architects, Prompt Engineers",
    metric: "Top 0.5% Verified",
    accent: "text-blue-400",
  },
  {
    title: "Distributed Systems & Backend",
    roles: "Go, Rust, Java, High-Throughput Microservices, Kafka, PostgreSQL Sharding, Kubernetes",
    metric: "Ready in Minutes",
    accent: "text-emerald-400",
  },
  {
    title: "Fintech, Web3 & Low Latency",
    roles: "Algorithmic Trading Systems, Payment Gateways, Smart Contracts, Quantitative Engineers",
    metric: "Bank-Grade Proctored",
    accent: "text-cyan-400",
  },
  {
    title: "Cloud Infrastructure & DevSecOps",
    roles: "AWS, GCP, Azure, Terraform, CI/CD Automation, Site Reliability Engineering, Zero-Trust",
    metric: "Production-Tested",
    accent: "text-purple-400",
  },
  {
    title: "Full-Stack & Frontend Architecture",
    roles: "Next.js, React, TypeScript, Mobile (iOS/Android/Flutter), Performance Optimization",
    metric: "Code Benchmark Passed",
    accent: "text-amber-400",
  },
  {
    title: "Engineering & Product Leadership",
    roles: "VP of Engineering, CTO, Head of AI, Director of Product, Principal Staff Architects",
    metric: "Partner-Led Search",
    accent: "text-red-400",
  },
];

const challengesSolutions = [
  {
    problem: "Recruiters lose 70% of time to manual scheduling & follow-ups",
    solution: "Autonomous Dispatcher & Calendar Kernel",
    impact: "Zero-clash availability matching, automated Google Meet/Teams links, and WhatsApp reminders.",
    link: "/services",
  },
  {
    problem: "Engineers waste hours interviewing unverified keyword resumes",
    solution: "2-Minute Video Resumes & Proctored Coding Proof",
    impact: "Candidates demonstrate architecture on video and pass server-side code challenges before interview.",
    link: "/services",
  },
  {
    problem: "Agency retainers demand high upfront fees with zero guarantee",
    solution: "HireGo Managed Hiring (100% Pay on Joining)",
    impact: "₹0 upfront risk. Pay strictly when the selected candidate joins your payroll, with 30-90 days warranty.",
    link: "/pricing",
  },
  {
    problem: "High candidate drop-offs and ghosting between interview rounds",
    solution: "Automated Candidate Care & Real-Time Telemetry",
    impact: "Transparent progression loops and automated status updates keep top-tier talent engaged.",
    link: "/services",
  },
  {
    problem: "Cross-border timezone friction across USA, UAE, and India",
    solution: "Global Follow-the-Sun Talent Routing",
    impact: "24/7 sourcing and scheduling pipelines coordinating candidate interviews across global time zones.",
    link: "/about",
  },
  {
    problem: "Lack of objective rubric and unified candidate dossiers",
    solution: "Secure Interview Transfer System & 3D Dossiers",
    impact: "Prepares verified candidate dossiers, speech clarity ratings, and questions rubric directly for HR.",
    link: "/services",
  },
];

export default function SolutionsPage() {
  return (
    <MarketingShell>
      <div className="relative overflow-hidden bg-[#01050b] text-white">
        {/* Subtle Luxury Ambient Glows (Zero text-blocking clutter) */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-blue-600/15 via-emerald-600/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-[1200px] -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-[2400px] -left-40 h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-[120px]" />

        {/* 1. HERO SECTION */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-12 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300 shadow-[0_0_15px_rgba(0,102,252,0.25)] backdrop-blur-md mb-6">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>ENTERPRISE RECRUITMENT SOLUTIONS · OPERATED BY HIREGO OS</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-4">
            Autonomous Talent Solutions. <br />
            <span className="text-luxury-gradient">Engineered for Every Stage of Scale.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-3xl text-sm sm:text-base text-slate-300 font-normal leading-relaxed mb-8">
            From Fortune 500 MNCs requiring zero-risk recruitment to high-growth tech teams scaling critical engineering squads—HireGo AI automates sourcing, screening, proctoring, and interview transfer while <strong className="text-white font-semibold">your company HR and engineering leaders conduct all final interviews</strong>.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FC] to-[#03BE45] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_0_25px_rgba(0,102,252,0.4)] hover:shadow-[0_0_35px_rgba(3,190,69,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Explore Managed Hiring (Zero Risk)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-7 py-3 text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-200 backdrop-blur-sm"
            >
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>View Software Platform Plans</span>
            </Link>
          </div>

          {/* Executive KPI Bar (4 Compact 3D Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            <div className="card-3d p-4 text-left border-l-2 border-l-blue-500">
              <div className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5 tracking-tight">
                In Minutes
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-0.5">
                Instant Mobilization
              </div>
              <div className="text-[11px] text-slate-400">
                Job-ready, proctored candidates in minutes
              </div>
            </div>

            <div className="card-3d p-4 text-left border-l-2 border-l-emerald-500">
              <div className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5 tracking-tight">
                ₹0 Upfront
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                Strictly Pay on Joining
              </div>
              <div className="text-[11px] text-slate-400">
                100% contingent with 30-90 days warranty
              </div>
            </div>

            <div className="card-3d p-4 text-left border-l-2 border-l-cyan-500">
              <div className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5 tracking-tight">
                100% HR
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-0.5">
                Decision Governance
              </div>
              <div className="text-[11px] text-slate-400">
                Zero automated rejections; company HR decides
              </div>
            </div>

            <div className="card-3d p-4 text-left border-l-2 border-l-purple-500">
              <div className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5 tracking-tight">
                Top 0.5%
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-0.5">
                Technical Rigor
              </div>
              <div className="text-[11px] text-slate-400">
                Verified video resumes & code sandboxes
              </div>
            </div>
          </div>
        </section>

        {/* 2. AUTHENTIC 3D HIREGO OS SOLUTIONS CONSOLE (With Official Logo & Scaled Down Size) */}
        <section className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-semibold text-emerald-400 mb-2">
              <Cpu className="h-3 w-3" />
              INTELLIGENT HIRING INFRASTRUCTURE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              The Autonomous Pipeline in Action
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              HireGo’s operational layer coordinates sourcing, proctored code evaluations, video resume capture, and zero-clash calendar dispatch into one unified console.
            </p>
          </div>

          {/* Sleek, Compact 3D Dark Glass Console with Official HireGo HD Logo */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Top Mac-Style Bar with Real HireGo HD Logo */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/80 inline-block" />
                </div>
                <div className="h-3.5 w-[1px] bg-slate-700 mx-1" />
                {/* Official HireGo HD Logo */}
                <div className="flex items-center gap-2">
                  <Image
                    src="/marketing/hirego-logo-hd.png"
                    alt="HireGo AI Logo"
                    width={80}
                    height={24}
                    className="h-4 w-auto object-contain"
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    OS // Solutions Console · v3.4
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Global Pipeline: ACTIVE
                </span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-cyan-300 hidden sm:inline">SLA: In Minutes</span>
              </div>
            </div>

            {/* Split Console Content: Compact & Dense */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 items-center">
              {/* Left Column: Photographic Candidate Video Resume Preview */}
              <div className="md:col-span-7 flex flex-col gap-2.5">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black shadow-lg group">
                  <Image
                    src="/marketing/images/candidate-video-resume.jpg"
                    alt="Real Candidate Video Resume Frame"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 45vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                  {/* Top Bar Overlays */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 rounded bg-black/70 px-2 py-0.5 font-bold text-red-400 backdrop-blur-sm border border-red-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                      ● REC 02:14
                    </div>
                    <div className="rounded bg-black/70 px-2 py-0.5 text-slate-300 backdrop-blur-sm border border-slate-700">
                      1080p HD · Proctor Active
                    </div>
                  </div>

                  {/* Audio Spectrum Bars */}
                  <div className="absolute bottom-10 right-3 flex items-end gap-1 pointer-events-none bg-black/70 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm">
                    <span className="text-[8px] font-mono text-cyan-300 mr-1">VOICE AI</span>
                    <span className="w-0.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-4 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-0.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-bounce" />
                  </div>

                  {/* Candidate Strip */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 pointer-events-none">
                    <div className="text-xs font-bold text-white drop-shadow">
                      Aryan Sharma · Lead Distributed Systems Architect (6.5 Yrs)
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <span className="text-[9px] font-mono bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded border border-blue-400/30">Go / Rust</span>
                      <span className="text-[9px] font-mono bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-400/30">Raft Consensus</span>
                      <span className="text-[9px] font-mono bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded border border-purple-400/30">PostgreSQL</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 size={12} />
                    Dual-Camera & Screen Monitoring: 100% Pass
                  </span>
                  <span className="font-mono text-slate-400">Anti-Cheat Verified</span>
                </div>
              </div>

              {/* Right Column: Live Telemetry & Matching Matrix */}
              <div className="md:col-span-5 flex flex-col justify-between h-full bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Live Candidate Dossier</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      96.4% MATCH · TOP 0.5%
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-medium mb-1">
                        <span className="text-slate-300">System Design & Concurrency</span>
                        <span className="text-cyan-400 font-mono">98%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: "98%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-medium mb-1">
                        <span className="text-slate-300">Algorithmic & Code Execution</span>
                        <span className="text-emerald-400 font-mono">42/42 Tests</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-medium mb-1">
                        <span className="text-slate-300">Speech & Technical Clarity</span>
                        <span className="text-blue-400 font-mono">97%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: "97%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-mono text-cyan-300 mb-2">
                    Secure Interview Transfer: Ready for In-House HR
                  </div>
                  <Link
                    href="/contact"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 px-3 py-2 text-xs font-bold text-white hover:opacity-95 shadow transition-all"
                  >
                    <span>Schedule Company HR Final Interview</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CORE 4 ENTERPRISE SOLUTIONS (REDUCED SIZE: 4-COLUMN SINGLE ROW, NO SCROLL NEEDED) */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-800/80" id="solutions-by-stage">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 px-3 py-1 text-[11px] font-semibold text-blue-300 mb-2">
              <Briefcase className="h-3 w-3" />
              SOLUTIONS BY COMPANY STAGE & NEED
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              A Tailored Solution for Every Scale of Operation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Whether you are an enterprise MNC needing zero-risk managed hiring or an in-house recruitment team looking for autonomous software superpowers.
            </p>
          </div>

          {/* 4 Compact Cards in a Single Row on Desktop (Zero Scroll Needed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {enterpriseSolutions.map((sol) => (
              <div
                key={sol.id}
                className={`${sol.cardClass} p-5 rounded-xl flex flex-col justify-between transition-all duration-200 hover:scale-[1.01]`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {sol.target}
                    </span>
                    <span className="rounded-full border border-cyan-500/40 bg-cyan-950/60 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                      {sol.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{sol.title}</h3>
                  <p className="text-xs text-slate-300 leading-snug line-clamp-2 mb-3">{sol.desc}</p>

                  <div className="space-y-1.5 mb-4 border-t border-white/10 pt-2.5">
                    {sol.perks.map((perk) => (
                      <div key={perk} className="flex items-start gap-1.5 text-[11px] text-slate-200">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={sol.ctaLink}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 py-2 px-3 text-xs font-bold text-white transition-all shadow-sm text-center"
                >
                  <span>{sol.ctaText}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-cyan-300" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 4. TECHNICAL DOMAINS & SQUAD SPECIALIZATION (Compact) */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-[11px] font-semibold text-purple-300 mb-2">
              <Code2 className="h-3 w-3" />
              DOMAIN ARCHITECTURE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Deep Technical Calibration Across Mission-Critical Domains
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              HireGo’s pre-screening rubrics are designed specifically for complex engineering and architectural domains, not generic keyword matching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicalDomains.map((dom) => (
              <div key={dom.title} className="card-3d p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {dom.metric}
                    </span>
                    <Sparkles className={`h-3.5 w-3.5 ${dom.accent}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{dom.title}</h3>
                  <p className="text-[11px] text-slate-300 leading-snug">{dom.roles}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. INTERACTIVE PROBLEM -> SOLUTION MATRIX (Compact) */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[11px] font-semibold text-slate-300 mb-2">
              <TrendingUp className="h-3 w-3 text-cyan-400" />
              PROBLEM → SOLUTION MATRIX
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Solving the 6 Critical Bottlenecks in Modern Hiring
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Start with the operational challenge that is slowing your team down today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challengesSolutions.map((item) => (
              <div key={item.problem} className="card-3d p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-red-400 font-semibold mb-1 flex items-center gap-1">
                    <span>✕</span>
                    <span>Challenge</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-2 leading-snug">“{item.problem}”</h4>

                  <div className="text-[10px] font-mono text-emerald-400 font-semibold mb-1 flex items-center gap-1 border-t border-slate-800 pt-2">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>HireGo Solution</span>
                  </div>
                  <h5 className="text-xs font-bold text-cyan-300 mb-1">{item.solution}</h5>
                  <p className="text-[11px] text-slate-300 leading-snug">{item.impact}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <Link href={item.link} className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1">
                    <span>Explore solution details</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. ENTERPRISE GOVERNANCE GUARANTEE BANNER */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-cyan-950/20 p-5 sm:p-6 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 shrink-0 text-cyan-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-0.5">
                  Enterprise Governance Standard: 100% Human Interview & Hiring Authority
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  HireGo AI executes permitted operational tasks—sourcing, video resume capture, code execution tests, and calendar dispatch. All candidate interviews, evaluations, offer issuances, and final hiring choices remain exclusively with authorized company HR and leadership.
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="shrink-0 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-black transition-all shadow font-mono"
            >
              Consult Solutions Team
            </Link>
          </div>
        </section>

        {/* 7. COMPACT, SLEEK ENTERPRISE CTA */}
        <section className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 via-slate-950 to-black p-6 sm:p-8 text-center shadow-[0_0_35px_rgba(0,102,252,0.18)] backdrop-blur-xl">
            {/* Ambient Background Aura */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-[450px] rounded-full bg-blue-500/15 blur-2xl" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-[11px] font-bold text-emerald-300 mb-3">
                <Flame className="h-3 w-3 text-emerald-400" />
                ACCELERATE YOUR HIRING SQUADS
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2 leading-snug">
                Ready to Upgrade to an <br />
                <span className="text-luxury-gradient">Autonomous Hiring Operating System?</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mb-5 max-w-xl mx-auto leading-relaxed">
                Stop losing weeks to resume filtering, ghosted candidates, and unverified credentials. Partner with HireGo for ₹0 upfront risk Managed Hiring or deploy the AI Hiring Co-Pilot to your internal recruitment desk today.
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
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-all duration-200"
                >
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span>View Software Pricing</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  ₹0 Upfront Risk on Managed Hiring
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  100% HR Decision Authority
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
                  { "@type": "ListItem", position: 2, name: "Solutions", item: "https://www.hiregoai.com/solutions" },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                name: "HireGo AI Enterprise Recruitment Solutions",
                description:
                  "Autonomous recruitment solutions for Global MNCs, high-growth startups, and internal talent teams. Managed hiring, verified video resumes, and human decision governance.",
                provider: {
                  "@type": "Organization",
                  name: "HireGo AI",
                  url: "https://www.hiregoai.com",
                  logo: "https://www.hiregoai.com/marketing/hirego-logo-hd.png",
                },
                url: "https://www.hiregoai.com/solutions",
              },
            ]),
          }}
        />
      </div>
    </MarketingShell>
  );
}
