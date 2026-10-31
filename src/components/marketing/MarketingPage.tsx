import Link from "next/link";
import MarketingShell from "./MarketingShell";
import { PUBLIC_BUSINESS_DETAILS } from "@/lib/publicBusinessDetails";
import EmployerPricingPreview from "./EmployerPricingPreview";

type PageKind = "features" | "pricing" | "enterprise" | "about" | "company" | "careers" | "contact" | "terms" | "privacy" | "ai-features" | "find-jobs" | "certifications" | "career-resources" | "post-job-public";

const content: Record<PageKind, { eyebrow: string; title: string; intro: string }> = {
  features: { eyebrow: "Agentic Hiring Operating System", title: "One connected system for the hiring workflow.", intro: "HireGo AI connects sourcing, screening, assessments, interviews, candidate communication and workflow coordination while keeping consequential employment decisions under human control." },
  pricing: { eyebrow: "Employer Pricing", title: "Simple, Transparent Pricing", intro: "Flexible self-serve job posting packages or hands-on Managed Hiring with 100% outcome-based fees." },
  enterprise: { eyebrow: "For teams that are hiring", title: "Hire people for what they can do.", intro: "Create structured hiring workflows, compare verified skills, and move from shortlist to offer with confidence." },
  about: { eyebrow: "Our mission", title: "Make opportunity easier to reach.", intro: "We are building a more useful bridge between human potential and the teams looking for it." },
  company: { eyebrow: "Inside HireGo", title: "A team building better hiring infrastructure.", intro: "We combine thoughtful product design, responsible AI, and practical workflows to make hiring clearer for everyone." },
  careers: { eyebrow: "Join HireGo", title: "Build the future of work with us.", intro: "We are a small, ambitious team working on products that make hiring more human and more evidence-based." },
  contact: { eyebrow: "We are here to help", title: "Let’s talk about your next hire.", intro: "Tell us what you are building, hiring for, or trying to improve. Our team will route your message to the right person." },
  terms: { eyebrow: "Legal", title: "Terms of service", intro: "These terms explain the rules for using HireGo AI and the responsibilities of everyone using the platform." },
  privacy: { eyebrow: "Legal", title: "Privacy at HireGo", intro: "We collect and use information to provide a safe, useful hiring platform. This page explains the choices and controls available to you." },
  "ai-features": { eyebrow: "The HireGo platform", title: "Useful AI, with people in control.", intro: "Use AI to prepare, organise, and surface signal—while candidates and hiring teams keep the final say." },
  "find-jobs": { eyebrow: "Find Jobs", title: "Discover opportunities. Apply with useful context.", intro: "Explore available roles on HireGo and use your profile, skills and preparation to give employers clearer context when you apply." },
  certifications: { eyebrow: "Show what you know", title: "Turn progress into proof.", intro: "Build credible evidence of your skills through structured practice and assessments." },
  "career-resources": { eyebrow: "Career Resources", title: "Build the skills, confidence and evidence to get job-ready.", intro: "Prepare for interviews, practise with AI, strengthen how you present your skills and discover opportunities that match your goals." },
  "post-job-public": { eyebrow: "For employers", title: "Post a role people can trust.", intro: "Create a clear brief, reach prepared candidates, and keep your hiring process structured from day one." },
};

