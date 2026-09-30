import Link from "next/link";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SEO_JOB_CITIES } from "@/lib/seoJobCities";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/jobs-in",
  title: "Jobs in India by City | HireGo AI",
  description: "Browse current jobs by city on HireGo AI, including Delhi NCR, Noida, Gurugram, Bengaluru, Hyderabad, Pune, Mumbai, Chennai and Ahmedabad.",
});

export default function JobsByCityPage() {
  return (
    <MarketingShell>
      <main className="bg-[#071322] text-white">
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">Jobs by location</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Find Jobs in India by City</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Explore published opportunities in major hiring markets. City pages show real HireGo job listings and do not invent availability or match scores.
            </p>
            <Link href="/jobs" className="mt-8 inline-flex rounded-full bg-white px-7 py-3 font-bold text-[#0c2551]">Browse All Jobs</Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEO_JOB_CITIES.map((city) => (
              <Link key={city.slug} href={`/jobs-in/${city.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-[#448aff]">
                <h2 className="text-xl font-bold">Jobs in {city.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{city.candidateIntro}</p>
                <span className="mt-5 inline-flex text-sm font-bold text-[#82b1ff]">View jobs →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
