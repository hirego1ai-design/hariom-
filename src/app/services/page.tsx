import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";
import {
  ShieldCheck,
  Bot,
  Cpu,
  Video,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Code2,
  TrendingUp,
  Sparkles,
  Check,
  Briefcase,
  Layers,
  Lock,
  Award,
  Flame,
  ArrowUpRight,
  Send,
  UserCheck,
  Building,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = marketingMetadata({
  path: "/services",
  title: "HireGo AI Services | Enterprise Hiring Operating System & Managed Recruitment",
  description:
    "HireGo AI operates as the autonomous Hiring Operating System for modern tech teams and global MNCs. Sourcing, screening, proctored testing, and interview transfer—while employer conducts final interviews.",
  image: "/marketing/og/services.webp",
});

function PieChart3D() {
  return (
    <div className="relative flex items-center justify-center select-none" style={{ perspective: "700px" }}>
      {/* 3D Ambient Base Glow Ring */}
      <div className="absolute h-36 w-36 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />

      {/* 3D Tilted SVG Donut/Pie Chart */}
      <div
        className="relative"
        style={{
          transform: "rotateX(20deg) rotateZ(-10deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Layer 1: Bottom Shadow Ring (gives physical 3D elevation) */}
        <svg viewBox="0 0 120 120" className="h-32 w-32 drop-shadow-[0_15px_20px_rgba(0,0,0,0.8)]">
          <circle cx="60" cy="65" r="46" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="14" />
        </svg>

        {/* Layer 2: Main 3D Segmented Donut Arcs */}
        <svg viewBox="0 0 120 120" className="h-32 w-32 absolute inset-0 -rotate-90">
          <defs>
            <linearGradient id="pie-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0066FC" />
            </linearGradient>
            <linearGradient id="pie-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#03BE45" />
            </linearGradient>
            <linearGradient id="pie-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#FCBE00" />
            </linearGradient>
            <linearGradient id="pie-rose" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#FC392D" />
            </linearGradient>
          </defs>

          {/* Segment 1: Technical Depth 38% (Blue) */}
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="url(#pie-blue)"
            strokeWidth="12"
            strokeDasharray="110 180"
            strokeDashoffset="0"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(0,102,252,0.6)]"
          />

          {/* Segment 2: Verbal Communication 30% (Green) */}
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="url(#pie-green)"
            strokeWidth="12"
            strokeDasharray="85 205"
            strokeDashoffset="-118"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(3,190,69,0.6)]"
          />

          {/* Segment 3: Code Benchmark 22% (Amber) */}
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="url(#pie-yellow)"
            strokeWidth="12"
            strokeDasharray="62 228"
            strokeDashoffset="-210"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(252,190,0,0.6)]"
          />

          {/* Segment 4: System Problem Solving 10% (Coral Red) */}
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="url(#pie-rose)"
            strokeWidth="12"
            strokeDasharray="26 264"
            strokeDashoffset="-278"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(252,57,45,0.6)]"
          />
        </svg>

        {/* Center 3D Score Pedestal */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-2xl font-black text-white tracking-tight drop-shadow-md">
            96.4
          </span>
          <span className="text-[8px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
            AI SCORE
          </span>
          <span className="text-[7px] font-bold text-emerald-400">
            TOP 0.5%
          </span>
        </div>
      </div>
    </div>
  );
}

