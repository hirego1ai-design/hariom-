import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { handleApiError, ApiError } from "@/lib";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new ApiError("Invalid JSON payload", 400);
    }

    const { event, payload } = body;
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    // 1. Multi-Gateway Webhook Verification via PaymentGatewayController
    const providerParam = req.nextUrl.searchParams.get("provider") as any;
    const providerHeader = providerParam || (req.headers.get("x-razorpay-signature") ? "RAZORPAY" : req.headers.get("x-verify") ? "PHONEPE" : "PAYU");

    const signature = req.headers.get("x-razorpay-signature") ||
      req.headers.get("x-verify") ||
      body?.hash || "";

    const { PaymentGatewayController } = await import("@/lib/payments/PaymentGatewayController");
    const verification = await PaymentGatewayController.verifyWebhook({
      rawBody,
      signature,
      provider: providerHeader,
      headers: Object.fromEntries(req.headers.entries()),
    });

    if (!verification.isValid) {
      return NextResponse.json({ success: false, error: verification.error || "Invalid gateway webhook signature" }, { status: 400 });
    }

    const companyId = verification.companyId || payload?.companyId || payload?.metadata?.companyId;
    const planId = verification.planId || payload?.planId || payload?.metadata?.planId;
    const gatewayTxId = verification.gatewayTxId || payload?.paymentId || payload?.id || `tx_${Date.now()}`;

    // 2. Strict Idempotency Check: Query PaymentTransaction table for existing gatewayTxId
    if (gatewayTxId) {
      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { gatewayTxId },
      });
      if (existingTx && existingTx.status === "SUCCESS") {
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: `Webhook transaction ${gatewayTxId} already processed. Zero duplicate credits provisioned.`,
        });
      }
    }

    // 3. Handle Payment Failure / Rejection Events
    if (verification.status === "FAILED" || verification.status === "REJECTED" || event === "payment.failed") {
      if (gatewayTxId && companyId) {
        await prisma.paymentTransaction.upsert({
          where: { gatewayTxId },
          update: { status: "FAILED", errorMessage: "Payment gateway failed event received" },
          create: {
            gatewayTxId,
            companyId,
            planId: planId || null,
            amount: verification.amount || 0,
            status: "FAILED",
            provider: providerHeader,
            errorMessage: "Payment gateway failed event received",
          },
        });
      }

      logAuditEvent({
        userId: companyId || "SYSTEM",
        action: "PAYMENT_FAILED",
        resource: "/api/payments/webhook",
        details: `Payment failed for order ${gatewayTxId} (Company: ${companyId})`,
      });

      return NextResponse.json({
        success: true,
        received: true,
        status: "FAILED",
        message: "Payment failure recorded. Subscription and credits remain uncharged.",
      });
    }

    // 4. Handle Payment Success Events with Amount Integrity Check & Credit Provisioning
    if (verification.status === "SUCCESS" || event === "payment.captured") {
      if (!companyId || !planId) {
        return NextResponse.json({ success: false, error: "Missing companyId or planId in webhook payload" }, { status: 400 });
      }

      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) {
        return NextResponse.json({ success: false, error: "Subscription plan not found" }, { status: 404 });
      }

      // Amount Integrity Enforcement: Reject if gateway amount does not match authoritative plan price
      if (verification.amount !== undefined && verification.amount > 0) {
        if (Math.abs(verification.amount - plan.price) > 0.01) {
          throw new ApiError(`Payment amount mismatch. Gateway: ₹${verification.amount}, Plan: ₹${plan.price}`, 400);
        }
      }

      // Execute Atomic Credit Provisioning & Idempotent Transaction Record inside Prisma Transaction
      const result = await prisma.$transaction(async (tx) => {
        // Record PaymentTransaction
        await tx.paymentTransaction.upsert({
          where: { gatewayTxId },
          update: { status: "SUCCESS", planId: plan.id, amount: plan.price },
          create: {
            gatewayTxId,
            companyId,
            planId: plan.id,
            amount: plan.price,
            status: "SUCCESS",
            provider: req.headers.get("x-razorpay-signature") ? "RAZORPAY" : "STRIPE",
            rawPayload: body,
          },
        });

        // Activate Subscription
        const now = new Date();
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + (plan.validityMonths || 1));

        const existingSub = await tx.companySubscription.findFirst({ where: { companyId } });
        if (existingSub) {
          await tx.companySubscription.update({
            where: { id: existingSub.id },
            data: {
              planId: plan.id,
              status: "ACTIVE",
              startDate: now,
              endDate: expiry,
            },
          });
        } else {
          await tx.companySubscription.create({
            data: {
              companyId,
              planId: plan.id,
              status: "ACTIVE",
              startDate: now,
              endDate: expiry,
            },
          });
        }

        // Provision Credits
        const credits = await tx.companyCredits.upsert({
          where: { companyId },
          update: {
            jobPostsLeft: { increment: plan.jobPostsQuota },
            resumeUnlocksLeft: { increment: plan.resumeUnlocksQuota },
            aiInterviewsLeft: { increment: plan.aiInterviewsQuota },
          },
          create: {
            companyId,
            jobPostsLeft: plan.jobPostsQuota,
            resumeUnlocksLeft: plan.resumeUnlocksQuota,
            aiInterviewsLeft: plan.aiInterviewsQuota,
          },
        });

        return credits;
      });

      logAuditEvent({
        userId: companyId,
        action: "PAYMENT_SUCCESS",
        resource: "/api/payments/webhook",
        details: `Successfully activated plan ${plan.name} and provisioned ${plan.jobPostsQuota} job credits for company ${companyId}`,
      });

      return NextResponse.json({
        success: true,
        received: true,
        status: "ACTIVE",
        credits: result,
      });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
