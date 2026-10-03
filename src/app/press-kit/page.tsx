import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import { marketingMetadata } from "@/lib/marketingMetadata";
import { PUBLIC_BUSINESS_DETAILS } from "@/lib/publicBusinessDetails";

export const metadata: Metadata = marketingMetadata({
  path: "/press-kit",
  title: "HireGo AI Press Kit | Company & Brand Resources",
  description: "Official HireGo AI press kit with company overview, approved brand description, logo assets, product facts, press releases and media contact information.",
});

const productFacts = [
  "Employer hiring workflows for sourcing, screening, assessments, interviews and joining follow-up",
  "Candidate job discovery, profiles, assessments and job-match evidence",
  "Managed Hiring and Employer Co-Pilot services",
  "Human-controlled consequential hiring decisions",
];

export default function PressKitPage() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PUBLIC_BUSINESS_DETAILS.brandName,
    alternateName: ["HireGoAI", "Hire Go AI", "HireGo"],
    url: "https://www.hiregoai.com",
    logo: "https://www.hiregoai.com/marketing/hirego-logo-hd.png",
    email: PUBLIC_BUSINESS_DETAILS.supportEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: "G-31, Sector 63",
      addressLocality: "Noida",
      addressRegion: "Uttar Pradesh",
      postalCode: "201301",
      addressCountry: "IN",
    },
  };

  return (
    <MarketingShell>
      <main className="bg-[#071322] text-white">
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82b1ff]">Official company resources</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">HireGo AI Press Kit</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Company facts, approved brand language and downloadable assets for journalists, partners, directories and other publishers referencing HireGo AI.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">Approved company description</p>
              <h2 className="mt-3 text-2xl font-bold">About HireGo AI</h2>
              <p className="mt-4 leading-7 text-slate-300">
                HireGo AI is a hiring platform that connects job requirements, candidate sourcing, screening, assessments, interview coordination and joining follow-up in one workflow. Autonomous AI agents can help execute permitted operational steps while authorized people remain responsible for consequential hiring decisions.
              </p>
              <p className="mt-4 leading-7 text-slate-300">
                The platform supports employers, candidates and managed hiring workflows, with an emphasis on evidence-based evaluation and human-controlled final hiring decisions.
              </p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">Brand facts</p>
              <dl className="mt-5 space-y-4 text-sm">
                <div><dt className="font-bold text-white">Brand</dt><dd className="mt-1 text-slate-400">HireGo AI</dd></div>
                <div><dt className="font-bold text-white">Website</dt><dd className="mt-1"><a className="text-[#82b1ff] hover:underline" href="https://www.hiregoai.com">hiregoai.com</a></dd></div>
                <div><dt className="font-bold text-white">Primary market</dt><dd className="mt-1 text-slate-400">India</dd></div>
                <div><dt className="font-bold text-white">Location</dt><dd className="mt-1 text-slate-400">{PUBLIC_BUSINESS_DETAILS.postalAddress}</dd></div>
                <div><dt className="font-bold text-white">Support</dt><dd className="mt-1"><a className="text-[#82b1ff] hover:underline" href={`mailto:${PUBLIC_BUSINESS_DETAILS.supportEmail}`}>{PUBLIC_BUSINESS_DETAILS.supportEmail}</a></dd></div>
              </dl>
            </article>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">Brand language</p>
              <h2 className="mt-3 text-2xl font-bold">Approved positioning</h2>
              <p className="mt-5 text-xl font-bold">AI-assisted hiring with people in control.</p>
              <p className="mt-2 text-slate-300">Managed Hiring, Employer Co-Pilot and structured hiring workflows.</p>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                When referencing the product, use “HireGo AI” on first mention. “HireGo” can be used afterward where context is clear.
              </p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">Brand assets</p>
              <h2 className="mt-3 text-2xl font-bold">Official logo</h2>
              <div className="mt-5 rounded-2xl bg-white p-5">
                <Image src="/marketing/hirego-logo-hd.png" alt="HireGo AI official logo" width={660} height={220} className="h-auto w-[220px] max-w-full" sizes="220px" />
              </div>
              <a href="/marketing/hirego-logo-hd.png" download className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0c2551]">Download logo</a>
            </article>
          </div>

          <article className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#82b1ff]">Product overview</p>
            <h2 className="mt-3 text-2xl font-bold">What HireGo AI covers</h2>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {productFacts.map((fact) => (
                <li key={fact} className="rounded-2xl border border-white/10 px-5 py-4 text-sm leading-6 text-slate-300">{fact}</li>
              ))}
            </ul>
          </article>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
              <h2 className="text-2xl font-bold">Press releases</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Official announcements published by HireGo AI are available in the press release archive.</p>
              <Link href="/press-releases" className="mt-5 inline-flex text-sm font-bold text-[#82b1ff]">View press releases →</Link>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
              <h2 className="text-2xl font-bold">Media and partnership inquiries</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">For interviews, company information, partnerships or verification of published facts, contact HireGo AI through the official contact channel.</p>
              <Link href="/contact" className="mt-5 inline-flex text-sm font-bold text-[#82b1ff]">Contact HireGo AI →</Link>
            </article>
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }}
        />
      </main>
    </MarketingShell>
  );
}
