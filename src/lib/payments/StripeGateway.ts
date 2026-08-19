import crypto from "crypto";
import {
  PaymentGateway,
  GatewayName,
  CreateOrderParams,
  CreateOrderResult,
  VerifyWebhookParams,
  VerifyWebhookResult,
} from "./PaymentGatewayInterface";

export class StripeGateway implements PaymentGateway {
  name: GatewayName = "STRIPE";

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const mockGatewayOrderId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      success: true,
      gateway: "STRIPE",
      orderId: params.orderId,
      gatewayOrderId: mockGatewayOrderId,
      amount: params.amount,
      currency: params.currency || "INR",
      checkoutUrl: `/payment/status?orderId=${params.orderId}&gatewayOrderId=${mockGatewayOrderId}&gateway=STRIPE`,
      rawPayload: { mock: true, gatewayOrderId: mockGatewayOrderId },
    };
  }

  async verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === "production" && !secret) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Stripe Webhook secret missing in production environment.",
      };
    }

    const signature = params.signature || params.headers?.["stripe-signature"] || "";
    if (!signature && (secret || process.env.NODE_ENV === "production")) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Missing Stripe webhook signature (stripe-signature)",
      };
    }

    let isVerified = false;
    let eventPayload: any = null;

    try {
      if (secret && signature) {
        // Parse Stripe signature header components: t=timestamp,v1=signature,v0=...
        const items = signature.split(",").reduce((acc: Record<string, string>, item: string) => {
          const [k, ...v] = item.trim().split("=");
          if (k && v.length > 0) acc[k] = v.join("=");
          return acc;
        }, {});

        const timestamp = items["t"];
        const signatureHash = items["v1"] || items["v0"];

        if (timestamp && signatureHash) {
          const payloadToSign = `${timestamp}.${params.rawBody}`;
          const expectedSig = crypto
            .createHmac("sha256", secret)
            .update(payloadToSign)
            .digest("hex");

          try {
            const sigBuf = Buffer.from(signatureHash, "utf-8");
            const expBuf = Buffer.from(expectedSig, "utf-8");
            if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
              isVerified = true;
            }
          } catch {
            isVerified = false;
          }
        } else {
          // Direct HMAC signature comparison fallback
          const expectedSig = crypto
            .createHmac("sha256", secret)
            .update(params.rawBody)
            .digest("hex");
          
          try {
            const sigBuf = Buffer.from(signature, "utf-8");
            const expBuf = Buffer.from(expectedSig, "utf-8");
            if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
              isVerified = true;
            }
          } catch {
            isVerified = false;
          }
        }

        if (!isVerified) {
          return {
            isValid: false,
            gatewayTxId: "",
            status: "REJECTED",
            rawPayload: {},
            error: "Invalid Stripe signature",
          };
        }
      } else {
        isVerified = true;
      }

      eventPayload = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;
    } catch (err: any) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: `Stripe verification failed: ${err.message}`,
      };
    }

    const dataObj = eventPayload?.data?.object || eventPayload;
    const gatewayTxId = dataObj?.id || eventPayload?.id || `stripe_${Date.now()}`;
    const eventType = eventPayload?.type || "";
    const isSuccess =
      eventType === "checkout.session.completed" ||
      eventType === "payment_intent.succeeded" ||
      eventType === "charge.succeeded" ||
      dataObj?.status === "succeeded" ||
      dataObj?.status === "paid" ||
      dataObj?.payment_status === "paid";

    const status = isSuccess ? "SUCCESS" : "FAILED";

    return {
      isValid: true,
      gatewayTxId,
      companyId: dataObj?.metadata?.companyId || dataObj?.client_reference_id,
      planId: dataObj?.metadata?.planId,
      amount: dataObj?.amount ? dataObj.amount / 100 : dataObj?.amount_total ? dataObj.amount_total / 100 : undefined,
      currency: (dataObj?.currency || "inr").toUpperCase(),
      status,
      rawPayload: eventPayload,
    };
  }

  async getPaymentStatus(gatewayTxId: string): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; rawResponse?: any }> {
    return { status: "SUCCESS" };
  }
}
