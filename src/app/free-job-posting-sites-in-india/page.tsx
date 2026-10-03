import Link from "next/link";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/free-job-posting-sites-in-india",
  title: "Free Job Posting Sites in India: Employer Guide | HireGo AI",
  description: "Compare free job posting options in India by posting eligibility, applicant workflow, screening support and interview coordination.",
});

export default function Page() {
  const criteria = [
    ["Clear posting eligibility", "Check whether free posting is available for your account, how many roles are included and how long each listing stays active."],
    ["Useful applicant workflow", "A posting site should help you review applications and keep candidate progress organized instead of only collecting resumes."],
    ["Structured evaluation", "For roles that need it, look for screening evidence, assessments and interview coordination that can sit beside the job listing."],
    ["Employer control", "Automation can support hiring operations, while consequential employment decisions should remain with people."],
  ];
  return <MarketingShell><main className="bg-[#071322] text-white">
    <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28"><div className="mx-auto max-w-4xl">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">Employer guide · India</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Free Job Posting Sites in India: What Employers Should Compare</h1>
      <p className="mt-6 text-lg leading-8 text-slate-300">Free job posting sites can differ in posting limits, candidate workflow and hiring tools. Use this guide to compare the parts that matter before choosing where to publish a role.</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/employer/employer-registration-company-info" className="rounded-full bg-white px-7 py-3 font-bold text-[#0c2551]">Post Jobs with HireGo AI</Link><Link href="/employer/employer-sign-in" className="rounded-full border border-white/30 px-7 py-3 font-bold">Employer Sign In</Link></div>
      <p className="mt-5 text-xs leading-5 text-slate-400">Free posting availability, limits and validity depend on the current employer plan and eligibility shown in your account.</p>
    </div></section>
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
      <h2 className="text-3xl font-bold">Four things to check before you post</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-2">{criteria.map(([t,c])=><article key={t} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7"><h2 className="text-xl font-bold">{t}</h2><p className="mt-3 leading-7 text-slate-400">{c}</p></article>)}</div>
      <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.04] p-8"><h2 className="text-2xl font-bold">How HireGo AI fits the comparison</h2><p className="mt-4 max-w-4xl leading-7 text-slate-300">HireGo AI connects eligible job publishing with applicant management, structured screening, configured assessments and interview workflow coordination. Employers remain responsible for consequential hiring decisions.</p><div className="mt-5 flex flex-wrap gap-5 text-sm font-bold text-[#82b1ff]"><Link href="/free-job-posting">Free Job Posting in India →</Link><Link href="/how-to-post-a-job-for-free">How to post for free →</Link><Link href="/pricing">Employer plans →</Link></div></div>
    </section>
  </main></MarketingShell>;
}