import Link from "next/link";
import MarketingShell from "./MarketingShell";
import { PUBLIC_BUSINESS_DETAILS } from "@/lib/publicBusinessDetails";
import EmployerPricingPreview from "./EmployerPricingPreview";

type PageKind = "features" | "pricing" | "enterprise" | "about" | "company" | "careers" | "contact" | "terms" | "privacy" | "ai-features" | "find-jobs" | "certifications" | "career-resources" | "post-job-public";

const content: Record<PageKind, { eyebrow: string; title: string; intro: string }> = {
  features: { eyebrow: "Agentic Hiring Operating System", title: "One connected system for the hiring workflow.", intro: "HireGo AI connects sourcing, screening, assessments, interviews, candidate communication and workflow coordination while keeping consequential employment decisions under human control." },
  pricing: { eyebrow: "Employer Pricing", title: "Choose how you want to hire.", intro: "Use employer hiring plans, add the AI Hiring Co-Pilot as a separate product, or talk to HireGo about managed hiring support." },
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
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">\n        {kind === "features" && <FeaturesContent />}\n        {kind === "career-resources" && <CareerResourcesContent />}\n        {kind === "find-jobs" && <FindJobsContent />}
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
    { title: "Assessments & AI Mock Interviews", description: "Use structured assessments and interview-practice experiences to build useful evidence of skills and job readiness.", href: "/ai-mock-interview", cta: "Explore AI Mock Interviews" },
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
    ["Interview preparation", "Practise answering role-specific interview questions in a structured environment before speaking with an employer.", "/ai-mock-interview", "Start an AI Mock Interview"],
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
    <div className="flex flex-wrap justify-center gap-3"><Link href="/ai-mock-interview" className="btn-primary-blue">Practice AI Mock Interview</Link><Link href="/jobs" className="btn-primary-red">Find Jobs</Link></div>
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
      <article className="glass-card p-7"><h2 className="text-2xl font-bold text-white">Practise interviews</h2><p className="mt-3 leading-7 text-slate-400">Use AI Mock Interviews to practise explaining your experience and responses before an employer interview.</p><Link href="/ai-mock-interview" className="mt-5 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">Practice AI Mock Interview →</Link></article>
      <article className="glass-card p-7"><h2 className="text-2xl font-bold text-white">Add a Video Resume</h2><p className="mt-3 leading-7 text-slate-400">Give employers another way to understand your experience and communication beyond the information on a traditional resume.</p><Link href="/video-resume" className="mt-5 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">Explore Video Resume →</Link></article>
    </section>
    <section className="glass-card p-8 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff8a80]">Important</p><h2 className="mt-4 text-3xl font-extrabold text-white">HireGo helps connect candidates and hiring workflows. Employers make employment decisions.</h2><p className="mt-5 max-w-4xl leading-7 text-slate-300">Job availability, application progression and hiring outcomes depend on the employer and the requirements of each role. HireGo does not guarantee an interview, selection or job offer.</p></section>
    <section className="text-center"><h2 className="text-3xl font-extrabold text-white">Ready to explore available opportunities?</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">Browse current HireGo job listings and review each opportunity before deciding whether to apply.</p><Link href="/jobs" className="btn-primary-red mt-7">Browse Jobs</Link></section>
  </div>;
}

function PricingContent() {
  return <div className="space-y-14">
    <section>
      <div className="mx-auto mb-8 max-w-3xl text-center"><h2 className="text-3xl font-extrabold text-white">Employer hiring plans</h2><p className="mt-4 leading-7 text-slate-400">The plans and prices below are loaded from HireGo's live subscription catalog. Administrators control plan names, prices, job-posting quotas, validity and public benefits from the Admin Subscription & Plan Management console.</p></div>
      <EmployerPricingPreview />
    </section>
    <section className="grid gap-5 lg:grid-cols-2">
      <article className="glass-card p-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#82b1ff]">AI Hiring Co-Pilot</p><h2 className="mt-4 text-3xl font-extrabold text-white">A separate agentic hiring product.</h2><p className="mt-4 leading-7 text-slate-400">Co-Pilot plans and regional pricing are managed independently through HireGo's Admin Copilot Commerce console. The public Co-Pilot flow resolves the applicable catalog for the billing country, while checkout uses the authoritative commerce configuration.</p><p className="mt-3 text-sm leading-6 text-slate-500">Job posting is separate from Co-Pilot, and consequential employment decisions remain with people.</p><Link href="/ai-hiring-copilot" className="mt-6 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">Explore AI Hiring Co-Pilot →</Link></article>
      <article className="glass-card p-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ff8a80]">Managed Hiring</p><h2 className="mt-4 text-3xl font-extrabold text-white">Need hands-on hiring support?</h2><p className="mt-4 leading-7 text-slate-400">Managed Hiring is for employers that want additional operational support rather than a self-serve subscription alone. Commercial terms depend on the agreed hiring requirement and service arrangement.</p><Link href="/pay-per-hire" className="mt-6 inline-flex text-sm font-semibold text-[#82b1ff] hover:underline">Explore Managed Hiring →</Link></article>
    </section>
    <section className="glass-card p-8 sm:p-10"><h2 className="text-3xl font-extrabold text-white">Which option fits your workflow?</h2><div className="mt-7 grid gap-5 md:grid-cols-3"><div><h3 className="font-bold text-white">Employer plans</h3><p className="mt-2 text-sm leading-6 text-slate-400">For employers who want job-posting and plan entitlements from the standard employer catalog.</p></div><div><h3 className="font-bold text-white">AI Hiring Co-Pilot</h3><p className="mt-2 text-sm leading-6 text-slate-400">For teams that want agentic assistance with permitted hiring operations and workflow coordination.</p></div><div><h3 className="font-bold text-white">Managed Hiring</h3><p className="mt-2 text-sm leading-6 text-slate-400">For employers who want HireGo to provide additional operational hiring support under agreed commercial terms.</p></div></div><div className="mt-8 flex flex-wrap gap-3"><Link href="/features" className="btn-primary-blue">Compare platform capabilities</Link><Link href="/contact" className="btn-primary-red">Contact HireGo</Link></div></section>
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-xs leading-6 text-slate-400">Displayed employer plan pricing comes from the current Admin-managed catalog and may change when an administrator updates that catalog. Paid services are subject to the <Link href="/terms" className="text-[#82b1ff] hover:underline">Terms & Conditions</Link>, <Link href="/privacy" className="text-[#82b1ff] hover:underline">Privacy Policy</Link>, <Link href="/refund-cancellation" className="text-[#82b1ff] hover:underline">Refund & Cancellation Policy</Link> and <Link href="/service-delivery" className="text-[#82b1ff] hover:underline">Service Delivery Policy</Link>.</div>
  </div>;
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
