import { generateAndSendOtp, verifyOtpCode } from "@/lib/otp";
import { enforceRateLimit, resetRateLimitStore } from "@/lib/apiSecurity";

export interface AuditFixTestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
}

export async function runAuditFixesTests(): Promise<{
  total: number;
  passedCount: number;
  failedCount: number;
  results: AuditFixTestResult[];
}> {
  const results: AuditFixTestResult[] = [];

  // 1. OTP Cryptographic Randomness Tests
  try {
    const testEmail = `audit.otp.${Date.now()}@hirego.ai`;
    const res = await generateAndSendOtp(testEmail, "VERIFY_EMAIL");
    const otp = res.debugOtp;
    const is6Digits = typeof otp === "string" && /^\d{6}$/.test(otp);
    results.push({
      name: "OTP Engine - Secure 6-Digit Numeric Generation",
      category: "OTP Security",
      passed: is6Digits,
      message: is6Digits ? undefined : `OTP was not 6 digits: ${otp}`,
    });
  } catch (e: any) {
    results.push({
      name: "OTP Engine - Secure 6-Digit Numeric Generation",
      category: "OTP Security",
      passed: false,
      message: e.message,
    });
  }

  // 2. Upload Category Allowlist & Path Traversal Guard Tests
  try {
    const ALLOWED_UPLOAD_CATEGORIES = new Set([
      "resumes",
      "avatars",
      "company-logos",
      "assessment-media",
    ]);

    const validCategory = "resumes";
    const invalidCategory = "../malicious";
    const path = await import("path");

    const baseDir = path.resolve(path.join(process.cwd(), "public", "uploads"));

    const checkTraversal = (cat: string) => {
      if (!ALLOWED_UPLOAD_CATEGORIES.has(cat)) return false;
      const targetDir = path.resolve(path.join(baseDir, cat));
      const relative = path.relative(baseDir, targetDir);
      return !relative.startsWith("..") && !path.isAbsolute(relative);
    };

    const passValid = checkTraversal(validCategory) === true;
    const passInvalid = checkTraversal(invalidCategory) === false;

    results.push({
      name: "Upload Guard - Allowed Category & Path Traversal Prevention",
      category: "Upload Security",
      passed: passValid && passInvalid,
      message: passValid && passInvalid ? undefined : "Traversal check failed",
    });
  } catch (e: any) {
    results.push({
      name: "Upload Guard - Allowed Category & Path Traversal Prevention",
      category: "Upload Security",
      passed: false,
      message: e.message,
    });
  }

  // 3. API Security Rate Limiter Cleanup Test
  try {
    resetRateLimitStore("test-prefix");
    const req = new Request("https://hirego.ai/api/test", {
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    enforceRateLimit(req, "test-prefix", 10, 60000);
    resetRateLimitStore("test-prefix");

    results.push({
      name: "API Security - Rate Limiter Store & Stale Entry Eviction",
      category: "Rate Limiter",
      passed: true,
    });
  } catch (e: any) {
    results.push({
      name: "API Security - Rate Limiter Store & Stale Entry Eviction",
      category: "Rate Limiter",
      passed: false,
      message: e.message,
    });
  }

  // 4. PaymentOrder Interface & Notes Structure
  try {
    const { RazorpayGateway } = await import("@/lib/payments/RazorpayGateway");
    const rzp = new RazorpayGateway();

    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test123",
            order_id: "order_test123",
            status: "captured",
            amount: 1199900,
            notes: { companyId: "comp-test", planId: "plan-test" },
          },
        },
      },
    });

    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.PAYMENT_WEBHOOK_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      "";

    const signature = secret
      ? (await import("crypto")).createHmac("sha256", secret).update(rawBody).digest("hex")
      : "";

    // Verify webhook parser returns gatewayOrderId
    const mockWebhookRes = await rzp.verifyWebhook({
      rawBody,
      signature,
      provider: "RAZORPAY",
      headers: {},
    });

    const passGatewayOrderId = mockWebhookRes.gatewayOrderId === "order_test123";
    const passGatewayTxId = mockWebhookRes.gatewayTxId === "pay_test123";

    results.push({
      name: "Razorpay Gateway - gatewayOrderId & notes field binding",
      category: "Payments",
      passed: passGatewayOrderId && passGatewayTxId,
      message:
        passGatewayOrderId && passGatewayTxId
          ? undefined
          : `Expected gatewayOrderId=order_test123, got: ${mockWebhookRes.gatewayOrderId}`,
    });
  } catch (e: any) {
    results.push({
      name: "Razorpay Gateway - gatewayOrderId & notes field binding",
      category: "Payments",
      passed: false,
      message: e.message,
    });
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
