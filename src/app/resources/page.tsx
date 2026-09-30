import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import EditorialContentListing from "@/components/marketing/EditorialContentListing";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/resources",
  title: "News & Insights — HireGo AI",
  description: "Read HireGo AI hiring insights, product perspectives, company announcements and press releases.",
});
export const dynamic = "force-dynamic";

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const query = await searchParams;
  const selected = query.type === "press" ? "PRESS_RELEASE" : query.type === "blog" ? "BLOG" : "ALL";

  return (
    <MarketingShell>
      <section className="border-b border-white/10 px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[.2em] text-sky-300">News & Insights</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">Ideas, updates and official HireGo announcements.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">One place for practical hiring content and company press releases, published directly by the HireGo team.</p>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Content type">
            {[
              ["ALL", "/resources", "All"],
              ["BLOG", "/resources?type=blog", "Blogs"],
              ["PRESS_RELEASE", "/resources?type=press", "Press Releases"],
            ].map(([value, href, label]) => (
              <Link key={value} href={href} aria-current={selected === value ? "page" : undefined} className={selected === value ? "rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950" : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
        <EditorialContentListing filter={selected as "ALL" | "BLOG" | "PRESS_RELEASE"} />
      </section>
    </MarketingShell>
  );
}
