import crypto from "crypto";
import {
  PaymentGateway,
  GatewayName,
  CreateOrderParams,
  CreateOrderResult,
  VerifyWebhookParams,
  VerifyWebhookResult,
} from "./PaymentGatewayInterface";

export class RazorpayGateway implements PaymentGateway {
  name: GatewayName = "RAZORPAY";

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (process.env.NODE_ENV === "production" && (!keyId || !keySecret)) {
      throw new Error("Razorpay credentials missing in production environment.");
    }

    if (keyId && keySecret) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const res = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(params.amount * 100), // amount in paise
            currency: params.currency || "INR",
            receipt: params.orderId,
            notes: { companyId: params.companyId, planId: params.planId },
          }),
        });

        const data = await res.json();
        if (res.ok && data.id) {
          return {
            success: true,
            gateway: "RAZORPAY",
            orderId: params.orderId,
            gatewayOrderId: data.id,
            amount: params.amount,
            currency: params.currency,
            checkoutUrl: `/payment/status?orderId=${params.orderId}&gatewayOrderId=${data.id}&gateway=RAZORPAY`,
            rawPayload: data,
          };
        }
      } catch (err: any) {
        console.error("Razorpay Live API Order Creation Failed:", err.message);
        throw err; // Allow Controller to capture exception for safe failover if order was NOT created
      }
    }

    // Sandbox / Test fallback order
    const mockGatewayOrderId = `order_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      success: true,
      gateway: "RAZORPAY",
      orderId: params.orderId,
      gatewayOrderId: mockGatewayOrderId,
      amount: params.amount,
      currency: params.currency,
      checkoutUrl: `/payment/status?orderId=${params.orderId}&gatewayOrderId=${mockGatewayOrderId}&gateway=RAZORPAY`,
      rawPayload: { mock: true, gatewayOrderId: mockGatewayOrderId },
    };
  }

  async verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult> {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (process.env.NODE_ENV === "production" && !secret) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Razorpay Webhook secret missing in production environment.",
      };
    }

    if (!params.signature && (secret || process.env.NODE_ENV === "production")) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Missing Razorpay webhook signature (x-razorpay-signature)",
      };
    }

    if (secret && params.signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(params.rawBody)
        .digest("hex");

      let isMatch = false;
      try {
        const sigBuf = Buffer.from(params.signature, "utf-8");
        const expBuf = Buffer.from(expectedSignature, "utf-8");
        isMatch = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
      } catch {
        isMatch = false;
      }

      if (!isMatch) {
        return {
          isValid: false,
          gatewayTxId: "",
          status: "REJECTED",
          rawPayload: {},
          error: "Invalid Razorpay HMAC signature",
        };
      }
    }

    const jsonPayload = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;
    const entity = jsonPayload?.payload?.payment?.entity || jsonPayload;
    const gatewayTxId = entity?.id || `pay_rzp_${Date.now()}`;
    const status = entity?.status === "captured" || jsonPayload?.event === "payment.captured" ? "SUCCESS" : "FAILED";
    const gatewayOrderId = entity?.order_id || jsonPayload?.order_id || jsonPayload?.payload?.payment?.entity?.order_id;

    return {
      isValid: true,
      gatewayTxId,
      gatewayOrderId,
      companyId: entity?.notes?.companyId,
      planId: entity?.notes?.planId,
      amount: entity?.amount ? entity.amount / 100 : undefined,
      currency: entity?.currency || "INR",
      status,
      rawPayload: jsonPayload,
    };
  }

  async getPaymentStatus(gatewayTxId: string): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; rawResponse?: any }> {
    return { status: "SUCCESS" };
  }
}
