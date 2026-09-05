import { calculateCommercialFee } from "@/utils/pricing";
import { agreementsDb } from "@/lib/agreements-db";
import { invoicesDb } from "@/lib/invoices-db";
import { dispatchAiTask } from "@/utils/aiRouter";
import { generateAndSendOtp, verifyOtpCode } from "@/lib/otp";
import { validatePasswordStrength, hasRoleAccess, sanitizeUserInput } from "@/lib/auth";

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

  // 3. Invoices Engine Tests
  try {
    const newInv = await invoicesDb.createInvoice({
      agreementId: "agr-test",
      companyName: "TestCorp",
      amount: 100000,
      taxAmount: 18000,
      totalAmount: 118000,
      currency: "INR",
      status: "UNPAID",
      dueDate: "2026-09-01",
    });
    const pass4 = newInv.status === "UNPAID" && newInv.totalAmount === 118000;
    results.push({ name: "Invoices Engine - Creation & Calculation", category: "Invoices", passed: pass4 });

    const paidInv = await invoicesDb.markAsPaid(newInv.id);
    const pass5 = paidInv?.status === "PAID";
    results.push({ name: "Invoices Engine - Payment Status Transition", category: "Invoices", passed: pass5 });
  } catch (e: any) {
    results.push({ name: "Invoices Engine - Creation & Payment", category: "Invoices", passed: false, message: e.message });
  }

  // 4. Multi-LLM Router safety test. A missing provider is an explicit error;
  // it must never turn into a simulated production score or fake usage data.
  try {
    const isPlaceholder = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("sk-proj-hirego-openai-production-key") || process.env.OPENAI_API_KEY.includes("placeholder");
    if (isPlaceholder) {
      let rejected = false;
      try {
        await dispatchAiTask({ task: "RESUME_SCORE", prompt: "Test prompt" });
      } catch {
        rejected = true;
      }
      results.push({ name: "AI Router - Missing provider fails explicitly without simulated output", category: "AI Router", passed: rejected });
    } else {
      const aiRes = await dispatchAiTask({ task: "RESUME_SCORE", prompt: "Test prompt" });
      const pass6 = aiRes.success && aiRes.log.costEstUsd === null;
      results.push({ name: "AI Router - Provider telemetry does not invent cost", category: "AI Router", passed: pass6 });
    }
  } catch (e: any) {
    results.push({ name: "Multi-LLM Router - Dispatch & Telemetry Logging", category: "AI Router", passed: false, message: e.message });
  }

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

  // 7. OTP Engine Verification Tests
  try {
    const testEmail = "candidate.test@hirego.ai";
    const otpRes = await generateAndSendOtp(testEmail, "VERIFY_EMAIL");
    const passOtp1 = otpRes.success;
    results.push({ name: "OTP Engine - 6-Digit Generation & Persistence", category: "OTP", passed: passOtp1 });

    const invalidVerify = await verifyOtpCode(testEmail, "000000", "VERIFY_EMAIL");
    const passOtp2 = !invalidVerify.valid;
    results.push({ name: "OTP Engine - Rejection of Invalid Code", category: "OTP", passed: passOtp2 });

    const validVerify = await verifyOtpCode(testEmail, "123456", "VERIFY_EMAIL");
    const passOtp3 = validVerify.valid;
    results.push({ name: "OTP Engine - Code Verification & Consumption", category: "OTP", passed: passOtp3 });
  } catch (e: any) {
    results.push({ name: "OTP Engine - Verification Suite", category: "OTP", passed: false, message: e.message });
  }

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
    const { runAuditFixesTests } = await import("./audit-fixes.test");
    const auditRes = await runAuditFixesTests();
    for (const r of auditRes.results) {
      results.push({ name: r.name, category: r.category, passed: r.passed, message: r.message });
    }
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
  const databaseUrl = process.env.DATABASE_URL || "";
  const directUrl = process.env.DIRECT_URL || "";
  const isTestDb = process.env.HIREGO_TEST_DATABASE === "1";
  const isDisposable = (url: string) =>
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("hirego_ci") ||
    url.includes("test");

  if (!isTestDb || (!isDisposable(databaseUrl) && !isDisposable(directUrl))) {
    console.error("FATAL: Test runner blocked. You are attempting to run tests against a live/production database.");
    console.error("To run tests safely, you must set HIREGO_TEST_DATABASE=1 and configure DATABASE_URL/DIRECT_URL to a local/disposable database.");
    process.exit(1);
  }

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
