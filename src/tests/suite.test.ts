import { calculateCommercialFee } from "@/utils/pricing";
import { agreementsDb } from "@/lib/agreements-db";
import { invoicesDb } from "@/lib/invoices-db";
import { dispatchAiTask } from "@/utils/aiRouter";
import { validatePasswordStrength, hasRoleAccess, sanitizeUserInput } from "@/lib/auth";

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
}

export async function runAllTests(): Promise<{
  total: number;
  passedCount: number;
  failedCount: number;
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

  // 4. Multi-LLM Router Tests
  try {
    const aiRes = await dispatchAiTask({ task: "RESUME_SCORE", prompt: "Test prompt" });
    const pass6 = aiRes.success && aiRes.log.totalTokens > 0;
    results.push({ name: "Multi-LLM Router - Dispatch & Telemetry Logging", category: "AI Router", passed: pass6 });
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

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}
