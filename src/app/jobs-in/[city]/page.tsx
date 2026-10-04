import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SEO_JOB_CITIES, findSeoJobCity } from "@/lib/seoJobCities";
import { categoriesForCity } from "@/lib/seoJobCategories";
import { getPublicJobsForCity } from "@/lib/publicJobs";
import { marketingMetadata } from "@/lib/marketingMetadata";
import { PUBLIC_ORIGIN } from "@/lib/publicDiscovery";

type Props = { params: Promise<{ city: string }> };
export const revalidate = 300;

export function generateStaticParams() {
  return SEO_JOB_CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = findSeoJobCity(slug);
  if (!city) return {};
  return marketingMetadata({
    path: `/jobs-in/${city.slug}`,
    title: `Jobs in ${city.name} | Live Openings | HireGo AI`,
    description: `${city.candidateIntro} Browse current openings by real employers and apply through HireGo AI.`,
  });
}

export default async function JobsInCityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = findSeoJobCity(slug);
  if (!city) notFound();

  const jobs = await getPublicJobsForCity(city);
  const categories = categoriesForCity(city.slug);
  const canonical = `${PUBLIC_ORIGIN}/jobs-in/${city.slug}`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Jobs in ${city.name}`,
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${PUBLIC_ORIGIN}/jobs/${job.id}`,
      name: `${job.title} — ${job.company.name}`,
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${PUBLIC_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Jobs in India", item: `${PUBLIC_ORIGIN}/jobs-in` },
      { "@type": "ListItem", position: 3, name: `Jobs in ${city.name}`, item: canonical },
    ],
  };

  return (
    <MarketingShell>
      <main className="bg-[#071322] text-white">
        <section className="border-b border-white/10 px-5 py-16 sm:px-8 md:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">{city.regionLabel}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Jobs in {city.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{city.candidateIntro}</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              This page is generated from live HireGo listings. Closed and expired jobs are excluded automatically.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/jobs-in/${city.slug}/${category.slug}`}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-[#448aff] hover:text-white"
              >
                {category.name} jobs
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <article key={job.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-sm font-semibold text-[#82b1ff]">{job.company.name}</p>
                <h2 className="mt-2 text-xl font-bold">
                  <Link href={`/jobs/${job.id}`} className="hover:text-[#82b1ff]">{job.title}</Link>
                </h2>
                <p className="mt-3 text-sm text-slate-400">{job.location} · {job.type} · {job.workMode}</p>
                <p className="mt-2 text-sm text-slate-400">{job.experienceLevel}{job.salaryRange ? ` · ${job.salaryRange}` : ""}</p>
                <Link href={`/jobs/${job.id}`} className="mt-5 inline-flex text-sm font-bold text-[#82b1ff]">View job →</Link>
              </article>
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">
              No active HireGo jobs are currently published for {city.name}. Check again as employers publish new roles.
            </div>
          )}

          <div className="mt-12">
            <Link href="/jobs-in" className="text-sm font-bold text-[#82b1ff]">← Browse jobs in other cities</Link>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
      </main>
    </MarketingShell>
  );
}
