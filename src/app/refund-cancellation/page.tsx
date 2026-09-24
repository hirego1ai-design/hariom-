import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalHighlight, LegalSection } from "@/components/legal/LegalPageLayout";
import { marketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = marketingMetadata({
  path: "/refund-cancellation",
  title: "Refund & Cancellation Policy | HireGo AI",
  description: "HireGo AI refund, cancellation, failed payment and subscription rules for digital services, credits and managed hiring.",
});

const nav = [
  { href: "#overview", label: "Policy overview" },
  { href: "#subscriptions", label: "Subscriptions" },
  { href: "#credits", label: "Credits & digital services" },
  { href: "#managed", label: "Managed hiring" },
  { href: "#failed", label: "Failed or duplicate payments" },
  { href: "#eligibility", label: "Refund eligibility" },
  { href: "#process", label: "How to request" },
  { href: "#timelines", label: "Refund timelines" },
  { href: "#chargebacks", label: "Disputes & chargebacks" },
  { href: "#contact", label: "Billing contact" },
];

export default function RefundCancellationPage() {
  return (
    <LegalPageLayout
      eyebrow="Payments · Customer Protection"
      title="Clear refund and cancellation rules before checkout."
      summary="This policy explains how cancellations, duplicate charges, failed payments, subscriptions, digital credits and managed hiring fees are handled when paid services are enabled on HireGo AI."
      updated="25 September 2026"
      nav={nav}
      badges={["Digital services", "Subscriptions", "Failed-payment protection", "Original payment method", "Stripe / PayU ready"]}
    >
      <LegalSection id="overview" eyebrow="01 · Overview" title="What this policy covers">
        <p>
          HireGo AI provides digital hiring software and recruitment-related services. We do not ordinarily sell or ship physical goods. This policy applies to eligible payments made through HireGo AI checkout or an invoice that expressly incorporates this policy.
        </p>
        <p>
          A signed employer agreement, order form or statement of work may contain service-specific cancellation, replacement, credit or refund terms. If those terms conflict with this public policy, the signed commercial terms govern that employer engagement to the extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection id="subscriptions" eyebrow="02 · Recurring plans" title="Subscription cancellation">
        <p>
          A plan is recurring only when the checkout, order form or plan description clearly states that it renews. You may request cancellation of future renewals before the next billing date through the available account controls or by contacting support.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cancellation stops future renewal charges; it does not normally reverse a billing period that has already started.</li>
          <li>Unless the checkout or law provides otherwise, access may continue until the end of the already-paid billing period.</li>
          <li>If we charge after a valid cancellation was completed before the billing cut-off, the unintended charge is eligible for correction or refund.</li>
        </ul>
      </LegalSection>

      <LegalSection id="credits" eyebrow="03 · Digital fulfilment" title="Credits, assessments and other digital services">
        <p>
          Credits, assessment attempts, interview sessions, AI service allowances or similar digital entitlements may be delivered to the account after successful payment confirmation.
        </p>
        <p>
          Once a digital entitlement has been materially consumed, completed or used to obtain the intended service, the corresponding charge is generally non-refundable unless the service was defective, duplicated, not delivered as described, or a refund is required by applicable law.
        </p>
        <LegalHighlight title="Unused entitlement review">
          If a digital purchase has not been used and a refund request is made promptly, HireGo AI may review the request based on the product, service state, provider fees and any checkout-specific terms.
        </LegalHighlight>
      </LegalSection>

      <LegalSection id="managed" eyebrow="04 · Managed services" title="Managed Hiring and Pay Per Hire">
        <p>
          Managed Hiring, Pay Per Hire and other recruitment services can involve work performed before a hire occurs, including sourcing, screening coordination, interview operations and employer support. Fees, trigger events, replacement commitments, cancellation rights and refund/credit rules are therefore governed primarily by the applicable employer agreement.
        </p>
        <p>
          If a payment was collected contrary to the signed fee trigger or due to a billing error, contact us for reconciliation. Nothing in this public policy removes a specific replacement, service-credit or refund right expressly stated in a signed agreement.
        </p>
      </LegalSection>

      <LegalSection id="failed" eyebrow="05 · Reconciliation" title="Failed, pending and duplicate payments">
        <p>
          A transaction shown as failed, dropped, pending or ambiguous is not treated as a successful purchase until HireGo AI receives reliable provider confirmation or completes reconciliation.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Duplicate charge:</strong> if the same order is accidentally charged more than once, the duplicate confirmed charge is eligible for refund after verification.</li>
          <li><strong>Debited but failed:</strong> if your bank account is debited but the HireGo AI order is not confirmed, we will rely on payment-provider reconciliation. The provider or bank may automatically reverse the debit, or we may initiate a refund after the failed payment is confirmed.</li>
          <li><strong>Pending transaction:</strong> do not repeatedly repay the same order until its state is resolved or a new order is intentionally created.</li>
        </ul>
      </LegalSection>

      <LegalSection id="eligibility" eyebrow="06 · Eligibility" title="When a refund may be approved">
        <p>A refund may be appropriate where, after verification:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>HireGo AI charged the same order more than once;</li>
          <li>payment was captured but the purchased service or entitlement was not delivered and cannot reasonably be restored;</li>
          <li>a confirmed billing error charged an incorrect amount;</li>
          <li>a valid cancellation was completed before a renewal but a renewal charge was still taken;</li>
          <li>a signed service agreement or checkout term expressly grants the refund;</li>
          <li>applicable law requires a refund or other remedy.</li>
        </ul>
        <p>
          Refunds are generally not provided merely because a user changed their mind after substantially consuming a digital service, assessment, interview session or other purchased entitlement, except where required by law or expressly stated at checkout.
        </p>
      </LegalSection>

      <LegalSection id="process" eyebrow="07 · Request" title="How to request a cancellation or refund">
        <p>
          Contact <a href="mailto:support@hiregoai.com">support@hiregoai.com</a> with the subject “Billing / Refund Request.” Include the account email, order or invoice reference, payment date, amount and a short explanation. Do not send full card numbers, CVV values, OTPs or online-banking credentials.
        </p>
        <p>
          For ordinary digital-service refund requests, please contact us within <strong>7 calendar days</strong> of the relevant charge where practical. This request window does not limit mandatory rights that apply under law or a signed agreement.
        </p>
      </LegalSection>

      <LegalSection id="timelines" eyebrow="08 · Timing" title="Processing and settlement timelines">
        <p>
          Once a refund is approved, HireGo AI will normally initiate it to the original payment method within <strong>7 business days</strong>. The payment provider, card network or bank may require additional time before the funds appear in the customer’s account.
        </p>
        <p>
          For a failed transaction where funds were debited but no successful order was created, reconciliation may occur automatically through the payment provider. If a manual refund is required, we will initiate it after the provider confirms the failed/eligible state. Customers should allow normal banking settlement time after initiation.
        </p>
        <LegalHighlight title="Refund destination" tone="violet">
          Refunds are returned to the original source used for the payment where supported. HireGo AI does not substitute a cash refund for an eligible electronic payment refund unless required by law.
        </LegalHighlight>
      </LegalSection>

      <LegalSection id="chargebacks" eyebrow="09 · Disputes" title="Payment disputes and chargebacks">
        <p>
          If you do not recognize a transaction or believe a payment was incorrect, contact us first so we can investigate quickly. A chargeback opened through a bank or payment provider may temporarily restrict our ability to issue a separate refund for the same transaction while the dispute is active.
        </p>
        <p>
          Fraud, unauthorized payment use and suspected account compromise may be investigated using transaction, account and security records in accordance with the <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection id="contact" eyebrow="10 · Support" title="Billing contact">
        <p>
          Billing, cancellation and refund questions can be sent to <a href="mailto:support@hiregoai.com">support@hiregoai.com</a>. For service fulfilment expectations, see the <Link href="/service-delivery">Service Delivery Policy</Link>. General platform rules are in the <Link href="/terms">Terms and Conditions</Link>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
