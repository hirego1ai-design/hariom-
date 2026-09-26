import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { copilotCheckoutSchema } from "@/lib/copilot/contracts";
import { resolveCopilotPrice } from "@/lib/copilot/commerce";
import { createCopilotPurchaseSnapshot, parseCopilotPurchaseSnapshot } from "@/lib/copilot/purchaseSnapshot";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import { AmbiguousPaymentOrderError, type GatewayName } from "@/lib/payments/PaymentGatewayInterface";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{16,128}$/;

function orderId(companyId: string, idempotencyKey: string) {
  return `ord_cp_${crypto.createHash("sha256").update(companyId).update("\0COPILOT\0").update(idempotencyKey).digest("hex")}`;
}

function safeExistingResponse(order: {
  orderId: string;
  gatewayOrderId: string | null;
  gateway: string | null;
  status: string;
  planSnapshot: unknown;
}) {
  if (order.status !== "CREATED" || !order.gateway || !order.gatewayOrderId) {
    throw new ApiError(
      order.status === "INITIATED"
        ? "Copilot checkout initialization is still being reconciled. Retry this same request later."
        : "This Copilot checkout attempt is already settled or failed. Start a new checkout.",
      409,
    );
  }
  const snapshot = parseCopilotPurchaseSnapshot(order.planSnapshot);
  return NextResponse.json({
    success: true,
    duplicate: true,
    product: "COPILOT",
    order: {
      orderId: order.orderId,
      gatewayOrderId: order.gatewayOrderId,
      gateway: order.gateway,
      planId: snapshot.planId,
      planName: snapshot.planName,
      amount: snapshot.amountMinor / 100,
      currency: snapshot.currency,
      billingCountry: snapshot.billingCountry,
      taxesMayApplyAtCheckout: snapshot.taxMode === "TAX_EXCLUSIVE",
      status: order.status,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "copilot_checkout", 10, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "ADMIN") throw new ApiError("Administrators cannot purchase a tenant Copilot plan from this endpoint.", 400);
    if (session.role !== "EMPLOYER") throw new ApiError("Only the company employer can purchase HireGo Copilot.", 403);
    const company = await getSessionCompany(session);

    const idempotencyKey = req.headers.get("idempotency-key")?.trim() || "";
    if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
      throw new ApiError("A valid Idempotency-Key header (16-128 safe characters) is required.", 400);
    }

    const input = await readValidatedJson(req, copilotCheckoutSchema);
    const price = await resolveCopilotPrice(input.planId, input.countryCode);
    if (price.paymentRoute === "MERCHANT_OF_RECORD") {
      throw new ApiError("This billing region is not yet connected to an approved merchant-of-record provider.", 503);
    }
    if (input.paymentMethod && input.paymentMethod !== price.paymentRoute) {
      throw new ApiError("The selected payment method is not available for this billing region.", 400);
    }

    const plan = await prisma.copilotPlan.findUnique({ where: { id: price.planId } });
    if (!plan || plan.isArchived) throw new ApiError("Copilot plan not found.", 404);

    const snapshot = createCopilotPurchaseSnapshot(price, {
      monthlyCapacityUnits: plan.monthlyCapacityUnits,
      softWarningPct: plan.softWarningPct,
      hardWarningPct: plan.hardWarningPct,
    });

    const deterministicOrderId = orderId(company.id, idempotencyKey);
    const existing = await prisma.paymentOrder.findUnique({ where: { orderId: deterministicOrderId } });
    if (existing) {
      if (
        existing.productType !== "COPILOT" ||
        existing.companyId !== company.id ||
        existing.planId !== price.planId ||
        existing.billingCountry !== price.countryCode
      ) {
        throw new ApiError("Idempotency key was already used for a different checkout request.", 409);
      }
      return safeExistingResponse(existing);
    }

    const amount = snapshot.amountMinor / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new ApiError("Copilot plan does not have a payable regional price.", 409);

    try {
      await prisma.paymentOrder.create({
        data: {
          orderId: deterministicOrderId,
          companyId: company.id,
          productType: "COPILOT",
          billingCountry: price.countryCode,
          planId: price.planId,
          planSnapshot: snapshot,
          originalAmount: amount,
          discountAmount: 0,
          expectedAmount: amount,
          gateway: price.paymentRoute,
          status: "INITIATED",
        },
      });
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") throw error;
      const winner = await prisma.paymentOrder.findUnique({ where: { orderId: deterministicOrderId } });
      if (!winner) throw error;
      if (
        winner.productType !== "COPILOT" ||
        winner.companyId !== company.id ||
        winner.planId !== price.planId ||
        winner.billingCountry !== price.countryCode
      ) {
        throw new ApiError("Idempotency key was already used for a different checkout request.", 409);
      }
      return safeExistingResponse(winner);
    }

    try {
      const gateway = await PaymentGatewayController.createOrderForRoute(
        {
          orderId: deterministicOrderId,
          amount,
          currency: snapshot.currency,
          planName: `HireGo Copilot — ${snapshot.planName}`,
          planId: snapshot.planId,
          companyId: company.id,
        },
        price.paymentRoute as GatewayName,
      );

      await prisma.paymentOrder.update({
        where: { orderId: deterministicOrderId },
        data: {
          gateway: gateway.gateway,
          gatewayOrderId: gateway.gatewayOrderId,
          status: "CREATED",
        },
      });

      return NextResponse.json({
        success: true,
        product: "COPILOT",
        order: {
          orderId: deterministicOrderId,
          gatewayOrderId: gateway.gatewayOrderId,
          gateway: gateway.gateway,
          planId: snapshot.planId,
          planName: snapshot.planName,
          amount,
          currency: snapshot.currency,
          billingCountry: snapshot.billingCountry,
          taxesMayApplyAtCheckout: snapshot.taxMode === "TAX_EXCLUSIVE",
          checkoutUrl: gateway.checkoutUrl,
          checkoutParams: gateway.checkoutParams,
          status: "CREATED",
        },
      }, { status: 201 });
    } catch (error) {
      if (!(error instanceof AmbiguousPaymentOrderError)) {
        await prisma.paymentOrder.updateMany({
          where: { orderId: deterministicOrderId, status: "INITIATED" },
          data: { status: "FAILED" },
        }).catch(() => undefined);
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
