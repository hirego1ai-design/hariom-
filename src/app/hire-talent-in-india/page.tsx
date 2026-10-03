import Link from "next/link";
import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import { JsonLd, SectionHeading, styles } from "@/components/marketing/Editorial";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/hire-talent-in-india",
  title: "Hire Talent in India | HireGo AI",
  description:
    "HireGo AI helps employers source, screen and interview candidates in India through managed hiring and connected workflows, with human hiring decisions."
});

const employerMarkets = ["United States", "Canada", "Australia", "United Arab Emirates"];
const roleFamilies = ["Software engineering", "AI and data", "Sales", "Customer support", "Recruiting and HR", "Business operations"];

export default function HireTalentInIndiaPage() {
  return (
    <MarketingShell>
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>Hire talent in India</p>
            <h1 className="mt-4">Hire Indian talent for your global team with a connected hiring workflow.</h1>
            <p className={styles.body + " mt-5 max-w-4xl"}>
              HireGo helps employers turn a role requirement into a structured sourcing, screening and interview process. Use the platform with your own recruiting team or discuss Managed Hiring when you need additional hiring capacity.
            </p>
            <div className={styles.actions}>
              <Link className={styles.button} href="/contact">Discuss your hiring requirement ↗</Link>
              <Link className={styles.buttonOutline} href="/pay-per-hire">Explore Managed Hiring</Link>
            </div>
          </div>
        </section>

        <section className={styles.section + " " + styles.tint}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="International employer intent"
              title="A hiring path for companies looking for talent in India."
              body="This page is for employers searching for Indian candidates, remote talent or recruiting support from markets such as the United States, Canada, Australia and the UAE."
            />
            <div className={styles.grid4}>
              {employerMarkets.map((market) => (
                <article className={styles.card} key={market}>
                  <p className={styles.eyebrow}>Employer market</p>
                  <h2 className="mt-3 text-xl">{market}</h2>
                  <p>Source and coordinate India-based candidates for roles your team is actively hiring.</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="Role coverage"
              title="Start with the role, then build the evidence you need."
              body="HireGo can support role-focused sourcing and screening workflows across common hiring families. Availability depends on the requirement, candidate market and agreed service scope."
            />
            <div className={styles.grid3}>
              {roleFamilies.map((role) => (
                <article className={styles.card} key={role}>
                  <h2 className="text-xl">{role}</h2>
                  <p>Define the skills, experience, interview stages and evidence that matter before sourcing begins.</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section + " " + styles.tint}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="How it works"
              title="From hiring requirement to employer decision."
              body="Automation can support permitted operational work, while your authorized hiring team remains responsible for consequential hiring decisions."
            />
            <ol className={styles.flow}>
              {[
                "Define the role and hiring criteria",
                "Source and organize relevant candidates",
                "Review role-aligned screening evidence",
                "Coordinate assessments or interviews where required",
                "Employer evaluates candidates and makes the decision",
                "Complete joining follow-up under the agreed workflow"
              ].map((step) => (
                <li className={styles.flowItem} key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="Choose the operating model"
              title="Use HireGo as software, hiring operations support or a combination."
              body="Employers can use available subscription workflows internally, discuss Managed Hiring under Pay Per Hire terms, or combine platform access with agreed operational support."
            />
            <div className={styles.grid3}>
              <article className={styles.card}>
                <h2 className="text-xl">Managed Hiring</h2>
                <p>HireGo helps operate the agreed sourcing, screening, interview coordination and follow-up workflow.</p>
                <Link className={styles.inlineLink} href="/pay-per-hire">Explore Pay Per Hire ↗</Link>
              </article>
              <article className={styles.card}>
                <h2 className="text-xl">Employer Co-Pilot</h2>
                <p>Use connected recruiting workflows to reduce repetitive coordination between stages and participants.</p>
                <Link className={styles.inlineLink} href="/ai-hiring-copilot">Explore Co-Pilot ↗</Link>
              </article>
              <article className={styles.card}>
                <h2 className="text-xl">Candidate Screening</h2>
                <p>Organize job-relevant experience, skills and available assessment evidence for human review.</p>
                <Link className={styles.inlineLink} href="/candidate-screening-software">Explore screening ↗</Link>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.cta}>
              <h2>Tell HireGo who you need to hire in India.</h2>
              <p>Share the role, location or remote setup, required experience and interview process. We can discuss the most appropriate hiring workflow and commercial model.</p>
              <div className={styles.actions}>
                <Link className={styles.buttonLight} href="/contact">Talk to HireGo ↗</Link>
                <Link className={styles.buttonOutline} href="/hiring-in">Explore India hiring markets</Link>
              </div>
            </div>
          </div>
        </section>

        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Hire talent in India with HireGo AI",
          serviceType: "Candidate sourcing, screening, interview coordination and managed hiring",
          provider: { "@type": "Organization", name: "HireGo AI", url: "https://www.hiregoai.com" },
          areaServed: employerMarkets.map((name) => ({ "@type": "Country", name })),
          url: "https://www.hiregoai.com/hire-talent-in-india"
        }} />
      </div>
    </MarketingShell>
  );
}
