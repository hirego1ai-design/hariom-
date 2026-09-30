import Link from "next/link";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SEO_JOB_CITIES } from "@/lib/seoJobCities";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/free-job-posting",
  title: "Free Job Posting in India | HireGo AI for Employers",
  description: "Post jobs on HireGo AI and manage applicants with structured screening, assessments and interview workflows. Explore employer hiring pages for major Indian cities.",
});

export default function FreeJobPostingIndiaPage() {
  const faq = [
    {
      question: "Can employers post jobs for free on HireGo AI?",
      answer: "HireGo AI can provide free job posting access based on the employer plan and eligibility shown in the account. Current limits and validity are always shown before a role is published.",
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
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Free Job Posting in India</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Create a clear role, publish it for candidates, and manage screening and interview steps in one structured hiring workflow.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/employer/employer-sign-in" className="rounded-full bg-white px-7 py-3 font-bold text-[#0c2551]">Post a Job</Link>
              <Link href="/jobs" className="rounded-full border border-white/30 px-7 py-3 font-bold text-white">Browse Jobs</Link>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-xs leading-5 text-slate-400">
              Free posting availability, limits and validity depend on the current employer plan and eligibility shown in your HireGo account.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
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
          }) }}
        />
      </main>
    </MarketingShell>
  );
}
