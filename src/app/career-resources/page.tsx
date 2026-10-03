import type { Metadata } from "next";
import MarketingPage from "@/components/marketing/MarketingPage";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/career-resources",
  title: "Career Resources & Interview Practice | HireGo AI",
  description: "Prepare for interviews, practise with AI, improve how you present your skills, explore Video Resume tools and discover jobs with HireGo AI.",
});

const faqs = [
  ["What are HireGo Career Resources?", "Career Resources brings together interview practice, profile and Video Resume guidance, skill-readiness tools and pathways to job discovery."],
  ["How does an AI Mock Interview help?", "AI Mock Interviews provide a structured environment to practise responses and reflect on areas you may want to improve before an employer interview."],
  ["What is a Video Resume?", "A Video Resume gives candidates another way to introduce themselves and add context about their experience, skills and communication beyond a traditional resume."],
  ["Can I practise before applying for jobs?", "Yes. You can use available preparation and assessment experiences before exploring and applying for relevant opportunities."],
  ["Does HireGo AI decide whether I get hired?", "No. HireGo AI can support preparation, assessments and hiring workflows, but final employment decisions remain with the employer and the people responsible for the hiring process."],
  ["Where can I find jobs on HireGo?", "Use the HireGo Jobs area to browse available opportunities and review roles relevant to your interests, skills and location."],
];

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "HireGo AI Career Resources",
  url: "https://www.hiregoai.com/career-resources",
  description: "Career preparation resources for interview practice, Video Resume guidance, skill readiness and job discovery.",
  isPartOf: { "@type": "WebSite", name: "HireGo AI", url: "https://www.hiregoai.com" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([name, text]) => ({
    "@type": "Question",
    name,
    acceptedAnswer: { "@type": "Answer", text },
  })),
};

export default function CareerResourcesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <MarketingPage kind="career-resources" />
    </>
  );
}
