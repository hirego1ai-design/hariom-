import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalHighlight, LegalSection } from "@/components/legal/LegalPageLayout";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/terms",
  title: "Terms and Conditions | HireGo AI",
  description: "Terms governing HireGo AI accounts, hiring workflows, subscriptions, managed hiring, payments, AI-assisted features and user responsibilities.",
});

const nav = [
  { href: "#scope", label: "Scope & acceptance" },
  { href: "#accounts", label: "Accounts & eligibility" },
  { href: "#platform", label: "Platform services" },
  { href: "#ai", label: "AI-assisted features" },
  { href: "#employers", label: "Employer responsibilities" },
  { href: "#candidates", label: "Candidate responsibilities" },
  { href: "#managed-hiring", label: "Managed hiring" },
  { href: "#payments", label: "Payments & billing" },
  { href: "#communications", label: "Communications" },
  { href: "#content", label: "Content & IP" },
  { href: "#acceptable-use", label: "Acceptable use" },
  { href: "#availability", label: "Availability & changes" },
  { href: "#termination", label: "Suspension & termination" },
  { href: "#liability", label: "Disclaimers & liability" },
  { href: "#law", label: "Law & disputes" },
  { href: "#contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal · Platform Terms"
      title="Terms built for a modern hiring platform."
      summary="These Terms explain how candidates, employers and recruiters may use HireGo AI, including AI-assisted hiring workflows, assessments, video resumes, managed hiring, subscriptions and paid services."
      updated="25 September 2026"
      nav={nav}
      badges={["Candidates", "Employers", "AI-assisted workflows", "Stripe / PayU policy coverage", "India"]}
    >
      <LegalSection id="scope" eyebrow="01 · Foundation" title="Scope and acceptance">
        <p>
          These Terms and Conditions govern access to <strong>HireGo AI</strong>, including hiregoai.com, related applications, employer and candidate dashboards, assessments, interview workflows, communications, managed hiring services and other features made available by HireGo AI.
        </p>
        <p>
          By creating an account, purchasing a service, accepting an employer engagement, submitting an application or otherwise using the platform, you agree to these Terms and the <Link href="/privacy">Privacy Policy</Link>. A signed service agreement, order form, statement of work or checkout-specific term may add commercial terms for a particular service. If there is a direct conflict, the signed or checkout-specific term governs that transaction.
        </p>
        <LegalHighlight title="Important distinction">
          HireGo AI provides hiring technology and, where selected, managed hiring support. Employers remain responsible for lawful hiring decisions. Candidates are not promised a job, interview, offer or hiring outcome.
        </LegalHighlight>
      </LegalSection>

      <LegalSection id="accounts" eyebrow="02 · Access" title="Accounts, eligibility and security">
        <ul className="list-disc space-y-2 pl-5">
          <li>You must provide accurate, current information and keep it reasonably up to date.</li>
          <li>You must protect passwords, OTPs, recovery links and other authentication credentials.</li>
          <li>You may not share privileged employer/admin access with an unauthorized person.</li>
          <li>You must meet any age, employment or contractual-capacity requirement that applies to your use of the service.</li>
          <li>You are responsible for activity performed through your account unless caused by a security failure attributable to HireGo AI.</li>
        </ul>
        <p>
          We may require email, phone or identity verification, additional employer verification, anti-fraud checks or other reasonable controls before enabling sensitive features.
        </p>
      </LegalSection>

      <LegalSection id="platform" eyebrow="03 · Services" title="What the platform provides">
        <p>
          HireGo AI may provide job discovery, candidate profiles, sourcing, application workflows, assessments, mock interviews, interview coordination, employer collaboration, candidate communication, video resumes, hiring analytics, AI-assisted recommendations, managed hiring and related operational tools.
        </p>
        <p>
          Feature availability may differ by plan, account type, geography, employer configuration, integration status or service agreement. Some features may be released gradually, suspended for security or compliance reasons, or replaced as the platform evolves.
        </p>
      </LegalSection>

      <LegalSection id="ai" eyebrow="04 · Responsible AI" title="AI-assisted features and human decisions">
        <p>
          HireGo AI may generate summaries, recommendations, candidate matches, assessment support, interview preparation, workflow suggestions and other automated outputs. These outputs can be incomplete, inaccurate or context-dependent and should be reviewed by an appropriate person.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>AI output is supporting information, not a guarantee of job fit, truthfulness, ability or future performance.</li>
          <li>Employers should use job-related evidence and appropriate human review before consequential decisions.</li>
          <li>HireGo AI does not intend appearance, accent, voice, disability, emotion, personality or other sensitive/protected traits to be inferred from video or audio for hiring decisions.</li>
          <li>Where a workflow requires human approval for a consequential action, users must not attempt to bypass that control.</li>
        </ul>
      </LegalSection>

      <LegalSection id="employers" eyebrow="05 · Employers" title="Employer and recruiter responsibilities">
        <p>
          Employers and recruiters must use candidate information only for legitimate hiring purposes, limit access to authorized personnel, use appropriate job-related criteria and comply with applicable employment, anti-discrimination, privacy and communications requirements.
        </p>
        <p>
          An employer is responsible for the accuracy and lawfulness of its job posts, compensation representations, hiring criteria, interview instructions, decisions, offers and communications. Employers must not ask candidates to provide unnecessary sensitive information through HireGo AI.
        </p>
      </LegalSection>

      <LegalSection id="candidates" eyebrow="06 · Candidates" title="Candidate responsibilities">
        <p>
          Candidates must submit information they are entitled to provide and should keep profile, application, education, work history and assessment information materially accurate. Candidates must not impersonate another person, use prohibited assistance during restricted assessments or upload content that infringes another person’s rights.
        </p>
        <p>
          Video resumes and recorded responses should contain only information relevant to the candidate’s professional profile or the requested assessment. If another person appears or is heard, the candidate is responsible for having permission to include them.
        </p>
      </LegalSection>

      <LegalSection id="managed-hiring" eyebrow="07 · Services" title="Managed Hiring and Pay Per Hire">
        <p>
          Managed Hiring may combine HireGo AI personnel, platform tools and permitted automation to help source, coordinate, assess and progress candidates under an agreed hiring workflow. The employer controls final selection and employment decisions.
        </p>
        <p>
          Where an employer selects a Pay Per Hire or other outcome-linked service, the fee trigger, amount, taxes, replacement terms, invoice timing, exclusions and any refund or credit terms are governed by the applicable commercial agreement or order form. A signed commercial agreement may therefore contain terms that are more specific than this public page.
        </p>
      </LegalSection>

      <LegalSection id="payments" eyebrow="08 · Commerce" title="Payments, subscriptions, taxes and billing">
        <p>
          Paid features may include subscriptions, credits, assessments, interview services, managed hiring or other services displayed at checkout or in an employer agreement. Prices, billing frequency and included usage are shown before purchase or documented in the relevant agreement.
        </p>
        <p>
          Payments may be processed by approved third-party payment providers, which may include <strong>Stripe</strong> and <strong>PayU</strong> depending on availability and account activation. Payment providers process payment credentials under their own terms and privacy practices. HireGo AI should receive only the payment and transaction information needed to confirm, reconcile, support or refund a payment rather than full raw card credentials.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Applicable taxes may be added where required.</li>
          <li>A recurring plan renews only where the checkout or order explicitly states that it is recurring.</li>
          <li>Failed, pending or ambiguous transactions are not treated as successful until confirmed by the payment provider or reconciliation process.</li>
          <li>Refunds and cancellations are governed by the <Link href="/refund-cancellation">Refund & Cancellation Policy</Link>.</li>
          <li>Service activation and fulfilment timelines are described in the <Link href="/service-delivery">Service Delivery Policy</Link>.</li>
        </ul>
      </LegalSection>

      <LegalSection id="communications" eyebrow="09 · Messaging" title="Transactional communications and preferences">
        <p>
          HireGo AI may send transactional email, WhatsApp or other messages that are necessary for account verification, security, password recovery, applications, assessments, interview coordination, employer-candidate workflows, billing and service delivery.
        </p>
        <p>
          We do not intend transactional email infrastructure to be used for unsolicited bulk marketing. Where optional promotional communications are offered, they should be separated from essential transactional messages and include appropriate preference or opt-out controls.
        </p>
      </LegalSection>

      <LegalSection id="content" eyebrow="10 · Ownership" title="User content and intellectual property">
        <p>
          You retain ownership of content you lawfully submit. You grant HireGo AI a limited right to host, process, reproduce and display that content as reasonably necessary to provide the service, protect the platform, comply with law and carry out the hiring workflow you selected.
        </p>
        <p>
          HireGo AI retains rights in its software, branding, workflows, designs, documentation and platform technology. These Terms do not grant a right to copy, reverse engineer, resell or commercially exploit the platform except where expressly permitted.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" eyebrow="11 · Safety" title="Acceptable use and prohibited conduct">
        <p>You must not use HireGo AI to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>break applicable law, discriminate unlawfully or facilitate fraud;</li>
          <li>scrape private candidate information or bypass access controls;</li>
          <li>upload malware, exploit vulnerabilities or interfere with platform availability;</li>
          <li>misrepresent identity, employment opportunities, compensation or hiring authority;</li>
          <li>use candidate recordings or data to infer sensitive traits in an unlawful or inappropriate manner;</li>
          <li>send spam, deceptive messages or communications to people without an appropriate relationship or basis;</li>
          <li>circumvent assessment, approval, payment, security, quota or rate-limit controls.</li>
        </ul>
      </LegalSection>

      <LegalSection id="availability" eyebrow="12 · Operations" title="Availability, integrations and service changes">
        <p>
          We work to keep HireGo AI available and secure, but uninterrupted operation is not guaranteed. Maintenance, third-party outages, provider restrictions, internet failures, security events or legal requirements may affect availability.
        </p>
        <p>
          Integrations such as payment, email, messaging, storage, AI or video infrastructure may be provided by third parties. Their availability and performance can affect related HireGo AI features.
        </p>
      </LegalSection>

      <LegalSection id="termination" eyebrow="13 · Enforcement" title="Suspension and termination">
        <p>
          We may restrict, suspend or terminate access where reasonably necessary to protect users, investigate suspected abuse, enforce these Terms, comply with law, respond to non-payment or address material security risk. Where appropriate and lawful, we will provide notice or an opportunity to resolve the issue.
        </p>
        <p>
          Users may stop using the service at any time. Ending an account does not automatically cancel amounts already due, signed employer obligations or records that must be retained for legal, security, billing or dispute purposes.
        </p>
      </LegalSection>

      <LegalSection id="liability" eyebrow="14 · Risk" title="Disclaimers and limitation of liability">
        <p>
          HireGo AI is provided on an “as available” basis subject to applicable law. We do not guarantee that an AI output, candidate match, assessment result, recommendation or workflow action will be error-free or produce a particular hiring outcome.
        </p>
        <p>
          To the maximum extent permitted by applicable law, HireGo AI is not responsible for indirect, incidental or consequential losses arising from a user’s independent hiring decision, candidate misrepresentation, third-party service failure or use of the platform contrary to these Terms. Nothing in these Terms excludes liability that cannot lawfully be excluded.
        </p>
      </LegalSection>

      <LegalSection id="law" eyebrow="15 · Legal" title="Applicable law and disputes">
        <p>
          These Terms are intended to operate under the laws applicable to the HireGo AI service and the user’s transaction, including applicable laws of India where HireGo AI contracts in India. Mandatory consumer, employment or privacy rights continue to apply where they cannot be waived.
        </p>
        <p>
          Before starting formal proceedings, users are encouraged to contact us so that the issue can be investigated and, where possible, resolved. A signed employer agreement may specify a more particular dispute mechanism or jurisdiction for that engagement.
        </p>
      </LegalSection>

      <LegalSection id="contact" eyebrow="16 · Contact" title="Questions, notices and support">
        <p>
          For legal, account, billing, privacy or service questions, contact <a href="mailto:support@hiregoai.com">support@hiregoai.com</a> or use the <Link href="/contact">Contact page</Link>. Include enough information for us to identify the relevant account or transaction without sending passwords, OTPs or unnecessary sensitive information.
        </p>
        <LegalHighlight title="Merchant identity note" tone="amber">
          The legal contracting name, tax registration details and business address used for payment onboarding must match the entity approved with the payment provider and the details shown on invoices or checkout. HireGo AI will not display an unverified legal identity as fact.
        </LegalHighlight>
      </LegalSection>
    </LegalPageLayout>
  );
}
