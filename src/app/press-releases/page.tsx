import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import EditorialContentListing from "@/components/marketing/EditorialContentListing";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/press-releases",
  title: "Press Releases — HireGo AI",
  description: "Official HireGo AI announcements, company news, product updates and media information.",
});
export const dynamic = "force-dynamic";

export default function PressReleasesPage() {
  return (
    <MarketingShell>
      <section className="border-b border-white/10 px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase tracking-[.2em] text-rose-300">Press Room</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">Official HireGo AI press releases.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Company announcements and media-ready updates published directly by HireGo AI.</p>
          <Link href="/resources" className="mt-7 inline-flex text-sm font-bold text-sky-300 hover:text-sky-200">View all news & insights →</Link>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
        <EditorialContentListing filter="PRESS_RELEASE" />
      </section>
    </MarketingShell>
  );
}
