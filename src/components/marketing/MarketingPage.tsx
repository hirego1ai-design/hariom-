import Link from "next/link";
import MarketingShell from "./MarketingShell";

type PageKind = "features" | "pricing" | "enterprise" | "about" | "company" | "careers" | "blog" | "contact" | "terms" | "privacy" | "ai-features" | "find-jobs" | "certifications" | "career-resources" | "post-job-public";

const content: Record<PageKind, { eyebrow: string; title: string; intro: string }> = {
  features: { eyebrow: "One trusted workflow", title: "Turn potential into proof.", intro: "HireGo AI helps candidates build job-ready evidence and gives employers a faster, fairer way to discover it." },
  pricing: { eyebrow: "Simple, transparent plans", title: "Invest in better hiring.", intro: "Start with the tools you need today and scale when your hiring or career goals grow." },
  enterprise: { eyebrow: "For teams that are hiring", title: "Hire people for what they can do.", intro: "Create structured hiring workflows, compare verified skills, and move from shortlist to offer with confidence." },
  about: { eyebrow: "Our mission", title: "Make opportunity easier to reach.", intro: "We are building a more useful bridge between human potential and the teams looking for it." },
  company: { eyebrow: "Inside HireGo", title: "A team building better hiring infrastructure.", intro: "We combine thoughtful product design, responsible AI, and practical workflows to make hiring clearer for everyone." },
  careers: { eyebrow: "Join HireGo", title: "Build the future of work with us.", intro: "We are a small, ambitious team working on products that make hiring more human and more evidence-based." },
  blog: { eyebrow: "Insights", title: "Ideas for better careers and hiring.", intro: "Practical guidance for candidates, recruiters, and leaders navigating a changing world of work." },
  contact: { eyebrow: "We are here to help", title: "Let’s talk about your next hire.", intro: "Tell us what you are building, hiring for, or trying to improve. Our team will route your message to the right person." },
  terms: { eyebrow: "Legal", title: "Terms of service", intro: "These terms explain the rules for using HireGo AI and the responsibilities of everyone using the platform." },
  privacy: { eyebrow: "Legal", title: "Privacy at HireGo", intro: "We collect and use information to provide a safe, useful hiring platform. This page explains the choices and controls available to you." },
  "ai-features": { eyebrow: "The HireGo platform", title: "Useful AI, with people in control.", intro: "Use AI to prepare, organise, and surface signal—while candidates and hiring teams keep the final say." },
  "find-jobs": { eyebrow: "Find your next step", title: "Search with more confidence.", intro: "Discover roles that match your goals and present a profile that gives employers useful context." },
  certifications: { eyebrow: "Show what you know", title: "Turn progress into proof.", intro: "Build credible evidence of your skills through structured practice and assessments." },
  "career-resources": { eyebrow: "Career resources", title: "Practical help for the journey.", intro: "Guides, practice, and feedback to help you move from where you are to where you want to be." },
  "post-job-public": { eyebrow: "For employers", title: "Post a role people can trust.", intro: "Create a clear brief, reach prepared candidates, and keep your hiring process structured from day one." },
};

function Hero({ kind }: { kind: PageKind }) {
  const item = content[kind];
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
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        {["features", "ai-features", "find-jobs", "certifications", "career-resources"].includes(kind) && (
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
        {(kind === "enterprise" || kind === "post-job-public") && <EnterpriseContent />}
        {kind === "contact" && <ContactContent />}
        {kind === "about" && <AboutContent />}
        {kind === "company" && <CompanyContent />}
        {kind === "careers" && <CareersContent />}
        {kind === "blog" && <BlogContent />}
        {(kind === "terms" || kind === "privacy") && <LegalContent kind={kind} />}
      </section>
    </MarketingShell>
  );
}

function PricingContent() {
  const plans: Array<{ name: string; description: string; price: string; features: string[] }> = [
    { name: "Starter", description: "For exploring your next step", price: "₹0", features: ["Profile builder", "Browse verified roles", "Basic readiness insights"] },
    { name: "Pro", description: "For candidates who want momentum", price: "₹499/mo", features: ["Everything in Starter", "Practice assessments", "Detailed readiness report"] },
    { name: "Teams", description: "For employers building talent pipelines", price: "Let’s talk", features: ["Structured hiring workflows", "Verified candidate signals", "Dedicated support"] },
  ];
  return <div className="grid gap-5 lg:grid-cols-3">{plans.map(({ name, description, price, features }) => <article key={name} className="glass-card flex flex-col p-7"><h2 className="text-2xl font-bold">{name}</h2><p className="mt-2 min-h-12 text-sm text-slate-400">{description}</p><p className="mt-6 text-4xl font-extrabold">{price}</p><ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">{features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-[#4caf50]">✓</span>{feature}</li>)}</ul><Link href={name === "Teams" ? "/contact" : "/register"} className="btn-primary-red mt-8 w-full">{name === "Teams" ? "Contact sales" : "Get started"}</Link></article>)}</div>;
}

