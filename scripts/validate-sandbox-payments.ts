/**
 * HireGo AI — Production Payment Gateway Sandbox Validation Suite
 * Strict verification for approved production gateways: STRIPE + PAYU
 * Zero legacy providers (No PhonePe, No Razorpay).
 */

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { StripeGateway } from "../src/lib/payments/StripeGateway";
import { PayUGateway } from "../src/lib/payments/PayUGateway";
import { PaymentGatewayController } from "../src/lib/payments/PaymentGatewayController";
import { isGateway, GatewayName, AmbiguousPaymentOrderError } from "../src/lib/payments/PaymentGatewayInterface";

interface TestCaseResult {
  name: string;
  provider: "STRIPE" | "PAYU" | "CONTROLLER";
  passed: boolean;
  error?: string;
}

const results: TestCaseResult[] = [];

function recordTest(provider: "STRIPE" | "PAYU" | "CONTROLLER", name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ name, provider, passed: true });
      console.log(`  [PASS] [${provider}] ${name}`);
    } catch (err: any) {
      results.push({ name, provider, passed: false, error: err.message });
      console.error(`  [FAIL] [${provider}] ${name}: ${err.message}`);
    }
  };
}

async function runStripeTests() {
  console.log("\n=========================================");
  console.log(" RUNNING STRIPE SANDBOX & SECURITY SUITE");
  console.log("=========================================");

  const stripe = new StripeGateway();
  const testSecret = "mock_webhook_secret_for_validation_only";
  process.env.STRIPE_WEBHOOK_SECRET = testSecret;

  // 1. Missing credentials in production
  await recordTest("STRIPE", "Missing credentials fail closed in production", async () => {
    const oldNodeEnv = process.env.NODE_ENV;
    const oldKey = process.env.STRIPE_SECRET_KEY;
    try {
      (process.env as any).NODE_ENV = "production";
      delete process.env.STRIPE_SECRET_KEY;
      await assert.rejects(
        () => stripe.createOrder({
          orderId: "ord_stripe_prod_missing",
          amount: 1000,
          currency: "INR",
          planName: "Test Plan",
          companyId: "comp_123",
        }),
        /Stripe checkout credentials are not configured/
      );
    } finally {
      (process.env as any).NODE_ENV = oldNodeEnv;
      if (oldKey) process.env.STRIPE_SECRET_KEY = oldKey;
    }
  })();

  // 2. Checkout creation in test/dev
  await recordTest("STRIPE", "Checkout creation returns authoritative checkout URL", async () => {
    const res = await stripe.createOrder({
      orderId: "ord_stripe_test_001",
      amount: 4999,
      currency: "INR",
      planName: "Growth Plan",
      companyId: "comp_001",
    });
    assert.equal(res.success, true);
    assert.equal(res.gateway, "STRIPE");
    assert.equal(res.orderId, "ord_stripe_test_001");
    assert.ok(res.checkoutUrl);
  })();

  // 3. Webhook with correct signature
  await recordTest("STRIPE", "Webhook with valid timestamped v1 signature succeeds", async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const bodyObj = {
      id: "evt_test_success",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_session_001",
          amount_total: 499900,
          currency: "inr",
          metadata: { companyId: "comp_001", orderId: "ord_stripe_test_001" },
          payment_status: "paid",
        },
      },
    };
    const rawBody = JSON.stringify(bodyObj);
    const sig = crypto.createHmac("sha256", testSecret).update(`${nowSeconds}.${rawBody}`).digest("hex");
    const header = `t=${nowSeconds},v1=${sig}`;

    const verification = await stripe.verifyWebhook({
      rawBody,
      signature: header,
      provider: "STRIPE",
      headers: { "stripe-signature": header },
    });

    assert.equal(verification.isValid, true);
    assert.equal(verification.status, "SUCCESS");
    assert.equal(verification.amount, 4999);
    assert.equal(verification.currency, "INR");
    assert.equal(verification.orderId, "ord_stripe_test_001");
    assert.equal(verification.companyId, "comp_001");
  })();

  // 4. Webhook with invalid signature fails closed
  await recordTest("STRIPE", "Webhook with invalid signature is rejected", async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const rawBody = JSON.stringify({ id: "evt_tampered" });
    const header = `t=${nowSeconds},v1=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef`;

    const verification = await stripe.verifyWebhook({
      rawBody,
      signature: header,
      provider: "STRIPE",
      headers: { "stripe-signature": header },
    });

    assert.equal(verification.isValid, false);
    assert.equal(verification.status, "REJECTED");
  })();

  // 5. Stale / Replayed signature rejected
  await recordTest("STRIPE", "Stale webhook signature (>300s) is rejected as replay", async () => {
    const staleSeconds = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
    const rawBody = JSON.stringify({ id: "evt_stale" });
    const sig = crypto.createHmac("sha256", testSecret).update(`${staleSeconds}.${rawBody}`).digest("hex");
    const header = `t=${staleSeconds},v1=${sig}`;

    const verification = await stripe.verifyWebhook({
      rawBody,
      signature: header,
      provider: "STRIPE",
      headers: { "stripe-signature": header },
    });

    assert.equal(verification.isValid, false);
    assert.equal(verification.status, "REJECTED");
    assert.match(verification.error || "", /tolerance window/);
  })();

  // 6. Malformed header rejected (no fallback to raw HMAC)
  await recordTest("STRIPE", "Missing timestamp (raw HMAC attempt) fails closed", async () => {
    const rawBody = JSON.stringify({ id: "evt_no_t" });
    const rawSig = crypto.createHmac("sha256", testSecret).update(rawBody).digest("hex");

    const verification = await stripe.verifyWebhook({
      rawBody,
      signature: rawSig,
      provider: "STRIPE",
      headers: { "stripe-signature": rawSig },
    });

    assert.equal(verification.isValid, false);
    assert.equal(verification.status, "REJECTED");
  })();

  // 7. Failed payment status mapping
  await recordTest("STRIPE", "Payment failure event correctly mapped to FAILED status", async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const bodyObj = {
      id: "evt_failed",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_test_failed",
          amount: 200000,
          currency: "inr",
          status: "failed",
        },
      },
    };
    const rawBody = JSON.stringify(bodyObj);
    const sig = crypto.createHmac("sha256", testSecret).update(`${nowSeconds}.${rawBody}`).digest("hex");
    const header = `t=${nowSeconds},v1=${sig}`;

    const verification = await stripe.verifyWebhook({
      rawBody,
      signature: header,
      provider: "STRIPE",
      headers: { "stripe-signature": header },
    });

    assert.equal(verification.isValid, true);
    assert.equal(verification.status, "FAILED");
  })();
}

