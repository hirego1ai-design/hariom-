import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { PaymentGatewayController } from "../lib/payments/PaymentGatewayController";
import { POST } from "../app/api/payments/webhook/route";
import { createPurchasedPlanSnapshot } from "../lib/payments/planSnapshot";

const purchasedPlan = createPurchasedPlanSnapshot({
  id: "plan", name: "Test", price: 100, currency: "INR", validityMonths: 1,
  jobPostsQuota: 1, resumeUnlocksQuota: 1, aiInterviewsQuota: 1, applicationsQuota: 1,
  resumeDownloadsQuota: 1, backgroundVerificationsQuota: 1, featuresAllowed: ["ALL_FEATURES"],
});

test("an explicitly unknown webhook provider is rejected before verification", async () => {
  const originalVerify = PaymentGatewayController.verifyWebhook;
  let calls = 0;
  try {
    PaymentGatewayController.verifyWebhook = async () => {
      calls++;
      throw new Error("must not verify unknown provider");
    };
    const response = await POST(new NextRequest("https://hirego.test/api/payments/webhook?provider=unknown", {
      method: "POST", body: "{}",
    }));
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  } finally {
    PaymentGatewayController.verifyWebhook = originalVerify;
  }
});

// No database/provider calls: exercise the route against an order whose atomic
// claim was won by another webhook. PostgreSQL concurrency itself needs staging.
test("captured webhook cannot grant credits when another event already fulfilled its order", async () => {
  const originalConfig = PaymentGatewayController.getConfig;
  const originalVerify = PaymentGatewayController.verifyWebhook;
  const originalFindTx = prisma.paymentTransaction.findUnique;
  const originalFindOrder = prisma.paymentOrder.findFirst;
  const originalFindPlan = prisma.subscriptionPlan.findUnique;
  const originalTransaction = prisma.$transaction;
  let claims = 0;
  try {
    PaymentGatewayController.getConfig = async () => ({ mode: "AUTO", primaryGateway: "STRIPE", autoFailover: false,
      allowEmployerSelection: false, gatewaysStatus: { STRIPE: "HEALTHY", STRIPE: "DISABLED", PAYU: "DISABLED", PHONEPE: "DISABLED" }, priorities: ["STRIPE"] });
    PaymentGatewayController.verifyWebhook = async () => ({ isValid: true, gatewayTxId: "payment-second",
      gatewayOrderId: "order-provider", status: "SUCCESS", amount: 100, currency: "INR", rawPayload: {} });
    prisma.paymentTransaction.findUnique = (async () => null) as unknown as typeof originalFindTx;
    prisma.paymentOrder.findFirst = (async () => ({ orderId: "order-local", companyId: "company", planId: "plan",
      planSnapshot: purchasedPlan, gateway: "STRIPE", gatewayOrderId: "order-provider", expectedAmount: 100 })) as unknown as typeof originalFindOrder;
    prisma.subscriptionPlan.findUnique = (async () => ({ id: "plan", currency: "INR" })) as unknown as typeof originalFindPlan;
    prisma.$transaction = (async (callback: (tx: unknown) => Promise<unknown>) => callback({
      paymentTransaction: { findUnique: async () => null },
      paymentOrder: { updateMany: async (args: { where: { status: { not: string } } }) => {
        claims++;
        assert.equal(args.where.status.not, "SUCCESS");
        return { count: 0 };
      } },
      // No credit or subscription delegates: touching either would fail.
    })) as unknown as typeof originalTransaction;
    const response = await POST(new NextRequest("https://hirego.test/api/payments/webhook", {
      method: "POST", body: JSON.stringify({ event: "payment.captured" }),
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).duplicate, true);
    assert.equal(claims, 1);
  } finally {
    PaymentGatewayController.getConfig = originalConfig;
    PaymentGatewayController.verifyWebhook = originalVerify;
    prisma.paymentTransaction.findUnique = originalFindTx;
    prisma.paymentOrder.findFirst = originalFindOrder;
    prisma.subscriptionPlan.findUnique = originalFindPlan;
    prisma.$transaction = originalTransaction;
  }
});

test("a disabled provider still accepts a signed event for an order already bound to it", async () => {
  const originalConfig = PaymentGatewayController.getConfig;
  const originalVerify = PaymentGatewayController.verifyWebhook;
  const originalFindTx = prisma.paymentTransaction.findUnique;
  const originalFindOrder = prisma.paymentOrder.findFirst;
  try {
    PaymentGatewayController.getConfig = async () => ({ mode: "AUTO", primaryGateway: "STRIPE", autoFailover: false,
      allowEmployerSelection: false, gatewaysStatus: { STRIPE: "HEALTHY", STRIPE: "DISABLED", PAYU: "DISABLED", PHONEPE: "DISABLED" }, priorities: ["STRIPE"] });
    PaymentGatewayController.verifyWebhook = async () => ({ isValid: true, gatewayTxId: "payment-finished",
      gatewayOrderId: "order-disabled", status: "SUCCESS", amount: 100, currency: "INR", rawPayload: {} });
    prisma.paymentOrder.findFirst = (async () => ({ orderId: "order-local", companyId: "company", planId: "plan",
      gateway: "STRIPE", gatewayOrderId: "order-disabled", gatewayTxId: "payment-finished", expectedAmount: 100 })) as unknown as typeof originalFindOrder;
    prisma.paymentTransaction.findUnique = (async () => ({ gatewayTxId: "payment-finished", status: "SUCCESS" })) as unknown as typeof originalFindTx;

    const response = await POST(new NextRequest("https://hirego.test/api/payments/webhook?provider=STRIPE", {
      method: "POST", body: JSON.stringify({ type: "checkout.session.completed" }),
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).duplicate, true);
  } finally {
    PaymentGatewayController.getConfig = originalConfig;
    PaymentGatewayController.verifyWebhook = originalVerify;
    prisma.paymentTransaction.findUnique = originalFindTx;
    prisma.paymentOrder.findFirst = originalFindOrder;
  }
});

test("a disabled provider webhook without an order bound to it remains rejected", async () => {
  const originalConfig = PaymentGatewayController.getConfig;
  const originalVerify = PaymentGatewayController.verifyWebhook;
  const originalFindOrder = prisma.paymentOrder.findFirst;
  try {
    PaymentGatewayController.getConfig = async () => ({ mode: "AUTO", primaryGateway: "STRIPE", autoFailover: false,
      allowEmployerSelection: false, gatewaysStatus: { STRIPE: "HEALTHY", STRIPE: "DISABLED", PAYU: "DISABLED", PHONEPE: "DISABLED" }, priorities: ["STRIPE"] });
    PaymentGatewayController.verifyWebhook = async () => ({ isValid: true, gatewayTxId: "payment-unknown",
      gatewayOrderId: "order-unknown", status: "SUCCESS", amount: 100, currency: "INR", rawPayload: {} });
    prisma.paymentOrder.findFirst = (async () => null) as unknown as typeof originalFindOrder;

    const response = await POST(new NextRequest("https://hirego.test/api/payments/webhook?provider=STRIPE", {
      method: "POST", body: JSON.stringify({ type: "checkout.session.completed" }),
    }));
    assert.equal(response.status, 403);
  } finally {
    PaymentGatewayController.getConfig = originalConfig;
    PaymentGatewayController.verifyWebhook = originalVerify;
    prisma.paymentOrder.findFirst = originalFindOrder;
  }
});

test("webhook routing trusts only the provider-normalized failure status", async () => {
  const originalConfig = PaymentGatewayController.getConfig;
  const originalVerify = PaymentGatewayController.verifyWebhook;
  const originalFindTx = prisma.paymentTransaction.findUnique;
  const originalFindOrder = prisma.paymentOrder.findFirst;
  const originalTransaction = prisma.$transaction;
  let failedTransactions = 0;
  try {
    PaymentGatewayController.getConfig = async () => ({ mode: "AUTO", primaryGateway: "STRIPE", autoFailover: false,
      allowEmployerSelection: false, gatewaysStatus: { STRIPE: "HEALTHY", STRIPE: "DISABLED", PAYU: "DISABLED", PHONEPE: "DISABLED" }, priorities: ["STRIPE"] });
    PaymentGatewayController.verifyWebhook = async () => ({ isValid: true, gatewayTxId: "payment-failed",
      gatewayOrderId: "order-provider", status: "FAILED", amount: 100, currency: "INR", rawPayload: {} });
    prisma.paymentTransaction.findUnique = (async () => null) as unknown as typeof originalFindTx;
    prisma.paymentOrder.findFirst = (async () => ({ orderId: "order-local", companyId: "company", planId: "plan",
      gateway: "STRIPE", gatewayOrderId: "order-provider", expectedAmount: 100 })) as unknown as typeof originalFindOrder;
    prisma.$transaction = (async (callback: (tx: unknown) => Promise<unknown>) => callback({
      paymentOrder: {
        updateMany: async (args: { where: { status: unknown } }) => {
          assert.deepEqual(args.where.status, { in: ["INITIATED", "CREATED"] });
          return { count: 1 };
        },
        findUnique: async () => ({ orderId: "order-local", planId: "plan", promoCode: null, promoReservationState: null }),
      },
      paymentTransaction: { upsert: async () => { failedTransactions++; } },
      auditLog: { create: async () => ({}) },
    })) as unknown as typeof originalTransaction;

    const response = await POST(new NextRequest("https://hirego.test/api/payments/webhook", {
      method: "POST", body: JSON.stringify({ event: "payment.captured" }),
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "FAILED");
    assert.equal(failedTransactions, 1);
  } finally {
    PaymentGatewayController.getConfig = originalConfig;
    PaymentGatewayController.verifyWebhook = originalVerify;
    prisma.paymentTransaction.findUnique = originalFindTx;
    prisma.paymentOrder.findFirst = originalFindOrder;
    prisma.$transaction = originalTransaction;
  }
});

test("successful fulfillment records the immutable purchased currency", async () => {
  const source = await import("node:fs/promises").then(fs => fs.readFile(
    new URL("../app/api/payments/webhook/route.ts", import.meta.url), "utf8",
  ));
  assert.match(source, /update:\s*\{[\s\S]*?currency:\s*planSnapshot\.currency/);
  assert.match(source, /create:\s*\{[\s\S]*?currency:\s*planSnapshot\.currency/);
});