const enterpriseServices = [
  {
    tier: "Tier 01",
    name: "HireGo Managed Hiring",
    badge: "MOST POPULAR FOR MNCS · ZERO RISK",
    cardClass: "card-3d-blue",
    headline: "Full-Funnel Recruitment, Strictly Pay on Joining",
    tagline: "The primary choice for Global MNCs and tech leaders who want verified hires without agency overhead.",
    description:
      "HireGo executes the entire operational pipeline: autonomous sourcing, video resume screening, proctored code benchmarks, and calendar dispatch with secure interview transfer. Your company HR conducts final interviews, selects or rejects candidates, and shares feedback. You pay strictly when the candidate joins your payroll.",
    pricing: "100% Contingent · ₹0 Advance · Pay Only on Joining",
    warranty: "30 to 90 Days Free Replacement Guarantee",
    features: [
      "₹0 Upfront Retainer — 100% Contingent on Joining",
      "Calibrated 3-5 Candidate Shortlist in Minutes",
      "Verified Video Resumes & Proctored Coding Dossiers",
      "Company HR Conducts Final Interviews & Retains Decision",
      "Secure Interview Transfer System with Zero Middleman Interference",
      "Full 30-90 Days Free Replacement Protection",
    ],
    ctaText: "Engage Managed Hiring",
    ctaLink: "/contact",
    primary: true,
  },
  {
    tier: "Tier 02",
    name: "AI Hiring Co-Pilot",
    badge: "ENTERPRISE SOFTWARE OS · RECURRING",
    cardClass: "card-3d",
    headline: "Autonomous Operations Layer for In-House Talent Teams",
    tagline: "Best for high-growth tech teams wanting continuous autonomous sourcing and pre-screening.",
    description:
      "Deploy HireGo's proprietary intelligence architecture directly into your existing recruiting workflows. Automate multi-channel talent discovery, video resume collection, server-side MCQ & coding tests, and round-robin interviewer calendar dispatch.",
    pricing: "Subscription & Usage-Based Pricing",
    warranty: "Continuous Software Updates & Enterprise SLA",
    features: [
      "Autonomous Multi-Channel Talent Discovery Engine",
      "Custom 2-Minute Video Resume Screening Workflows",
      "Server-Side MCQ & Anti-Cheat Coding Sandbox",
      "Zero-Clash Multi-Calendar Round-Robin Dispatcher",
      "Automated Context Dossier & Scorecard Delivery",
      "Enterprise ATS & Calendar Integrations",
    ],
    ctaText: "Explore Software Plans & Pricing",
    ctaLink: "/pricing",
    primary: false,
  },
  {
    tier: "Tier 03",
    name: "Executive & Leadership Search",
    badge: "CONFIDENTIAL SEARCH · CXO & VP",
    cardClass: "card-3d-amber",
    headline: "Discreet Search for C-Suite, VP & Principal Tech Leaders",
    tagline: "Best for confidential executive appointments, VP Engineering, CTO, and Principal Architect hires.",
    description:
      "High-touch, discreet talent mapping for mission-critical engineering leaders and C-suite talent. Backed by extensive industry networks, competitive market intelligence, deep reference backchanneling, and customized leadership scorecards.",
    pricing: "Custom Milestone / Retained Terms",
    warranty: "Executive Onboarding Advisory & Extended Guarantee",
    features: [
      "Confidential Market Mapping & Discreet Headhunting",
      "Deep Technical & Cultural Fit Due Diligence",
      "Backchannel Peer & Leadership Reference Verification",
      "Executive Compensation & Equity Benchmarking",
      "Board-Level Scorecard Alignment & Dossiers",
      "Dedicated Executive Managing Partner",
    ],
    ctaText: "Initiate Executive Search",
    ctaLink: "/contact",
    primary: false,
  },
];

const osKernels = [
  {
    id: "K-01",
    title: "Intelligent Sourcing Kernel",
    badge: "AUTONOMOUS DISCOVERY",
    desc: "Scours verified technical talent networks, cross-referencing active GitHub repositories, LinkedIn footprints, open-source commits, and verified tech stacks. Delivers active candidates matching exact compensation and notice criteria.",
    icon: Bot,
    accent: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    id: "K-02",
    title: "Video Resume & Proof-of-Work Kernel",
    badge: "AUTHENTIC VERIFICATION",
    desc: "Replaces unverified 3-page PDFs with 2-minute video demonstrations of real engineering solutions. Dual-camera & screen integrity proctoring ensures authenticity before scheduling any human interview.",
    icon: Video,
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    id: "K-03",
    title: "Calibrated Assessment & Sandbox Kernel",
    badge: "SERVER-SIDE EVALUATION",
    desc: "Role-tailored MCQ and runtime code execution sandbox. Evaluates algorithmic complexity, memory allocation, edge-case coverage, and production design patterns with zero human intervention required.",
    icon: Code2,
    accent: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    id: "K-04",
    title: "Zero-Clash Calendar & Governance Kernel",
    badge: "ORCHESTRATION DESK",
    desc: "Intelligent round-robin interviewer calendar dispatch across global time zones. Automates video room generation, dispatches candidate reminders via WhatsApp/SMS, and consolidates structured scorecards for final HR review.",
    icon: Calendar,
    accent: "text-purple-400",
    border: "border-purple-500/20",
  },
];

