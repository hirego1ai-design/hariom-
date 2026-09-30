import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import { prisma } from "@/lib/prisma";
import { findSeoJobCity } from "@/lib/seoJobCities";
import {
  categoriesForCity,
  categoryPrismaOr,
  findSeoJobCategory,
} from "@/lib/seoJobCategories";
import { marketingMetadata } from "@/lib/marketingMetadata";

type Props = { params: Promise<{ city: string; category: string }> };

export const dynamic = "force-dynamic";

function categoryWhere(
  city: NonNullable<ReturnType<typeof findSeoJobCity>>,
  category: NonNullable<ReturnType<typeof findSeoJobCategory>>,
) {
  return {
    status: "ACTIVE" as const,
    publishedAt: { not: null },
    NOT: { aiFocusAreas: "QA_TEST_PUBLIC_JOB" },
    AND: [
      { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      {
        OR: city.dbTerms.map((term) => ({
          location: { contains: term, mode: "insensitive" as const },
        })),
      },
      { OR: categoryPrismaOr(category) },
    ],
  };
}

function resolveParams(citySlug: string, categorySlug: string) {
  const city = findSeoJobCity(citySlug);
  const category = findSeoJobCategory(categorySlug);
  if (!city || !category || !categoriesForCity(city.slug).some((item) => item.slug === category.slug)) {
    return null;
  }
  return { city, category };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, category: categorySlug } = await params;
  const resolved = resolveParams(citySlug, categorySlug);
  if (!resolved) return {};

  const { city, category } = resolved;
  let jobCount = 0;
  try {
    jobCount = await prisma.jobListing.count({ where: categoryWhere(city, category) });
  } catch {
    jobCount = 0;
  }

  const base = marketingMetadata({
    path: `/jobs-in/${city.slug}/${category.slug}`,
    title: `${category.title} in ${city.name} | HireGo AI`,
    description: `Browse current ${category.name.toLowerCase()} jobs in ${city.name} from employers publishing roles on HireGo AI.`,
  });

  return {
    ...base,
    robots: jobCount >= 3 ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CityCategoryJobsPage({ params }: Props) {
  const { city: citySlug, category: categorySlug } = await params;
  const resolved = resolveParams(citySlug, categorySlug);
  if (!resolved) notFound();

  const { city, category } = resolved;
  const jobs = await prisma.jobListing.findMany({
    where: categoryWhere(city, category),
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

  const relatedCategories = categoriesForCity(city.slug).filter((item) => item.slug !== category.slug);
  const faq = [
    {
      question: `Where can I find current ${category.name} jobs in ${city.name}?`,
      answer: `This page shows currently published HireGo AI roles that match both ${city.name} and the ${category.name} category. Expired, closed and QA test jobs are excluded.`,
    },
    {
      question: `What kinds of ${category.name} roles may appear in ${city.name}?`,
      answer: category.intro,
    },
    {
      question: "Can I browse before creating a candidate profile?",
      answer: "Yes. Public visitors can browse available roles. A candidate account and profile are used when applying, saving jobs or viewing evidence-based match information.",
    },
  ];

  const itemList = jobs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://hiregoai.com/jobs/${job.id}`,
      name: job.title,
    })),
  } : null;

  return (
    <MarketingShell>
      <main className="bg-[#071322] text-white">
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">{city.regionLabel}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">{category.title} in {city.name}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{category.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/jobs-in/${city.slug}`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold">All jobs in {city.name}</Link>
              <Link href="/jobs" className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold">Search all jobs</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold">Current {category.name.toLowerCase()} openings</h2>
              <p className="mt-2 text-sm text-slate-400">{jobs.length} published {jobs.length === 1 ? "role" : "roles"} currently match this city and category.</p>
            </div>
            <Link href={`/free-job-posting/${city.slug}`} className="text-sm font-bold text-[#82b1ff]">Hiring in {city.name}? Post a job →</Link>
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
              <h2 className="text-xl font-bold">No published {category.name.toLowerCase()} roles in {city.name} right now</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">This page is kept out of search indexing until enough genuine published jobs exist. It never uses QA listings to manufacture inventory.</p>
              <Link href="/jobs" className="mt-5 inline-flex text-sm font-bold text-[#82b1ff]">Browse all current jobs →</Link>
            </div>
          )}

          <div className="mt-16">
            <h2 className="text-2xl font-bold">Related job categories in {city.name}</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {relatedCategories.map((item) => (
                <Link
                  key={item.slug}
                  href={`/jobs-in/${city.slug}/${item.slug}`}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-[#448aff] hover:text-white"
                >
                  {item.name}
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
        {itemList ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }}
          />
        ) : null}
      </main>
    </MarketingShell>
  );
}
