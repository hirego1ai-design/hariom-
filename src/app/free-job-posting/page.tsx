import Link from "next/link";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SEO_JOB_CITIES } from "@/lib/seoJobCities";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/free-job-posting",
  title: "Free Job Posting in India for Employers | HireGo AI",
  description: "Post jobs for free in India with HireGo AI and manage applicant screening, assessments and interview workflows. Employers retain final hiring decisions.",
});

export default function FreeJobPostingIndiaPage() {
  const faq = [
    {
      question: "Where can I post jobs for free in India?",
      answer: "Employers can create a HireGo AI employer account and use the job posting workflow. Free posting access, limits and validity depend on the current plan and eligibility shown in the account before publication.",
    },
    {
      question: "Which Indian cities does HireGo AI support?",
      answer: "Employers can publish roles across India. HireGo AI is building dedicated hiring pages for major markets including Delhi NCR, Noida, Gurugram, Bengaluru, Hyderabad, Pune, Mumbai, Chennai and Ahmedabad.",
    },
    {
      question: "What happens after a job is published?",
      answer: "Published roles can receive applications inside HireGo AI. Employers can review candidate evidence, use configured assessments and coordinate interviews from the hiring workflow.",
    },
  ];

  return (
    <MarketingShell>
      <main className="bg-[#071322] text-white">
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">Hire across India</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Post Jobs for Free in India</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Looking for free job posting in India? Create an employer account, publish eligible roles, and manage applicant screening, assessments and interview steps in one structured hiring workflow.
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              HireGo AI gives employers a free job posting workflow with clear role details, applicant management and hiring tools across India.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/employer/employer-registration-company-info" className="rounded-full bg-white px-7 py-3 font-bold text-[#0c2551]">Post Jobs for Free</Link>
              <Link href="/employer/employer-sign-in" className="rounded-full border border-white/30 px-7 py-3 font-bold text-white">Already an Employer? Sign In</Link>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-xs leading-5 text-slate-400">
              Free posting availability, limits and validity depend on the current employer plan and eligibility shown in your HireGo account.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="mb-12 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">How to post a job for free</p>
            <h2 className="mt-3 text-3xl font-bold">Free job posting for employers in three steps</h2>
            <p className="mt-4 leading-7 text-slate-400">
              If you are searching for where to post jobs for free in India, start by creating your employer account. Your account shows the current posting eligibility, limits and validity before you publish.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["1", "Create the role", "Add the job title, location, requirements, work mode and other role details."],
              ["2", "Publish for candidates", "Make the role available to job seekers once it is ready and eligible to publish."],
              ["3", "Manage hiring", "Review applications, screening evidence, assessments and interview progress in one workflow."],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
                <span className="text-sm font-bold text-[#82b1ff]">{number}</span>
                <h2 className="mt-4 text-xl font-bold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">AI recruitment workflow</p>
            <h2 className="mt-3 text-3xl font-bold">One hiring platform from job posting to interview coordination</h2>
            <p className="mt-4 max-w-4xl leading-7 text-slate-300">
              HireGo AI connects job publishing, candidate applications, structured screening, configured assessments and interview progression. Employers can use the platform directly or discuss Managed Hiring when they want operational support.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold">
              <Link href="/services" className="text-[#82b1ff]">Managed Hiring →</Link>
              <Link href="/solutions" className="text-[#82b1ff]">Hiring Solutions →</Link>
              <Link href="/pricing" className="text-[#82b1ff]">Employer Plans →</Link>
            </div>
          </div>

          <div className="mt-16">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">Priority hiring markets</p>
            <h2 className="mt-3 text-3xl font-bold">Post jobs in major Indian cities</h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">
              These pages are built around local hiring intent rather than duplicate city-name swaps, with city-specific hiring categories and market areas.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SEO_JOB_CITIES.map((city) => (
                <Link key={city.slug} href={`/free-job-posting/${city.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#448aff]">
                  <span className="text-lg font-bold">Free job posting in {city.name}</span>
                  <span className="mt-2 block text-sm text-slate-400">{city.industries.slice(0, 3).join(" · ")}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
            <h2 className="text-2xl font-bold">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              {faq.map((item) => (
                <section key={item.question}>
                  <h3 className="font-bold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.answer}</p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "HireGo AI recruitment and hiring platform in India",
            serviceType: "Recruitment software, job posting and hiring workflow",
            provider: {
              "@type": "Organization",
              name: "HireGo AI",
              url: "https://www.hiregoai.com",
              logo: "https://www.hiregoai.com/marketing/hirego-logo-hd.png",
            },
            areaServed: {
              "@type": "Country",
              name: "India",
            },
            url: "https://www.hiregoai.com/free-job-posting",
          }).replace(/</g, "\\u003c") }}
        />
      </main>
    </MarketingShell>
  );
}