const deliveryPipeline = [
  {
    step: "01",
    title: "Role Calibration & Rubric",
    desc: "We define target tech stack depth, compensation boundaries, assessment rubrics, and interview stages with your engineering leadership.",
    actor: "Employer + HireGo",
  },
  {
    step: "02",
    title: "Autonomous Talent Discovery",
    desc: "HireGo's sourcing engine identifies matching candidates from approved pools and engages them with calibrated role briefs.",
    actor: "HireGo AI Sourcing Kernel",
  },
  {
    step: "03",
    title: "Video Resume & Coding Proof",
    desc: "Candidates submit 2-minute video responses and proctored technical benchmarks evaluated server-side.",
    actor: "HireGo Verification Engine",
  },
  {
    step: "04",
    title: "Company HR Final Interviews",
    desc: "Your hiring team receives a ranked 3D candidate dossier and conducts all final interviews. You retain 100% hiring authority.",
    actor: "Company HR & Hiring Managers",
    highlight: true,
  },
  {
    step: "05",
    title: "Offer, Joining & 90-Day Warranty",
    desc: "Candidate accepts and joins your team. On Managed Hiring, fees trigger strictly upon physical joining date backed by 30-90 days warranty.",
    actor: "Successful Placement",
  },
];

const hiregoWorkflowSteps = [
  {
    number: "01",
    name: "Autonomous Talent Sourcing",
    tagline: "Zero Keyword Guesswork",
    desc: "AI identifies passive & active engineers across verified GitHub, LinkedIn, and real open-source technical footprints.",
    icon: Bot,
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/30",
    accent: "text-blue-400",
  },
  {
    number: "02",
    name: "Video Resume & Skills Screening",
    tagline: "Authentic Pre-Screening",
    desc: "Candidates record 2-minute technical demonstrations. Speech-to-context AI checks communication and domain depth.",
    icon: Video,
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    accent: "text-emerald-400",
  },
  {
    number: "03",
    name: "Proctored Anti-Cheat Testing",
    tagline: "Bank-Grade Proctoring",
    desc: "Sandboxed algorithmic & MCQ tests with dual-camera monitoring, tab tracking, and code runtime verification.",
    icon: ShieldCheck,
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/30",
    accent: "text-cyan-400",
  },
  {
    number: "04",
    name: "Zero-Clash Interview Scheduling",
    tagline: "Automated Orchestration",
    desc: "Coordinates interviewer availability, provisions secure Google Meet/Teams rooms, and sends candidate reminders.",
    icon: Calendar,
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/30",
    accent: "text-purple-400",
  },
  {
    number: "05",
    name: "Secure Interview Transfer System",
    tagline: "Context Handed to Employer",
    desc: "Transfers the verified candidate, dossier, recorded video proof, and calibrated questions directly into employer hands.",
    icon: Send,
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    accent: "text-amber-400",
  },
];

const employerResponsibilitySteps = [
  {
    title: "1. Only Company HR & Leads Conduct Interview",
    desc: "No third-party recruiters or middlemen in the meeting. Your internal engineering leads and HR hold the direct conversation.",
    icon: UserCheck,
  },
  {
    title: "2. Sole Selection & Rejection Authority",
    desc: "Your team makes the final call. HireGo never forces candidates or makes automated hiring decisions on your behalf.",
    icon: Award,
  },
  {
    title: "3. Share Feedback & Close the Loop",
    desc: "Submit your decision with one click. Selected candidates move to offer & joining; rejected roles get refreshed candidates immediately.",
    icon: CheckCircle2,
  },
];

const mncPillars = [
  {
    title: "₹0 Upfront Risk & 100% Contingent",
    desc: "Large MNCs cannot risk budget on unproven agency retainers. You pay strictly when the candidate physically joins your payroll.",
    highlight: "CFO & Procurement Friendly",
  },
  {
    title: "Zero Recruiter & Manager Burnout",
    desc: "Engineering managers at MNCs save 90% of screening time. They only interview the top 2-3 pre-vetted, proctored candidates.",
    highlight: "Top 0.5% Pre-Screened Only",
  },
  {
    title: "Full Proctoring & Enterprise Security",
    desc: "Bank-grade anti-cheat proctoring, dual-cam verification, runtime code execution, and enterprise NDA security standard.",
    highlight: "Enterprise Compliance",
  },
  {
    title: "30 to 90 Days Free Replacement",
    desc: "Every single placement is backed by a full replacement warranty. If a hire leaves within 30-90 days, we replace at zero fee.",
    highlight: "Full Retention Insurance",
  },
];

