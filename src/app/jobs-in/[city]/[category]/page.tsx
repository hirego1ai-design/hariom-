import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SEO_JOB_CITIES, findSeoJobCity } from "@/lib/seoJobCities";
import { categoriesForCity, findSeoJobCategory } from "@/lib/seoJobCategories";
import { getPublicJobsForCity } from "@/lib/publicJobs";
import { marketingMetadata } from "@/lib/marketingMetadata";
import { PUBLIC_ORIGIN } from "@/lib/publicDiscovery";

type Props = { params: Promise<{ city: string; category: string }> };
export const revalidate = 300;

export function generateStaticParams() {
  return SEO_JOB_CITIES.flatMap((city) =>
    categoriesForCity(city.slug).map((category) => ({
      city: city.slug,
      category: category.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, category: categorySlug } = await params;
  const city = findSeoJobCity(citySlug);
  const category = findSeoJobCategory(categorySlug);
  if (!city || !category || !categoriesForCity(city.slug).some((item) => item.slug === category.slug)) return {};
  return marketingMetadata({
    path: `/jobs-in/${city.slug}/${category.slug}`,
    title: `${category.title} in ${city.name} | HireGo AI`,
    description: `Browse current ${category.name.toLowerCase()} jobs in ${city.name}. Listings come from real active HireGo jobs and closed roles are removed automatically.`,
  });
}

export default async function JobsInCityCategoryPage({ params }: Props) {
  const { city: citySlug, category: categorySlug } = await params;
  const city = findSeoJobCity(citySlug);
  const category = findSeoJobCategory(categorySlug);

  if (!city || !category || !categoriesForCity(city.slug).some((item) => item.slug === category.slug)) {
    notFound();
  }

  const jobs = await getPublicJobsForCity(city, category);
  const canonical = `${PUBLIC_ORIGIN}/jobs-in/${city.slug}/${category.slug}`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.title} in ${city.name}`,
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
      { "@type": "ListItem", position: 3, name: `Jobs in ${city.name}`, item: `${PUBLIC_ORIGIN}/jobs-in/${city.slug}` },
      { "@type": "ListItem", position: 4, name: category.title, item: canonical },
    ],
  };

  return (
    <MarketingShell>
      <main className="bg-[#071322] text-white">
        <section className="border-b border-white/10 px-5 py-16 sm:px-8 md:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">{city.regionLabel} · {category.name}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">{category.title} in {city.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{category.intro}</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Results are generated from active HireGo listings that match this city and role category. No synthetic vacancies are created for SEO.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">
              No active {category.name.toLowerCase()} jobs are currently published for {city.name}. This page remains available as a category hub and will populate automatically when matching roles go live.
            </div>
          )}

          <div className="mt-12 flex flex-wrap gap-4 text-sm font-bold">
            <Link href={`/jobs-in/${city.slug}`} className="text-[#82b1ff]">← All jobs in {city.name}</Link>
            <Link href="/jobs" className="text-[#82b1ff]">Browse all jobs →</Link>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
      </main>
    </MarketingShell>
  );
}
