import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { StripeGateway } from "../lib/payments/StripeGateway";
import { PayUGateway } from "../lib/payments/PayUGateway";
import { PaymentGatewayController } from "../lib/payments/PaymentGatewayController";
import { isGateway, AmbiguousPaymentOrderError } from "../lib/payments/PaymentGatewayInterface";

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
    customerName: "Employer",
    customerEmail: "billing@hirego.ai",
    customerPhone: "9999999999",
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


test("admin payment routing UI cannot persist fabricated healthy fallbacks", async () => {
  const fs = await import("node:fs");
  const page = fs.readFileSync(new URL("../app/admin/payment-gateways/page.tsx", import.meta.url), "utf8");
  const controller = fs.readFileSync(new URL("../lib/payments/PaymentGatewayController.ts", import.meta.url), "utf8");

  assert.match(page, /configLoaded/);
  assert.match(page, /gatewaysStatus:\s*\{[\s\S]*STRIPE:\s*"DISABLED"[\s\S]*PAYU:\s*"DISABLED"/);
  assert.doesNotMatch(page, /\|\|\s*"HEALTHY"/);
  assert.match(page, /Enabled\/Limited\/Disabled are administrator routing states\. They do not claim that a provider is currently reachable or healthy\./);
  assert.match(page, /disabled=\{saving \|\| loading \|\| !configLoaded\}/);

  assert.doesNotMatch(controller, /At least one payment gateway must remain enabled/);
  assert.match(controller, /An all-disabled configuration is a valid emergency\/maintenance state/);
  assert.match(controller, /No enabled payment gateways are available/);
});

test("candidate credit checkout creates provider-backed orders but never self-fulfills credits", async () => {
  const fs = await import("node:fs");
  const credits = fs.readFileSync(new URL("../app/api/candidate/credits/route.ts", import.meta.url), "utf8");
  const fulfillment = fs.readFileSync(new URL("../lib/payments/candidateCreditCommerce.ts", import.meta.url), "utf8");
  const webhook = fs.readFileSync(new URL("../app/api/payments/webhook/route.ts", import.meta.url), "utf8");
  const boost = fs.readFileSync(new URL("../app/api/employer/jobs/[id]/boost/route.ts", import.meta.url), "utf8");

  assert.match(credits, /CANDIDATE_CREDIT_PRODUCT_TYPE/);
  assert.match(credits, /PaymentGatewayController\.createOrder/);
  assert.match(credits, /Idempotency-Key/);
  assert.doesNotMatch(credits, /candidateCreditWallet\.upsert[\s\S]*increment:\s*creditPackage\.credits/);

  assert.match(webhook, /handleCandidateCreditPaymentWebhook/);
  assert.match(fulfillment, /verification\.status !== "SUCCESS"/);
  assert.match(fulfillment, /Math\.abs\(verification\.amount - paymentOrder\.expectedAmount\)/);
  assert.match(fulfillment, /candidate-credit-purchase:\$\{paymentOrder\.orderId\}/);
  assert.match(fulfillment, /type: "PURCHASE"/);
  assert.match(fulfillment, /balance: \{ increment: snapshot\.credits \}/);
  assert.match(fulfillment, /processPaymentReferralReward/);
  assert.match(fulfillment, /ReferralProductType\.CANDIDATE_CAREER_PASS/);
  assert.match(fulfillment, /tx,/);

  assert.doesNotMatch(boost, /status:\s*["']SUCCESS["']/);
  assert.doesNotMatch(boost, /isBoosted:\s*true/);
  assert.match(boost, /PAYMENT_INTEGRATION_REQUIRED/);
});

test("candidate credit commercial values come from the database package catalog", async () => {
  const fs = await import("node:fs");
  const route = fs.readFileSync(new URL("../app/api/candidate/credits/route.ts", import.meta.url), "utf8");
  const schema = fs.readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/credits/page.tsx", import.meta.url), "utf8");

  assert.match(schema, /model CandidateCreditPackage/);
  assert.match(route, /candidateCreditPackage\.findMany/);
  assert.match(route, /candidateCreditPackage\.findUnique/);
  assert.doesNotMatch(route, /const\s+packages\s*=\s*\[[^\]]+\]/);
  assert.match(page, /signed gateway webhook/);
  assert.match(page, /submitPayU/);
});


test("payment gateways honor server-provided product return URLs", async () => {
  const fs = await import("node:fs");
  const stripe = fs.readFileSync(new URL("../lib/payments/StripeGateway.ts", import.meta.url), "utf8");
  const payu = fs.readFileSync(new URL("../lib/payments/PayUGateway.ts", import.meta.url), "utf8");
  const contract = fs.readFileSync(new URL("../lib/payments/PaymentGatewayInterface.ts", import.meta.url), "utf8");

  assert.match(contract, /successUrl\?: string/);
  assert.match(contract, /cancelUrl\?: string/);
  assert.match(stripe, /params\.successUrl \|\|/);
  assert.match(stripe, /params\.cancelUrl \|\|/);
  assert.match(payu, /params\.successUrl \|\|/);
  assert.match(payu, /params\.cancelUrl \|\|/);
});


test("candidate gateway browser returns never fulfill credits", async () => {
  const fs = await import("node:fs");
  const checkout = fs.readFileSync(new URL("../app/api/candidate/credits/route.ts", import.meta.url), "utf8");
  const browserReturn = fs.readFileSync(new URL("../app/api/candidate/credits/return/route.ts", import.meta.url), "utf8");

  assert.match(checkout, /\/api\/candidate\/credits\/return\?orderId=/);
  assert.match(browserReturn, /NextResponse\.redirect\(target, 303\)/);
  assert.match(browserReturn, /export async function POST/);
  assert.doesNotMatch(browserReturn, /candidateCreditWallet/);
  assert.doesNotMatch(browserReturn, /paymentTransaction/);
});


test("candidate mock interview is never debited through the generic candidate service endpoint", async () => {
  const fs = await import("node:fs");
  const credits = fs.readFileSync(new URL("../app/api/candidate/credits/route.ts", import.meta.url), "utf8");
  const genericService = fs.readFileSync(new URL("../app/api/candidate/services/[serviceKey]/request/route.ts", import.meta.url), "utf8");
  const mockStart = fs.readFileSync(new URL("../app/api/assessment/mock-interview/start/route.ts", import.meta.url), "utf8");

  assert.match(credits, /serviceKey: \{ notIn: \["mock-interview", "mock_interview"\] \}/);
  assert.match(genericService, /AI Mock Interview is charged only when an actual interview session starts/);
  assert.match(mockStart, /mock-interview:\$\{candidateProfile\.id\}:\$\{body\.idempotencyKey\}/);
  assert.match(mockStart, /balance: \{ decrement: mockService\.creditCost \}/);
});

test("candidate checkout preserves only the allowlisted mock interview return intent", async () => {
  const fs = await import("node:fs");
  const checkout = fs.readFileSync(new URL("../app/api/candidate/credits/route.ts", import.meta.url), "utf8");
  const browserReturn = fs.readFileSync(new URL("../app/api/candidate/credits/return/route.ts", import.meta.url), "utf8");
  const setup = fs.readFileSync(new URL("../app/ai/mock-interview/setup/page.tsx", import.meta.url), "utf8");
  const creditsPage = fs.readFileSync(new URL("../app/credits/page.tsx", import.meta.url), "utf8");

  assert.match(checkout, /returnTo: z\.enum\(\["mock-interview"\]\)\.optional\(\)/);
  assert.match(browserReturn, /returnTo: z\.enum\(\["mock-interview"\]\)\.optional\(\)/);
  assert.match(setup, /res\.status === 402/);
  assert.match(setup, /\/credits\?returnTo=mock-interview/);
  assert.match(creditsPage, /window\.location\.assign\("\/ai\/mock-interview\/setup"\)/);
});

test("Stripe checkout fails closed when signed webhook readiness is missing and blocks ambiguous cross-provider failover", async () => {
  const fs = await import("node:fs");
  const stripe = fs.readFileSync(new URL("../lib/payments/StripeGateway.ts", import.meta.url), "utf8");
  const controller = fs.readFileSync(new URL("../lib/payments/PaymentGatewayController.ts", import.meta.url), "utf8");

  assert.match(stripe, /STRIPE_WEBHOOK_SECRET \|\| process\.env\.PAYMENT_WEBHOOK_SECRET/);
  assert.match(stripe, /AmbiguousPaymentOrderError/);
  assert.match(stripe, /response\.status >= 500/);
  assert.match(controller, /err instanceof AmbiguousPaymentOrderError/);
  assert.match(controller, /Never create a second provider order/);
});


test("mock interview entitlement is fail-closed when service pricing is absent", async () => {
  const fs = await import("node:fs");
  const mockStart = fs.readFileSync(new URL("../app/api/assessment/mock-interview/start/route.ts", import.meta.url), "utf8");
  const adminService = fs.readFileSync(new URL("../app/api/admin/candidate-credits/mock-interview-service/route.ts", import.meta.url), "utf8");
  const migration = fs.readFileSync(new URL("../../prisma/migrations/20261001000200_candidate_service_cost_guard/migration.sql", import.meta.url), "utf8");

  assert.match(mockStart, /if \(!mockService\)/);
  assert.match(mockStart, /candidate credit configuration is not published/);
  assert.doesNotMatch(mockStart, /mockService\?\.creditCost \|\| 0/);

  assert.match(adminService, /const SERVICE_KEY = "mock-interview"/);
  assert.match(adminService, /creditCost: z\.number\(\)\.int\(\)\.min\(0\)/);
  assert.match(adminService, /candidateServiceCatalog\.upsert/);
  assert.match(adminService, /MOCK_INTERVIEW_CREDIT_CONFIG_UPDATED/);

  assert.match(migration, /CHECK \("creditCost" >= 0\)/);
});
