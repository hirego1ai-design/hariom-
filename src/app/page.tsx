import Link from "next/link";
import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import HeroEarth from "@/components/marketing/HeroEarth";
import HeroSky from "@/components/marketing/HeroSky";
import heroStyles from "@/components/marketing/HomeHero.module.css";
import { marketingMetadata } from "@/lib/marketingMetadata";
import { 
  Zap, Clock, ShieldCheck, ArrowRight, CheckCircle2, 
  Award, Laptop, Layers, Video, Play, Volume2, 
  CheckCheck, BarChart3, Trophy, PieChart, Star
} from "lucide-react";

const heroFont = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-home-hero" });

export const metadata: Metadata = marketingMetadata({
  path: "/",
  title: "HireGo AI | Autonomous Agentic Hiring Operating System",
  description: "HireGo AI is the autonomous hiring operating system connecting sourcing, screening, video resumes, assessments, and interview coordination.",
  image: "/marketing/og/home.webp",
});

const TELEMETRY_ITEMS = [
  { type: "Sourcing", tag: "⚡ Auto-Sourcing", text: "48 Verified Engineers matched to requirement in 3.8s", color: "text-[#60A5FA]" },
  { type: "Video", tag: "🎥 Video Resume", text: "Communication depth & technical score 94% verified", color: "text-[#F43F5E]" },
  { type: "Proctoring", tag: "🛡️ AI Proctoring", text: "Anti-cheating integrity scan passed (99% score)", color: "text-[#34D399]" },
  { type: "Schedule", tag: "📅 Autonomous Calendar", text: "3 Technical rounds coordinated with 0 clashes", color: "text-[#FBBF24]" },
  { type: "Managed", tag: "🤝 Managed Hiring", text: "Candidate shortlist mobilized under 48-Hour SLA", color: "text-[#FB923C]" },
  { type: "HR", tag: "💼 Company HR Decision", text: "Final interview conducted by HR · Offer accepted", color: "text-[#34D399]" },
  { type: "Trust", tag: "💰 Zero Upfront Guarantee", text: "100% Outcome fee · Payable strictly upon candidate joining", color: "text-[#FBBF24]" }
];