function EnterpriseContent() { return <div className="grid gap-8 lg:grid-cols-2"><div className="glass-card p-8"><h2 className="text-2xl font-bold">A hiring system your team can trust</h2><p className="mt-4 leading-7 text-slate-400">Standardise role requirements, keep evaluation evidence together, and give every interviewer the context they need.</p></div><div className="glass-card p-8"><h2 className="text-2xl font-bold">Ready for your workflow</h2><p className="mt-4 leading-7 text-slate-400">Connect your existing process to HireGo through secure APIs and clear permissions. No forced rip-and-replace.</p></div><div className="lg:col-span-2 text-center"><Link href="/contact" className="btn-primary-blue">Talk to our team</Link></div></div>; }
function ContactContent() { return <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3"><a className="glass-card p-6 hover:border-[#448aff]" href="mailto:support@hiregoai.com"><h2 className="font-bold">Support</h2><p className="mt-2 text-sm text-slate-400">Questions about your account or assessment.</p><p className="mt-4 text-sm text-[#82b1ff]">support@hiregoai.com</p></a><a className="glass-card p-6 hover:border-[#448aff]" href="mailto:employers@hiregoai.com"><h2 className="font-bold">Employers</h2><p className="mt-2 text-sm text-slate-400">Build a better hiring workflow with us.</p><p className="mt-4 text-sm text-[#82b1ff]">employers@hiregoai.com</p></a><a className="glass-card p-6 hover:border-[#448aff]" href="mailto:hello@hiregoai.com"><h2 className="font-bold">General</h2><p className="mt-2 text-sm text-slate-400">Partnerships, press, and other enquiries.</p><p className="mt-4 text-sm text-[#82b1ff]">hello@hiregoai.com</p></a></div>; }
function AboutContent() { return <div className="mx-auto max-w-3xl space-y-6 text-lg leading-8 text-slate-300"><p>Hiring works better when people can show what they know and employers can evaluate it consistently.</p><p>HireGo AI brings preparation, evidence, and opportunity into one trusted experience—so candidates can improve and teams can make decisions with more signal and less noise.</p><div className="pt-4 text-center"><Link href="/register" className="btn-primary-red">Join HireGo</Link></div></div>; }
function CompanyContent() { return <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3"><article className="glass-card p-7"><h2 className="text-xl font-bold">Human-first</h2><p className="mt-3 text-sm leading-6 text-slate-400">Technology should make good decisions easier, never remove human judgment.</p></article><article className="glass-card p-7"><h2 className="text-xl font-bold">Evidence-led</h2><p className="mt-3 text-sm leading-6 text-slate-400">We value useful proof of skills over noisy labels and keyword matching.</p></article><article className="glass-card p-7"><h2 className="text-xl font-bold">Built for trust</h2><p className="mt-3 text-sm leading-6 text-slate-400">Clear permissions, honest feedback, and accountable workflows guide our product.</p></article></div>; }
function CareersContent() { return <div className="mx-auto max-w-3xl text-center"><div className="glass-card p-8 text-left"><h2 className="text-2xl font-bold">We are growing thoughtfully</h2><p className="mt-4 leading-7 text-slate-400">We do not have open roles published right now. If our mission resonates with you, send a short introduction and your work to careers@hiregoai.com.</p><a href="mailto:careers@hiregoai.com" className="mt-6 inline-flex text-[#82b1ff]">careers@hiregoai.com →</a></div></div>; }
function BlogContent() { const posts = [["The job-ready candidate", "Why evidence beats a list of keywords."], ["Fairer hiring signals", "How structured assessments reduce guesswork."], ["From feedback to progress", "Making a lower score a useful next step."]]; return <div className="grid gap-5 md:grid-cols-3">{posts.map(([title, description]) => <article key={title} className="glass-card p-7"><p className="text-xs font-bold uppercase tracking-widest text-[#ff8a80]">HireGo insights</p><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{description}</p><span className="mt-6 inline-block text-sm text-[#82b1ff]">Read more →</span></article>)}</div>; }
function LegalContent({ kind }: { kind: "terms" | "privacy" }) { return <div className="mx-auto max-w-3xl space-y-8 text-base leading-8 text-slate-300"><section><h2 className="text-2xl font-bold text-white">{kind === "terms" ? "Using HireGo" : "Information we handle"}</h2><p className="mt-3">This page is a plain-language overview and does not replace the complete policy presented during account creation. HireGo processes information only for operating, securing, and improving the platform.</p></section><section><h2 className="text-2xl font-bold text-white">Your responsibilities</h2><p className="mt-3">Keep account details accurate, protect your sign-in information, and use assessments and platform tools honestly. Contact support if you believe your account or data has been used improperly.</p></section><section><h2 className="text-2xl font-bold text-white">Questions</h2><p className="mt-3">For privacy or legal questions, email <a className="text-[#82b1ff] underline" href="mailto:legal@hiregoai.com">legal@hiregoai.com</a>.</p></section></div>; }