function Hero({ kind }: { kind: PageKind }) {
  const item = content[kind];
  const isPricing = kind === "pricing";
  
  if (isPricing) {
    return (
      <section className="relative overflow-hidden border-b border-white/10 pt-20 pb-4 sm:pt-24 sm:pb-6 bg-gradient-to-b from-[#070e1c] via-[#040813] to-[#02050c]">
        {/* HireGo Logo Multi-Color Ambient Mesh Glow (Electric Blue, Coral Red, Amber Gold, Emerald Green) */}
        <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-blue-600/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-10 top-10 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-red-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl px-5 text-center">
          {/* Branded Logo Pill matching Logo */}
          <div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-amber-900/30 px-4 py-1.5 shadow-xl backdrop-blur-xl">
            <img src="/marketing/hirego-logo-hd.png" alt="HireGo AI" className="h-4 sm:h-4.5 w-auto object-contain drop-shadow" />
            <span className="h-3 w-[1px] bg-white/20" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-cyan-300">Employer Pricing & Solutions</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight sm:text-4xl md:text-5xl text-white leading-tight">
            Transparent Pricing Built for
            <span className="block mt-1 bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
              Every Hiring Model & Scale.
            </span>
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300">
            Choose self-serve job posting packages or hands-on Managed Hiring with 100% outcome-based fees where you pay strictly when your chosen candidate joins.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-white/10 px-5 py-20 sm:px-8 md:py-28">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#ff5252]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-96 w-96 rounded-full bg-[#448aff]/15 blur-3xl" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">{item.eyebrow}</p>
        <h1 className="font-display-xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">{item.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">{item.intro}</p>
      </div>
    </section>
  );
}

const featureCards = [
  ["01", "Job-ready profiles", "Show skills, assessments, and practical evidence in one clear candidate profile."],
  ["02", "Structured assessments", "Use role-aligned MCQ, typing, and interview signals instead of guesswork."],
  ["03", "Confident shortlists", "Give hiring teams consistent signals and a faster path to meaningful conversations."],
  ["04", "Coaching that helps", "Turn lower assessment results into an actionable improvement plan, not a dead end."],
];

export default function MarketingPage({ kind }: { kind: PageKind }) {
  const item = content[kind];
  return (
    <MarketingShell>
      <Hero kind={kind} />
      <section className={`mx-auto max-w-7xl px-5 ${kind === "pricing" ? "py-6 sm:px-8 md:py-8" : "py-16 sm:px-8 md:py-24"}`}>
        {kind === "features" && <FeaturesContent />}
        {kind === "career-resources" && <CareerResourcesContent />}
        {kind === "find-jobs" && <FindJobsContent />}
        {["ai-features", "certifications"].includes(kind) && (
          <div className="grid gap-5 md:grid-cols-2">
            {featureCards.map(([number, title, description]) => (
              <article key={number} className="glass-card p-7">
                <span className="font-mono text-sm text-[#ff8a80]">{number}</span>
                <h2 className="mt-5 text-2xl font-bold text-white">{title}</h2>
                <p className="mt-3 leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        )}
        {kind === "pricing" && <PricingContent />}
        {kind === "enterprise" && <EnterpriseContent />}
        {kind === "post-job-public" && <PostJobPublicContent />}
        {kind === "contact" && <ContactContent />}
        {kind === "about" && <AboutContent />}
        {kind === "company" && <CompanyContent />}
        {kind === "careers" && <CareersContent />}
        {(kind === "terms" || kind === "privacy") && <LegalContent kind={kind} />}
      </section>
    </MarketingShell>
  );
}

function FeaturesContent() {
  const capabilities = [
    { title: "Employer AI Co-Pilot", description: "Assist with defined hiring operations, workflow context and next-step coordination while your team retains control of consequential decisions.", href: "/ai-hiring-copilot", cta: "Explore AI Co-Pilot" },
    { title: "Candidate Search & Screening", description: "Bring candidate discovery and evidence-based screening into the same workflow so teams can review relevant signals with context.", href: "/candidate-screening-software", cta: "Explore candidate screening" },
    { title: "Candidate Discovery & Job Matching", description: "Search, filter, and apply directly to verified active opportunities matching your target role and skills.", href: "/jobs", cta: "Explore Jobs" },
    { title: "Video Resume & Candidate Intelligence", description: "Combine candidate information, video resumes, assessment evidence and interview insights into a more unified candidate view.", href: "/video-resume", cta: "Explore Video Resume" },
    { title: "Interview Orchestration", description: "Coordinate interview stages, interviewer context and workflow progression without separating the process across disconnected tools.", href: "/interview-proctoring-software", cta: "Explore interview workflows" },
    { title: "Candidate Communication & Follow-ups", description: "Support timely candidate communication and follow-up workflows while maintaining durable hiring context across stages.", href: "/solutions", cta: "Explore hiring workflows" },
    { title: "Managed Hiring", description: "Access an additional hiring model for employers that need hands-on support, including hiring talent from India for global requirements.", href: "/pay-per-hire", cta: "Explore Managed Hiring" },
  ];
  return <div className="space-y-16">
    <section>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">Connected capabilities</p>
        <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">From candidate discovery to coordinated hiring operations.</h2>
        <p className="mt-5 leading-7 text-slate-400">Instead of treating sourcing, assessment, interviews and follow-ups as separate systems, HireGo AI is designed to keep the workflow and its evidence connected.</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {capabilities.map((capability) => <article key={capability.title} className="glass-card p-7">
          <h3 className="text-2xl font-bold text-white">{capability.title}</h3>
          <p className="mt-3 leading-7 text-slate-400">{capability.description}</p>
          <Link href={capability.href} className="mt-5 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">{capability.cta} →</Link>
        </article>)}
      </div>
    </section>
    <section className="glass-card p-8 sm:p-10">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff8a80]">Human control</p>
      <h2 className="mt-4 text-3xl font-extrabold text-white">AI can execute permitted workflows. People make consequential employment decisions.</h2>
      <p className="mt-5 max-w-4xl leading-7 text-slate-300">HireGo AI is designed to assist with and execute defined operational work while final selection or rejection, offers, compensation commitments and other consequential employment decisions remain under human control.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link href="/about#human-control" className="btn-primary-blue">How human control works</Link><Link href="/solutions" className="btn-secondary">Explore solutions</Link></div>
    </section>
    <section className="text-center">
      <h2 className="text-3xl font-extrabold text-white">Choose the HireGo workflow that fits your hiring needs.</h2>
      <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">Use the platform directly or explore managed hiring support for requirements that need additional operational help.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/pricing" className="btn-primary-red">View pricing</Link><Link href="/contact" className="btn-primary-blue">Talk to HireGo AI</Link></div>
    </section>
  </div>;
}

function CareerResourcesContent() {
  const guides = [
    ["Find verified jobs", "Search and apply to verified job opportunities matching your interests, skills, and target location.", "/jobs", "Browse Jobs"],
    ["Resume & Video Resume", "Use your profile and Video Resume to introduce yourself, communicate your experience and add context beyond a traditional resume.", "/video-resume", "Explore Video Resume"],
    ["Skills & assessments", "Use structured assessments and preparation tools to demonstrate what you know and identify areas where additional practice may help.", "/certifications", "Explore skill evidence"],
    ["Find the right jobs", "Search HireGo jobs and review roles that match your interests, skills and location when you are ready to explore opportunities.", "/jobs", "Browse Jobs"],
  ];
  const steps = ["Create your profile", "Build your Video Resume", "Practise and assess", "Find relevant jobs", "Interview with employers", "Track your applications"];
  const faqs = [
    ["What are HireGo Career Resources?", "Career Resources brings together interview practice, profile and Video Resume guidance, skill-readiness tools and pathways to job discovery."],
    ["How does an AI Mock Interview help?", "AI Mock Interviews provide a structured environment to practise responses and reflect on areas you may want to improve before an employer interview."],
    ["What is a Video Resume?", "A Video Resume gives candidates another way to introduce themselves and add context about their experience, skills and communication beyond a traditional resume."],
    ["Can I practise before applying for jobs?", "Yes. You can use available preparation and assessment experiences before exploring and applying for relevant opportunities."],
    ["Does HireGo AI decide whether I get hired?", "No. HireGo AI can support preparation, assessments and hiring workflows, but final employment decisions remain with the employer and the people responsible for the hiring process."],
    ["Where can I find jobs on HireGo?", "Use the HireGo Jobs area to browse available opportunities and review roles relevant to your interests, skills and location."],
  ];
  return <div className="space-y-16">
    <div className="flex flex-wrap justify-center gap-3"><Link href="/jobs" className="btn-primary-red">Browse Verified Jobs</Link><Link href="/register" className="btn-primary-blue">Create Candidate Profile</Link></div>
    <section>
      <div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-extrabold text-white sm:text-4xl">Prepare for interviews before they count.</h2><p className="mt-5 leading-7 text-slate-400">Use practical preparation tools to become more comfortable explaining your experience, skills and approach before speaking with an employer.</p></div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">{guides.map(([title, description, href, cta]) => <article key={title} className="glass-card p-7"><h3 className="text-2xl font-bold text-white">{title}</h3><p className="mt-3 leading-7 text-slate-400">{description}</p><Link href={href} className="mt-5 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">{cta} →</Link></article>)}</div>
    </section>
    <section className="glass-card p-8 sm:p-10"><h2 className="text-3xl font-extrabold text-white">One journey from preparation to opportunity.</h2><p className="mt-4 max-w-4xl leading-7 text-slate-300">HireGo connects career preparation and job discovery so you can carry useful context and evidence through your journey instead of starting from zero at every stage.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{steps.map((step, index) => <div key={step} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><span className="font-mono text-sm text-[#ff8a80]">{String(index + 1).padStart(2, "0")}</span><p className="mt-2 font-semibold text-white">{step}</p></div>)}</div></section>
    <section><div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-extrabold text-white">Practical guidance for every stage of your job search.</h2><p className="mt-4 leading-7 text-slate-400">Explore published HireGo insights for practical guidance. We only link resources that are actually available.</p><Link href="/blog" className="mt-6 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">Browse published career guides →</Link></div></section>
    <section className="glass-card p-8 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">Human decision-making</p><h2 className="mt-4 text-3xl font-extrabold text-white">AI helps you prepare. Employers make hiring decisions.</h2><p className="mt-5 max-w-4xl leading-7 text-slate-300">HireGo AI can support preparation, assessments, interview practice and hiring workflows. Final employment decisions remain with the employer and the people responsible for the hiring process.</p></section>
    <section><div className="mx-auto max-w-3xl"><h2 className="text-center text-3xl font-extrabold text-white">Career Resources FAQ</h2><div className="mt-8 space-y-4">{faqs.map(([question, answer]) => <details key={question} className="glass-card p-6"><summary className="cursor-pointer font-bold text-white">{question}</summary><p className="mt-4 leading-7 text-slate-400">{answer}</p></details>)}</div></div></section>
    <div className="flex flex-wrap justify-center gap-3"><Link href="/find-jobs" className="btn-primary-blue">Explore Find Jobs</Link><Link href="/jobs" className="btn-primary-red">Browse Jobs</Link></div>
  </div>;
}

function FindJobsContent() {
  const steps = [
    ["01", "Explore available roles", "Browse jobs published on HireGo and review the role, requirements and available location information before applying."],
    ["02", "Build your candidate profile", "Keep your experience, skills and relevant candidate information together so employers have useful context when reviewing your application."],
    ["03", "Add stronger evidence", "Use available Video Resume, assessment and preparation tools to add context beyond a traditional resume where appropriate."],
    ["04", "Apply and track progress", "Apply to relevant opportunities and use HireGo to follow your application as it moves through the employer's hiring workflow."],
  ];
  return <div className="space-y-16">
    <div className="flex flex-wrap justify-center gap-3"><Link href="/jobs" className="btn-primary-red">Browse Jobs</Link><Link href="/register" className="btn-primary-blue">Create Candidate Profile</Link></div>
    <section>
      <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">From search to application</p><h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">A clearer path from discovering a role to presenting your profile.</h2><p className="mt-5 leading-7 text-slate-400">HireGo connects job discovery with candidate preparation so the information you build can support your applications instead of living in disconnected tools.</p></div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">{steps.map(([number, title, description]) => <article key={number} className="glass-card p-7"><span className="font-mono text-sm text-[#ff8a80]">{number}</span><h3 className="mt-4 text-2xl font-bold text-white">{title}</h3><p className="mt-3 leading-7 text-slate-400">{description}</p></article>)}</div>
    </section>
    <section className="grid gap-5 lg:grid-cols-3">
      <article className="glass-card p-7"><h2 className="text-2xl font-bold text-white">Prepare before you apply</h2><p className="mt-3 leading-7 text-slate-400">Use Career Resources for interview preparation, skill readiness and practical guidance throughout your job search.</p><Link href="/career-resources" className="mt-5 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">Explore Career Resources →</Link></article>
      <article className="glass-card p-7"><h2 className="text-2xl font-bold text-white">Browse Active Jobs</h2><p className="mt-3 leading-7 text-slate-400">Search through active roles across India with verified salary and company details.</p><Link href="/jobs" className="mt-5 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">Browse Jobs →</Link></article>
      <article className="glass-card p-7"><h2 className="text-2xl font-bold text-white">Add a Video Resume</h2><p className="mt-3 leading-7 text-slate-400">Give employers another way to understand your experience and communication beyond the information on a traditional resume.</p><Link href="/video-resume" className="mt-5 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">Explore Video Resume →</Link></article>
    </section>
    <section className="glass-card p-8 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff8a80]">Important</p><h2 className="mt-4 text-3xl font-extrabold text-white">HireGo helps connect candidates and hiring workflows. Employers make employment decisions.</h2><p className="mt-5 max-w-4xl leading-7 text-slate-300">Job availability, application progression and hiring outcomes depend on the employer and the requirements of each role. HireGo does not guarantee an interview, selection or job offer.</p></section>
    <section className="text-center"><h2 className="text-3xl font-extrabold text-white">Ready to explore available opportunities?</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">Browse current HireGo job listings and review each opportunity before deciding whether to apply.</p><Link href="/jobs" className="btn-primary-red mt-7">Browse Jobs</Link></section>
  </div>;
}

function PricingContent() {
  return (
    <div className="space-y-8">
      {/* ─── 1. Main Pricing Catalog (Tabs: Subscriptions & Managed Hiring) ─── */}
      <section>
        <EmployerPricingPreview />
      </section>

      {/* ─── 2. PRODUCT SHOWCASE: AI Hiring Co-Pilot ─── */}
      <section className="relative overflow-hidden rounded-[32px] border border-cyan-500/25 bg-gradient-to-br from-[#08152c] via-[#050f1f] to-[#040a14] p-8 sm:p-12 shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-[110px]" />
        
        <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left: Product Information & 3D Icons Grid */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-black tracking-wide text-cyan-300 shadow-md">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>AI SOFTWARE PRODUCT · RECRUITING AUTOMATION</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl leading-tight">
              AI Hiring Co-Pilot: Put Repetitive Hiring Operations on Autopilot.
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-slate-300">
              Recruiting teams spend up to 70% of their week chasing updates, checking candidate status, and scheduling interviews. 
              <strong className="text-white"> AI Hiring Co-Pilot</strong> executes these permitted operations autonomously—organizing candidates, routing skill assessments, and scheduling rounds while keeping consequential hiring decisions strictly in your hands.
            </p>

            {/* 3D Glass Icon Feature Grid */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_8px_20px_-4px_rgba(6,182,212,0.6)] border border-cyan-300/40 text-white font-black">
                    <span className="text-lg">⚡</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Auto-Sourcing & Signals</h4>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Automatically analyzes applicants against job criteria, highlighting verified skill evidence without manual resume parsing.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 shadow-[0_8px_20px_-4px_rgba(99,102,241,0.6)] border border-indigo-300/40 text-white font-black">
                    <span className="text-lg">📅</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Autonomous Scheduling</h4>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Collects interviewer availability, syncs calendars, and sends candidate confirmation reminders with zero back-and-forth emails.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.6)] border border-emerald-300/40 text-white font-black">
                    <span className="text-lg">📝</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Assessment Routing</h4>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Dispatches role-relevant MCQ tests and video interview prompts, compiling proctoring integrity scores for fast review.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.6)] border border-amber-300/40 text-white font-black">
                    <span className="text-lg">🛡️</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Human in the Loop</h4>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Never rejects or selects candidates automatically. Final hiring decisions and offers remain strictly under human authorization.
                </p>
              </div>
            </div>

            {/* Pricing & CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-white/10">
              <Link
                href="/ai-hiring-copilot"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-500 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 shadow-lg shadow-cyan-400/30"
              >
                <span>Explore AI Hiring Co-Pilot</span>
                <span>→</span>
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-xs font-bold text-white hover:bg-white/5 transition"
              >
                <span>View Platform Features</span>
              </Link>
              <span className="text-xs font-semibold text-slate-300 ml-auto">
                Add-on available at <strong className="text-cyan-300">₹499</strong> / role
              </span>
            </div>
          </div>

          {/* Right: Crisp High-Visibility 3D Control Center Mockup */}
          <div className="lg:col-span-5">
            <div className="relative rounded-[24px] border border-cyan-400/40 bg-gradient-to-b from-[#0c1a33] to-[#060e1d] p-5 shadow-2xl">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs font-bold text-cyan-300">HireGo Co-Pilot Control</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              {/* Job Profile Overview */}
              <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/5 p-3.5">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Role</h5>
                    <p className="text-sm font-black text-white mt-0.5">Senior Full-Stack Engineer</p>
                  </div>
                  <span className="rounded-lg bg-blue-500/20 border border-blue-500/30 px-2 py-1 text-[11px] font-bold text-blue-300">
                    42 Sourced
                  </span>
                </div>
              </div>

              {/* Real-time Pipeline Stages */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 block">Screened</span>
                  <span className="text-base font-black text-cyan-300">18 Candidates</span>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 block">Assessed</span>
                  <span className="text-base font-black text-indigo-300">9 Completed</span>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 block">HR Interviews</span>
                  <span className="text-base font-black text-emerald-300">4 Shortlisted</span>
                </div>
              </div>

              {/* Candidate Spotlight Card */}
              <div className="mt-3 rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center">
                      AS
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Aarav Sharma</p>
                      <p className="text-[10px] text-slate-400">Next.js · TypeScript · Cloud</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    96% Match
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-300">
                  <span className="text-cyan-300 font-bold">
                    ✓ Video Resume (Score 94)
                  </span>
                  <span className="text-slate-400">Proctoring Verified</span>
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-white/10 pt-3">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  ✓ Human Authorization Required
                </span>
                <span className="text-[10px] text-slate-400">Company HR Decides</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. SERVICE SHOWCASE: HireGo Managed Hiring ─── */}
      <section className="relative overflow-hidden rounded-[32px] border border-amber-500/30 bg-gradient-to-br from-[#1a1107] via-[#110c05] to-[#070503] p-8 sm:p-12 shadow-2xl">
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-amber-500/15 blur-[110px]" />

        <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left: 3D Visual Delivery Pipeline Showcase */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-[24px] border border-amber-400/40 bg-gradient-to-b from-[#1c1308] to-[#0e0904] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <img src="/marketing/hirego-logo-hd.png" alt="HireGo" className="h-4 w-auto" />
                  <span className="text-xs font-bold text-amber-300">Managed Hiring Operations</span>
                </div>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black text-amber-300">
                  100% Pay on Joining
                </span>
              </div>

              {/* Visual Recruitment Pipeline Steps */}
              <div className="mt-4 space-y-2.5">
                {[
                  { step: "01", title: "Role Requirement Sourced", sub: "HireGo talent sourcers activate active/passive pools" },
                  { step: "02", title: "Video Resumes & Pre-Screening", sub: "Verified communication, tests & tech evidence" },
                  { step: "03", title: "Company HR Conducts Interviews", sub: "Your hiring manager takes interviews & decides", highlight: true },
                  { step: "04", title: "Candidate Joins & Fee Triggered", sub: "30 to 90 days replacement warranty begins" },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`rounded-xl p-3 border ${
                      item.highlight
                        ? "border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 shadow-md"
                        : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`font-mono text-xs font-black ${item.highlight ? "text-amber-300" : "text-slate-400"}`}>{item.step}</span>
                      <h6 className={`text-xs font-bold ${item.highlight ? "text-white" : "text-slate-300"}`}>{item.title}</h6>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 ml-6">{item.sub}</p>
                  </div>
                ))}
              </div>

              {/* Bottom Guarantee Badge */}
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-center text-xs font-bold text-emerald-400">
                🛡️ Zero Upfront Cost · Guaranteed Free Replacement
              </div>
            </div>
          </div>

          {/* Right: Service Information & Why Take It */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-black tracking-wide text-amber-300 shadow-md">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>WHITE-GLOVE RECRUITMENT SERVICE · PAY PER HIRE</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl leading-tight">
              Managed Hiring: Don’t Want to Manage Software? We Deliver the Entire Hire.
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-slate-300">
              If your founding or leadership team does not have the bandwidth to source, screen, and coordinate interviews, 
              <strong className="text-white"> HireGo Managed Hiring</strong> takes over the operational heavy lifting. 
              Our talent partners handle discovery, vetting, video resumes, and candidate coordination. 
              <strong className="text-amber-300"> Your company HR conducts the final interviews and makes the hiring decision.</strong> You pay strictly when your chosen candidate joins.
            </p>

            {/* 3D Glass Icon Feature Grid */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.6)] border border-amber-300/40 text-white font-black text-base">
                    ₹0
                  </div>
                  <h4 className="font-bold text-white text-sm">Zero Financial Risk</h4>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Never pay for software licenses or inactive job postings. You pay strictly upon the successful joining of your chosen candidate.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_8px_20px_-4px_rgba(6,182,212,0.6)] border border-cyan-300/40 text-white font-black">
                    <span className="text-lg">🎥</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Pre-Vetted Video Resumes</h4>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Review recorded video communication responses and role-aligned test scores before dedicating interviewer hours.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.6)] border border-emerald-300/40 text-white font-black">
                    <span className="text-lg">⏱️</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Delivered in Minutes</h4>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Our autonomous OS matches pre-screened software engineers with video resumes and proctored code in just minutes.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 shadow-[0_8px_20px_-4px_rgba(99,102,241,0.6)] border border-indigo-300/40 text-white font-black">
                    <span className="text-lg">🤝</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Free Replacement Warranty</h4>
                </div>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Enjoy complete peace of mind with 45 to 90 days replacement warranty if a candidate departs within the warranty window.
                </p>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-white/10">
              <Link
                href="/employer/managed-hiring/request"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 shadow-lg shadow-amber-400/30"
              >
                <span>Submit Role for Managed Hiring</span>
                <span>→</span>
              </Link>
              <Link
                href="/pay-per-hire"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-xs font-bold text-white hover:bg-white/5 transition"
              >
                <span>Read Pay-Per-Hire Terms</span>
              </Link>
              <Link
                href="/contact?topic=managed-hiring"
                className="text-xs font-semibold text-amber-300 hover:underline ml-auto"
              >
                Talk to a Talent Partner →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. DECISION MATRIX: Which Option Fits Your Workflow? ─── */}
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-b from-[#081324] to-[#040914] p-8 sm:p-12 shadow-2xl">
        <h2 className="text-center text-2xl font-black text-white sm:text-3xl">
          Which Option Fits Your Team Best?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-xs sm:text-sm text-slate-400">
          Compare our three hiring models to select the right approach for your current hiring context.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Option 1 */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Self-Serve SaaS</span>
              <h3 className="mt-2 text-xl font-bold text-white">Employer Packages</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                You have an internal recruiter or HR manager who wants to post jobs, run assessments, and track applicants using our platform.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300 border-t border-white/5 pt-4">
                <li>• Quota-based job posting</li>
                <li>• Automated JD generation</li>
                <li>• Candidate match scoring</li>
                <li>• Self-directed candidate contact</li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="block text-xs font-bold text-white">Cost: ₹0 to ₹999 package</span>
              <Link href="#subscriptions" className="mt-3 block text-center rounded-xl border border-white/15 py-2.5 text-xs font-bold text-white hover:bg-white/5">
                View Subscription Plans
              </Link>
            </div>
          </div>

          {/* Option 2 */}
          <div className="rounded-2xl border border-cyan-400/40 bg-gradient-to-b from-cyan-950/30 to-blue-950/20 p-7 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Agentic Product</span>
              <h3 className="mt-2 text-xl font-bold text-white">AI Hiring Co-Pilot</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                You want software agents to automate sourcing pipelines, schedule rounds, and route tests while your hiring managers make final decisions.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-200 border-t border-cyan-400/20 pt-4">
                <li>• Autonomous candidate scoring</li>
                <li>• Automated calendar coordination</li>
                <li>• Role-specific test routing</li>
                <li>• Human approval safeguards</li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-cyan-400/20">
              <span className="block text-xs font-bold text-cyan-300">Cost: ₹499 per role assignment</span>
              <Link href="/ai-hiring-copilot" className="mt-3 block text-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-2.5 text-xs font-black text-slate-950 hover:brightness-110 shadow-md">
                Explore AI Co-Pilot
              </Link>
            </div>
          </div>

          {/* Option 3 */}
          <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-950/30 to-orange-950/20 p-7 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Full Service</span>
              <h3 className="mt-2 text-xl font-bold text-white">Managed Hiring</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                You want HireGo to handle candidate sourcing, pre-screening, and coordination. <strong className="text-white">Your company HR conducts the final interviews and makes the hiring decision.</strong> You pay strictly upon joining.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-200 border-t border-amber-400/20 pt-4">
                <li>• 100% Pay on success (₹0 upfront)</li>
                <li>• Pre-recorded video resumes</li>
                <li>• 45 to 90 days replacement warranty</li>
                <li>• Company HR takes final interview</li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-amber-400/20">
              <span className="block text-xs font-bold text-amber-300">Cost: 8.33% to 12.5% CTC or Flat Fix Charge</span>
              <Link href="/employer/managed-hiring/request" className="mt-3 block text-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-2.5 text-xs font-black text-slate-950 hover:brightness-110 shadow-md">
                Submit Requirement
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Customer-Facing Legal Disclaimer (Zero Admin Wording) ─── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-center text-xs leading-6 text-slate-400">
        All plan pricing, allowances, and service packages are backed by official HireGo service guarantees. Paid services are subject to the <Link href="/terms" className="text-cyan-400 hover:underline">Terms & Conditions</Link>, <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>, <Link href="/refund-cancellation" className="text-cyan-400 hover:underline">Refund & Cancellation Policy</Link>, and <Link href="/service-delivery" className="text-cyan-400 hover:underline">Service Delivery Policy</Link>.
      </div>
    </div>
  );
}

function PostJobPublicContent() {
  return (
    <div className="space-y-10">
      <section className="grid gap-5 md:grid-cols-3">
        {[
          ["1", "Create your employer account", "Set up your company workspace and complete the required verification steps."],
          ["2", "Create the role", "Add the title, location, requirements, work mode, openings and hiring process."],
          ["3", "Publish and manage hiring", "Publish an eligible role, review applicants and keep screening, assessments and interviews in one workflow."],
        ].map(([number, title, description]) => (
          <article key={number} className="glass-card p-7">
            <span className="font-mono text-sm text-[#82b1ff]">{number}</span>
            <h2 className="mt-4 text-xl font-bold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
          </article>
        ))}
      </section>
      <section className="glass-card p-8 text-center sm:p-10">
        <h2 className="text-3xl font-extrabold text-white">Ready to post your job?</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
          New employers can create a workspace first. Existing employers can sign in and continue directly to the job-creation workflow.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/employer/employer-registration-company-info" className="btn-primary-red">
            Create Employer Account
          </Link>
          <Link href="/employer/employer-sign-in?redirect=%2Femployer%2Fcreate-job-basic-info" className="btn-primary-blue">
            Sign In & Post a Job
          </Link>
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white">Structured from the first step</h2>
          <p className="mt-4 leading-7 text-slate-400">
            Keep role requirements, candidate evidence, assessments, interviews and progress connected instead of moving the hiring process across disconnected tools.
          </p>
        </article>
        <article className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white">Need HireGo to operate the hiring workflow?</h2>
          <p className="mt-4 leading-7 text-slate-400">
            Employers that need additional recruiting capacity can also use Managed Hiring under agreed Pay Per Hire terms.
          </p>
          <Link href="/pay-per-hire" className="mt-5 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">
            Explore Managed Hiring →
          </Link>
        </article>
      </section>
    </div>
  );
}

function EnterpriseContent() { return <div className="grid gap-8 lg:grid-cols-2"><div className="glass-card p-8"><h2 className="text-2xl font-bold">A hiring system your team can trust</h2><p className="mt-4 leading-7 text-slate-400">Standardise role requirements, keep evaluation evidence together, and give every interviewer the context they need.</p></div><div className="glass-card p-8"><h2 className="text-2xl font-bold">Ready for your workflow</h2><p className="mt-4 leading-7 text-slate-400">Connect your existing process to HireGo through secure APIs and clear permissions. No forced rip-and-replace.</p></div><div className="lg:col-span-2 text-center"><Link href="/contact" className="btn-primary-blue">Talk to our team</Link></div></div>; }
function ContactContent() { return <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2"><a className="glass-card p-6 hover:border-[#448aff]" href={`mailto:${PUBLIC_BUSINESS_DETAILS.supportEmail}`}><h2 className="font-bold">Support</h2><p className="mt-2 text-sm text-slate-400">Account, billing, privacy and service questions.</p><p className="mt-4 text-sm text-[#82b1ff]">{PUBLIC_BUSINESS_DETAILS.supportEmail}</p></a><a className="glass-card p-6 hover:border-[#448aff]" href="mailto:employers@hiregoai.com"><h2 className="font-bold">Employers</h2><p className="mt-2 text-sm text-slate-400">Build a better hiring workflow with us.</p><p className="mt-4 text-sm text-[#82b1ff]">employers@hiregoai.com</p></a><a className="glass-card p-6 hover:border-[#448aff]" href="mailto:hello@hiregoai.com"><h2 className="font-bold">General</h2><p className="mt-2 text-sm text-slate-400">Partnerships, press, and other enquiries.</p><p className="mt-4 text-sm text-[#82b1ff]">hello@hiregoai.com</p></a><div className="glass-card p-6"><h2 className="font-bold">Business Address</h2><p className="mt-2 text-sm leading-6 text-slate-400">{PUBLIC_BUSINESS_DETAILS.postalAddress}</p><p className="mt-4 text-xs uppercase tracking-wider text-slate-500">India</p></div></div>; }
function AboutContent() { return <div className="mx-auto max-w-3xl space-y-6 text-lg leading-8 text-slate-300"><p>Hiring works better when people can show what they know and employers can evaluate it consistently.</p><p>HireGo AI brings preparation, evidence, and opportunity into one trusted experience—so candidates can improve and teams can make decisions with more signal and less noise.</p><div className="pt-4 text-center"><Link href="/register" className="btn-primary-red">Join HireGo</Link></div></div>; }
function CompanyContent() { return <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3"><article className="glass-card p-7"><h2 className="text-xl font-bold">Human-first</h2><p className="mt-3 text-sm leading-6 text-slate-400">Technology should make good decisions easier, never remove human judgment.</p></article><article className="glass-card p-7"><h2 className="text-xl font-bold">Evidence-led</h2><p className="mt-3 text-sm leading-6 text-slate-400">We value useful proof of skills over noisy labels and keyword matching.</p></article><article className="glass-card p-7"><h2 className="text-xl font-bold">Built for trust</h2><p className="mt-3 text-sm leading-6 text-slate-400">Clear permissions, honest feedback, and accountable workflows guide our product.</p></article></div>; }
function CareersContent() { return <div className="mx-auto max-w-3xl text-center"><div className="glass-card p-8 text-left"><h2 className="text-2xl font-bold">We are growing thoughtfully</h2><p className="mt-4 leading-7 text-slate-400">We do not have open roles published right now. If our mission resonates with you, send a short introduction and your work to careers@hiregoai.com.</p><a href="mailto:careers@hiregoai.com" className="mt-6 inline-flex text-[#82b1ff]">careers@hiregoai.com →</a></div></div>; }
function LegalContent({ kind }: { kind: "terms" | "privacy" }) { return <div className="mx-auto max-w-3xl space-y-8 text-base leading-8 text-slate-300"><section><h2 className="text-2xl font-bold text-white">{kind === "terms" ? "Using HireGo" : "Information we handle"}</h2><p className="mt-3">This page is a plain-language overview and does not replace the complete policy presented during account creation. HireGo processes information only for operating, securing, and improving the platform.</p></section><section><h2 className="text-2xl font-bold text-white">Your responsibilities</h2><p className="mt-3">Keep account details accurate, protect your sign-in information, and use assessments and platform tools honestly. Contact support if you believe your account or data has been used improperly.</p></section><section><h2 className="text-2xl font-bold text-white">Questions</h2><p className="mt-3">For privacy or legal questions, email <a className="text-[#82b1ff] underline" href="mailto:legal@hiregoai.com">legal@hiregoai.com</a>.</p></section></div>; }
