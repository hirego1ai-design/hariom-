import Link from "next/link";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import { JsonLd, SectionHeading, styles } from "@/components/marketing/Editorial";
import { SEO_JOB_CITIES } from "@/lib/seoJobCities";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/hiring-in",
  title: "AI Recruitment & Hiring Services in India | HireGo AI",
  description: "Explore HireGo AI Managed Hiring, Pay Per Hire, recruiting Co-Pilot, candidate screening and interview workflows across major Indian hiring markets."
});

const services = [
  ["Pay Per Hire", "/pay-per-hire", "Managed hiring support tied to the successful hire event defined in the employer agreement."],
  ["AI Hiring Co-Pilot", "/ai-hiring-copilot", "Recruiting workflow automation for permitted operational work with human approval at consequential steps."],
  ["Candidate Screening", "/candidate-screening-software", "Organize role-relevant candidate evidence before interviews without invented fit scores."],
  ["Interview Workflows", "/interview-proctoring-software", "Coordinate remote interview stages and review configured session evidence in context."]
];

export default function HiringInIndiaPage() {
  return (
    <MarketingShell>
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>Hire across India</p>
            <h1 className="mt-4">AI recruitment and managed hiring services for major Indian hiring markets.</h1>
            <p className={styles.body + " mt-5 max-w-4xl"}>
              Use HireGo as recruiting software, an operations Co-Pilot or a Managed Hiring partner. Start with the hiring problem, then connect the workflow to the city where the role is actually based.
            </p>
            <div className={styles.actions}>
              <Link className={styles.button} href="/pay-per-hire">Explore Pay Per Hire ↗</Link>
              <Link className={styles.buttonOutline} href="/register?type=employer">Start as an employer</Link>
              <Link className={styles.buttonOutline} href="/hire-talent-in-india">Hire Indian talent globally</Link>
            </div>
          </div>
        </section>

        <section className={styles.section + " " + styles.tint}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="Revenue-ready services"
              title="Choose the hiring model, not just the software category."
              body="Each service has a dedicated page so employers can land on the exact problem they searched for and move directly into the relevant conversion path."
            />
            <div className={styles.grid4}>
              {services.map(([name, href, body]) => (
                <article className={styles.card} key={href}>
                  <h2 className="text-xl">{name}</h2>
                  <p>{body}</p>
                  <Link className={styles.inlineLink} href={href}>Explore {name} ↗</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="City hiring hubs"
              title="Recruitment workflows by local hiring market."
              body="These pages focus on employer hiring intent. Job-seeker city pages remain separate so employer and candidate search intent do not compete for the same URL."
            />
            <div className={styles.grid3}>
              {SEO_JOB_CITIES.map((city) => (
                <Link key={city.slug} href={"/hiring-in/" + city.slug} className={styles.card}>
                  <p className={styles.eyebrow}>{city.regionLabel}</p>
                  <h2 className="mt-3 text-xl">Hiring in {city.name}</h2>
                  <p>{city.industries.slice(0, 4).join(" · ")}</p>
                  <span className={styles.inlineLink}>Explore {city.name} hiring ↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "HireGo AI recruitment and managed hiring services in India",
          serviceType: "Recruitment software, managed hiring and hiring workflow automation",
          provider: { "@type": "Organization", name: "HireGo AI", url: "https://www.hiregoai.com" },
          areaServed: { "@type": "Country", name: "India" },
          url: "https://www.hiregoai.com/hiring-in"
        }} />
      </div>
    </MarketingShell>
  );
}
