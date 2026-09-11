import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { PaymentGatewayController } from "../lib/payments/PaymentGatewayController";
import { POST } from "../app/api/payments/webhook/route";

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
    PaymentGatewayController.getConfig = async () => ({ mode: "AUTO", primaryGateway: "RAZORPAY", autoFailover: false,
      allowEmployerSelection: false, gatewaysStatus: { RAZORPAY: "HEALTHY", STRIPE: "DISABLED", PAYU: "DISABLED", PHONEPE: "DISABLED" }, priorities: ["RAZORPAY"] });
    PaymentGatewayController.verifyWebhook = async () => ({ isValid: true, gatewayTxId: "payment-second",
      gatewayOrderId: "order-provider", status: "SUCCESS", amount: 100, currency: "INR", rawPayload: {} });
    prisma.paymentTransaction.findUnique = (async () => null) as unknown as typeof originalFindTx;
    prisma.paymentOrder.findFirst = (async () => ({ orderId: "order-local", companyId: "company", planId: "plan",
      gateway: "RAZORPAY", gatewayOrderId: "order-provider", expectedAmount: 100 })) as unknown as typeof originalFindOrder;
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
