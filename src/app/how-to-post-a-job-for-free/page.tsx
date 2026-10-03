import Link from "next/link";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/how-to-post-a-job-for-free",
  title: "How to Post a Job for Free in India | Employer Guide",
  description: "Learn how to post a job for free in India: prepare the role, create an employer account, confirm eligibility, publish and manage applicants.",
});

export default function Page() {
 const steps=[["1. Prepare the role","Write a specific title, location, work mode, responsibilities, required skills and experience. Clear requirements help candidates understand the role before applying."],["2. Create an employer account","Register your company and complete the account information required for the posting workflow."],["3. Check posting eligibility","Review the free-posting availability, limits and validity shown in your employer account before publication."],["4. Publish and manage applicants","Publish the eligible role, review applications and use the configured screening, assessment and interview workflow as appropriate."]];
 const howTo={"@context":"https://schema.org","@type":"HowTo",name:"How to post a job for free in India",step:steps.map(([name,text])=>({"@type":"HowToStep",name,text}))};
 return <MarketingShell><main className="bg-[#071322] text-white">
  <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28"><div className="mx-auto max-w-4xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">Step-by-step employer guide</p><h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">How to Post a Job for Free in India</h1><p className="mt-6 text-lg leading-8 text-slate-300">Start with a clear role, create your employer account, confirm the posting eligibility shown in the account and publish when the role is ready.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/employer/employer-registration-company-info" className="rounded-full bg-white px-7 py-3 font-bold text-[#0c2551]">Start Employer Registration</Link><Link href="/employer/employer-sign-in" className="rounded-full border border-white/30 px-7 py-3 font-bold">Employer Sign In</Link></div></div></section>
  <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 md:py-24"><h2 className="text-3xl font-bold">Job posting process</h2><div className="mt-8 space-y-5">{steps.map(([t,c])=><article key={t} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7"><h2 className="text-xl font-bold">{t}</h2><p className="mt-3 leading-7 text-slate-400">{c}</p></article>)}</div><div className="mt-12 flex flex-wrap gap-5 text-sm font-bold text-[#82b1ff]"><Link href="/free-job-posting">Free job posting hub →</Link><Link href="/where-to-post-jobs-for-free">Where to post jobs →</Link><Link href="/free-job-posting-for-employers">Employer workflow →</Link></div></section>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(howTo).replace(/</g,"\\u003c")}} />
 </main></MarketingShell>;
}