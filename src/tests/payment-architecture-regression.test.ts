import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { StripeGateway } from "../lib/payments/StripeGateway";
import { PayUGateway } from "../lib/payments/PayUGateway";
import { PaymentGatewayController } from "../lib/payments/PaymentGatewayController";
import { isGateway, AmbiguousPaymentOrderError } from "../lib/payments/PaymentGatewayInterface";
import { createPlanSchema } from "../lib/payments/planContracts";
import { createPurchasedPlanSnapshot, parsePurchasedPlanSnapshot } from "../lib/payments/planSnapshot";

test("subscription feature contracts accept admin service keys and legacy human-readable labels", () => {
  const plan = {
    id: "plan-contract-regression",
    name: "Contract Regression",
    description: "Subscription feature compatibility regression.",
    price: 999,
    currency: "INR",
    jobPostsQuota: 1,
    resumeUnlocksQuota: 5,
    aiInterviewsQuota: 10,
    applicationsQuota: 100,
    resumeDownloadsQuota: 10,
    backgroundVerificationsQuota: 2,
    featuresAllowed: ["resume_screening", "Basic Resume Screening", "AI_INTERVIEW_COPILOT"],
    validityMonths: 1,
  };

  assert.equal(createPlanSchema.safeParse({ ...plan, id: undefined }).success, true);
  const snapshot = createPurchasedPlanSnapshot(plan);
  assert.deepEqual(parsePurchasedPlanSnapshot(snapshot).featuresAllowed, plan.featuresAllowed);

  const unsafe = createPlanSchema.safeParse({
    ...plan,
    id: undefined,
    featuresAllowed: ["<script>alert(1)</script>"],
  });
  assert.equal(unsafe.success, false);
});

test("Payment architecture accepts only STRIPE and PAYU, rejecting RAZORPAY and PHONEPE", () => {
  assert.equal(isGateway("STRIPE"), true);
  assert.equal(isGateway("PAYU"), true);
  assert.equal(isGateway("RAZORPAY"), false);
  assert.equal(isGateway("PHONEPE"), false);
  assert.equal(isGateway("CASHFREE"), false);
});

test("Stripe webhook verification validates official v1 signatures and enforces replay tolerance", async () => {
  const stripe = new StripeGateway();
  const testSecret = "mock_webhook_secret_stripe_audit_regressions";
  process.env.STRIPE_WEBHOOK_SECRET = testSecret;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const bodyObj = {
    id: "evt_test_audit",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_session_audit",
        amount_total: 9900,
        currency: "inr",
        metadata: { companyId: "comp_audit", orderId: "ord_audit_1" },
        payment_status: "paid",
      },
    },
  };
  const rawBody = JSON.stringify(bodyObj);
  const sig = crypto.createHmac("sha256", testSecret).update(`${nowSeconds}.${rawBody}`).digest("hex");
  const header = `t=${nowSeconds},v1=${sig}`;

  const res = await stripe.verifyWebhook({
    rawBody,
    signature: header,
    provider: "STRIPE",
    headers: { "stripe-signature": header },
  });

  assert.equal(res.isValid, true);
  assert.equal(res.status, "SUCCESS");
  assert.equal(res.amount, 99);
  assert.equal(res.currency, "INR");
  assert.equal(res.orderId, "ord_audit_1");
  assert.equal(res.companyId, "comp_audit");

  // Replay attack (>300 seconds) must fail closed
  const staleSeconds = nowSeconds - 400;
  const staleSig = crypto.createHmac("sha256", testSecret).update(`${staleSeconds}.${rawBody}`).digest("hex");
  const staleHeader = `t=${staleSeconds},v1=${staleSig}`;

  const replayRes = await stripe.verifyWebhook({
    rawBody,
    signature: staleHeader,
    provider: "STRIPE",
    headers: { "stripe-signature": staleHeader },
  });

  assert.equal(replayRes.isValid, false);
  assert.equal(replayRes.status, "REJECTED");
  assert.match(replayRes.error || "", /tolerance window/);

  // Missing timestamp format fails closed (no raw HMAC fallback)
  const rawSig = crypto.createHmac("sha256", testSecret).update(rawBody).digest("hex");
  const rawFallback = await stripe.verifyWebhook({
    rawBody,
    signature: rawSig,
    provider: "STRIPE",
    headers: { "stripe-signature": rawSig },
  });
  assert.equal(rawFallback.isValid, false);
  assert.equal(rawFallback.status, "REJECTED");
});

test("PayU hosted checkout generation calculates official SHA-512 request hash without exposing salt", async () => {
  const payu = new PayUGateway();
  const testKey = "gtKFFx";
  const testSalt = "eCwWELxi";
  process.env.PAYU_MERCHANT_KEY = testKey;
  process.env.PAYU_MERCHANT_SALT = testSalt;

  const res = await payu.createOrder({
    orderId: "ord_audit_payu_001",
    amount: 2500,
    currency: "INR",
    planName: "Pro Tier",
    planId: "plan_pro",
    companyId: "comp_audit_payu",
  });

  assert.equal(res.success, true);
  assert.equal(res.gateway, "PAYU");
  assert.ok(res.checkoutUrl?.includes("_payment"));
  assert.ok(res.checkoutParams);
  assert.equal(res.checkoutParams.key, testKey);
  assert.equal(res.checkoutParams.amount, "2500.00");
  assert.equal(res.checkoutParams.udf1, "ord_audit_payu_001");
  assert.equal(res.checkoutParams.udf2, "comp_audit_payu");
  assert.equal(res.checkoutParams.udf3, "plan_pro");

  // Salt must never be returned to client
  assert.equal((res.checkoutParams as any).salt, undefined);
  assert.equal((res.rawPayload as any).salt, undefined);

  // Verify request hash calculation
  const expectedHash = crypto.createHash("sha512").update(
    `${testKey}|${res.gatewayOrderId}|2500.00|Pro Tier|Employer|billing@hirego.ai|ord_audit_payu_001|comp_audit_payu|plan_pro||||||||${testSalt}`
  ).digest("hex");
  assert.equal(res.checkoutParams.hash, expectedHash);
});

