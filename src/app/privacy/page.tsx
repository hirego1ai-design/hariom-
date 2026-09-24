import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalHighlight, LegalSection } from "@/components/legal/LegalPageLayout";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/privacy",
  title: "Privacy Policy | HireGo AI",
  description: "How HireGo AI handles candidate, employer, assessment, video, communications, payment and technical information.",
});

const nav = [
  { href: "#scope", label: "Scope" },
  { href: "#data", label: "Information we collect" },
  { href: "#sources", label: "Sources of information" },
  { href: "#purposes", label: "Why we use data" },
  { href: "#ai", label: "AI & automated processing" },
  { href: "#video", label: "Video & recorded assessments" },
  { href: "#payments", label: "Payments" },
  { href: "#communications", label: "Email & WhatsApp" },
  { href: "#sharing", label: "Sharing & processors" },
  { href: "#international", label: "International processing" },
  { href: "#security", label: "Security" },
  { href: "#retention", label: "Retention" },
  { href: "#choices", label: "Your rights & choices" },
  { href: "#cookies", label: "Cookies & analytics" },
  { href: "#children", label: "Age-related use" },
  { href: "#changes", label: "Policy changes" },
  { href: "#contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy · Data Trust"
      title="Privacy that explains the real hiring workflow."
      summary="This policy describes how HireGo AI handles candidate, employer and platform data across profiles, applications, assessments, interviews, video resumes, communications, payments and AI-assisted workflows."
      updated="25 September 2026"
      nav={nav}
      badges={["Candidate data", "Employer data", "Video & assessments", "Payments", "AI transparency"]}
    >
      <LegalSection id="scope" eyebrow="01 · Scope" title="Who and what this policy covers">
        <p>
          This Privacy Policy applies to personal information processed through HireGo AI websites, applications, dashboards, hiring workflows and related support or managed hiring services. It covers candidates, employer and recruiter users, prospective customers and people who contact us.
        </p>
        <p>
          In some employer-led hiring workflows, an employer may independently determine why and how candidate information is used. In those cases the employer may have its own privacy obligations in addition to HireGo AI’s responsibilities as a platform or service provider.
        </p>
      </LegalSection>

      <LegalSection id="data" eyebrow="02 · Data map" title="Information we may collect and process">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Account data:</strong> name, email, phone number, authentication state, role, account preferences and security records.</li>
          <li><strong>Candidate profile data:</strong> resume, skills, education, employment history, projects, preferences, availability, job interests and profile information.</li>
          <li><strong>Application and hiring data:</strong> jobs viewed or applied to, sourcing invitations, status changes, employer notes where permitted, interview scheduling, feedback and workflow events.</li>
          <li><strong>Assessment data:</strong> questions, answers, scores, timestamps, attempt metadata, typing or job-readiness activity and recorded assessment responses.</li>
          <li><strong>Video and audio data:</strong> optional video resumes, recorded assessment responses, transcripts and technical/descriptive audio signals needed to process the recording.</li>
          <li><strong>Employer data:</strong> company details, recruiter identity, job requirements, hiring workflow configuration, team permissions, billing records and service usage.</li>
          <li><strong>Communications:</strong> support requests, email events, WhatsApp workflow events, notification preferences and delivery status.</li>
          <li><strong>Payment data:</strong> order identifiers, provider references, amount, currency, payment state, invoice/refund information and reconciliation records. Raw card or bank credentials should be handled by the payment provider rather than stored by HireGo AI.</li>
          <li><strong>Technical and security data:</strong> IP address, device/browser information, logs, session state, rate-limit events, security events and operational diagnostics.</li>
        </ul>
      </LegalSection>

      <LegalSection id="sources" eyebrow="03 · Sources" title="Where information comes from">
        <p>
          Information may come directly from you, from an employer or recruiter involved in a hiring process, from actions you take on the platform, from authorized integrations and service providers, or from publicly available/professionally relevant sources where sourcing features are lawfully used.
        </p>
        <p>
          We do not intend to purchase personal contact lists for transactional communications. Candidate sourcing must be carried out with an appropriate professional purpose and in accordance with applicable law and platform rules.
        </p>
      </LegalSection>

      <LegalSection id="purposes" eyebrow="04 · Purpose" title="Why we use information">
        <ul className="list-disc space-y-2 pl-5">
          <li>create, authenticate and secure accounts;</li>
          <li>build and display candidate or employer profiles;</li>
          <li>support applications, sourcing, assessments, interviews and hiring workflows;</li>
          <li>operate managed hiring and requested recruitment services;</li>
          <li>send account, security, interview, assessment, application and service communications;</li>
          <li>process, reconcile and support payments, credits, invoices and refunds;</li>
          <li>detect abuse, investigate security issues and enforce platform rules;</li>
          <li>measure reliability and improve product performance;</li>
          <li>meet legal, accounting, tax, dispute and compliance obligations.</li>
        </ul>
        <p>
          Depending on the context and applicable law, processing may be based on your request or contract, consent, legitimate operational needs, legal obligations or another lawful basis.
        </p>
      </LegalSection>

      <LegalSection id="ai" eyebrow="05 · Responsible AI" title="AI-assisted and automated processing">
        <p>
          HireGo AI may use automated systems to summarize job requirements, structure candidate information, generate interview or assessment support, assist with matching, draft communications, evaluate text responses or help coordinate workflows.
        </p>
        <LegalHighlight title="Human decision principle">
          HireGo AI does not intend a candidate to be finally hired or rejected solely because an automated system produced a particular score or summary. Employers remain responsible for lawful, job-related and appropriately reviewed hiring decisions.
        </LegalHighlight>
        <p>
          Automated outputs can be wrong or incomplete. Users should review important outputs, and candidates may contact us if they believe an automated report materially misrepresents information they provided.
        </p>
      </LegalSection>

      <LegalSection id="video" eyebrow="06 · Recorded media" title="Video resumes and recorded assessments">
        <p>
          A candidate may choose to record or upload a video resume or may be invited to complete a job-specific recorded assessment. The recording can contain image, voice, statements and other information visible or audible in the recording.
        </p>
        <p>
          HireGo AI may create a transcript and descriptive processing signals such as duration, speech pace, pauses, transcription confidence and recording quality where the feature is enabled. These signals are not intended to infer character, honesty, personality, disability, emotion or overall employability from a person’s appearance, accent or voice.
        </p>
        <p>
          Recordings are intended to be private to the candidate, authorized HireGo AI operations and employers/recruiters with a legitimate relationship to the relevant application or workflow, subject to product permissions.
        </p>
      </LegalSection>

      <LegalSection id="payments" eyebrow="07 · Commerce" title="Payment information and processors">
        <p>
          When paid services are enabled, checkout may be provided through approved payment processors such as <strong>Stripe</strong> or <strong>PayU</strong>. Those providers may collect payment credentials, fraud-prevention information and billing details under their own privacy terms.
        </p>
        <p>
          HireGo AI should retain only the information needed to identify the order, confirm payment status, reconcile provider records, issue invoices, investigate disputes and process eligible refunds. We do not intend to store full raw card numbers, CVV values or online-banking credentials.
        </p>
      </LegalSection>

      <LegalSection id="communications" eyebrow="08 · Communications" title="Email, WhatsApp and notifications">
        <p>
          We may send transactional communications for registration verification, password recovery, account security, application updates, sourcing invitations, assessment instructions, interview coordination, hiring workflow events, service delivery and billing.
        </p>
        <p>
          Delivery infrastructure may include email, WhatsApp or other communications providers. Provider acceptance does not always mean a message was delivered or read. We may keep delivery state and event identifiers to prevent duplicate sends, troubleshoot failures and support users.
        </p>
        <p>
          Transactional channels are not intended for unsolicited bulk marketing. Optional marketing communications, where offered, should use separate preference and opt-out controls where required.
        </p>
      </LegalSection>

      <LegalSection id="sharing" eyebrow="09 · Sharing" title="Who may receive information">
        <p>We may share information with:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>employers and recruiters</strong> where necessary for a candidate’s application, sourcing relationship or hiring workflow;</li>
          <li><strong>service providers</strong> that host infrastructure, databases, files, email, messaging, security, analytics, payments or AI processing;</li>
          <li><strong>professional advisers and authorities</strong> where reasonably necessary for legal, tax, security or dispute purposes;</li>
          <li><strong>a successor entity</strong> in connection with a legitimate merger, financing, acquisition or business transfer, subject to appropriate safeguards.</li>
        </ul>
        <p>
          Depending on the feature, service providers may include infrastructure and platform providers such as Vercel, Supabase/PostgreSQL, Cloudflare R2, Redis infrastructure, communications providers such as Zoho CPaaS/ZeptoMail or other configured email services, WhatsApp/Meta infrastructure, AI providers, and payment processors such as Stripe or PayU. This list can change as integrations are replaced or added.
        </p>
        <p>
          We do not sell personal information to advertisers.
        </p>
      </LegalSection>

      <LegalSection id="international" eyebrow="10 · Locations" title="International processing and transfers">
        <p>
          HireGo AI and its service providers may process information in countries other than the country where a user lives. Where cross-border processing occurs, we seek to use appropriate contractual, technical and organizational safeguards required for the relevant data and jurisdiction.
        </p>
      </LegalSection>

      <LegalSection id="security" eyebrow="11 · Security" title="How we protect information">
        <p>
          HireGo AI uses measures intended to protect information, including access controls, role-based authorization, authenticated APIs, private object storage for sensitive uploads, signed access where appropriate, encryption in transit, security logging, session controls, rate limiting and provider-side security controls.
        </p>
        <p>
          No internet service can guarantee absolute security. Users should protect their credentials and contact us promptly if they suspect unauthorized access.
        </p>
      </LegalSection>

      <LegalSection id="retention" eyebrow="12 · Lifecycle" title="Retention and deletion">
        <p>
          We retain information for as long as reasonably necessary for the account, hiring workflow, employer engagement, purchased service, security record, legal obligation, accounting requirement or dispute for which it is needed. Retention can therefore differ by data type and workflow.
        </p>
        <p>
          Where a product-specific fixed retention period is not yet enforced consistently, we do not publish a shorter period that the system cannot reliably guarantee. A verified user may request deletion, subject to information that must be retained for security, legal, billing, fraud-prevention or dispute purposes.
        </p>
      </LegalSection>

      <LegalSection id="choices" eyebrow="13 · Control" title="Your rights and choices">
        <p>
          Subject to applicable law and verification, you may ask to access, correct or delete personal information; withdraw a permission where processing depends on that permission; object to or question certain processing; request an alternative to an optional recorded-media workflow where reasonably available; or raise a concern about an automated report.
        </p>
        <p>
          Send privacy requests to <a href="mailto:support@hiregoai.com">support@hiregoai.com</a> with a clear subject such as “Privacy Request.” We may ask for enough information to verify the request and protect the account.
        </p>
      </LegalSection>

      <LegalSection id="cookies" eyebrow="14 · Browser data" title="Cookies, local storage and analytics">
        <p>
          HireGo AI may use cookies or similar browser storage for sign-in state, security, theme/preferences, session continuity and product analytics. Essential storage may be required for the service to function. Where consent is legally required for non-essential analytics or advertising technologies, the relevant controls should be presented before those technologies are used.
        </p>
      </LegalSection>

      <LegalSection id="children" eyebrow="15 · Age" title="Age-related use">
        <p>
          HireGo AI is designed for professional hiring and career use, not for children. Users must satisfy the minimum age and capacity requirements applicable to employment, contracting and online services in their jurisdiction. If we learn that information was submitted inappropriately for a child, we may restrict the account and take reasonable deletion steps.
        </p>
      </LegalSection>

      <LegalSection id="changes" eyebrow="16 · Updates" title="Changes to this policy">
        <p>
          We may update this Privacy Policy as features, providers, laws or business operations change. The “Last updated” date identifies the current public version. Material changes should be communicated through the platform or another appropriate channel where required.
        </p>
      </LegalSection>

      <LegalSection id="contact" eyebrow="17 · Contact" title="Privacy questions and grievances">
        <p>
          For privacy questions, data requests or grievances, contact <a href="mailto:support@hiregoai.com">support@hiregoai.com</a> or use the <Link href="/contact">Contact page</Link>. Do not send passwords, OTPs, full card numbers or unrelated identity documents by ordinary email.
        </p>
        <LegalHighlight title="Business identity consistency" tone="amber">
          Payment providers and compliance reviewers may require the legal merchant name, postal address, support phone and tax/business registration details to match the verified entity. Those facts should be published only after they are confirmed and should remain consistent across checkout, invoices, policies and KYC records.
        </LegalHighlight>
      </LegalSection>
    </LegalPageLayout>
  );
}
