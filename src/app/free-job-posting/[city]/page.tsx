import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SEO_JOB_CITIES, findSeoJobCity } from "@/lib/seoJobCities";
import { marketingMetadata } from "@/lib/marketingMetadata";

type Props = { params: Promise<{ city: string }> };

export function generateStaticParams() {
  return SEO_JOB_CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = findSeoJobCity(slug);
  if (!city) return {};
  return marketingMetadata({
    path: `/free-job-posting/${city.slug}`,
    title: `Free Job Posting & AI Hiring Platform in ${city.name} | HireGo AI`,
    description: `Post jobs in ${city.name}, screen applicants, coordinate assessments and manage interviews with HireGo AI's recruitment and hiring workflow for employers.`,
  });
}

export default async function FreeJobPostingCityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = findSeoJobCity(slug);
  if (!city) notFound();

  const localAreas = city.areas.slice(0, 4).join(", ");

  const faq = [
    {
      question: `Can I post a job for free in ${city.name} on HireGo AI?`,
      answer: "HireGo AI can provide free job posting access based on the employer plan and eligibility shown in your account. Current limits and validity are displayed before publication.",
    },
    {
      question: `What kinds of roles can I post in ${city.name}?`,
      answer: `Employers can publish legitimate open roles across functions. Common hiring areas in ${city.name} include ${city.industries.join(", ")}.`,
    },
    {
      question: "Can I manage applicants after posting?",
      answer: "Yes. HireGo AI is designed to keep applications, candidate evidence, configured assessments and interview progression inside one employer workflow.",
    },
    {
      question: `Is HireGo AI recruitment software for employers hiring in ${city.name}?`,
      answer: `HireGo AI is a hiring platform for employers that want job posting, applicant workflow, structured screening, assessments and interview coordination in one system. Teams hiring across ${localAreas} can use the same employer workflow while keeping each role's real location and requirements clear.`,
    },
  ];

  return (
    <MarketingShell>
      <main className="bg-[#071322] text-white">
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">Employers · {city.regionLabel}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Free Job Posting & AI Hiring Platform in {city.name}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">{city.employerIntro}</p>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              HireGo AI brings job posting, applicant tracking, structured screening, assessments and interview coordination into one employer workflow for teams hiring in {city.name}.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/employer/employer-sign-in" className="rounded-full bg-white px-7 py-3 font-bold text-[#0c2551]">Post a Job in {city.name}</Link>
              <Link href={`/jobs-in/${city.slug}`} className="rounded-full border border-white/30 px-7 py-3 font-bold text-white">See Jobs in {city.name}</Link>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-xs leading-5 text-slate-400">
              Free posting availability, limits and validity depend on the current employer plan and eligibility shown in your HireGo account.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <h2 className="text-2xl font-bold">Hiring categories in {city.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Build a role around real requirements instead of a generic listing.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {city.industries.map((item) => <li key={item} className="rounded-xl border border-white/10 px-4 py-3 text-sm">{item}</li>)}
              </ul>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <h2 className="text-2xl font-bold">Local hiring areas</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Use accurate job locations so candidates can understand where and how the role is based.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {city.areas.map((item) => <li key={item} className="rounded-xl border border-white/10 px-4 py-3 text-sm">{item}</li>)}
              </ul>
            </article>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">Recruitment platform for {city.name}</p>
            <h2 className="mt-3 text-3xl font-bold">Hire across {city.name} without stitching together separate recruiting tools</h2>
            <p className="mt-4 max-w-4xl leading-7 text-slate-300">
              Employers hiring across {localAreas} can publish genuine openings, keep applicants organised, route configured assessments and coordinate interviews from one workflow. Common hiring areas include {city.industries.join(", ")}.
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                ["Local job visibility", `Use accurate ${city.name} locations and role details so candidates understand where the opportunity is based.`],
                ["Structured screening", "Review applications and role-relevant evidence in one place instead of relying on disconnected spreadsheets and chats."],
                ["Interview coordination", "Keep interview stages, reminders and progression connected to the same hiring requirement."],
              ].map(([title, copy]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
                </article>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-4 text-sm font-bold">
              <Link href="/services" className="text-[#82b1ff]">Explore managed hiring →</Link>
              <Link href="/solutions" className="text-[#82b1ff]">Explore employer solutions →</Link>
              <Link href="/pricing" className="text-[#82b1ff]">View employer plans →</Link>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              ["1", "Define the job", "Add title, location, work mode, requirements and role details."],
              ["2", "Publish", "Make the job available when the role is complete and eligible to publish."],
              ["3", "Review evidence", "Compare applications and relevant candidate evidence without inventing scores."],
              ["4", "Coordinate interviews", "Move qualified candidates through your configured interview workflow."],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <span className="text-sm font-bold text-[#82b1ff]">{number}</span>
                <h2 className="mt-3 font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
              </article>
            ))}
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

          <div className="mt-16">
            <h2 className="text-2xl font-bold">Other priority hiring markets</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {SEO_JOB_CITIES.filter((item) => item.slug !== city.slug).map((item) => (
                <Link key={item.slug} href={`/free-job-posting/${item.slug}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-[#448aff] hover:text-white">
                  {item.name}
                </Link>
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
            name: `HireGo AI hiring platform for ${city.name}`,
            serviceType: "Recruitment software, job posting and hiring workflow",
            provider: {
              "@type": "Organization",
              name: "HireGo AI",
              url: "https://www.hiregoai.com",
            },
            areaServed: {
              "@type": "AdministrativeArea",
              name: city.regionLabel,
            },
            url: `https://www.hiregoai.com/free-job-posting/${city.slug}`,
            description: `Job posting, applicant workflow, structured screening, assessments and interview coordination for employers hiring in ${city.name}.`,
          }).replace(/</g, "\\u003c") }}
        />
      </main>
    </MarketingShell>
  );
}