const comparisonData = [
  {
    dimension: "Candidate Sourcing",
    hirego: "Autonomous AI Discovery Across GitHub & Tech Networks",
    agency: "Manual LinkedIn Message Spamming",
    jobBoards: "Waiting for Influx of Random Applicants",
  },
  {
    dimension: "Technical Pre-Screening",
    hirego: "Verified Video Resumes + Anti-Cheat Proctored Code",
    agency: "Unverified Keyword Matching on PDF Resumes",
    jobBoards: "Raw Unverified Resumes with Zero Context",
  },
  {
    dimension: "Interview Operations",
    hirego: "Secure Interview Transfer System · ONLY Employer Interviews",
    agency: "Commission-Driven Agency Broker Pushiness",
    jobBoards: "Complete Manual Scheduling Burden on In-House HR",
  },
  {
    dimension: "Selection & Rejection",
    hirego: "100% Employer Decision Authority (Zero Automated Rejections)",
    agency: "Heavy Sales Pressure to Close Quick Deals",
    jobBoards: "Manual Sifting & Overwhelming Pipeline Chaos",
  },
  {
    dimension: "Commercial Risk (MNC Preferred)",
    hirego: "₹0 Upfront · Strictly Pay on Joining · 30-90 Days Warranty",
    agency: "Hefty Upfront Retainers & Rigid Commissions",
    jobBoards: "Expensive Non-Refundable Job Slot Upfront Fees",
  },
];

