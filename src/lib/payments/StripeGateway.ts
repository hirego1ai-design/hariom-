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
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!secretKey || !appUrl) {
      if (process.env.NODE_ENV === "production") throw new Error("Stripe checkout credentials are not configured.");
      const id = `cs_test_${crypto.randomUUID()}`;
      return { success: true, gateway: "STRIPE", orderId: params.orderId, gatewayOrderId: id, amount: params.amount, currency: params.currency || "INR", checkoutUrl: `/payment/status?orderId=${params.orderId}&gatewayOrderId=${id}&gateway=STRIPE`, rawPayload: { mock: true, gatewayOrderId: id } };
    }
    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", `${appUrl}/payment/status?orderId=${encodeURIComponent(params.orderId)}&gateway=STRIPE`);
    body.set("cancel_url", `${appUrl}/payment/status?orderId=${encodeURIComponent(params.orderId)}&gateway=STRIPE&cancelled=1`);
    body.set("client_reference_id", params.orderId);
    body.set("metadata[companyId]", params.companyId);
    body.set("metadata[planId]", params.planId || "");
    body.set("metadata[orderId]", params.orderId);
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", (params.currency || "INR").toLowerCase());
    body.set("line_items[0][price_data][unit_amount]", String(Math.round(params.amount * 100)));
    body.set("line_items[0][price_data][product_data][name]", params.planName);
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `hirego-${params.orderId}` }, body, signal: AbortSignal.timeout(10_000), redirect: "error", cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload?.id || !payload?.url) throw new Error("Stripe checkout session creation failed.");
    return { success: true, gateway: "STRIPE", orderId: params.orderId, gatewayOrderId: payload.id, amount: params.amount, currency: params.currency || "INR", checkoutUrl: payload.url, rawPayload: { id: payload.id } };
  }

  async verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Stripe Webhook secret missing in production environment.",
      };
    }

    const signature = params.signature || params.headers?.["stripe-signature"] || "";
    if (!signature) {
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
    const gatewayTxId = dataObj?.id || eventPayload?.id || "";
    const eventType = eventPayload?.type || "";
    const isSuccess =
      eventType === "checkout.session.completed" ||
      eventType === "payment_intent.succeeded" ||
      eventType === "charge.succeeded" ||
      dataObj?.status === "succeeded" ||
      dataObj?.status === "paid" ||
      dataObj?.payment_status === "paid";

    const isFailure = eventType === "payment_intent.payment_failed" || eventType === "checkout.session.expired" || dataObj?.status === "failed";
    const status: VerifyWebhookResult["status"] = isSuccess ? "SUCCESS" : isFailure ? "FAILED" : "PENDING";
    const session = eventPayload?.data?.object;
    const gatewayOrderId = session?.id || session?.payment_intent || eventPayload?.id;

    return {
      isValid: true,
      gatewayTxId,
      gatewayOrderId,
      companyId: dataObj?.metadata?.companyId || dataObj?.client_reference_id,
      planId: dataObj?.metadata?.planId,
      amount: dataObj?.amount ? dataObj.amount / 100 : dataObj?.amount_total ? dataObj.amount_total / 100 : undefined,
      currency: (dataObj?.currency || "inr").toUpperCase(),
      status,
      rawPayload: eventPayload,
    };
  }

  async getPaymentStatus(gatewayTxId: string): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; rawResponse?: any }> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      if (process.env.NODE_ENV === "production") throw new Error("Stripe reconciliation credentials are not configured.");
      return { status: "PENDING" };
    }
    if (!/^pi_[A-Za-z0-9_]+$/.test(gatewayTxId)) throw new Error("Invalid Stripe payment intent id.");
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(gatewayTxId)}`, { headers: { Authorization: `Bearer ${secretKey}` }, signal: AbortSignal.timeout(10_000), redirect: "error", cache: "no-store" });
    if (!response.ok) throw new Error(`Stripe reconciliation failed with HTTP ${response.status}.`);
    const payload = await response.json();
    const status = payload?.status === "succeeded" ? "SUCCESS" : payload?.status === "canceled" ? "FAILED" : "PENDING";
    return { status, rawResponse: payload };
  }
}