async function runPayUTests() {
  console.log("\n=========================================");
  console.log("  RUNNING PAYU SANDBOX & SECURITY SUITE");
  console.log("=========================================");

  const payu = new PayUGateway();
  const testKey = "mock_payu_merchant_key";
  const testSalt = "mock_payu_merchant_salt";
  process.env.PAYU_MERCHANT_KEY = testKey;
  process.env.PAYU_MERCHANT_SALT = testSalt;

  // 1. Missing credentials fail closed in production
  await recordTest("PAYU", "Missing credentials fail closed in production", async () => {
    const oldNodeEnv = process.env.NODE_ENV;
    const oldEnv = process.env.PAYU_ENVIRONMENT;
    const oldKey = process.env.PAYU_MERCHANT_KEY;
    try {
      (process.env as any).NODE_ENV = "production";
      delete process.env.PAYU_ENVIRONMENT;
      delete process.env.PAYU_MERCHANT_KEY;
      await assert.rejects(
        () => payu.createOrder({
          orderId: "ord_payu_missing_key",
          amount: 2500,
          currency: "INR",
          planName: "Pro Plan",
          companyId: "comp_payu_1",
        }),
        /PayU merchant credentials missing in production/
      );
    } finally {
      (process.env as any).NODE_ENV = oldNodeEnv;
      if (oldEnv) process.env.PAYU_ENVIRONMENT = oldEnv;
      process.env.PAYU_MERCHANT_KEY = oldKey;
    }
  })();

  // 2. Real hosted checkout creation with official SHA-512 request hash
  await recordTest("PAYU", "Hosted checkout creation generates official request hash and fields", async () => {
    const res = await payu.createOrder({
      orderId: "ord_payu_create_001",
      amount: 1500,
      currency: "INR",
      planName: "Starter Tier",
      planId: "plan_starter",
      companyId: "comp_payu_001",
    });

    assert.equal(res.success, true);
    assert.equal(res.gateway, "PAYU");
    assert.ok(res.checkoutUrl?.includes("_payment"));
    assert.ok(res.checkoutParams);
    assert.equal(res.checkoutParams.key, testKey);
    assert.equal(res.checkoutParams.amount, "1500.00");
    assert.equal(res.checkoutParams.udf1, "ord_payu_create_001");
    assert.equal(res.checkoutParams.udf2, "comp_payu_001");
    assert.equal(res.checkoutParams.udf3, "plan_starter");

    // Salt must NOT be exposed in checkoutParams or rawPayload
    assert.equal((res.checkoutParams as any).salt, undefined);
    assert.equal((res.rawPayload as any).salt, undefined);

    // Verify hash integrity: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const expectedHash = crypto.createHash("sha512").update(
      `${testKey}|${res.gatewayOrderId}|1500.00|Starter Tier|Employer|billing@hirego.ai|ord_payu_create_001|comp_payu_001|plan_starter||||||||${testSalt}`
    ).digest("hex");
    assert.equal(res.checkoutParams.hash, expectedHash);
  })();

  // 3. Webhook with valid reverse SHA-512 hash
  await recordTest("PAYU", "Webhook with valid reverse SHA-512 hash succeeds", async () => {
    const txnid = "payu_tx_verified_001";
    const amount = "1500.00";
    const productinfo = "Starter Tier";
    const firstname = "Employer";
    const email = "billing@hirego.ai";
    const udf1 = "ord_payu_create_001";
    const udf2 = "comp_payu_001";
    const udf3 = "plan_starter";
    const status = "success";

    // Reverse hash formula: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const reverseHash = crypto.createHash("sha512").update(
      `${testSalt}|${status}||||||||${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${testKey}`
    ).digest("hex");

    const payload = {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      key: testKey,
      hash: reverseHash,
      mihpayid: "403993715530",
    };

    const verification = await payu.verifyWebhook({
      rawBody: JSON.stringify(payload),
      signature: reverseHash,
      provider: "PAYU",
      headers: {},
    });

    assert.equal(verification.isValid, true);
    assert.equal(verification.status, "SUCCESS");
    assert.equal(verification.amount, 1500);
    assert.equal(verification.gatewayTxId, "403993715530");
    assert.equal(verification.gatewayOrderId, txnid);
    assert.equal(verification.companyId, "comp_payu_001");
    assert.equal(verification.planId, "plan_starter");
  })();

  // 4. Webhook with tampered amount/hash fails closed
  await recordTest("PAYU", "Tampered PayU webhook payload fails verification", async () => {
    const payload = {
      status: "success",
      txnid: "payu_tx_tampered",
      amount: "100.00",
      productinfo: "Starter Tier",
      firstname: "Employer",
      email: "billing@hirego.ai",
      key: testKey,
      hash: "invalid_tampered_hash_value_1234567890",
    };

    const verification = await payu.verifyWebhook({
      rawBody: JSON.stringify(payload),
      signature: "invalid_tampered_hash_value_1234567890",
      provider: "PAYU",
      headers: {},
    });

    assert.equal(verification.isValid, false);
    assert.equal(verification.status, "REJECTED");
    assert.match(verification.error || "", /Invalid PayU reverse/);
  })();

  // 5. Failed PayU transaction verification
  await recordTest("PAYU", "Failed PayU webhook status mapped to FAILED", async () => {
    const status = "failure";
    const txnid = "payu_tx_failed_001";
    const amount = "500.00";
    const productinfo = "Trial";
    const firstname = "Employer";
    const email = "billing@hirego.ai";

    const reverseHash = crypto.createHash("sha512").update(
      `${testSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${testKey}`
    ).digest("hex");

    const verification = await payu.verifyWebhook({
      rawBody: JSON.stringify({ status, txnid, amount, productinfo, firstname, email, key: testKey, hash: reverseHash }),
      signature: reverseHash,
      provider: "PAYU",
      headers: {},
    });

    assert.equal(verification.isValid, true);
    assert.equal(verification.status, "FAILED");
  })();
}

