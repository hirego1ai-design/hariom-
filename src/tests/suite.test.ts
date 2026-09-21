import { calculateCommercialFee } from "@/utils/pricing";
import { agreementsDb } from "@/lib/agreements-db";
import { receiptDownloadUrl, receiptNotes, rejectionStatus } from "@/lib/invoiceReceiptState";
import { validatePasswordStrength, hasRoleAccess, sanitizeUserInput } from "@/lib/auth";
import { assertDisposableTestEnvironment, withBlockedProviderNetwork } from "./test-safety";

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  skipped?: boolean;
  message?: string;
}

export async function runAllTests(): Promise<{
  total: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  results: TestResult[];
}> {
  assertDisposableTestEnvironment();
  return withBlockedProviderNetwork(runIsolatedTests);
}

async function runIsolatedTests() {
  const results: TestResult[] = [];

  // 1. Commercial Pricing Engine Tests
  try {
    const feePct = calculateCommercialFee({ pricingModel: "PERCENTAGE", feeValue: 8.33, ctcAnnual: 1500000 });
    const pass1 = feePct.baseFee === 124950 && feePct.totalAmount === 147441;
    results.push({ name: "Commercial Pricing - Percentage Model", category: "Pricing", passed: pass1 });
  } catch (e: any) {
    results.push({ name: "Commercial Pricing - Percentage Model", category: "Pricing", passed: false, message: e.message });
  }

  try {
    const feeSlab = calculateCommercialFee({ pricingModel: "SLAB", feeValue: 0, ctcAnnual: 3000000 });
    const pass2 = feeSlab.baseFee === 375000; // 12.5% rate for >25L
    results.push({ name: "Commercial Pricing - Slab Model (>25L @ 12.5%)", category: "Pricing", passed: pass2 });
  } catch (e: any) {
    results.push({ name: "Commercial Pricing - Slab Model (>25L @ 12.5%)", category: "Pricing", passed: false, message: e.message });
  }

  // 2. Agreements Engine Tests
  try {
    const reqs = await agreementsDb.getRequirements();
    const pass3 = Array.isArray(reqs) && reqs.length >= 1;
    results.push({ name: "Agreements Engine - Requirement Fetching", category: "Agreements", passed: pass3 });
  } catch (e: any) {
    results.push({ name: "Agreements Engine - Requirement Fetching", category: "Agreements", passed: false, message: e.message });
  }

  // 3. Invoice receipt state helpers (database transitions are covered by the
  // disposable-database billing integration suite below).
  try {
    const notes = JSON.stringify({ notes: "Bank transfer", storedFileId: "file-123", bankTransferRef: "UTR-12345" });
    const parsed = receiptNotes(notes);
    const pass4 = parsed.bankTransferRef === "UTR-12345" && receiptDownloadUrl(notes) === "/api/files/file-123";
    results.push({ name: "Invoice receipt metadata is parsed into a private download URL", category: "Invoices", passed: pass4 });

    const pass5 = rejectionStatus("2026-09-01", new Date("2026-09-02T00:00:00.000Z")) === "OVERDUE"
      && rejectionStatus("2026-09-02", new Date("2026-09-02T23:59:59.000Z")) === "UNPAID";
    results.push({ name: "Rejected receipt restores the correct outstanding status", category: "Invoices", passed: pass5 });
  } catch (e: any) {
    results.push({ name: "Invoice receipt state helpers", category: "Invoices", passed: false, message: e.message });
  }

  results.push({ name: "AI Router - Live provider integration", category: "AI Router", passed: false, skipped: true,
    message: "Requires a separately authorized provider sandbox; regression tests must not spend real AI credits." });

  // 5. Security & Auth Tests
  try {
    const p1 = validatePasswordStrength("weak");
    const p2 = validatePasswordStrength("strong_pass_123");
    const pass7 = !p1.valid && p2.valid;
    results.push({ name: "Security Engine - Password Strength Validation", category: "Security", passed: pass7 });

    const rolePass = hasRoleAccess("ADMIN", ["EMPLOYER"]);
    results.push({ name: "Security Engine - Role-Based Access Control", category: "Security", passed: rolePass });

    const sanitized = sanitizeUserInput("<script>alert('xss')</script>");
    const pass8 = !sanitized.includes("<script>");
    results.push({ name: "Security Engine - XSS Input Sanitization", category: "Security", passed: pass8 });
  } catch (e: any) {
    results.push({ name: "Security Engine - Auth Tests", category: "Security", passed: false, message: e.message });
  }

  // 6. Subscriptions & Credits Engine Tests
  try {
    const { subscriptionsDb } = await import("@/lib/subscriptions-db");
    const plans = await subscriptionsDb.getSubscriptionPlans();
    const pass9 = plans.length >= 3;
    results.push({ name: "Subscriptions Engine - Plans Registration", category: "Subscriptions", passed: pass9 });

    const sub = await subscriptionsDb.subscribeCompanyToPlan("comp-test", "plan-daily");
    const credits = await subscriptionsDb.getCompanyCredits("comp-test");
    const pass10 = sub.status === "ACTIVE" && credits.jobPostsLeft === 1 && credits.resumeUnlocksLeft === 5;
    results.push({ name: "Subscriptions Engine - Purchase & Credit Provisioning", category: "Subscriptions", passed: pass10 });

    const updatedCredits = await subscriptionsDb.updateCompanyCredits("comp-test", -1, 0, 0);
    const pass11 = updatedCredits.jobPostsLeft === 0;
    results.push({ name: "Subscriptions Engine - Credit Quota Enforcement", category: "Subscriptions", passed: pass11 });
  } catch (e: any) {
    results.push({ name: "Subscriptions Engine - Tests", category: "Subscriptions", passed: false, message: e.message });
  }

  results.push({ name: "OTP Engine - Live email delivery", category: "OTP", passed: false, skipped: true,
    message: "Requires an isolated mail transport; fixed OTP 123456 is not a valid cryptographic OTP assertion." });

  // 8. Referral Engine & Managed Hiring Auditor Tests
  try {
    const { runReferralTestSuite } = await import("./referrals.test");
    const refSuiteRes = await runReferralTestSuite();
    for (const r of refSuiteRes.results) {
      results.push({ name: r.name, category: "Referrals", passed: r.success, message: r.message });
    }

    const { runManagedHiringAuditorTests } = await import("@/lib/tests/runManagedHiringReferralAuditorTest");
    const auditorRes = await runManagedHiringAuditorTests();
    for (const d of auditorRes.details) {
      const isPass = d.startsWith("[PASS]");
      const cleanName = d.replace(/^\[(PASS|FAIL)\]\s*/, "");
      results.push({ name: cleanName, category: "Managed Hiring Pipeline & Cron", passed: isPass });
    }
  } catch (e: any) {
    results.push({ name: "Managed Hiring Referral & Scheduled Cron Suite", category: "Managed Hiring Pipeline & Cron", passed: false, message: e.message });
  }

  // 9. Audit Fixes Verification Suite
  try {
    
  } catch (e: any) {
    results.push({ name: "Audit Fixes Suite", category: "Audit Fixes", passed: false, message: e.message });
  }

  // 10. WhatsApp Meta Cloud API Integration Suite
  try {
    const { runWhatsAppTestSuite } = await import("./whatsapp.test");
    const waRes = await runWhatsAppTestSuite();
    for (const r of waRes.results) {
      results.push({ name: r.name, category: "WhatsApp Meta Cloud API", passed: r.passed, message: r.message });
    }
  } catch (e: any) {
    results.push({ name: "WhatsApp Meta Cloud API Suite", category: "WhatsApp Meta Cloud API", passed: false, message: e.message });
  }

  // 11. Production hardening regressions. Database integration coverage only
  // runs in the disposable PostgreSQL service provisioned by CI.
  try {
    const { runProductionHardeningTests } = await import("./production-hardening.test");
    const hardening = await runProductionHardeningTests();
    results.push(...hardening.results);
  } catch (e: any) {
    results.push({ name: "Production hardening regression suite", category: "Production hardening", passed: false, message: e.message });
  }

  // 12. Dynamic MCQ assessment system. Verified dynamically-loaded tests
  // and correct grading math on secure endpoints.
  try {
    const { runMcqAssessmentTests } = await import("./mcq-assessment.test");
    const mcqTests = await runMcqAssessmentTests();
    results.push(...mcqTests.results);
  } catch (e: any) {
    results.push({ name: "MCQ assessment system suite", category: "MCQ Assessments", passed: false, message: e.message });
  }

  // 13. Employer Team Invitations. Verified cryptographic tokens, RBAC,
  // duplicate prevention, and lifecycle state transitions.
  try {
    const { runTeamInvitationTests } = await import("./team-invitations.test");
    const teamTests = await runTeamInvitationTests();
    results.push(...teamTests.results);
  } catch (e: any) {
    results.push({ name: "Team invitations test suite", category: "Team Invitations", passed: false, message: e.message });
  }

  // 14. PostgreSQL Promo Code Engine. Verified database validity,
  // expiration, archive status, max usage, and atomic concurrency reservations.
  try {
    const { runPromoCodeTests } = await import("./promo-code.test");
    const promoTests = await runPromoCodeTests();
    results.push(...promoTests.results);
  } catch (e: any) {
    results.push({ name: "Promo codes test suite", category: "Promo Codes", passed: false, message: e.message });
  }

  // 15. Managed Hiring Join Invoice Verification. Verified Zod validation,
  // pricing model, agreement status, role access, and idempotency.
  try {
    const { runManagedHiringJoinTests } = await import("./managed-hiring-join.test");
    const joinTests = await runManagedHiringJoinTests();
    results.push(...joinTests.results);
  } catch (e: any) {
    results.push({ name: "Managed hiring join test suite", category: "Managed Hiring Join", passed: false, message: e.message });
  }

  // 16. Billing Invoices and Private Proof Verification. Verified RBAC,
  // company-scoped listings, payment processing, and StoredFile uploads.
  try {
    const { runBillingInvoicesTests } = await import("./billing-invoices.test");
    const billingTests = await runBillingInvoicesTests();
    results.push(...billingTests.results);
  } catch (e: any) {
    results.push({ name: "Billing invoices test suite", category: "Billing Invoices", passed: false, message: e.message });
  }

  // 17. Hiring Workflow Operations. Verified RBAC, company-scoped candidate
  // stage updates, job updates/deletions, and interview scheduling/cancellation.
  try {
    const { runHiringWorkflowTests } = await import("./hiring-workflow.test");
    const workflowTests = await runHiringWorkflowTests();
    results.push(...workflowTests.results);
  } catch (e: any) {
    results.push({ name: "Hiring workflow test suite", category: "Hiring Workflow", passed: false, message: e.message });
  }

  // 18. Phase 5 agent security boundary. These offline regressions prove that
  // model-selected consequential tools and agent-context spoofing fail closed.
  try {
    const { runPhase5AgentSecurityTests } = await import("./phase5-agent-security.test");
    const phase5Security = await runPhase5AgentSecurityTests();
    results.push(...phase5Security.results);
  } catch (e: any) {
    results.push({ name: "Phase 5 agent security suite", category: "Phase 5 Agent Security", passed: false, message: e.message });
  }

  // 19. Workflow engine behavioral regressions run through Node's test runner
  // in CI via verify:phase5. Keep the main suite aware of the contract file so
  // accidental removal from the repository is reported immediately.
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const regressionPath = path.resolve("src/tests/workflow-engine-regression.test.ts");
    const source = fs.readFileSync(regressionPath, "utf8");
    const required = [
      "workflow completion blocks approved but unconsumed consequential actions",
      "duplicate decided approval request cannot re-pause workflow",
      "approving one action keeps workflow paused while another approval is pending",
      "approved action consumption is single-use under replay",
    ];
    results.push({
      name: "Workflow approval behavioral regressions remain registered",
      category: "Phase 5 Workflow Reliability",
      passed: required.every((name) => source.includes(name)),
    });
  } catch (e: any) {
    results.push({ name: "Workflow approval behavioral regressions", category: "Phase 5 Workflow Reliability", passed: false, message: e.message });
  }

  // 20. Payment Architecture & Gateway Security (Stripe + PayU only)
  try {
    const { isGateway } = await import("../lib/payments/PaymentGatewayInterface");
    const { PaymentGatewayController } = await import("../lib/payments/PaymentGatewayController");
    const { StripeGateway } = await import("../lib/payments/StripeGateway");
    const { PayUGateway } = await import("../lib/payments/PayUGateway");

    const approvedOnly = isGateway("STRIPE") && isGateway("PAYU") && !isGateway("RAZORPAY") && !isGateway("PHONEPE");
    results.push({
      name: "Payment Gateway Contract - Exactly STRIPE and PAYU supported",
      category: "Payments",
      passed: approvedOnly,
    });

    const unapprovedReject = await PaymentGatewayController.verifyWebhook({
      rawBody: "{}",
      signature: "sig",
      provider: "PHONEPE" as any,
      headers: {},
    });
    results.push({
      name: "Payment Gateway Security - Unsupported provider webhooks rejected",
      category: "Payments",
      passed: unapprovedReject.isValid === false && unapprovedReject.status === "REJECTED",
    });

    const stripe = new StripeGateway();
    const payu = new PayUGateway();
    results.push({
      name: "Payment Gateways - Stripe and PayU instances initialized",
      category: "Payments",
      passed: stripe.name === "STRIPE" && payu.name === "PAYU",
    });
  } catch (e: any) {
    results.push({ name: "Payment Architecture & Gateway Security", category: "Payments", passed: false, message: e.message });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const skippedCount = results.filter((r) => r.skipped).length;
  const failedCount = results.length - passedCount - skippedCount;

  return {
    total: results.length,
    passedCount,
    failedCount,
    skippedCount,
    results,
  };
}

// Direct CLI execution support for CI & npm test
if (process.argv[1]?.includes("suite.test")) {
  runAllTests()
    .then((res) => {
      console.log("\n========================================");
      console.log(`HireGo Test Suite Summary:`);
      console.log(`Total: ${res.total} | Passed: ${res.passedCount} | Skipped: ${res.skippedCount} | Failed: ${res.failedCount}`);
      console.log("========================================\n");
      for (const r of res.results) {
        console.log(`  [${r.skipped ? "SKIP" : r.passed ? "PASS" : "FAIL"}] [${r.category}] ${r.name}${r.message ? ` - ${r.message}` : ""}`);
      }
      process.exit(res.failedCount > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error("Test runner execution failed:", err);
      process.exit(1);
    });
}



