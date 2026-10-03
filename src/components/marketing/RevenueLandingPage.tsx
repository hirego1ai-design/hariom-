import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { FAQ, FinalCTA, JsonLd, SectionHeading, breadcrumbSchema, styles } from "@/components/marketing/Editorial";
import { MOCK_INTERVIEW_ROLES, type RevenueSeoPage } from "@/lib/revenueSeo";

export default function RevenueLandingPage({ page }: { page: RevenueSeoPage }) {
  const path = "/" + page.slug;

  return (
    <MarketingShell>
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.container + " " + styles.split}>
            <div>
              <p className={styles.eyebrow}>{page.eyebrow}</p>
              <h1 className="mt-4">{page.title}</h1>
              <p className={styles.body + " mt-5"}>{page.lead}</p>
              <div className={styles.actions}>
                <Link className={styles.button} href={page.primaryCta.href}>{page.primaryCta.label} ↗</Link>
                <Link className={styles.buttonOutline} href={page.secondaryCta.href}>{page.secondaryCta.label}</Link>
              </div>
            </div>
            <div className={styles.card}>
              <p className={styles.eyebrow}>Best fit</p>
              <h2 className="mt-3 text-2xl">Who this is for</h2>
              <p>{page.audience}</p>
              <p className="mt-6 text-sm font-semibold text-slate-700">
                HireGo connects the work around the hiring stage while authorized people remain responsible for consequential hiring decisions.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section + " " + styles.tint}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="Why teams look for this"
              title="Solve the operational problem before adding more tools."
              body="The strongest hiring workflow removes repeated coordination while keeping evidence, responsibilities and human approvals clear."
            />
            <div className={styles.grid3}>
              {page.problems.map((item) => (
                <article className={styles.card} key={item}><h3>{item}</h3></article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="Workflow"
              title="How it fits into HireGo."
              body="The exact configuration depends on the employer or candidate workflow, but the process stays tied to real requirements and reviewable actions."
            />
            <ol className={styles.flow}>
              {page.workflow.map((item) => <li className={styles.flowItem} key={item}>{item}</li>)}
            </ol>
          </div>
        </section>

        <section className={styles.section + " " + styles.tint}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="What you get"
              title="A clearer path to the next hiring action."
              body="HireGo focuses on connected workflow outcomes rather than invented certainty or opaque automated verdicts."
            />
            <div className={styles.grid3}>
              {page.outcomes.map((item) => (
                <article className={styles.card} key={item}><h3>{item}</h3></article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-bold">
              <Link href="/hiring-in" className={styles.inlineLink}>Hiring services by city ↗</Link>
              <Link href="/services" className={styles.inlineLink}>All HireGo services ↗</Link>
              <Link href="/solutions" className={styles.inlineLink}>Solutions by hiring problem ↗</Link>
            </div>
          </div>
        </section>

        {page.slug === "ai-mock-interview" ? (
          <section className={styles.section}>
            <div className={styles.container}>
              <SectionHeading
                eyebrow="Practice by role"
                title="Start with the interview you are actually preparing for."
                body="Role pages focus the practice around the situations, examples and questions that matter for that job family."
              />
              <div className={styles.grid4}>
                {MOCK_INTERVIEW_ROLES.map((role) => (
                  <Link key={role.slug} href={"/ai-mock-interview/" + role.slug} className={styles.card}>
                    <h3>{role.name}</h3>
                    <p>{role.focusAreas.slice(0, 3).join(" · ")}</p>
                    <span className={styles.inlineLink}>Practice {role.name} ↗</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <FAQ items={page.faqs} />
        <FinalCTA title={page.title} body={page.lead} primary={page.primaryCta} secondary={page.secondaryCta} />
        <JsonLd data={[
          breadcrumbSchema(page.eyebrow, path),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: page.metadataTitle.replace(" | HireGo AI", ""),
            serviceType: page.serviceType,
            description: page.description,
            provider: {
              "@type": "Organization",
              name: "HireGo AI",
              url: "https://www.hiregoai.com",
              logo: "https://www.hiregoai.com/marketing/hirego-logo.png"
            },
            url: "https://www.hiregoai.com" + path
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.faqs.map((item) => ({
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