async function runControllerArchitectureTests() {
  console.log("\n=========================================");
  console.log(" RUNNING PAYMENT CONTROLLER ARCHITECTURE");
  console.log("=========================================");

  // 1. Exactly STRIPE and PAYU are recognized gateways
  await recordTest("CONTROLLER", "isGateway accepts STRIPE and PAYU, rejects PHONEPE and RAZORPAY", () => {
    assert.equal(isGateway("STRIPE"), true);
    assert.equal(isGateway("PAYU"), true);
    assert.equal(isGateway("RAZORPAY"), false);
    assert.equal(isGateway("PHONEPE"), false);
    assert.equal(isGateway("CASHFREE"), false);
  })();

  // 2. Webhook verification rejects unsupported legacy providers
  await recordTest("CONTROLLER", "verifyWebhook rejects unsupported gateway name", async () => {
    const res = await PaymentGatewayController.verifyWebhook({
      rawBody: "{}",
      signature: "test",
      provider: "RAZORPAY" as any,
      headers: {},
    });
    assert.equal(res.isValid, false);
    assert.equal(res.status, "REJECTED");
    assert.match(res.error || "", /Unsupported payment webhook provider/);
  })();

  // 3. Stale DB config migration handled cleanly
  await recordTest("CONTROLLER", "Stale DB config containing legacy providers is safely migrated to STRIPE", async () => {
    const staleConfig = {
      primaryGateway: "RAZORPAY" as any,
      gatewaysStatus: { RAZORPAY: "HEALTHY", PAYU: "HEALTHY", PHONEPE: "HEALTHY" } as any,
      priorities: ["RAZORPAY", "PAYU", "PHONEPE"] as any,
    };
    // Normalization must filter out RAZORPAY and PHONEPE, setting primaryGateway to STRIPE or PAYU
    const normalized = (PaymentGatewayController as any).normalizeConfig(staleConfig);
    assert.ok(["STRIPE", "PAYU"].includes(normalized.primaryGateway));
    assert.deepEqual(Object.keys(normalized.gatewaysStatus).sort(), ["PAYU", "STRIPE"].sort());
    assert.equal(normalized.priorities.includes("RAZORPAY" as any), false);
    assert.equal(normalized.priorities.includes("PHONEPE" as any), false);
  })();

  // 4. Source-level regression preventing PHONEPE/PhonePe from re-entering production
  await recordTest("CONTROLLER", "Source-level regression check: zero active PhonePe references", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const activePaths = [
      "src/app/employer/subscriptions/page.tsx",
      "src/app/admin/payment-gateways/page.tsx",
      "src/app/payment/status/page.tsx",
      "src/lib/payments/PaymentGatewayController.ts",
      "src/lib/payments/PaymentGatewayInterface.ts",
      "src/lib/payments/StripeGateway.ts",
      "src/lib/payments/PayUGateway.ts",
      "src/lib/securityHeaders.ts",
      ".env.example",
    ];

    for (const relPath of activePaths) {
      const fullPath = path.resolve(relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");
        const match = content.match(/phonepe|phone_pe|phone-pe/i);
        assert.equal(match, null, `Forbidden PhonePe reference detected in active file: ${relPath}`);
      }
    }
  })();

  // 5. AmbiguousPaymentOrderError handling
  await recordTest("CONTROLLER", "AmbiguousPaymentOrderError preserves provider and error details", () => {
    const err = new AmbiguousPaymentOrderError("Provider returned ambiguous state", "STRIPE");
    assert.equal(err.name, "AmbiguousPaymentOrderError");
    assert.equal(err.provider, "STRIPE");
    assert.match(err.message, /ambiguous state/);
  })();
}

async function main() {
  console.log("#################################################################");
  console.log("  HIREGO AI — COMPREHENSIVE PAYMENT SANDBOX VALIDATION SUITE");
  console.log("  Target Architecture: STRIPE + PAYU ONLY");
  console.log("  Zero PhonePe • Zero Razorpay");
  console.log("#################################################################");

  await runStripeTests();
  await runPayUTests();
  await runControllerArchitectureTests();

  console.log("\n=========================================");
  console.log("              TEST SUMMARY");
  console.log("=========================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);

  if (failed > 0) {
    console.error("\n[!] Validation suite failed with errors.");
    process.exit(1);
  } else {
    console.log("\n[✓] All payment sandbox and security tests PASSED 100% GREEN.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error running payment validation suite:", err);
  process.exit(1);
});
