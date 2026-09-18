import assert from "node:assert/strict";
import test from "node:test";
import { subscriptionExpiry } from "../lib/payments/subscriptionCredits";
import { PaymentGatewayController } from "../lib/payments/PaymentGatewayController";
import { RazorpayGateway } from "../lib/payments/RazorpayGateway";
import { StripeGateway } from "../lib/payments/StripeGateway";
import { failCheckoutOrder } from "../lib/payments/failCheckoutOrder";
import type { Prisma } from "@prisma/client";
import { createPurchasedPlanSnapshot, parsePurchasedPlanSnapshot } from "../lib/payments/planSnapshot";

test("purchased plan snapshot freezes all fulfillment and entitlement terms", () => {
  const plan = {
    id: "plan-enterprise", name: "Enterprise", price: 125000, currency: "INR",
    validityMonths: 12, jobPostsQuota: 50, resumeUnlocksQuota: 500,
    aiInterviewsQuota: 200, applicationsQuota: 2000, resumeDownloadsQuota: 500,
    backgroundVerificationsQuota: 50, featuresAllowed: ["ALL_FEATURES"],
  };
  const snapshot = createPurchasedPlanSnapshot(plan);

  plan.price = 999999;
  plan.currency = "USD";
  plan.validityMonths = 1;
  plan.aiInterviewsQuota = 0;
  plan.featuresAllowed = [];

  assert.deepEqual(parsePurchasedPlanSnapshot(snapshot), {
    version: 1, planId: "plan-enterprise", name: "Enterprise", price: 125000,
    currency: "INR", validityMonths: 12, jobPostsQuota: 50, resumeUnlocksQuota: 500,
    aiInterviewsQuota: 200, applicationsQuota: 2000, resumeDownloadsQuota: 500,
    backgroundVerificationsQuota: 50, featuresAllowed: ["ALL_FEATURES"],
  });
});

test("missing or malformed purchased terms fail closed", () => {
  assert.throws(() => parsePurchasedPlanSnapshot(null));
  assert.throws(() => parsePurchasedPlanSnapshot({ version: 1, planId: "plan" }));
});

test("checkout failure is recorded without a promo and cannot overwrite success", async () => {
  for (const status of ["INITIATED", "SUCCESS"]) {
    let state = status;
    let reads = 0;
    const tx = { paymentOrder: {
      updateMany: async (args: { where: { status: { in: string[] } }; data: { status: string } }) => {
        assert.deepEqual(args.where.status, { in: ["INITIATED", "CREATED"] });
        if (state === "SUCCESS") return { count: 0 };
        state = args.data.status;
        return { count: 1 };
      },
      findUnique: async () => { reads++; return { promoCode: null }; },
    } } as unknown as Prisma.TransactionClient;
    await failCheckoutOrder(tx, "order");
    assert.equal(state, status === "SUCCESS" ? "SUCCESS" : "FAILED");
    assert.equal(reads, status === "SUCCESS" ? 0 : 1);
  }
});

test("replayed checkout failure releases a promo reservation exactly once", async () => {
  let status = "CREATED";
  let promoReservationState = "RESERVED";
  let reservedUsage = 1;
  const tx = {
    paymentOrder: {
      updateMany: async () => {
        if (!["INITIATED", "CREATED"].includes(status)) return { count: 0 };
        status = "FAILED";
        return { count: 1 };
      },
      findUnique: async () => ({ promoCode: "SAVE", promoReservationState }),
      update: async (args: { data: { promoReservationState: string } }) => {
        promoReservationState = args.data.promoReservationState;
      },
    },
    $queryRaw: async () => [{ id: "promo", reservedUsage }],
    promoCode: {
      update: async () => { reservedUsage--; },
    },
  } as unknown as Prisma.TransactionClient;

  await failCheckoutOrder(tx, "order");
  await failCheckoutOrder(tx, "order");
  assert.equal(status, "FAILED");
  assert.equal(promoReservationState, "RELEASED");
  assert.equal(reservedUsage, 0);
});

test("subscription month ends clamp without overflowing into the following month", () => {
  for (const [start, months, expected] of [
    ["2026-01-31T14:30:00.123Z", 1, "2026-02-28T14:30:00.123Z"],
    ["2028-01-31T00:00:00.000Z", 1, "2028-02-29T00:00:00.000Z"],
    ["2028-02-29T00:00:00.000Z", 12, "2029-02-28T00:00:00.000Z"],
    ["2026-12-15T10:00:00.000Z", 2, "2027-02-15T10:00:00.000Z"],
  ] as const) {
    const source = new Date(start);
    assert.equal(subscriptionExpiry(source, months).toISOString(), expected);
    assert.equal(source.toISOString(), start);
  }
});