test("PayU webhook verification validates official reverse SHA-512 hash and detects tampering", async () => {
  const payu = new PayUGateway();
  const testKey = "gtKFFx";
  const testSalt = "eCwWELxi";
  process.env.PAYU_MERCHANT_KEY = testKey;
  process.env.PAYU_MERCHANT_SALT = testSalt;

  const txnid = "payu_tx_audit_001";
  const amount = "2500.00";
  const productinfo = "Pro Tier";
  const firstname = "Employer";
  const email = "billing@hirego.ai";
  const udf1 = "ord_audit_payu_001";
  const udf2 = "comp_audit_payu";
  const udf3 = "plan_pro";
  const status = "success";

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

  const validRes = await payu.verifyWebhook({
    rawBody: JSON.stringify(payload),
    signature: reverseHash,
    provider: "PAYU",
    headers: {},
  });

  assert.equal(validRes.isValid, true);
  assert.equal(validRes.status, "SUCCESS");
  assert.equal(validRes.amount, 2500);
  assert.equal(validRes.gatewayTxId, "403993715530");
  assert.equal(validRes.companyId, "comp_audit_payu");
  assert.equal(validRes.planId, "plan_pro");

  // Tampered payload fails closed
  const tamperedRes = await payu.verifyWebhook({
    rawBody: JSON.stringify({ ...payload, amount: "100.00" }),
    signature: reverseHash,
    provider: "PAYU",
    headers: {},
  });
  assert.equal(tamperedRes.isValid, false);
  assert.equal(tamperedRes.status, "REJECTED");
});

test("Payment controller rejects unsupported providers and safely migrates legacy configuration", async () => {
  const unapproved = await PaymentGatewayController.verifyWebhook({
    rawBody: "{}",
    signature: "sig",
    provider: "PHONEPE" as any,
    headers: {},
  });
  assert.equal(unapproved.isValid, false);
  assert.equal(unapproved.status, "REJECTED");

  const staleConfig = {
    primaryGateway: "RAZORPAY" as any,
    gatewaysStatus: { RAZORPAY: "HEALTHY", PAYU: "HEALTHY", PHONEPE: "HEALTHY" } as any,
    priorities: ["RAZORPAY", "PAYU", "PHONEPE"] as any,
  };
  const normalized = (PaymentGatewayController as any).normalizeConfig(staleConfig);
  assert.ok(["STRIPE", "PAYU"].includes(normalized.primaryGateway));
  assert.deepEqual(Object.keys(normalized.gatewaysStatus).sort(), ["PAYU", "STRIPE"].sort());
  assert.equal(normalized.priorities.includes("RAZORPAY" as any), false);
  assert.equal(normalized.priorities.includes("PHONEPE" as any), false);
});


test("production payment routing preserves an all-disabled gateway configuration", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  Reflect.set(process.env, "NODE_ENV", "production");
  try {
    const normalized = (PaymentGatewayController as any).normalizeConfig({
      primaryGateway: "STRIPE",
      gatewaysStatus: { STRIPE: "DISABLED", PAYU: "DISABLED" },
      priorities: ["STRIPE", "PAYU"],
    });
    assert.equal(normalized.gatewaysStatus.STRIPE, "DISABLED");
    assert.equal(normalized.gatewaysStatus.PAYU, "DISABLED");
  } finally {
    if (previousNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
  }
});

test("Stripe checkout completed without paid status remains nonterminal", async () => {
  const stripe = new StripeGateway();
  const secret = "mock_webhook_secret_unpaid_checkout";
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify({
    id: "evt_unpaid_checkout",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_unpaid",
        amount_total: 49900,
        currency: "inr",
        metadata: { companyId: "company-unpaid", orderId: "order-unpaid" },
        payment_status: "unpaid",
      },
    },
  });
  const sig = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const header = `t=${timestamp},v1=${sig}`;
  const result = await stripe.verifyWebhook({
    rawBody,
    signature: header,
    provider: "STRIPE",
    headers: { "stripe-signature": header },
  });
  assert.equal(result.isValid, true);
  assert.equal(result.status, "PENDING");
});

test("candidate credit and job boost purchase endpoints do not self-fulfill payment success", async () => {
  const fs = await import("node:fs");
  const credits = fs.readFileSync(new URL("../app/api/candidate/credits/route.ts", import.meta.url), "utf8");
  const boost = fs.readFileSync(new URL("../app/api/employer/jobs/[id]/boost/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(credits, /status:\s*["']SUCCESS["']/);
  assert.doesNotMatch(credits, /balance:\s*\{\s*increment:/);
  assert.match(credits, /PAYMENT_INTEGRATION_REQUIRED/);
  assert.doesNotMatch(boost, /status:\s*["']SUCCESS["']/);
  assert.doesNotMatch(boost, /isBoosted:\s*true/);
  assert.match(boost, /PAYMENT_INTEGRATION_REQUIRED/);
});
