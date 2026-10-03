import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/marketing/MarketingShell";
import { FAQ, FinalCTA, JsonLd, SectionHeading, styles } from "@/components/marketing/Editorial";
import { MOCK_INTERVIEW_ROLES, findMockInterviewRole } from "@/lib/revenueSeo";
import { marketingMetadata } from "@/lib/marketingMetadata";

type Props = { params: Promise<{ role: string }> };

export function generateStaticParams() {
  return MOCK_INTERVIEW_ROLES.map((role) => ({ role: role.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role: slug } = await params;
  const role = findMockInterviewRole(slug);
  if (!role) return {};

  return marketingMetadata({
    path: "/ai-mock-interview/" + role.slug,
    title: "AI Mock Interview for " + role.name + " | HireGo AI",
    description: "Practice a structured AI mock interview for " + role.name + " roles with role-specific questions and preparation feedback on HireGo AI."
  });
}

export default async function MockInterviewRolePage({ params }: Props) {
  const { role: slug } = await params;
  const role = findMockInterviewRole(slug);
  if (!role) notFound();

  const faqs = [
    {
      question: "What should I practice for a " + role.name + " interview?",
      answer: "Focus on role-relevant examples and explain your reasoning clearly. HireGo organizes practice around areas such as " + role.focusAreas.join(", ") + "."
    },
    {
      question: "Is this a real employer interview?",
      answer: "No. This is candidate preparation. It is intended to help you practice answer structure and role relevance before a real employer interview."
    },
    {
      question: "Will mock interview practice automatically affect my job applications?",
      answer: "Mock interview practice is a preparation experience and should not be treated as an automatic employer hiring decision."
    }
  ];

  return (
    <MarketingShell>
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.container + " " + styles.split}>
            <div>
              <p className={styles.eyebrow}>Role-specific interview practice</p>
              <h1 className="mt-4">AI Mock Interview for {role.name}.</h1>
              <p className={styles.body + " mt-5"}>{role.intro}</p>
              <div className={styles.actions}>
                <Link className={styles.button} href="/register?type=candidate">Start candidate account ↗</Link>
                <Link className={styles.buttonOutline} href="/ai-mock-interview">All mock interview roles</Link>
              </div>
            </div>
            <div className={styles.card}>
              <p className={styles.eyebrow}>Practice focus</p>
              <ul className={styles.list}>
                {role.focusAreas.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.section + " " + styles.tint}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="Interview scenarios"
              title={"Practice the situations a " + role.name + " candidate should be ready to explain."}
              body="The goal is not to memorize scripts. Practice turning your real experience into clear, relevant answers."
            />
            <div className={styles.grid4}>
              {role.scenarios.map((item) => (
                <article className={styles.card} key={item}><h2 className="text-lg">{item}</h2></article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <SectionHeading
              eyebrow="How to use practice"
              title="Answer, review, improve, repeat."
              body="Use the text-based mock interview as preparation. Keep examples truthful, specific and tied to what you actually did."
            />
            <ol className={styles.flow}>
              {[
                "Choose the target role",
                "Answer role-related questions",
                "Finish the practice session",
                "Review preparation feedback",
                "Rewrite weak answers in your own words",
                "Practice again before the real interview"
              ].map((item) => <li className={styles.flowItem} key={item}>{item}</li>)}
            </ol>
          </div>
        </section>

        <FAQ items={faqs} />
        <FinalCTA
          title={"Practice your " + role.name + " interview before it matters."}
          body="Create a candidate account, prepare role-specific examples and use structured practice to improve how you explain your experience."
          primary={{ label: "Start practice", href: "/register?type=candidate" }}
          secondary={{ label: "Browse jobs", href: "/jobs" }}
        />
        <JsonLd data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "AI Mock Interview for " + role.name,
            serviceType: "AI mock interview practice",
            provider: { "@type": "Organization", name: "HireGo AI", url: "https://www.hiregoai.com", logo: "https://www.hiregoai.com/marketing/hirego-logo.png" },
            url: "https://www.hiregoai.com/ai-mock-interview/" + role.slug
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
