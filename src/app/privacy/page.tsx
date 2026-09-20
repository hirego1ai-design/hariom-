import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/privacy",
  title: "Privacy Policy | HireGo AI",
  description: "How HireGo handles candidate, employer and video resume information, including analysis, sharing and privacy requests.",
});

export default function PrivacyPage() {
  return <MarketingShell><div className="bg-white text-slate-800">
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-700">Privacy</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: 20 September 2026</p>
      <p className="mt-8 text-lg leading-8">HireGo AI provides a hiring platform for candidates, employers and recruiters. This policy explains what information the platform handles and how video resumes and their analysis fit into the hiring process. For a question or privacy request, write to <a className="text-blue-700 underline" href="mailto:legal@hiregoai.com">legal@hiregoai.com</a>.</p>
      <div className="mt-10 space-y-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-slate-950 [&_p]:leading-7 [&_li]:leading-7">
        <section><h2>Information we handle</h2><p>Depending on how you use HireGo, we handle account and contact details; candidate profiles, resumes, skills, work history and applications; employer and job information; assessments, interview activity and feedback; messages and support requests; payment and service records; and technical records needed to operate and protect the service.</p></section>
        <section><h2>Video resumes and analysis</h2><p>A candidate may choose to record or upload a video resume. The recording may contain the candidate’s image, voice, statements and other personal information visible or audible in the recording. The platform may create a transcript and a report with descriptive details such as speech pace, pauses and recording quality. Automated outputs can be inaccurate, especially when audio or video quality is poor, and must be interpreted in context.</p><p className="mt-3">Video analysis is intended to help a person review a candidate’s presentation. It must not be treated as a measure of character, honesty, personality, emotional state, disability or overall suitability for a job. HireGo does not intend a video score alone to make a final hiring or rejection decision. Candidates can request an alternative way to present relevant information through the contact address above.</p></section>
        <section><h2>Why we use information</h2><ul className="list-disc space-y-2 pl-6"><li>To create accounts, display profiles and support applications and hiring workflows.</li><li>To let candidates present experience and job related evidence to relevant employers.</li><li>To process optional video resumes and show a review report where the feature is available.</li><li>To coordinate assessments, interviews, managed hiring and requested services.</li><li>To provide support, protect accounts, investigate misuse and meet applicable obligations.</li><li>To improve reliability and usability using appropriate access controls and safeguards.</li></ul></section>
        <section><h2>Who can see information</h2><p>Candidates can access their own information. Authorized HireGo personnel and service providers may access information where needed to operate and support the platform. Employer and recruiter access should be limited to candidates connected to their hiring process and to the permissions granted in the product. A video resume is not intended to be a public profile by default. Employers remain responsible for their use of candidate information and their hiring decisions.</p></section>
        <section><h2>Storage, security and retention</h2><p>HireGo uses access controls and private file storage for uploaded materials. No internet service can promise absolute security. We retain information for the period needed for the relevant account, hiring process, agreed service, legal obligation or dispute, then delete or deidentify it when appropriate. A specific video retention period is not currently stated here because the product does not yet enforce one consistently across all records and files. Contact us to ask about a particular recording or request deletion.</p></section>
        <section><h2>Your choices and requests</h2><p>Video resumes are optional unless a particular employer workflow states otherwise. You may ask to access, correct or delete information, withdraw a permission where applicable, or raise a concern about an automated report or employer use. We will verify the request and respond in line with applicable law and any information we must retain. Email <a className="text-blue-700 underline" href="mailto:legal@hiregoai.com">legal@hiregoai.com</a>. You can also <Link className="text-blue-700 underline" href="/contact">contact the team</Link>.</p></section>
        <section><h2>Changes to this policy</h2><p>We may update this page as the platform, service providers or legal requirements change. The date above shows when this version was last updated. Material changes should be communicated through the service or another appropriate channel.</p></section>
      </div>
    </div>
  </div></MarketingShell>;
}
