import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createSessionToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { PaymentGatewayController } from "../lib/payments/PaymentGatewayController";
import { POST } from "../app/api/payments/checkout/route";

const checkoutRequest = (body: Record<string, unknown>, idempotencyKey = "offline-checkout-key-0001") => {
  const token = createSessionToken({ id: "employer", email: "employer@hirego.test", name: "Employer", role: "EMPLOYER" });
  return new NextRequest("https://hirego.test/api/payments/checkout", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
    body: JSON.stringify(body),
  });
};

test("checkout rejects nonexistent and archived plans in every environment", async t => {
  const originalEmployer = prisma.employerProfile.findUnique;
  const originalPlan = prisma.subscriptionPlan.findUnique;
  const originalFindOrder = prisma.paymentOrder.findUnique;
  const originalTransaction = prisma.$transaction;
  const originalCreateOrder = PaymentGatewayController.createOrder;
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let plan: Record<string, unknown> | null = null;
  let transactions = 0;
  let providerCalls = 0;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  t.after(() => {
    prisma.employerProfile.findUnique = originalEmployer;
    prisma.subscriptionPlan.findUnique = originalPlan;
    prisma.paymentOrder.findUnique = originalFindOrder;
    prisma.$transaction = originalTransaction;
    PaymentGatewayController.createOrder = originalCreateOrder;
    if (originalRedisUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;
    if (originalRedisToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
  });
  prisma.employerProfile.findUnique = (async () => ({ companyId: "company" })) as unknown as typeof originalEmployer;
  prisma.subscriptionPlan.findUnique = (async () => plan) as unknown as typeof originalPlan;
  prisma.paymentOrder.findUnique = (async () => null) as unknown as typeof originalFindOrder;
  prisma.$transaction = (async () => { transactions++; throw new Error("transaction must not run"); }) as unknown as typeof originalTransaction;
  PaymentGatewayController.createOrder = async () => { providerCalls++; throw new Error("provider must not run"); };

  const missing = await POST(checkoutRequest({ planId: "missing-plan", paymentMethod: "STRIPE" }));
  assert.equal(missing.status, 404);
  plan = {
    id: "archived-plan", name: "Archived", description: "Archived plan", price: 100,
    currency: "INR", jobPostsQuota: 1, resumeUnlocksQuota: 1, aiInterviewsQuota: 1,
    applicationsQuota: 1, resumeDownloadsQuota: 1, backgroundVerificationsQuota: 1,
    featuresAllowed: [], marketingBenefits: ["Test benefit"], validityMonths: 1, jobValidityDays: 7,
    firstTimeOnly: false, copilotIncluded: false, copilotJobLimit: 0, isFeatured: false, badgeText: null, displayOrder: 1, isArchived: true, createdAt: new Date(), updatedAt: new Date(),
  };
  const archived = await POST(checkoutRequest({ planId: "archived-plan", paymentMethod: "STRIPE" }));
  assert.equal(archived.status, 400);
  assert.equal(transactions, 0);
  assert.equal(providerCalls, 0);
});

test("zero-price and full-discount checkout never creates a payment order or calls a provider", async t => {
  const originalEmployer = prisma.employerProfile.findUnique;
  const originalPlan = prisma.subscriptionPlan.findUnique;
  const originalTransaction = prisma.$transaction;
  const originalFindOrder = prisma.paymentOrder.findUnique;
  const originalCreateOrder = PaymentGatewayController.createOrder;
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let price = 0;
  let promoUpdates = 0;
  let orderCreates = 0;
  let providerCalls = 0;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  t.after(() => {
    prisma.employerProfile.findUnique = originalEmployer;
    prisma.subscriptionPlan.findUnique = originalPlan;
    prisma.$transaction = originalTransaction;
    prisma.paymentOrder.findUnique = originalFindOrder;
    PaymentGatewayController.createOrder = originalCreateOrder;
    if (originalRedisUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;
    if (originalRedisToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
  });
  prisma.employerProfile.findUnique = (async () => ({ companyId: "company" })) as unknown as typeof originalEmployer;
  prisma.subscriptionPlan.findUnique = (async () => ({
    id: "plan", name: "Plan", description: "Plan", price, currency: "INR",
    jobPostsQuota: 1, resumeUnlocksQuota: 1, aiInterviewsQuota: 1,
    applicationsQuota: 1, resumeDownloadsQuota: 1, backgroundVerificationsQuota: 1,
    featuresAllowed: [], marketingBenefits: ["Test benefit"], validityMonths: 1, jobValidityDays: 7,
    firstTimeOnly: false, copilotIncluded: false, copilotJobLimit: 0, isFeatured: false, badgeText: null, displayOrder: 1, isArchived: false, createdAt: new Date(), updatedAt: new Date(),
  })) as unknown as typeof originalPlan;
  prisma.paymentOrder.findUnique = (async () => null) as unknown as typeof originalFindOrder;
  prisma.$transaction = (async (callback: (tx: unknown) => Promise<unknown>) => callback({
    $queryRaw: async () => [{ id: "promo", code: "FREE", discountType: "PERCENTAGE", discountValue: 100,
      maxUsage: 1, usageCount: 0, reservedUsage: 0, validUntil: null, isArchived: false }],
    promoCode: { update: async () => { promoUpdates++; } },
    paymentOrder: { findUnique: async () => null, create: async () => { orderCreates++; } },
  })) as unknown as typeof originalTransaction;
  PaymentGatewayController.createOrder = async () => { providerCalls++; throw new Error("provider must not run"); };

  const zeroPrice = await POST(checkoutRequest({ planId: "plan", paymentMethod: "STRIPE" }));
  assert.equal(zeroPrice.status, 400);
  price = 100;
  const fullDiscount = await POST(checkoutRequest({ planId: "plan", paymentMethod: "STRIPE", promoCode: "FREE" }));
  assert.equal(fullDiscount.status, 400);
  assert.equal(promoUpdates, 0);
  assert.equal(orderCreates, 0);
  assert.equal(providerCalls, 0);
});

test("checkout requires a client idempotency key before reading a financial plan", async t => {
  const originalEmployer = prisma.employerProfile.findUnique;
  const originalPlan = prisma.subscriptionPlan.findUnique;
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let planReads = 0;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  t.after(() => {
    prisma.employerProfile.findUnique = originalEmployer;
    prisma.subscriptionPlan.findUnique = originalPlan;
    if (originalRedisUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;
    if (originalRedisToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
  });
  prisma.employerProfile.findUnique = (async () => ({ companyId: "company" })) as unknown as typeof originalEmployer;
  prisma.subscriptionPlan.findUnique = (async () => { planReads++; return null; }) as unknown as typeof originalPlan;

  const response = await POST(checkoutRequest({ planId: "plan" }, "short"));
  assert.equal(response.status, 400);
  assert.equal(planReads, 0);
});

test("a retry with the same key reuses the created provider order without another provider call", async t => {
  const originalEmployer = prisma.employerProfile.findUnique;
  const originalPlan = prisma.subscriptionPlan.findUnique;
  const originalFindOrder = prisma.paymentOrder.findUnique;
  const originalCreateOrder = PaymentGatewayController.createOrder;
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let providerCalls = 0;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const plan = {
    id: "plan", name: "Plan", description: "Plan", price: 100, currency: "INR",
    jobPostsQuota: 1, resumeUnlocksQuota: 1, aiInterviewsQuota: 1,
    applicationsQuota: 1, resumeDownloadsQuota: 1, backgroundVerificationsQuota: 1,
    featuresAllowed: [], marketingBenefits: ["Test benefit"], validityMonths: 1, jobValidityDays: 7,
    firstTimeOnly: false, copilotIncluded: false, copilotJobLimit: 0, isFeatured: false, badgeText: null, displayOrder: 1, isArchived: false, createdAt: new Date(), updatedAt: new Date(),
  };
  const { createPurchasedPlanSnapshot } = await import("../lib/payments/planSnapshot");
  const existing = {
    id: "db-order", orderId: "deterministic-order", companyId: "company", planId: "plan",
    planSnapshot: createPurchasedPlanSnapshot(plan), originalAmount: 100, discountAmount: 0,
    expectedAmount: 100, gateway: "STRIPE", gatewayOrderId: "provider-order",
    gatewayTxId: null, promoCode: null, promoReservationState: null, status: "CREATED",
    createdAt: new Date(), updatedAt: new Date(),
  };
  t.after(() => {
    prisma.employerProfile.findUnique = originalEmployer;
    prisma.subscriptionPlan.findUnique = originalPlan;
    prisma.paymentOrder.findUnique = originalFindOrder;
    PaymentGatewayController.createOrder = originalCreateOrder;
    if (originalRedisUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;
    if (originalRedisToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
  });
  prisma.employerProfile.findUnique = (async () => ({ companyId: "company" })) as unknown as typeof originalEmployer;
  prisma.subscriptionPlan.findUnique = (async () => plan) as unknown as typeof originalPlan;
  prisma.paymentOrder.findUnique = (async () => existing) as unknown as typeof originalFindOrder;
  PaymentGatewayController.createOrder = async () => { providerCalls++; throw new Error("must not call provider"); };

  const response = await POST(checkoutRequest({ planId: "plan", paymentMethod: "STRIPE" }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.duplicate, true);
  assert.equal(body.order.gatewayOrderId, "provider-order");
  assert.equal(providerCalls, 0);
});
