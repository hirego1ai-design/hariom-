import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import { FAQ, FinalCTA, JsonLd, SectionHeading, styles } from "@/components/marketing/Editorial";
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
    path: "/hiring-in/" + city.slug,
    title: "AI Recruitment & Pay Per Hire in " + city.name + " | HireGo AI",
    description: "Hire in " + city.name + " with HireGo AI Managed Hiring, Pay Per Hire, recruiting Co-Pilot, candidate screening and structured interview workflows."
  });
}

export default async function HiringInCityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = findSeoJobCity(slug);
  if (!city) notFound();

  const faqs = [
    {
      question: "Can HireGo support hiring in " + city.name + "?",
      answer: "HireGo provides employer hiring workflows that can be used for genuine roles based in " + city.name + ". The exact software, managed service and commercial scope depend on the employer plan or agreement."
    },
    {
      question: "What hiring services are available for " + city.name + " employers?",
      answer: "Employers can explore Managed Hiring / Pay Per Hire, Employer Co-Pilot, structured candidate screening, assessments and interview workflow capabilities. Availability depends on the selected plan and configured workflow."
    },
    {
      question: "Who makes the final hiring decision?",
      answer: "The employer does. HireGo can support sourcing, evidence organization and workflow operations, but consequential hiring decisions remain with authorized people."
    }
  ];

  return (
    <MarketingShell>
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.container + " " + styles.split}>
            <div>
              <p className={styles.eyebrow}>{city.regionLabel}</p>
              <h1 className="mt-4">AI recruitment and Managed Hiring in {city.name}.</h1>
              <p className={styles.body + " mt-5"}>{city.employerIntro}</p>
              <p className={styles.body}>
                HireGo connects employer job requirements with sourcing, screening, assessments, interview coordination and human-controlled hiring decisions. Teams hiring around {city.areas.slice(0, 4).join(", ")} can keep the role location and workflow connected.
              </p>
              <div className={styles.actions}>
                <Link className={styles.button} href="/pay-per-hire">Explore Pay Per Hire ↗</Link>
                <Link className={styles.buttonOutline} href="/register?type=employer">Start as an employer</Link>
              </div>
            </div>
            <div className={styles.card}>
              <p className={styles.eyebrow}>Common hiring areas</p>
              <h2 className="mt-3 text-2xl">{city.name} hiring focus</h2>
              <ul className={styles.list}>{city.industries.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className={styles.section + " " + styles.tint}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="Ways to hire"
              title={"Choose the workflow that fits your " + city.name + " requirement."}
              body="Use a dedicated commercial path instead of forcing every employer into the same recruitment model."
            />
            <div className={styles.grid4}>
              {[
                ["Managed Hiring · Pay Per Hire", "/pay-per-hire", "Use agreed hiring operations support when internal recruiting capacity is limited."],
                ["Employer Co-Pilot", "/ai-hiring-copilot", "Automate permitted recruiting operations while keeping human approval at consequential stages."],
                ["Candidate Screening", "/candidate-screening-software", "Organize role-relevant evidence before the interview workflow."],
                ["Interview & Proctoring", "/interview-proctoring-software", "Coordinate remote interview stages and review configured evidence in context."]
              ].map(([title, href, body]) => (
                <article className={styles.card} key={href}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <Link className={styles.inlineLink} href={href}>Explore ↗</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="Local intent, real jobs"
              title={"Keep employer hiring and candidate job search separate in " + city.name + "."}
              body="Employer service pages focus on buying and operating a hiring workflow. Candidate pages show genuine published opportunities and are indexed only when enough real jobs exist."
            />
            <div className={styles.actions}>
              <Link className={styles.button} href={"/free-job-posting/" + city.slug}>Post jobs in {city.name} ↗</Link>
              <Link className={styles.buttonOutline} href={"/jobs-in/" + city.slug}>Jobs in {city.name}</Link>
            </div>
          </div>
        </section>

        <FAQ items={faqs} />
        <FinalCTA
          title={"Build a faster hiring workflow in " + city.name + "."}
          body="Start with the role requirement. Choose software, Co-Pilot or Managed Hiring based on how much recruiting work your team wants HireGo to coordinate."
          primary={{ label: "Discuss a hiring requirement", href: "/contact" }}
          secondary={{ label: "See pricing", href: "/pricing" }}
        />
        <JsonLd data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "HireGo AI recruitment and managed hiring in " + city.name,
            serviceType: "Recruitment software, managed hiring and hiring workflow automation",
            provider: { "@type": "Organization", name: "HireGo AI", url: "https://www.hiregoai.com" },
            areaServed: { "@type": "City", name: city.name },
            url: "https://www.hiregoai.com/hiring-in/" + city.slug
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer }
            }))
          }
        ]} />
      </div>
    </MarketingShell>
  );
}
