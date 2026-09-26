import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { copilotCapacityCheckoutSchema } from "@/lib/copilot/contracts";
import { resolveCapacityOffer } from "@/lib/copilot/capacityOffers";
import {
  createCopilotCapacityAddonSnapshot,
  parseCopilotCapacityAddonSnapshot,
} from "@/lib/copilot/capacityAddonSnapshot";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import { AmbiguousPaymentOrderError, type GatewayName } from "@/lib/payments/PaymentGatewayInterface";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{16,128}$/;

function orderId(companyId: string, idempotencyKey: string) {
  return `ord_cpa_${crypto.createHash("sha256").update(companyId).update("\0COPILOT_ADDON\0").update(idempotencyKey).digest("hex")}`;
}

function existingResponse(order: {
  orderId: string;
  gatewayOrderId: string | null;
  gateway: string | null;
  status: string;
  planSnapshot: unknown;
}) {
  if (order.status !== "CREATED" || !order.gateway || !order.gatewayOrderId) {
    throw new ApiError(
      order.status === "INITIATED"
        ? "Add-capacity checkout initialization is still being reconciled. Retry the same request later."
        : "This add-capacity checkout is already settled or failed. Start a new checkout.",
      409,
    );
  }
  const snapshot = parseCopilotCapacityAddonSnapshot(order.planSnapshot);
  return NextResponse.json({
    success: true,
    duplicate: true,
    product: "COPILOT_ADDON",
    order: {
      orderId: order.orderId,
      gatewayOrderId: order.gatewayOrderId,
      gateway: order.gateway,
      offerId: snapshot.offerId,
      offerName: snapshot.offerName,
      amount: snapshot.amountMinor / 100,
      currency: snapshot.currency,
      billingCountry: snapshot.billingCountry,
      status: order.status,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "copilot_add_capacity_checkout", 10, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "ADMIN") throw new ApiError("Administrators cannot purchase tenant capacity from this endpoint.", 400);
    if (session.role !== "EMPLOYER") throw new ApiError("Only the company employer can purchase additional Copilot capacity.", 403);
    const company = await getSessionCompany(session);

    const idempotencyKey = req.headers.get("idempotency-key")?.trim() || "";
    if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
      throw new ApiError("A valid Idempotency-Key header (16-128 safe characters) is required.", 400);
    }

    const input = await readValidatedJson(req, copilotCapacityCheckoutSchema);
    const countryCode = input.countryCode.toUpperCase();
    const now = new Date();
    const subscription = await prisma.copilotSubscription.findFirst({
      where: { companyId: company.id, status: "ACTIVE", startDate: { lte: now }, endDate: { gt: now } },
      orderBy: { endDate: "desc" },
    });
    if (!subscription) throw new ApiError("An active HireGo Copilot subscription is required before adding capacity.", 402);
    if (subscription.billingCountry !== countryCode) {
      throw new ApiError("Add-capacity billing country must match the active Copilot subscription.", 409);
    }

    const cycle = await prisma.copilotBillingCycle.findFirst({
      where: {
        subscriptionId: subscription.id,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: { startsAt: "desc" },
    });
    if (!cycle) throw new ApiError("The current Copilot billing cycle is unavailable.", 503);
    if (cycle.endsAt.getTime() - now.getTime() < 30 * 60_000) {
      throw new ApiError("Additional capacity cannot be purchased within 30 minutes of the current Copilot period ending. Renew the plan instead.", 409);
    }

    const offer = await resolveCapacityOffer(input.offerId, countryCode);
    if (offer.paymentRoute === "MERCHANT_OF_RECORD") {
      throw new ApiError("This capacity offer requires a merchant-of-record provider that is not connected yet.", 503);
    }

    const snapshot = createCopilotCapacityAddonSnapshot(
      offer,
      subscription.id,
      cycle.id,
      cycle.endsAt,
    );
    const amount = snapshot.amountMinor / 100;
    const deterministicOrderId = orderId(company.id, idempotencyKey);

    const existing = await prisma.paymentOrder.findUnique({ where: { orderId: deterministicOrderId } });
    if (existing) {
      if (
        existing.productType !== "COPILOT_ADDON" ||
        existing.companyId !== company.id ||
        existing.planId !== snapshot.offerId ||
        existing.billingCountry !== countryCode
      ) {
        throw new ApiError("Idempotency key was already used for a different checkout request.", 409);
      }
      return existingResponse(existing);
    }

    try {
      await prisma.paymentOrder.create({
        data: {
          orderId: deterministicOrderId,
          companyId: company.id,
          productType: "COPILOT_ADDON",
          billingCountry: countryCode,
          planId: snapshot.offerId,
          planSnapshot: snapshot,
          originalAmount: amount,
          discountAmount: 0,
          expectedAmount: amount,
          gateway: snapshot.paymentRoute,
          status: "INITIATED",
        },
      });
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") throw error;
      const winner = await prisma.paymentOrder.findUnique({ where: { orderId: deterministicOrderId } });
      if (!winner) throw error;
      return existingResponse(winner);
    }

    const billingUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { phoneNumber: true },
    });

    try {
      const gateway = await PaymentGatewayController.createOrderForRoute(
        {
          orderId: deterministicOrderId,
          amount,
          currency: snapshot.currency,
          planName: `HireGo Copilot — ${snapshot.offerName}`,
          planId: snapshot.offerId,
          companyId: company.id,
          customerName: session.name,
          customerEmail: session.email,
          customerPhone: billingUser?.phoneNumber || undefined,
        },
        snapshot.paymentRoute as GatewayName,
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
        product: "COPILOT_ADDON",
        order: {
          orderId: deterministicOrderId,
          gatewayOrderId: gateway.gatewayOrderId,
          gateway: gateway.gateway,
          offerId: snapshot.offerId,
          offerName: snapshot.offerName,
          amount,
          currency: snapshot.currency,
          billingCountry: snapshot.billingCountry,
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
