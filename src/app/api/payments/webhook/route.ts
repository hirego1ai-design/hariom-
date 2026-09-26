import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError, readBoundedTextBody } from "@/lib";
import { prisma } from "@/lib/prisma";
import type { GatewayName } from "@/lib/payments/PaymentGatewayInterface";
import { subscriptionCredits, subscriptionExpiry } from "@/lib/payments/subscriptionCredits";
import { parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await readBoundedTextBody(req, 64 * 1024);
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      // PayU posts form-encoded callbacks, while Stripe posts JSON. Preserve
      // the exact raw body for cryptographic verification in both cases.
      body = Object.fromEntries(new URLSearchParams(rawBody).entries());
      if (!body || Object.keys(body).length === 0) {
        throw new ApiError("Invalid payment webhook payload", 400);
      }
    }

    // 1. Multi-Gateway Webhook Signature & Authenticity Verification
    const requestedProvider = req.nextUrl.searchParams.get("provider")?.toUpperCase();
    if (requestedProvider && !["STRIPE", "PAYU"].includes(requestedProvider)) {
      throw new ApiError("Unsupported payment webhook provider", 400);
    }
    const providerParam = ["STRIPE", "PAYU"].includes(requestedProvider || "")
      ? (requestedProvider as GatewayName)
      : null;
    const stripeSignature = req.headers.get("stripe-signature");
    const payuSignature = req.headers.get("x-payu-signature") || body?.hash;
    const providerHeader =
      providerParam ||
      (stripeSignature
        ? "STRIPE"
        : payuSignature
        ? "PAYU" : "STRIPE");

    const signature =
      stripeSignature ||
      payuSignature ||
      body?.hash ||
      "";

    const { PaymentGatewayController } = await import("@/lib/payments/PaymentGatewayController");
    const verification = await PaymentGatewayController.verifyWebhook({
      rawBody,
      signature,
      provider: providerHeader,
      headers: Object.fromEntries(req.headers.entries()),
    });

    // If signature is missing, invalid, or payload modified: Return 401 immediately with ZERO rewards/attribution created
    if (!verification.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Invalid or missing gateway webhook cryptographic signature",
        },
        { status: 401 }
      );
    }

    // Gateways normalize their native transaction identifier in the verified
    // result. Never accept a separately supplied client/body identifier.
    const gatewayTxId = verification.gatewayTxId;

    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        OR: [
          ...(verification.gatewayOrderId ? [{ gatewayOrderId: verification.gatewayOrderId }] : []),
          ...(verification.gatewayTxId ? [{ gatewayTxId: verification.gatewayTxId }] : []),
        ],
      },
    });

    // Disabling a gateway blocks new checkouts, but must not strand a payment
    // order that was already created with that provider. Unknown or unbound
    // events from a disabled provider remain rejected.
    const config = await PaymentGatewayController.getConfig();
    if (config.gatewaysStatus[providerHeader] === "DISABLED" && paymentOrder?.gateway !== providerHeader) {
      throw new ApiError("This payment provider is disabled", 403);
    }

    if (paymentOrder && (!paymentOrder.gateway || paymentOrder.gateway !== providerHeader)) {
      throw new ApiError("Webhook provider does not match the payment order gateway", 400);
    }
    if (paymentOrder && verification.gatewayOrderId &&
        paymentOrder.gatewayOrderId !== verification.gatewayOrderId) {
      throw new ApiError("Webhook order does not match the authoritative payment order", 400);
    }

    // 2. Strict Gateway Transaction Idempotency Pre-Check
    if (gatewayTxId) {
      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { gatewayTxId },
      });
      if (existingTx && existingTx.status === "SUCCESS") {
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: `Webhook transaction ${gatewayTxId} already processed. Zero duplicate credits or rewards provisioned.`,
        });
      }
    }

    // 3. Handle Payment Failure / Rejection Events
    if (verification.status === "FAILED" || verification.status === "REJECTED") {
      const failCompanyId = paymentOrder?.companyId;
      if (failCompanyId) {
        await prisma.$transaction(async (tx) => {
          // Serialize failure with success on the order row. A late failure
          // event must never overwrite a captured order or release its promo.
          const failedOrder = await tx.paymentOrder.updateMany({
            // A failure notification is a state transition, not an event log.
            // Claim it once so provider retries cannot duplicate audit rows.
            where: { orderId: paymentOrder!.orderId, status: { in: ["INITIATED", "CREATED"] } },
            data: { status: "FAILED" },
          });
          if (failedOrder.count !== 1) return;
          const currentOrder = paymentOrder
            ? await tx.paymentOrder.findUnique({ where: { orderId: paymentOrder.orderId } })
            : null;
          if (currentOrder?.promoReservationState === "RESERVED" && currentOrder.promoCode) {
            const promos = await tx.$queryRaw<Array<{ id: string; reservedUsage: number }>>`
              SELECT "id", "reservedUsage"
              FROM "PromoCode"
              WHERE "code" = ${currentOrder.promoCode}
              FOR UPDATE
            `;
            const promo = promos[0];
            if (promo?.reservedUsage && promo.reservedUsage > 0) {
              await tx.promoCode.update({ where: { id: promo.id }, data: { reservedUsage: { decrement: 1 } } });
            }
            await tx.paymentOrder.update({
              where: { orderId: currentOrder.orderId },
              data: { status: "FAILED", gatewayTxId: gatewayTxId || null, promoReservationState: "RELEASED" },
            });
          }

          if (gatewayTxId) {
            await tx.paymentTransaction.upsert({
              where: { gatewayTxId },
              update: {
                productType: currentOrder?.productType || paymentOrder?.productType || "LEGACY_SUBSCRIPTION",
                status: "FAILED",
                errorMessage: "Payment gateway failed event received",
              },
              create: {
                gatewayTxId,
                companyId: failCompanyId,
                productType: currentOrder?.productType || paymentOrder?.productType || "LEGACY_SUBSCRIPTION",
                planId: currentOrder?.planId || paymentOrder?.planId || null,
                amount: verification.amount || 0,
                status: "FAILED",
                provider: providerHeader,
                errorMessage: "Payment gateway failed event received",
              },
            });
          }

          await tx.auditLog.create({
            data: {
              userId: null,
              companyId: failCompanyId,
              action: "PAYMENT_FAILED",
              resource: "/api/payments/webhook",
              details: `Payment failed for gateway transaction ${gatewayTxId || "unknown"}.`,
            },
          });
        });
      }

      return NextResponse.json({
        success: true,
        received: true,
        status: "FAILED",
        message: "Payment failure recorded. Subscription and credits remain uncharged.",
      });
    }

    if (verification.status === "PENDING") {
      return NextResponse.json({
        success: true,
        received: true,
        status: "PENDING",
        message: "Nonterminal payment event acknowledged without changing subscription, credits, promo usage, or payment-order state.",
      });
    }

    // 4. Handle Payment Success Events with Amount Integrity Check & Atomic Transaction
    const isPaymentSuccess = verification.status === "SUCCESS";

    if (isPaymentSuccess) {
      if (!gatewayTxId || !verification.gatewayOrderId) {
        throw new ApiError("Gateway success webhook is missing its authoritative transaction or order identifier", 400);
      }
      if (!paymentOrder) {
        throw new ApiError("Authoritative payment order not found", 400);
      }
      if (!paymentOrder.gatewayOrderId || paymentOrder.gatewayOrderId !== verification.gatewayOrderId) {
        throw new ApiError("Gateway order does not match the authoritative payment order", 400);
      }
      
      const companyId = paymentOrder.companyId;
      const planId = paymentOrder.planId;
      const expectedAmount = paymentOrder.expectedAmount;

      if (paymentOrder.productType === "COPILOT") {
        const { fulfillCopilotPayment } = await import("@/lib/copilot/paymentFulfillment");
        const fulfillment = await fulfillCopilotPayment({
          paymentOrder,
          verification,
          provider: providerHeader,
          gatewayTxId,
          rawPayload: body,
        });

        if (fulfillment.duplicate) {
          return NextResponse.json({
            success: true,
            duplicate: true,
            product: "COPILOT",
            message: "Copilot payment was already fulfilled.",
          });
        }

        return NextResponse.json({
          success: true,
          received: true,
          product: "COPILOT",
          status: "ACTIVE",
          subscriptionId: fulfillment.subscriptionId,
          billingCycleId: fulfillment.billingCycleId,
        });
      }

      let planSnapshot;
      try {
        planSnapshot = parsePurchasedPlanSnapshot(paymentOrder.planSnapshot);
      } catch {
        throw new ApiError(
          "Payment order commercial snapshot is missing or invalid; manual reconciliation is required.",
          409,
        );
      }
      if (planSnapshot.planId !== planId) {
        throw new ApiError("Payment order commercial snapshot does not match the ordered plan.", 409);
      }

      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) {
        return NextResponse.json({ success: false, error: "Subscription plan not found" }, { status: 404 });
      }
      if (verification.currency && verification.currency !== planSnapshot.currency) {
        throw new ApiError("Gateway payment currency does not match the purchased plan", 400);
      }
      if (verification.companyId && verification.companyId !== companyId) {
        throw new ApiError("Gateway payment company does not match the payment order", 400);
      }

      // Amount Integrity Enforcement
      if (
        verification.amount === undefined ||
        !Number.isFinite(verification.amount) ||
        verification.amount <= 0
      ) {
        throw new ApiError("Gateway payment amount missing or invalid", 400);
      }

      if (Math.abs(verification.amount - expectedAmount) > 0.01) {
        throw new ApiError(`Payment amount mismatch. Gateway: ${verification.amount} ${planSnapshot.currency}, Plan: ${expectedAmount} ${planSnapshot.currency}`, 400);
      }

      // =========================================================================
      // ATOMIC TRANSACTION: Payment Status + Subscription + Referral + Immutable Ledger
      // If ANY step fails, prisma.$transaction automatically ROLLS BACK EVERYTHING.
      // =========================================================================
      const transactionResult = await prisma.$transaction(async (tx) => {
        // Step 1: In-transaction idempotency guard
        const existingTx = await tx.paymentTransaction.findUnique({
          where: { gatewayTxId },
        });
        if (existingTx && existingTx.status === "SUCCESS") {
          return {
            duplicate: true,
            gatewayTxId,
            message: `Webhook transaction ${gatewayTxId} already processed. Zero duplicate credits provisioned.`,
          };
        }

        // Conditional update locks this order until commit. Concurrent events,
        // even with different payment IDs, can provision this order only once.
        const claimedOrder = await tx.paymentOrder.updateMany({
          where: { orderId: paymentOrder.orderId, status: { not: "SUCCESS" } },
          data: { status: "SUCCESS", gatewayTxId }
        });
        if (claimedOrder.count !== 1) {
          return { duplicate: true, gatewayTxId, message: "Payment order already fulfilled." };
        }

        // A discount capacity slot was atomically reserved before the gateway
        // order was created. Convert that exact reservation to usage; never
        // reject a captured payment because another checkout used the last slot.
        if (paymentOrder.promoCode) {
          // Re-read after claiming: an earlier failure may have released its
          // reservation before a later captured event arrived.
          const currentOrder = await tx.paymentOrder.findUnique({ where: { orderId: paymentOrder.orderId } });
          const reservedPromos = await tx.$queryRaw<Array<{ id: string; reservedUsage: number }>>`
            SELECT "id", "reservedUsage"
            FROM "PromoCode"
            WHERE "code" = ${paymentOrder.promoCode.toUpperCase()}
            FOR UPDATE
          `;
          const wasReserved = currentOrder?.promoReservationState === "RESERVED";
          if (reservedPromos.length !== 1 || (wasReserved && reservedPromos[0].reservedUsage < 1) ||
              (!wasReserved && currentOrder?.promoReservationState !== "RELEASED")) {
            throw new ApiError("Promo reservation is unavailable for this payment order.", 409);
          }
          await tx.promoCode.update({
            where: { id: reservedPromos[0].id },
            data: { usageCount: { increment: 1 }, reservedUsage: wasReserved ? { decrement: 1 } : undefined },
          });
          await tx.paymentOrder.update({
            where: { orderId: paymentOrder.orderId },
            data: { promoReservationState: "CONSUMED" },
          });
        }

        // Step 2: Payment status is recorded
        await tx.paymentTransaction.upsert({
          where: { gatewayTxId },
          update: { status: "SUCCESS", planId: planSnapshot.planId, amount: expectedAmount,
            currency: planSnapshot.currency, provider: providerHeader },
          create: {
            gatewayTxId,
            companyId,
            planId: planSnapshot.planId,
            amount: expectedAmount,
            currency: planSnapshot.currency,
            status: "SUCCESS",
            provider: providerHeader,
            rawPayload: body,
          },
        });

        // Activate Subscription
        // Different paid orders for the same company must not create competing
        // active subscriptions or lose a concurrent renewal period.
        await tx.$queryRaw`SELECT "id" FROM "Company" WHERE "id" = ${companyId} FOR UPDATE`;
        const now = new Date();
        const existingSub = await tx.companySubscription.findFirst({ where: { companyId }, orderBy: { endDate: "desc" } });
        const renewCurrent = existingSub?.status === "ACTIVE" && existingSub.planId === planSnapshot.planId && existingSub.endDate > now;
        const expiry = subscriptionExpiry(renewCurrent ? existingSub.endDate : now, planSnapshot.validityMonths);

        if (existingSub) {
          await tx.companySubscription.update({
            where: { id: existingSub.id },
            data: {
              planId: planSnapshot.planId,
              entitlementSnapshot: planSnapshot,
              status: "ACTIVE",
              startDate: renewCurrent ? existingSub.startDate : now,
              endDate: expiry,
              paymentId: gatewayTxId,
            },
          });
        } else {
          await tx.companySubscription.create({
            data: {
              companyId,
              planId: planSnapshot.planId,
              entitlementSnapshot: planSnapshot,
              status: "ACTIVE",
              startDate: now,
              endDate: expiry,
              paymentId: gatewayTxId,
            },
          });
        }

        // Provision Credits
        const quotaCredits = subscriptionCredits(planSnapshot);
        const credits = await tx.companyCredits.upsert({
          where: { companyId },
          update: {
            jobPostsLeft: { increment: planSnapshot.jobPostsQuota },
            resumeUnlocksLeft: { increment: planSnapshot.resumeUnlocksQuota },
            aiInterviewsLeft: { increment: planSnapshot.aiInterviewsQuota },
            aiAgentCreditsLeft: { increment: planSnapshot.aiInterviewsQuota },
            applicationsLeft: { increment: quotaCredits.applicationsLeft },
            resumeDownloadsLeft: { increment: quotaCredits.resumeDownloadsLeft },
            backgroundVerificationsLeft: { increment: quotaCredits.backgroundVerificationsLeft },
          },
          create: {
            companyId,
            ...quotaCredits,
          },
        });

        // Step 3 & 4: Attribution is resolved, Idempotency is checked, Referral reward is created
        const { processPaymentReferralReward } = await import("@/lib/payment-referral");
        const referralResult = await processPaymentReferralReward(
          {
            companyId,
            amount: expectedAmount,
            provider: providerHeader,
            planId: planSnapshot.planId,
            transactionId: gatewayTxId,
            tx,
          },
          tx
        );

        // Step 5: Immutable ledger entry is written
        try {
          await tx.systemEvent.upsert({
            where: { idempotencyKey: `ledger_payment_${gatewayTxId}` },
            update: {},
            create: {
              scope: "TENANT",
              companyId,
              eventType: "PAYMENT_AND_REFERRAL_COMMITTED",
              correlationId: gatewayTxId,
              idempotencyKey: `ledger_payment_${gatewayTxId}`,
              payload: {
                gatewayTxId,
                companyId,
                planId: planSnapshot.planId,
                amount: expectedAmount,
                provider: providerHeader,
                rewardId: referralResult.reward?.id || null,
                rewardAmount: referralResult.reward?.rewardAmount || 0,
                rewardStatus: referralResult.reward?.status || null,
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch {
          // Schema fallback if systemEvent model not available in current DB mode
        }

        await tx.auditLog.create({
          data: {
            userId: null,
            companyId,
            action: "PAYMENT_AND_REFERRAL_COMMITTED",
            resource: "/api/payments/webhook",
            details: `Payment SUCCESS for plan ${planSnapshot.name} (Amount: ₹${expectedAmount}, GatewayTx: ${gatewayTxId}). Referral reward: ${referralResult.reward?.id || "None"}`,
          },
        });

        return {
          duplicate: false,
          credits,
          referral: referralResult,
        };
      });

      if (transactionResult.duplicate) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: transactionResult.message,
        });
      }

      return NextResponse.json({
        success: true,
        received: true,
        status: "ACTIVE",
        credits: transactionResult.credits,
        referral: transactionResult.referral,
      });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    return handleApiError(error);
  }
}

