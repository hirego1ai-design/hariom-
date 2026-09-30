import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import { prisma } from "@/lib/prisma";
import { SEO_JOB_CITIES, findSeoJobCity } from "@/lib/seoJobCities";
import { marketingMetadata } from "@/lib/marketingMetadata";

type Props = { params: Promise<{ city: string }> };

export function generateStaticParams() {
  return SEO_JOB_CITIES.map((city) => ({ city: city.slug }));
}

function cityWhere(city: NonNullable<ReturnType<typeof findSeoJobCity>>) {
  return {
    status: "ACTIVE" as const,
    publishedAt: { not: null },
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    NOT: { aiFocusAreas: "QA_TEST_PUBLIC_JOB" },
    AND: [
      {
        OR: city.dbTerms.map((term) => ({
          location: { contains: term, mode: "insensitive" as const },
        })),
      },
    ],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = findSeoJobCity(slug);
  if (!city) return {};

  let realJobCount = 0;
  try {
    realJobCount = await prisma.jobListing.count({ where: cityWhere(city) });
  } catch {
    realJobCount = 0;
  }

  const base = marketingMetadata({
    path: `/jobs-in/${city.slug}`,
    title: `Jobs in ${city.name} | Latest Job Vacancies | HireGo AI`,
    description: `Browse current jobs in ${city.name} on HireGo AI across ${city.industries.slice(0, 4).join(", ")} and other functions.`,
  });

  return {
    ...base,
    robots: realJobCount >= 3 ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function JobsInCityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = findSeoJobCity(slug);
  if (!city) notFound();

  const jobs = await prisma.jobListing.findMany({
    where: cityWhere(city),
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      location: true,
      type: true,
      workMode: true,
      experienceLevel: true,
      salaryRange: true,
      publishedAt: true,
      company: { select: { name: true } },
    },
  });

  const faq = [
    {
      question: `Where can I find current jobs in ${city.name}?`,
      answer: `This page lists currently published HireGo AI jobs whose location matches ${city.name} or the local areas covered by this city page. Closed, expired and QA test jobs are excluded.`,
    },
    {
      question: `What job categories are common on the ${city.name} page?`,
      answer: `The page can include roles across ${city.industries.join(", ")} and other functions whenever employers publish matching opportunities.`,
    },
    {
      question: "Do I need a profile to browse jobs?",
      answer: "No. Public visitors can browse job listings. A candidate account and profile are used when applying, saving jobs or viewing evidence-based match information.",
    },
  ];

  return (
    <MarketingShell>
      <main className="bg-[#071322] text-white">
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">{city.regionLabel}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Jobs in {city.name}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{city.candidateIntro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {city.industries.map((item) => (
                <span key={item} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300">{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold">Current openings</h2>
              <p className="mt-2 text-sm text-slate-400">{jobs.length} published {jobs.length === 1 ? "role" : "roles"} available on this city page.</p>
            </div>
            <Link href="/jobs" className="text-sm font-bold text-[#82b1ff]">Search all jobs →</Link>
          </div>

          {jobs.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <article key={job.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-sm font-semibold text-[#82b1ff]">{job.company.name}</p>
                  <h2 className="mt-2 text-xl font-bold">{job.title}</h2>
                  <p className="mt-3 text-sm text-slate-400">{job.location} · {job.type} · {job.workMode}</p>
                  <p className="mt-2 text-sm text-slate-400">{job.experienceLevel}{job.salaryRange ? ` · ${job.salaryRange}` : ""}</p>
                  <Link href={`/jobs/${job.id}`} className="mt-5 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-bold hover:border-[#448aff]">View job</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <h2 className="text-xl font-bold">No published roles in {city.name} right now</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">This page stays available for navigation, but it is not indexed as a city jobs landing page until enough real published jobs are available.</p>
              <Link href="/jobs" className="mt-5 inline-flex text-sm font-bold text-[#82b1ff]">Browse all current jobs →</Link>
            </div>
          )}

          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <h2 className="text-2xl font-bold">Popular hiring areas in {city.name}</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {city.areas.map((item) => <span key={item} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300">{item}</span>)}
              </div>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <h2 className="text-2xl font-bold">Hiring in {city.name}?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Employers can publish legitimate openings and manage candidate screening and interview steps through HireGo AI.</p>
              <Link href={`/free-job-posting/${city.slug}`} className="mt-5 inline-flex text-sm font-bold text-[#82b1ff]">Free job posting in {city.name} →</Link>
            </article>
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
