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
    if (params.customerEmail) body.set("customer_email", params.customerEmail.trim().toLowerCase());
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

    const signatureHeader = params.signature || params.headers?.["stripe-signature"] || "";
    if (!signatureHeader) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Missing Stripe webhook signature (stripe-signature)",
      };
    }

    // Official Stripe webhook signature verification specification:
    // Header format: t=<timestamp>,v1=<signature>,v1=<signature2>...
    const elements = signatureHeader.split(",");
    let timestampStr: string | null = null;
    const v1Signatures: string[] = [];

    for (const element of elements) {
      const [key, ...rest] = element.trim().split("=");
      const value = rest.join("=");
      if (key === "t") {
        timestampStr = value;
      } else if (key === "v1") {
        v1Signatures.push(value);
      }
    }

    if (!timestampStr || v1Signatures.length === 0) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Malformed Stripe signature header: missing timestamp or v1 signature",
      };
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || timestamp <= 0) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Invalid timestamp in Stripe signature header",
      };
    }

    // Enforce 5-minute (300 seconds) replay tolerance window
    const TOLERANCE_SECONDS = 300;
    const currentEpochSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(currentEpochSeconds - timestamp) > TOLERANCE_SECONDS) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Stripe webhook timestamp outside tolerance window (possible replay attack)",
      };
    }

    // Exact raw request body binding
    const signedPayload = `${timestamp}.${params.rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    let isValid = false;

    for (const v1Sig of v1Signatures) {
      try {
        const sigBuf = Buffer.from(v1Sig, "utf-8");
        if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          isValid = true;
          break;
        }
      } catch {
        // Continue checking next signature
      }
    }

    if (!isValid) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: "Invalid Stripe cryptographic signature",
      };
    }

    let eventPayload: any = null;
    try {
      eventPayload = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;
    } catch (err: any) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: {},
        error: `Failed to parse verified Stripe event payload: ${err.message}`,
      };
    }

    const dataObj = eventPayload?.data?.object || eventPayload;
    const gatewayTxId = dataObj?.id || eventPayload?.id || "";
    const eventType = eventPayload?.type || "";
    const isCheckoutEvent = eventType.startsWith("checkout.session.");
    const checkoutPaid = dataObj?.payment_status === "paid";
    const isSuccess =
      (isCheckoutEvent && ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(eventType) && checkoutPaid) ||
      eventType === "payment_intent.succeeded" ||
      eventType === "charge.succeeded" ||
      (!isCheckoutEvent && (dataObj?.status === "succeeded" || dataObj?.status === "paid"));

    const isFailure =
      eventType === "payment_intent.payment_failed" ||
      eventType === "checkout.session.async_payment_failed" ||
      eventType === "checkout.session.expired" ||
      dataObj?.status === "failed";

    const status: VerifyWebhookResult["status"] = isSuccess ? "SUCCESS" : isFailure ? "FAILED" : "PENDING";
    const session = eventPayload?.data?.object;
    const gatewayOrderId = session?.id || session?.payment_intent || eventPayload?.id;

    return {
      isValid: true,
      gatewayTxId,
      gatewayOrderId,
      companyId: dataObj?.metadata?.companyId || dataObj?.client_reference_id,
      planId: dataObj?.metadata?.planId,
      orderId: dataObj?.metadata?.orderId || dataObj?.client_reference_id,
      amount: dataObj?.amount_total ? dataObj.amount_total / 100 : dataObj?.amount ? dataObj.amount / 100 : undefined,
      currency: (dataObj?.currency || "INR").toUpperCase(),
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
    const isPaymentIntent = /^pi_[A-Za-z0-9_]+$/.test(gatewayTxId);
    const isCheckoutSession = /^cs_(?:test_|live_)?[A-Za-z0-9_]+$/.test(gatewayTxId);
    if (!isPaymentIntent && !isCheckoutSession) throw new Error("Invalid Stripe payment reference.");

    const resource = isPaymentIntent ? "payment_intents" : "checkout/sessions";
    const response = await fetch(`https://api.stripe.com/v1/${resource}/${encodeURIComponent(gatewayTxId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Stripe reconciliation failed with HTTP ${response.status}.`);
    const payload = await response.json();

    let status: "SUCCESS" | "FAILED" | "PENDING";
    if (isPaymentIntent) {
      status = payload?.status === "succeeded" ? "SUCCESS" : payload?.status === "canceled" ? "FAILED" : "PENDING";
    } else {
      status = payload?.payment_status === "paid"
        ? "SUCCESS"
        : payload?.status === "expired"
          ? "FAILED"
          : "PENDING";
    }
    return { status, rawResponse: payload };
  }
}
