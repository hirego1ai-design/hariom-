import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalHighlight, LegalSection } from "@/components/legal/LegalPageLayout";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/service-delivery",
  title: "Service Delivery Policy | HireGo AI",
  description: "How HireGo AI delivers subscriptions, credits, assessments, interviews, managed hiring and digital services after payment.",
});

const nav = [
  { href: "#scope", label: "Scope" },
  { href: "#digital", label: "Digital delivery" },
  { href: "#subscriptions", label: "Subscriptions & credits" },
  { href: "#interviews", label: "Interviews & assessments" },
  { href: "#managed", label: "Managed hiring" },
  { href: "#payments", label: "Payment confirmation" },
  { href: "#delays", label: "Delays & outages" },
  { href: "#physical", label: "No physical shipping" },
  { href: "#contact", label: "Support" },
];

export default function ServiceDeliveryPage() {
  return (
    <LegalPageLayout
      eyebrow="Delivery · Digital Services"
      title="How HireGo AI services are fulfilled after purchase."
      summary="HireGo AI primarily delivers digital software and recruitment services. This page explains when subscriptions, credits, assessments, interviews and managed hiring services become available."
      updated="25 September 2026"
      nav={nav}
      badges={["Digital delivery", "No physical shipping", "Payment reconciliation", "Managed hiring", "Customer support"]}
    >
      <LegalSection id="scope" eyebrow="01 · Scope" title="Services covered">
        <p>
          This policy applies to paid digital features and recruitment services purchased directly from HireGo AI, including subscriptions, account credits, assessment or interview entitlements, and managed hiring services. A signed employer agreement may set more specific service levels, milestones or delivery obligations.
        </p>
      </LegalSection>

      <LegalSection id="digital" eyebrow="02 · Instant access" title="Digital service delivery">
        <p>
          Where a product is designed for immediate self-service use, HireGo AI normally makes the corresponding account feature or entitlement available after the payment provider confirms a successful transaction and the order passes any required security or fraud checks.
        </p>
        <p>
          Delivery may appear as an activated plan, increased account allowance, unlocked feature, credit balance, assessment entitlement, interview entitlement or another visible account state rather than a downloadable physical item.
        </p>
      </LegalSection>

      <LegalSection id="subscriptions" eyebrow="03 · Accounts" title="Subscriptions and credits">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Subscriptions:</strong> access begins when the successful order is applied to the eligible account, unless checkout states a future start date.</li>
          <li><strong>Credits or usage allowances:</strong> balances are normally updated after successful payment confirmation and internal order reconciliation.</li>
          <li><strong>Plan changes:</strong> upgrades, downgrades and renewal timing follow the terms displayed at checkout or in the applicable employer order.</li>
        </ul>
        <p>
          If payment succeeds but the account does not show the purchased entitlement within a reasonable period, contact support before making a duplicate payment.
        </p>
      </LegalSection>

      <LegalSection id="interviews" eyebrow="04 · Scheduled services" title="Assessments, mock interviews and interview services">
        <p>
          Assessments or mock-interview products may be delivered as an immediate entitlement or as access to a session/workflow. Employer-led interviews and assessments may also depend on scheduling, candidate availability and employer configuration.
        </p>
        <p>
          A payment for an entitlement does not guarantee a particular employer interview, candidate selection or employment outcome. Where a purchased session requires scheduling, the available time and joining instructions will be shown in the product or communicated through the account.
        </p>
      </LegalSection>

      <LegalSection id="managed" eyebrow="05 · Human service" title="Managed Hiring and Pay Per Hire delivery">
        <p>
          Managed Hiring is not an instant-download product. Delivery starts according to the employer onboarding, job requirement, commercial agreement and operational readiness. Work may include requirement intake, sourcing, outreach, screening coordination, assessments, interviews, feedback collection and candidate progression.
        </p>
        <p>
          Target timelines, service scope, staffing assumptions, replacement terms and fee-trigger events should be documented in the applicable employer agreement. Market availability, role complexity, candidate response and employer feedback speed can affect hiring timelines.
        </p>
      </LegalSection>

      <LegalSection id="payments" eyebrow="06 · Confirmation" title="Successful, pending and failed payments">
        <p>
          HireGo AI activates paid services only after reliable payment confirmation. A browser redirect, screenshot or debit notification alone is not treated as final proof of a successful transaction if the payment provider reports the order as failed, pending or ambiguous.
        </p>
        <p>
          We may verify payment status through provider webhooks, server-side APIs or reconciliation before delivering the entitlement. This helps prevent duplicate fulfilment and incorrect charges.
        </p>
        <LegalHighlight title="If money was debited but access was not delivered">
          Do not repeatedly repay the same order. Contact support with the order reference. We will reconcile the transaction and either apply the confirmed purchase or follow the <Link href="/refund-cancellation">Refund & Cancellation Policy</Link>.
        </LegalHighlight>
      </LegalSection>

      <LegalSection id="delays" eyebrow="07 · Reliability" title="Delays, maintenance and provider outages">
        <p>
          Delivery can be delayed by payment-provider review, bank settlement, identity/security review, planned maintenance, third-party outages, communications failure or an operational dependency specific to a managed service.
        </p>
        <p>
          If an outage materially prevents delivery of a paid digital service, HireGo AI may restore the entitlement, extend access, provide a service credit or review a refund where appropriate to the affected product and applicable terms.
        </p>
      </LegalSection>

      <LegalSection id="physical" eyebrow="08 · Shipping" title="No physical shipping">
        <p>
          HireGo AI primarily provides digital software and recruitment services. Unless a product page explicitly states otherwise, there is <strong>no physical shipment, courier delivery or shipping charge</strong>. References to “delivery” on this site mean electronic access or performance of the purchased service.
        </p>
      </LegalSection>

      <LegalSection id="contact" eyebrow="09 · Support" title="Delivery support">
        <p>
          If a confirmed purchase is not visible in your account or a scheduled service has not been delivered as expected, contact <a href="mailto:support@hiregoai.com">support@hiregoai.com</a> and provide the account email and order/invoice reference. Do not send passwords, OTPs, full card numbers or CVV values.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