test("invalid validity fails closed", () => {
  for (const months of [0, -1, 1.5, 121, NaN]) {
    assert.throws(() => subscriptionExpiry(new Date(), months));
  }
  assert.throws(() => subscriptionExpiry(new Date("invalid"), 1));
});

test("manual disabled gateway cannot create a payment order", async t => {
  const getConfig = PaymentGatewayController.getConfig;
  const createOrder = RazorpayGateway.prototype.createOrder;
  let calls = 0;
  t.after(() => {
    PaymentGatewayController.getConfig = getConfig;
    RazorpayGateway.prototype.createOrder = createOrder;
  });
  PaymentGatewayController.getConfig = async () => ({
    mode: "MANUAL", primaryGateway: "RAZORPAY", autoFailover: false,
    allowEmployerSelection: false, priorities: ["RAZORPAY"],
    gatewaysStatus: { RAZORPAY: "DISABLED", STRIPE: "DISABLED", PAYU: "DISABLED", PHONEPE: "DISABLED" },
  });
  RazorpayGateway.prototype.createOrder = async () => {
    calls++;
    throw new Error("Provider must not be contacted");
  };
  await assert.rejects(PaymentGatewayController.createOrder({
    orderId: "test", amount: 100, currency: "INR", planName: "Test", companyId: "test",
  }), /No active or healthy payment gateways/);
  assert.equal(calls, 0);
});

test("an explicitly selected disabled gateway is rejected instead of silently rerouted", async t => {
  const getConfig = PaymentGatewayController.getConfig;
  const createOrder = RazorpayGateway.prototype.createOrder;
  let calls = 0;
  t.after(() => {
    PaymentGatewayController.getConfig = getConfig;
    RazorpayGateway.prototype.createOrder = createOrder;
  });
  PaymentGatewayController.getConfig = async () => ({
    mode: "AUTO", primaryGateway: "RAZORPAY", autoFailover: true,
    allowEmployerSelection: true, priorities: ["RAZORPAY"],
    gatewaysStatus: { RAZORPAY: "HEALTHY", STRIPE: "DISABLED", PAYU: "DISABLED", PHONEPE: "DISABLED" },
  });
  RazorpayGateway.prototype.createOrder = async () => {
    calls++;
    throw new Error("Provider must not be contacted");
  };
  await assert.rejects(PaymentGatewayController.createOrder({
    orderId: "test", amount: 100, currency: "INR", planName: "Test", companyId: "test",
  }, "STRIPE"), /STRIPE is disabled/);
  assert.equal(calls, 0);
});

test("unknown webhook providers fail closed instead of using the Razorpay verifier", async t => {
  const verify = RazorpayGateway.prototype.verifyWebhook;
  let calls = 0;
  t.after(() => { RazorpayGateway.prototype.verifyWebhook = verify; });
  RazorpayGateway.prototype.verifyWebhook = async () => {
    calls++;
    throw new Error("must not call Razorpay verifier");
  };
  const result = await PaymentGatewayController.verifyWebhook({
    rawBody: "{}", signature: "signature", provider: "UNKNOWN" as any, headers: {},
  });
  assert.equal(result.isValid, false);
  assert.match(result.error || "", /Unsupported/);
  assert.equal(calls, 0);
});

test("production-blocked gateway adapters cannot authorize webhook effects", async t => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const previousEnv = mutableEnv.NODE_ENV;
  const verify = StripeGateway.prototype.verifyWebhook;
  let calls = 0;
  t.after(() => {
    if (previousEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = previousEnv;
    StripeGateway.prototype.verifyWebhook = verify;
  });
  mutableEnv.NODE_ENV = "production";
  StripeGateway.prototype.verifyWebhook = async () => {
    calls++;
    return { isValid: true, gatewayTxId: "unsafe", status: "SUCCESS", rawPayload: {} };
  };
  const result = await PaymentGatewayController.verifyWebhook({
    rawBody: "{}", signature: "signature", provider: "STRIPE", headers: {},
  });
  assert.equal(result.isValid, false);
  assert.equal(calls, 0);
});
