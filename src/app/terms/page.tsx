import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/terms",
  title: "Terms and Conditions | HireGo AI",
  description: "Terms for candidates and employers using HireGo AI, including managed hiring, video resumes and human hiring decisions.",
});

export default function TermsPage() {
  return <MarketingShell><div className="bg-white text-slate-800">
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-700">Legal</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Terms and Conditions</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: 20 September 2026</p>
      <p className="mt-8 text-lg leading-8">These terms describe the basic rules for using HireGo AI. A signed employer service agreement or an in-product service term may add specific commercial and operational terms. If you have a question, contact <a className="text-blue-700 underline" href="mailto:legal@hiregoai.com">legal@hiregoai.com</a>.</p>
      <div className="mt-10 space-y-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-slate-950 [&_p]:leading-7 [&_li]:leading-7">
        <section><h2>Accounts and acceptable use</h2><p>Provide accurate information, keep your sign-in details secure and use the platform for lawful hiring and career purposes. Do not impersonate another person, submit material you do not have the right to use, interfere with the service, scrape private candidate information or misuse assessments and recordings.</p></section>
        <section><h2>Candidate information and video resumes</h2><p>Candidates are responsible for the information they submit and should avoid including sensitive information that is not needed for a job application. A video resume is an optional way to present experience, knowledge and communication in the candidate’s own words. Obtain permission from any other person whose image or voice you include. HireGo may process the recording to produce a transcript and review report, as described in the <Link className="text-blue-700 underline" href="/privacy">Privacy Policy</Link>.</p></section>
        <section><h2>Reports and hiring decisions</h2><p>Automated summaries, scores and suggestions are supporting information and may be incomplete or wrong. They are not a guarantee of ability, job fit, truthfulness or future performance. Employers must review relevant evidence, consider appropriate alternatives or accommodations, and make their own lawful hiring decisions. HireGo does not promise a job, interview, candidate or hiring outcome to any user.</p></section>
        <section><h2>Managed Hiring and Pay Per Hire</h2><p>Managed Hiring can combine HireGo personnel, platform tools and permitted automation to help run an agreed hiring process. The employer controls final selection. Where an employer chooses Pay Per Hire, a fee is due only when the successful hire event defined in that employer’s signed commercial agreement occurs. The amount, trigger, invoice timing, replacement terms, taxes and any exceptions are set in that agreement; this public page does not set a universal fee or redefine a signed agreement.</p></section>
        <section><h2>Employer responsibilities</h2><p>Employers and recruiters must have a lawful basis to use candidate information, keep access limited to people involved in the hiring process, use job related criteria, respect candidate rights and comply with applicable employment and privacy laws. Do not use a video report as an automatic rejection rule or infer protected or sensitive traits from appearance, accent, voice or mannerisms.</p></section>
        <section><h2>Availability and changes</h2><p>Features may vary by account, region, configuration and service agreement. We may maintain, improve or suspend a feature when needed for reliability, security or legal compliance. Contact us if a feature needed for an active engagement is unavailable.</p></section>
        <section><h2>Content and intellectual property</h2><p>You retain rights to content you submit. You allow HireGo to host, process and display it as needed to provide the service and your selected hiring workflow, subject to the Privacy Policy. HireGo retains rights to its platform, design and software. Do not copy or resell the platform without authorization.</p></section>
        <section><h2>Questions and concerns</h2><p>For service, privacy or legal concerns, email <a className="text-blue-700 underline" href="mailto:legal@hiregoai.com">legal@hiregoai.com</a> or visit <Link className="text-blue-700 underline" href="/contact">Contact</Link>. Additional terms in a signed agreement govern the applicable employer engagement.</p></section>
      </div>
    </div>
  </div></MarketingShell>;
}