/* ─── Elegant Gemini-Style 4-Pointed Sparkle Accent ─── */
function GeminiSparkle({ 
  className = "w-4 h-4", 
  variant = "multi" 
}: { 
  className?: string; 
  variant?: "blue" | "red" | "green" | "yellow" | "multi" 
}) {
  const gradId = `gemini-star-${variant}`;
  return (
    <svg viewBox="0 0 24 24" className={`inline-block shrink-0 ${className}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {variant === "blue" && (
            <>
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0066FC" />
            </>
          )}
          {variant === "red" && (
            <>
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#FC392D" />
            </>
          )}
          {variant === "green" && (
            <>
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#03BE45" />
            </>
          )}
          {variant === "yellow" && (
            <>
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#FCBE00" />
            </>
          )}
          {variant === "multi" && (
            <>
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="35%" stopColor="#A855F7" />
              <stop offset="70%" stopColor="#FC392D" />
              <stop offset="100%" stopColor="#03BE45" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d="M12 0 C12 6.627 6.627 12 0 12 C6.627 12 12 17.373 12 24 C12 17.373 17.373 12 24 12 C17.373 12 12 6.627 12 0 Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

/* ─── 3D Glowing Pie / Donut Chart Component ─── */
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
          transformStyle: "preserve-3d"
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
            cx="60" cy="60" r="46" fill="none"
            stroke="url(#pie-blue)" strokeWidth="12"
            strokeDasharray="110 180" strokeDashoffset="0"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(0,102,252,0.6)]"
          />

          {/* Segment 2: Verbal Communication 30% (Green) */}
          <circle
            cx="60" cy="60" r="46" fill="none"
            stroke="url(#pie-green)" strokeWidth="12"
            strokeDasharray="85 205" strokeDashoffset="-118"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(3,190,69,0.6)]"
          />

          {/* Segment 3: Code Benchmark 22% (Amber) */}
          <circle
            cx="60" cy="60" r="46" fill="none"
            stroke="url(#pie-yellow)" strokeWidth="12"
            strokeDasharray="62 228" strokeDashoffset="-210"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(252,190,0,0.6)]"
          />

          {/* Segment 4: System Problem Solving 10% (Coral Red) */}
          <circle
            cx="60" cy="60" r="46" fill="none"
            stroke="url(#pie-rose)" strokeWidth="12"
            strokeDasharray="26 264" strokeDashoffset="-278"
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

export default function HomePage() {
  return (
    <MarketingShell home>
      {/* ─── 1. HERO SECTION (Layout 100% Preserved - "Hiring" starts Blue & ends Green) ─── */}
      <section className={`${heroStyles.hero} ${heroFont.variable}`}>
        <HeroSky />
        <HeroEarth />
        <div className={heroStyles.copy} data-hero-copy>
          {/* Headline: "Hiring" starts with Blue (#0066FC) and ends with Green (#03BE45) */}
          <h1 className={heroStyles.headline}>
            Welcome to Future of{" "}
            <span className="inline-block text-luxury-gradient font-black tracking-tight drop-shadow-[0_4px_24px_rgba(0,102,252,0.5)]">
              Hiring
            </span>
          </h1>
          <p className={heroStyles.tagline}>The world’s fastest hiring platform.</p>
          <div className="mx-auto mt-5 max-w-3xl text-slate-200">
            <p className={heroStyles.description}>Designed to reduce recruiting time by up to 80–85%.</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              HireGo AI helps employers manage sourcing, candidate screening, interviews and hiring operations, with people making the final hiring decisions.
            </p>
          </div>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/pricing"
              className={`${heroStyles.primaryCta} rounded-full bg-white px-12 py-3 font-semibold text-[#1450c5] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 shadow-[0_10px_25px_-5px_rgba(255,255,255,0.4)]`}
            >
              Explore Managed Hiring <span aria-hidden className="ml-2">↗</span>
            </Link>
            <Link
              href="/jobs"
              className={`${heroStyles.secondaryCta} rounded-full border border-white px-12 py-3 font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300`}
            >
              Browse Jobs
            </Link>
          </div>
        </div>
        <svg className={heroStyles.transition} viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hirego-carved-edge" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#eaf4ff" />
              <stop offset="1" stopColor="#fff" />
            </linearGradient>
          </defs>
          <path d="M0 -8 C220 142 780 142 1000 -8 L1000 122 L0 122Z" fill="url(#hirego-carved-edge)" />
          <path d="M0 0 C220 150 780 150 1000 0 L1000 122 L0 122Z" fill="#030814" />
        </svg>
      </section>

      {/* ─── 2. LIVE INTERACTIVE TELEMETRY STREAM (Running Marquee) ─── */}
      <section className="relative border-y border-white/10 bg-[#020610] py-4 overflow-hidden z-20">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5">
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE OS TELEMETRY</span>
          </div>

          <div className="overflow-hidden whitespace-nowrap mask-gradient-x flex-1">
            <div className="animate-marquee-infinite gap-8 text-xs font-medium text-slate-300">
              {[...TELEMETRY_ITEMS, ...TELEMETRY_ITEMS].map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 shadow-sm backdrop-blur-md">
                  <span className={`font-bold ${item.color}`}>{item.tag}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. THE AUTONOMOUS HIRING OPERATING SYSTEM (4 3D Glass OS Engine Cards) ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#030814] via-[#050e20] to-[#030713] py-24 px-5 sm:px-8">
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-1/2 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />

        <div className="mx-auto max-w-7xl relative">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-black tracking-widest text-cyan-300 uppercase shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <Layers size={14} />
              <span>THE AGENTIC HIRING OPERATING SYSTEM</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl md:text-6xl leading-tight">
              One Unified OS for the
              <span className="block mt-1 bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Entire Recruiting Lifecycle.
              </span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-300">
              Traditional recruitment is fractured across disconnected job boards, messy spreadsheets, and calendar clashes. 
              HireGo AI connects sourcing, screening, video resumes, assessments, and interview operations into one synchronized intelligence loop.
            </p>
          </div>

          {/* 4 3D Glass OS Engine Cards */}
          <div className="mt-16 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {/* Kernel 1: Sourcing (Blue) */}
            <div className="google-card-wrapper">
              <div className="google-card-inner card-3d flex flex-col justify-between p-7">
                <div>
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_12px_25px_-5px_rgba(6,182,212,0.6)] border border-cyan-200/50 text-white font-black">
                    <Zap size={24} className="fill-white" />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <span className="font-mono text-[11px] font-black tracking-widest text-cyan-400 uppercase">
                      KERNEL 01 · SOURCING
                    </span>
                    <GeminiSparkle className="w-3.5 h-3.5" variant="blue" />
                  </div>
                  <h3 className="mt-2 text-xl font-black text-white">Autonomous Talent Discovery</h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                    Aggregates verified candidate profiles across active and passive networks, indexing real skills and github portfolios automatically.
                  </p>
                </div>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-cyan-300">⚡ 40+ hrs saved / role</span>
                  <span className="text-slate-400">100K+ Indexed</span>
                </div>
              </div>
            </div>

            {/* Kernel 2: Verification (Coral Red) */}
            <div className="google-card-wrapper">
              <div className="google-card-inner card-3d flex flex-col justify-between p-7">
                <div>
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_12px_25px_-5px_rgba(244,63,94,0.6)] border border-rose-200/50 text-white font-black">
                    <Video size={24} />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <span className="font-mono text-[11px] font-black tracking-widest text-rose-400 uppercase">
                      KERNEL 02 · VERIFICATION
                    </span>
                    <GeminiSparkle className="w-3.5 h-3.5" variant="red" />
                  </div>
                  <h3 className="mt-2 text-xl font-black text-white">Video Resume & Test Evidence</h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                    Candidates submit structured video responses and role-aligned MCQ/coding assessments, creating verified proof before interviews.
                  </p>
                </div>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-400">🎥 85% Accuracy</span>
                  <span className="text-slate-400">Anti-Cheat Scan</span>
                </div>
              </div>
            </div>

            {/* Kernel 3: Dispatcher (Emerald Green) */}
            <div className="google-card-wrapper">
              <div className="google-card-inner card-3d flex flex-col justify-between p-7">
                <div>
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_12px_25px_-5px_rgba(16,185,129,0.6)] border border-emerald-200/50 text-white font-black">
                    <Clock size={24} />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <span className="font-mono text-[11px] font-black tracking-widest text-emerald-400 uppercase">
                      KERNEL 03 · DISPATCHER
                    </span>
                    <GeminiSparkle className="w-3.5 h-3.5" variant="green" />
                  </div>
                  <h3 className="mt-2 text-xl font-black text-white">Autonomous Coordination</h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                    Syncs interviewer calendars, schedules interview rounds automatically, and triggers WhatsApp and email attendance follow-ups.
                  </p>
                </div>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-400">📅 0 Clashes</span>
                  <span className="text-slate-400">Auto Calendar</span>
                </div>
              </div>
            </div>

            {/* Kernel 4: Governance (Amber Yellow) */}
            <div className="google-card-wrapper">
              <div className="google-card-inner card-3d flex flex-col justify-between p-7">
                <div>
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_12px_25px_-5px_rgba(245,158,11,0.6)] border border-amber-200/50 text-white font-black">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <span className="font-mono text-[11px] font-black tracking-widest text-amber-400 uppercase">
                      KERNEL 04 · GOVERNANCE
                    </span>
                    <GeminiSparkle className="w-3.5 h-3.5" variant="yellow" />
                  </div>
                  <h3 className="mt-2 text-xl font-black text-white">Company HR Final Decision</h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                    Protected decision boundaries. Your Company HR conducts the interviews, evaluates shortlists, and makes consequential hiring decisions.
                  </p>
                </div>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-400">🛡️ HR Controls</span>
                  <span className="text-slate-400">HR Decides</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. TWO FLAGSHIP OS DEPLOYMENT MODES ─── */}
      <section className="relative bg-[#02050c] py-24 px-5 sm:px-8 border-t border-white/10">
        <div className="mx-auto max-w-7xl space-y-20">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="font-mono text-xs font-black uppercase tracking-widest text-cyan-400">
              DEPLOYMENT ARCHITECTURE
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              Two Ways to Deploy HireGo OS.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Whether you need agentic software tools for your in-house recruiters or full white-glove hiring operations, HireGo delivers.
            </p>
          </div>

          {/* Mode 1: AI Hiring Co-Pilot */}
          <div className="card-3d-blue rounded-[32px] p-8 sm:p-12 relative overflow-hidden">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center relative z-10">
              {/* Left Column: Clear Text & Bullet Points */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-black text-cyan-300">
                  <Laptop size={14} />
                  <span>AGENTIC SOFTWARE PRODUCT · SELF-SERVE & CO-PILOT</span>
                </div>

                <h3 className="text-2xl font-black text-white sm:text-4xl leading-tight">
                  For In-House Teams: Put Hiring Operations on Autopilot.
                </h3>

                <p className="text-sm leading-relaxed text-slate-300">
                  You already have HR managers or recruiters, but they are drowning in manual candidate chasing and interview scheduling. 
                  <strong className="text-white"> AI Hiring Co-Pilot</strong> executes workflow coordination automatically while your team reviews evidence and conducts interviews.
                </p>

                {/* Clean, High-Contrast Checklist */}
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Autonomous candidate match scoring</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Zero-touch interview scheduling</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Role-aligned test & video dispatch</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Automated WhatsApp reminders</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-white/10">
                  <Link
                    href="/ai-hiring-copilot"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 shadow-lg shadow-cyan-400/25"
                  >
                    <span>Explore AI Co-Pilot</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-xs font-bold text-white hover:bg-white/5 transition"
                  >
                    <span>View Pricing Plans</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: REAL CANDIDATE VIDEO RESUME & CONSOLE */}
              <div className="lg:col-span-7">
                <div className="card-3d rounded-2xl p-5 sm:p-7 shadow-[0_30px_70px_-15px_rgba(0,102,252,0.4)]">
                  {/* Console Header Bar */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#FC392D] shadow-[0_0_8px_rgba(252,57,45,0.6)]" />
                        <span className="h-3 w-3 rounded-full bg-[#FCBE00] shadow-[0_0_8px_rgba(252,190,0,0.6)]" />
                        <span className="h-3 w-3 rounded-full bg-[#03BE45] shadow-[0_0_8px_rgba(3,190,69,0.6)]" />
                      </div>
                      <div className="h-4 w-px bg-white/10 mx-1" />
                      <div className="flex items-center gap-2">
                        <img src="/marketing/hirego-logo-hd.png" alt="HireGo" className="h-4 w-auto object-contain" />
                        <span className="text-[11px] font-mono font-bold text-slate-300">OS Command Center</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE PIPELINE ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* ─── SCREENING & MATCHING FUNNEL TELEMETRY ─── */}
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pb-2 border-b border-white/5">
                      <span className="flex items-center gap-1.5 text-cyan-300 font-mono">
                        <BarChart3 size={13} />
                        PIPELINE SCREENING & MATCH FUNNEL
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">Real-Time Ingestion</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                      <div className="rounded-lg bg-white/[0.02] p-2 border border-white/5">
                        <span className="block text-sm sm:text-base font-black text-white">1,280</span>
                        <span className="text-[10px] font-semibold text-slate-300">Profiles Ingested</span>
                      </div>
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                        <span className="block text-sm sm:text-base font-black text-blue-300">184</span>
                        <span className="text-[10px] font-semibold text-blue-200">Video Resumes</span>
                      </div>
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                        <span className="block text-sm sm:text-base font-black text-emerald-300">48</span>
                        <span className="text-[10px] font-semibold text-emerald-200">AI Matched &gt;90%</span>
                      </div>
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
                        <span className="block text-sm sm:text-base font-black text-amber-300">3</span>
                        <span className="text-[10px] font-semibold text-amber-200">Finalists for HR</span>
                      </div>
                    </div>
                  </div>

                  {/* ─── CANDIDATE 1: REAL VIDEO RESUME PHOTO + KEY SKILL % MATCH BARS ─── */}
                  <div className="mt-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#091834] via-[#051024] to-[#030916] p-4 sm:p-5 shadow-xl space-y-4">
                    {/* Candidate Identity Line */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 font-black text-white text-sm shadow-md">
                            AM
                          </div>
                          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#091834] bg-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-white text-sm sm:text-base">Arjun Mehta</h5>
                            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                              98.4% AI Match
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">Ex-Uber · 8 yrs exp · Senior Cloud Architect</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[10px] font-bold text-cyan-300 border border-cyan-400/30">
                        Ready for HR Interview
                      </span>
                    </div>

                    {/* REAL EMBEDDED VIDEO RESUME PLAYER WITH REAL PHOTO */}
                    <div className="relative overflow-hidden rounded-xl border border-cyan-400/30 bg-gradient-to-br from-[#0c1e3f] via-[#061126] to-[#020712] p-4 shadow-inner">
                      {/* Top Video Header Bar with REC Dot */}
                      <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2 text-rose-400 font-bold">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                          <span>Candidate Video Resume Pitch</span>
                        </div>
                        <span className="font-mono text-slate-300 text-[10px]">01:24 / 02:14</span>
                      </div>

                      {/* Video Player Frame */}
                      <div className="my-3 flex flex-col sm:flex-row items-center gap-4">
                        {/* 16:9 Realistic Candidate Video Resume Frame */}
                        <div className="relative flex h-28 w-full sm:w-44 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-lg group cursor-pointer">
                          <img
                            src="/marketing/images/candidate-video-resume.jpg"
                            alt="Arjun Mehta Candidate Video Resume"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* REC Status & Play Button */}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-rose-400 backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>REC</span>
                          </div>
                          
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md shadow-lg transition hover:scale-110 border border-white/40">
                              <Play size={18} className="fill-white ml-0.5" />
                            </div>
                          </div>

                          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-white">
                            02:14
                          </span>
                        </div>

                        {/* Speech Transcript & Real-Time Audio Waves */}
                        <div className="flex-1 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-cyan-300 font-bold">AI SPEECH VERIFICATION</span>
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                              <Volume2 size={12} />
                              <span>98% Verbal Clarity</span>
                            </div>
                          </div>

                          <div className="rounded-lg border border-white/10 bg-black/50 p-2.5 text-[11px] italic text-slate-200 leading-snug">
                            "“...in our fintech platform, I architected the event-driven microservices cluster using Kafka & Go, reducing API latency from 180ms to 12ms under peak load...”"
                          </div>

                          {/* Audio Waveform Spectrum */}
                          <div className="flex items-center gap-1 pt-1">
                            {[3, 6, 12, 18, 9, 14, 20, 16, 10, 5, 15, 22, 17, 11, 7, 13, 19, 14, 8, 4].map((h, i) => (
                              <div
                                key={i}
                                className="w-1 rounded-full bg-gradient-to-t from-cyan-500 to-blue-400"
                                style={{ height: `${h}px` }}
                              />
                            ))}
                            <span className="ml-2 font-mono text-[9px] text-slate-300">Audio Scanned</span>
                          </div>
                        </div>
                      </div>

                      {/* ─── GRANULAR KEY SKILL MATCH % BARS ─── */}
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                          <span className="text-cyan-300 font-mono">CALIBRATED KEY SKILL MATCH %</span>
                          <span className="text-emerald-400">Overall Fit: 98.4%</span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 text-[11px]">
                          {/* Skill 1 */}
                          <div className="rounded-lg bg-black/40 p-2 border border-white/10">
                            <div className="flex justify-between items-center text-[10px] font-bold pb-1">
                              <span className="text-white">Go & Distributed Systems</span>
                              <span className="text-emerald-400 font-mono">98% Match</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: "98%" }} />
                            </div>
                          </div>

                          {/* Skill 2 */}
                          <div className="rounded-lg bg-black/40 p-2 border border-white/10">
                            <div className="flex justify-between items-center text-[10px] font-bold pb-1">
                              <span className="text-white">Kubernetes & Cloud Arch</span>
                              <span className="text-cyan-400 font-mono">96% Match</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: "96%" }} />
                            </div>
                          </div>

                          {/* Skill 3 */}
                          <div className="rounded-lg bg-black/40 p-2 border border-white/10">
                            <div className="flex justify-between items-center text-[10px] font-bold pb-1">
                              <span className="text-white">Kafka Event Pipelines</span>
                              <span className="text-blue-400 font-mono">95% Match</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" style={{ width: "95%" }} />
                            </div>
                          </div>

                          {/* Skill 4 */}
                          <div className="rounded-lg bg-black/40 p-2 border border-white/10">
                            <div className="flex justify-between items-center text-[10px] font-bold pb-1">
                              <span className="text-white">System Design & Scale</span>
                              <span className="text-emerald-400 font-mono">99% Match</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: "99%" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Candidate 2 Mini Line */}
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 font-bold text-white text-xs">
                        SK
                      </div>
                      <div>
                        <h6 className="font-bold text-white">Sarah Kim · 96.2% Match</h6>
                        <p className="text-[10px] text-slate-300">1m 45s Video Pitch · Auto-Calendar Synced</p>
                      </div>
                    </div>
                    <span className="rounded bg-purple-500/20 px-2 py-1 text-[10px] font-bold text-purple-300">
                      Round 1 Scheduled
                    </span>
                  </div>

                  {/* Governance Desk Note */}
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-center text-xs font-bold text-emerald-300">
                    🛡️ Company HR Governance Desk: All final interviews are conducted by your team.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mode 2: HireGo Managed Hiring */}
          <div className="card-3d-amber rounded-[32px] p-8 sm:p-12 relative overflow-hidden">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center relative z-10">
              {/* Delivery Workflow Visual */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="card-3d rounded-2xl p-6 shadow-2xl space-y-5 border border-amber-500/30">
                  {/* Clean, Scaled Logo Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <img src="/marketing/hirego-logo-hd.png" alt="HireGo" className="h-6 sm:h-7 w-auto object-contain" />
                      <span className="text-xs font-bold text-amber-300">Managed Hiring Operations</span>
                    </div>
                    <span className="rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1 text-[11px] font-black text-amber-300 shadow-sm whitespace-nowrap">
                      100% Pay on Joining
                    </span>
                  </div>

                  {/* 4 3D Delivery Step Cards */}
                  <div className="space-y-3">
                    {[
                      { step: "01", title: "Role Requirement & SLA Sourcing", desc: "Dedicated talent sourcers mobilize verified active/passive pools" },
                      { step: "02", title: "Video Resumes & Skill Screening", desc: "Pre-screened communication, test scores & portfolio evidence" },
                      { step: "03", title: "Company HR Conducts Interviews", desc: "Your hiring manager takes interviews and evaluates shortlisted candidates", highlight: true },
                      { step: "04", title: "Offer Acceptance & Joining", desc: "Success fee is triggered strictly when the candidate joins. 30–90 days warranty begins." },
                    ].map((step) => (
                      <div
                        key={step.step}
                        className={`rounded-xl p-3.5 border transition-all duration-300 ${
                          step.highlight
                            ? "border-amber-400/60 bg-gradient-to-r from-amber-500/25 to-orange-500/20 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.25)]"
                            : "border-white/10 bg-white/[0.03] shadow-md hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`font-mono text-xs font-black ${step.highlight ? "text-amber-300" : "text-slate-400"}`}>{step.step}</span>
                          <h6 className={`text-xs font-bold ${step.highlight ? "text-white" : "text-slate-200"}`}>{step.title}</h6>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300 ml-6">{step.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-400 shadow-md">
                    🛡️ Zero Upfront Cost · Guaranteed Free Replacement Warranty
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-black text-amber-300">
                  <Award size={14} />
                  <span>WHITE-GLOVE RECRUITMENT SERVICE · PAY PER HIRE</span>
                </div>

                <h3 className="text-2xl font-black text-white sm:text-4xl leading-tight">
                  Don't Want to Manage Software? We Deliver the Entire Hire.
                </h3>

                <p className="text-sm leading-relaxed text-slate-300">
                  If your leadership team does not have the bandwidth to source, screen, and coordinate interviews, 
                  <strong className="text-white"> HireGo Managed Hiring</strong> takes over the full operational heavy lifting. 
                  Our dedicated recruiters deliver pre-vetted shortlists. 
                  <strong className="text-amber-300"> Your company HR conducts the final interviews and makes the hiring decision.</strong> You pay strictly upon joining.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Zero upfront financial risk (₹0 upfront)</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>30 to 90 days free replacement warranty</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>3–5 business day candidate shortlist SLA</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Dedicated Talent Partner & Sourcing Squad</span>
                  </div>
                </div>

                {/* Clean, Non-Overlapping CTA Button Row */}
                <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-white/10">
                  <Link
                    href="/employer/managed-hiring/request"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 shadow-lg shadow-amber-500/30"
                  >
                    <span>Submit Role for Managed Hiring</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/pay-per-hire"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition py-2"
                  >
                    <span>Read Pay-Per-Hire Terms →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. CANDIDATE EXPERIENCE: VIDEO RESUME & 3D PIE CHART DEMO WITH RANKINGS ─── */}
      <section className="relative bg-[#030814] py-24 px-5 sm:px-8 border-t border-white/10">
        <div className="mx-auto max-w-7xl grid gap-10 lg:grid-cols-12 lg:items-center relative">
          {/* Left Column: Heading, Subtitle & Buttons */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3.5 py-1 text-xs font-black text-blue-300">
              <Video size={14} />
              <span>CANDIDATE EXPERIENCE · PROOF OF WORK</span>
            </div>

            <h2 className="text-3xl font-black text-white sm:text-5xl leading-tight">
              A Resume Tells the Facts.
              <span className="block text-blue-400">A Video Resume Adds Your Voice.</span>
            </h2>

            <p className="text-sm leading-relaxed text-slate-300">
              Give employers a clearer, faster way to understand your real-world communication, technical problem solving, and project achievements before stepping into the interview room.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 font-bold text-slate-200">
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                <span>Verbal communication & articulate presence scoring</span>
              </div>
              <div className="flex items-center gap-2.5 font-bold text-slate-200">
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                <span>Real-time candidate ranking across 100+ applicants</span>
              </div>
              <div className="flex items-center gap-2.5 font-bold text-slate-200">
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                <span>Automated anti-cheating & proctor integrity scan</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-3">
              <Link href="/video-resume" className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 shadow-lg shadow-blue-600/30">
                Explore Video Resumes →
              </Link>
              <Link href="/ai-mock-interview" className="rounded-xl border border-white/20 px-6 py-3.5 text-xs font-bold text-white hover:bg-white/5">
                Practice AI Mock Interview
              </Link>
            </div>
          </div>

          {/* Right Column: RICH VISUAL DEMO WITH 3D PIE CHART, CANDIDATE VIDEO & RANKINGS */}
          <div className="lg:col-span-7">
            <div className="card-3d rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-500/30 space-y-6 relative overflow-hidden">
              {/* Demo Window Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md">
                    <Trophy size={15} />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] font-bold text-slate-400 uppercase">LIVE DEMO · CANDIDATE RANKING</span>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Engineering Leadership Assessment</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1 text-[11px] font-black text-amber-300 shadow-sm flex items-center gap-1.5">
                    <Trophy size={12} className="text-amber-400" />
                    <span>Rank #1 of 184 Candidates</span>
                  </span>
                </div>
              </div>

              {/* Split Demo: Video Reel (Left) + 3D Pie Chart (Right) */}
              <div className="grid gap-6 sm:grid-cols-12 sm:items-center">
                {/* Left: Video Resume Reel */}
                <div className="sm:col-span-6 space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-xl group">
                    <img
                      src="/marketing/images/candidate-video-resume.jpg"
                      alt="Candidate Video Resume Demo"
                      className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    {/* REC Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-rose-400 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>REC 02:14</span>
                    </div>

                    {/* Center Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md shadow-2xl transition hover:scale-110 border border-white/40">
                        <Play size={20} className="fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Video Transcript Tag */}
                    <div className="absolute bottom-2.5 inset-x-2.5 rounded-lg bg-black/70 p-2 backdrop-blur-md border border-white/10 text-[10px] text-slate-200 italic line-clamp-2">
                      "“...architected our distributed event pipeline in Go handling 140K msgs/sec with 12ms p99 latency...”"
                    </div>
                  </div>

                  {/* Candidate Identity Strip */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <h5 className="font-bold text-white">Priya Sharma · 8 yrs exp</h5>
                      <p className="text-[10px] text-slate-400">Senior Staff Distributed Systems Architect</p>
                    </div>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                      Strong Hire
                    </span>
                  </div>
                </div>

                {/* Right: 3D PIE / DONUT CHART WITH SEGMENT RATINGS */}
                <div className="sm:col-span-6 flex flex-col items-center justify-center space-y-4">
                  {/* 3D Pie Chart Element */}
                  <PieChart3D />

                  {/* Legend / Breakdown of the 3D Pie Chart Segments */}
                  <div className="w-full grid grid-cols-2 gap-2 text-[10px] font-bold pt-1">
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <span className="h-2 w-2 rounded-full bg-[#0066FC]" />
                        Technical Depth
                      </span>
                      <span className="text-white font-mono">98%</span>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-[#03BE45]" />
                        Verbal Clarity
                      </span>
                      <span className="text-white font-mono">96%</span>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-amber-300">
                        <span className="h-2 w-2 rounded-full bg-[#FCBE00]" />
                        Code Quality
                      </span>
                      <span className="text-white font-mono">99%</span>
                    </div>
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-rose-300">
                        <span className="h-2 w-2 rounded-full bg-[#FC392D]" />
                        Problem Solving
                      </span>
                      <span className="text-white font-mono">95%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Multi-Score Strip */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                <span className="text-cyan-300 flex items-center gap-1.5">
                  <Star size={13} className="fill-cyan-300 text-cyan-300" />
                  Top 0.5% Candidate Across 184 Applicants
                </span>
                <span className="text-emerald-400">
                  🛡️ 100% Anti-Cheat Proctor Integrity Passed
                </span>
                <span className="text-amber-300">
                  Ready for Final HR Round
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. ENTERPRISE TRUST & FAQ ─── */}
      <section className="relative bg-[#02050c] py-24 px-5 sm:px-8 border-t border-white/10">
        <div className="mx-auto max-w-7xl space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Clear answers on how HireGo operates, safeguards human control, and guarantees hiring outcomes.
            </p>
          </div>

          {/* 3 FAQ Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* FAQ 1 (Blue) */}
            <article className="card-3d rounded-2xl p-7 space-y-4 border border-blue-500/25">
              <div className="flex items-center justify-between">
                <GeminiSparkle className="w-4 h-4" variant="blue" />
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  Operating System
                </span>
              </div>
              <h3 className="text-base font-bold text-white">What is the HireGo Hiring Operating System?</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                HireGo AI is an agentic recruitment platform that automates sourcing, screening, scheduling, and assessments while ensuring company HR makes consequential decisions.
              </p>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-cyan-300 font-semibold">
                <span>Autonomous Lifecycle</span>
                <span>Self-Serve & Co-Pilot</span>
              </div>
            </article>

            {/* FAQ 2 (Green) */}
            <article className="card-3d rounded-2xl p-7 space-y-4 border border-emerald-500/25">
              <div className="flex items-center justify-between">
                <GeminiSparkle className="w-4 h-4" variant="green" />
                <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  HR Interviews
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Who conducts the interview in Managed Hiring?</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                HireGo sources, pre-screens, and coordinates candidates with verified evidence. <strong className="text-white">Your company HR conducts the actual interview and makes the final decision.</strong>
              </p>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                <span>Company HR Decision</span>
                <span>Protected Boundary</span>
              </div>
            </article>

            {/* FAQ 3 (Amber) */}
            <article className="card-3d rounded-2xl p-7 space-y-4 border border-amber-500/25">
              <div className="flex items-center justify-between">
                <GeminiSparkle className="w-4 h-4" variant="yellow" />
                <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  Pricing Guarantee
                </span>
              </div>
              <h3 className="text-base font-bold text-white">When is the Pay-Per-Hire fee charged?</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                Zero upfront payment is required. The success fee is triggered strictly after your chosen candidate signs the offer and successfully joins your organization.
              </p>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-300 font-semibold">
                <span>100% Pay on Joining</span>
                <span>₹0 Upfront Risk</span>
              </div>
            </article>
          </div>

          {/* Bottom Enterprise CTA Banner */}
          <div className="card-3d rounded-[28px] p-8 sm:p-14 text-center space-y-6 border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 shadow-[0_20px_50px_-10px_rgba(0,102,252,0.3)]">
            <h3 className="text-2xl sm:text-4xl font-black text-white">
              Ready to Upgrade Your Hiring Operations?
            </h3>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300">
              Join modern high-growth companies that use HireGo AI to cut recruitment turnaround from months to days.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/employer/managed-hiring/request" className="rounded-xl bg-white px-8 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-slate-100 shadow-xl transition hover:scale-105">
                Submit Managed Hiring Role
              </Link>
              <Link href="/pricing" className="rounded-xl border border-white/20 px-8 py-3.5 text-xs font-bold text-white hover:bg-white/10 transition">
                View All Pricing & Plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