export default function ServicesPage() {
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
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>ENTERPRISE HIRING ARCHITECTURE · 4-KERNEL OPERATING SYSTEM</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white mb-6">
            Autonomous Talent Operations. <br />
            <span className="text-luxury-gradient">Human-Led Final Decisions.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-3xl text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-10">
            HireGo AI replaces fractured agency recruitment and unstructured resume floods with an intelligent Hiring Operating System. Sourcing, video resumes, coding benchmarks, and interview dispatch are executed autonomously—while <strong className="text-white font-semibold">your company HR and engineering leaders retain 100% final interview and decision authority</strong>.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FC] to-[#03BE45] px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-[0_0_25px_rgba(0,102,252,0.4)] hover:shadow-[0_0_35px_rgba(3,190,69,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Engage Managed Hiring (Zero Risk)</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-8 py-3.5 text-sm sm:text-base font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-200 backdrop-blur-sm"
            >
              <Cpu className="h-5 w-5 text-cyan-400" />
              <span>Explore AI Platform Plans</span>
            </Link>
          </div>

          {/* Executive KPI Bar (4 3D Glass Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <div className="card-3d p-6 text-left border-l-2 border-l-blue-500">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                82%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                Faster Time-to-Hire
              </div>
              <div className="text-xs text-slate-400">
                Calibrated shortlist delivered in minutes vs industry 42-day average
              </div>
            </div>

            <div className="card-3d p-6 text-left border-l-2 border-l-emerald-500">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                ₹0 Upfront
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Strictly Pay on Joining
              </div>
              <div className="text-xs text-slate-400">
                100% contingent recruitment with 30-90 days replacement warranty
              </div>
            </div>

            <div className="card-3d p-6 text-left border-l-2 border-l-cyan-500">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                100% HR
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                Decision Governance
              </div>
              <div className="text-xs text-slate-400">
                Zero automated rejections; company HR conducts all final interviews
              </div>
            </div>

            <div className="card-3d p-6 text-left border-l-2 border-l-purple-500">
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
                Top 0.5%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                Verified Candidate Depth
              </div>
              <div className="text-xs text-slate-400">
                Video proof-of-work and proctored coding execution before interview
              </div>
            </div>
          </div>
        </section>

        {/* 2. LIVE 3D INTERACTIVE CANDIDATE CONSOLE */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              AUTHENTIC VERIFICATION CONSOLE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Proof Before Interview: Video Resumes & 3D Candidate Scoring
            </h2>
            <p className="text-base text-slate-300">
              Never waste an engineering manager’s calendar on unverified keyword resumes. Review verified 2-minute candidate video responses, speech clarity, and proctored code benchmarks before scheduling.
            </p>
          </div>

          {/* Mac-Style 3D Dark Glass Console Frame */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 shadow-[0_25px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden">
            {/* Console Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
                <span className="ml-3 text-xs font-mono text-slate-400">
                  HireGo OS // Verified Candidate Evaluation Console · Pipeline #HG-9842
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Proctor Integrity: 100% PASS
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-400">Candidate Rank: #1 of 184</span>
              </div>
            </div>

            {/* Split Console Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8 items-center">
              {/* Left Column: Real Candidate Video Resume Frame */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl group">
                  <Image
                    src="/marketing/images/candidate-video-resume.jpg"
                    alt="Real Candidate Video Resume Interview Proof"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2 rounded-md bg-black/60 px-2.5 py-1 text-xs font-mono font-bold text-red-400 backdrop-blur-md border border-red-500/30">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      ● REC 02:14 / 03:00
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-black/60 px-2.5 py-1 text-xs font-mono font-medium text-slate-300 backdrop-blur-md border border-slate-700">
                      1080p HD · Proctor Active
                    </div>
                  </div>

                  <div className="absolute bottom-16 right-4 flex items-end gap-1 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded-lg border border-slate-800 backdrop-blur-md">
                    <span className="text-[9px] font-mono text-cyan-300 mr-1.5">VOICE ANALYTICS</span>
                    <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce" />
                    <span className="w-1 h-6 bg-emerald-400 rounded-full animate-pulse" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                    <div>
                      <div className="text-sm sm:text-base font-bold text-white drop-shadow-md flex items-center gap-2">
                        Aryan Sharma
                        <span className="text-xs font-normal text-slate-300">· Lead Distributed Systems Architect (6.5 Yrs)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[10px] font-mono bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded">Go / Rust</span>
                        <span className="text-[10px] font-mono bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded">Raft Consensus</span>
                        <span className="text-[10px] font-mono bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded">PostgreSQL Sharding</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Dual-Camera & Screen Monitoring: Zero Anomalies Detected</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">Session Hash: 8f9b2d</span>
                </div>
              </div>

              {/* Right Column: 3D Donut Chart & Candidate Evaluation Scorecard */}
              <div className="lg:col-span-5 flex flex-col justify-between h-full bg-slate-900/60 rounded-xl p-5 border border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-white">Candidate Scorecard</h4>
                      <p className="text-xs text-slate-400">Calibrated Against Principal Engineer Rubric</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400">
                      TOP 0.5%
                    </span>
                  </div>

                  <div className="py-2">
                    <PieChart3D />
                  </div>

                  <div className="space-y-2.5 mt-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">System Architecture & Scalability</span>
                        <span className="text-cyan-400 font-mono">98%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: "98%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Algorithmic Rigor & Clean Code</span>
                        <span className="text-emerald-400 font-mono">94%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: "94%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Technical Articulation & Clarity</span>
                        <span className="text-blue-400 font-mono">97%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: "97%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Production Problem Solving</span>
                        <span className="text-purple-400 font-mono">95%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400 rounded-full" style={{ width: "95%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
                  <Link
                    href="/contact"
                    className="w-full text-center rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 shadow-lg transition-all"
                  >
                    Schedule Company HR Final Interview
                  </Link>
                  <p className="text-[11px] text-center text-slate-400">
                    Company HR conducts all final interviews and makes the final hiring choice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CORE 3-TIER ENTERPRISE SERVICE MATRIX */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="commercial-models">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-300 mb-4">
              <Briefcase className="h-3.5 w-3.5" />
              ENTERPRISE ENGAGEMENT MODELS
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Tailored Delivery for Every Stage of Scale
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Choose between fully managed talent delivery with ₹0 upfront financial risk, or empower your internal recruitment team with our autonomous Hiring Operating System.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {enterpriseServices.map((service) => (
              <div
                key={service.name}
                className={`relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-300 ${service.cardClass}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {service.tier}
                    </span>
                    <span className="rounded-full border border-cyan-500/40 bg-cyan-950/50 px-3 py-0.5 text-[11px] font-bold text-cyan-300">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white mb-2">{service.name}</h3>
                  <div className="text-sm font-semibold text-cyan-400 mb-3">{service.headline}</div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">{service.description}</p>

                  <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Commercial Structure
                    </div>
                    <div className="text-sm font-extrabold text-white mb-1">{service.pricing}</div>
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {service.warranty}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      What is Included
                    </div>
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={service.ctaLink}
                  className={`w-full text-center rounded-xl py-3.5 px-6 text-sm font-bold transition-all duration-200 ${
                    service.primary
                      ? "bg-gradient-to-r from-[#0066FC] to-[#03BE45] text-white shadow-[0_0_20px_rgba(0,102,252,0.4)] hover:shadow-[0_0_30px_rgba(3,190,69,0.5)] hover:scale-[1.02]"
                      : "border border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 hover:border-slate-600"
                  }`}
                >
                  {service.ctaText} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 4. THE 4-KERNEL HIRING OS ARCHITECTURE */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-semibold text-purple-300 mb-4">
              <Cpu className="h-3.5 w-3.5" />
              ENTERPRISE PLATFORM ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              The 4 Autonomous Kernels Powering HireGo OS
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              A decoupled, reliable recruitment operating system engineered to eliminate operational friction while maintaining rigorous engineering standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {osKernels.map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.id}
                  className={`card-3d p-8 relative rounded-2xl border ${k.border} bg-slate-900/40 backdrop-blur-md`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                        <Icon className={`h-6 w-6 ${k.accent}`} />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-400">{k.id}</span>
                        <h3 className="text-xl font-bold text-white">{k.title}</h3>
                      </div>
                    </div>
                    <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300">
                      {k.badge}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{k.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. 5-STAGE DELIVERY PIPELINE */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
              <Layers className="h-3.5 w-3.5" />
              CORPORATE GOVERNANCE & DELIVERY PIPELINE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              How the Pipeline Moves: Clear Handoffs, Total Control
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              AI executes the repetitive, operationally heavy workflows. <strong className="text-white font-semibold">Your in-house HR and engineering leads conduct the interviews and make the hiring decisions.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
            {deliveryPipeline.map((step) => (
              <div
                key={step.step}
                className={`card-3d p-6 rounded-xl flex flex-col justify-between ${
                  step.highlight ? "border-2 border-emerald-500/60 bg-emerald-950/20" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-2xl font-black text-slate-500">
                      {step.step}
                    </span>
                    {step.highlight && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                        HUMAN GOVERNANCE
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{step.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{step.desc}</p>
                </div>
                <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-cyan-300 font-semibold">
                  Actor: {step.actor}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6 sm:p-8 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 shrink-0 text-cyan-400">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">
                  Enterprise Governance Guarantee: People Make the Decisions
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  HireGo AI operates under strict authorization boundaries. Autonomous agents execute candidate discovery, video resume collection, test administration, and calendar dispatch. All final candidate evaluations, technical interviews, offer extensions, and hiring decisions are exclusively reserved for authorized human hiring teams.
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3 text-sm font-bold text-black transition-all shadow-lg"
            >
              Discuss Your Hiring Requirements
            </Link>
          </div>
        </section>

        {/* 6. WHY MODERN CTOS, CEOS & GLOBAL MNCS CHOOSE HIREGO AI */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-800/80" id="why-mncs-choose">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-950/50 px-4 py-1.5 text-xs font-semibold text-blue-300 mb-4 shadow-[0_0_15px_rgba(0,102,252,0.2)]">
              <Building className="h-3.5 w-3.5 text-cyan-400" />
              ENTERPRISE & MNC OPERATIONAL ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Why Modern CTOs, CEOs & MNCs Choose HireGo AI
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              We automate the heavy operational pipeline—Sourcing, Screening, Shortlisting, and Proctored Interview Scheduling. <strong className="text-white font-semibold">Only your company HR and engineering leaders conduct the interview, select or reject candidates, and share feedback.</strong>
            </p>
          </div>

          {/* 2-Sided Architecture: What HireGo Operates vs What Employer Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            {/* Left 7 Columns: What HireGo Automates (The Autonomous Machine) */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-blue-500/30 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                      HireGo AI Autonomous Operations
                    </span>
                  </div>
                  <span className="rounded-md bg-blue-950/80 border border-blue-500/40 px-2.5 py-1 text-[11px] font-mono text-cyan-300">
                    AUTOMATED BY HIREGO
                  </span>
                </div>

                <div className="space-y-4">
                  {hiregoWorkflowSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.number}
                        className={`rounded-xl border ${step.border} bg-gradient-to-r ${step.color} p-4 transition-all duration-200 hover:scale-[1.01]`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-700/60 shrink-0">
                            <Icon className={`h-5 w-5 ${step.accent}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-400">{step.number}.</span>
                                {step.name}
                              </h4>
                              <span className="text-[10px] font-mono uppercase text-slate-400 bg-black/40 px-2 py-0.5 rounded">
                                {step.tagline}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-300 font-mono">
                  <ShieldCheck className="h-4 w-4" />
                  Bank-Grade Encryption & Dual-Cam Proctoring
                </span>
                <span className="font-mono text-slate-400">Zero Middlemen in Interviews</span>
              </div>
            </div>

            {/* Right 5 Columns: What the Employer Controls (Human Decision & Governance) */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-slate-900/80 to-slate-950 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-emerald-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                      Employer Governance Desk
                    </span>
                  </div>
                  <span className="rounded-md bg-emerald-950 border border-emerald-500/50 px-2.5 py-1 text-[11px] font-mono text-emerald-300 font-bold">
                    100% IN YOUR HANDS
                  </span>
                </div>

                <div className="space-y-6">
                  {employerResponsibilitySteps.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-5 w-5 text-emerald-400 shrink-0" />
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-8">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Callout Box on Right */}
              <div className="mt-8 rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-4 text-center">
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                  The HireGo Transfer Guarantee
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  We transfer a completely verified candidate dossier, video proof, and calibrated code test directly to your calendar. You interview, choose, and hire.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 text-xs transition-colors shadow-lg"
                >
                  <span>Talk to Managed Hiring Desk</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Why Big MNCs Choose Managed Hiring: 4 Enterprise Pillars */}
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-950 via-blue-950/30 to-slate-950 p-6 sm:p-10 mb-16 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
              <div>
                <span className="rounded-full bg-blue-500/20 border border-blue-400/40 px-3 py-1 text-xs font-mono font-bold text-blue-300 uppercase tracking-wider">
                  MNC STRATEGIC ADOPTION
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  Why Global MNCs Overwhelmingly Choose HireGo Managed Hiring
                </h3>
              </div>
              <div className="text-xs text-slate-400 sm:text-right font-mono">
                Used by 85%+ Enterprise Clients · Zero Balance-Sheet Risk
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mncPillars.map((pillar) => (
                <div key={pillar.title} className="card-3d p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/30 mb-3 inline-block">
                      {pillar.highlight}
                    </span>
                    <h4 className="text-base font-bold text-white mb-2">{pillar.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6 font-bold text-white">Capability & Governance</th>
                  <th className="py-4 px-6 font-bold text-cyan-400 bg-cyan-950/30 border-x border-cyan-500/20">
                    HireGo AI Operating System
                  </th>
                  <th className="py-4 px-6 font-bold text-slate-300">Traditional Recruitment Agencies</th>
                  <th className="py-4 px-6 font-bold text-slate-300">Legacy Job Portals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300 text-xs sm:text-sm">
                {comparisonData.map((row) => (
                  <tr key={row.dimension} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">{row.dimension}</td>
                    <td className="py-4 px-6 font-bold text-white bg-cyan-950/20 border-x border-cyan-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{row.hirego}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{row.agency}</td>
                    <td className="py-4 px-6 text-slate-400">{row.jobBoards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. COMPACT, SLEEK ENTERPRISE CTA (Redesigned & Scaled Down) */}
        <section className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 via-slate-950 to-black p-6 sm:p-9 text-center shadow-[0_0_35px_rgba(0,102,252,0.18)] backdrop-blur-xl">
            {/* Ambient Background Aura */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-[450px] rounded-full bg-blue-500/15 blur-2xl" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-[11px] font-bold text-emerald-300 mb-4">
                <Flame className="h-3 w-3 text-emerald-400" />
                ACCELERATE YOUR ENGINEERING VELOCITY
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3 leading-snug">
                Ready to Upgrade to an <br />
                <span className="text-luxury-gradient">Autonomous Hiring Operating System?</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-xl mx-auto leading-relaxed">
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
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
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
                  { "@type": "ListItem", position: 2, name: "Services", item: "https://www.hiregoai.com/services" },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                name: "HireGo AI Hiring Operating System & Managed Recruitment",
                description:
                  "Autonomous recruitment operations, verified candidate video resumes, proctored coding assessments, and zero-upfront Pay on Joining managed hiring with human-controlled hiring decisions.",
                provider: {
                  "@type": "Organization",
                  name: "HireGo AI",
                  url: "https://www.hiregoai.com",
                  logo: "https://www.hiregoai.com/marketing/hirego-logo-hd.png",
                },
                url: "https://www.hiregoai.com/services",
              },
            ]),
          }}
        />
      </div>
    </MarketingShell>
  );
}
