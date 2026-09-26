import crypto from "crypto";
import {
  PaymentGateway,
  GatewayName,
  CreateOrderParams,
  CreateOrderResult,
  VerifyWebhookParams,
  VerifyWebhookResult,
} from "./PaymentGatewayInterface";

export class PayUGateway implements PaymentGateway {
  name: GatewayName = "PAYU";

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const merchantKey = process.env.PAYU_MERCHANT_KEY?.trim();
    const merchantSalt = process.env.PAYU_MERCHANT_SALT?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

    const isProduction =
      process.env.NODE_ENV === "production" && process.env.PAYU_ENVIRONMENT !== "test";

    if (isProduction && (!merchantKey || !merchantSalt)) {
      throw new Error("PayU merchant credentials missing in production environment.");
    }

    const payuEndpoint = isProduction
      ? "https://secure.payu.in/_payment"
      : "https://test.payu.in/_payment";

    const gatewayOrderId = `payu_${params.orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}_${Date.now().toString(36)}`;
    const formattedAmount = params.amount.toFixed(2);
    const productInfo = (params.planName || "HireGo Subscription").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 100) || "Subscription";
    const firstname = (params.customerName || "Employer").trim().slice(0, 60) || "Employer";
    const requestedEmail = (params.customerEmail || "").trim().toLowerCase();
    const requestedPhone = (params.customerPhone || "").replace(/[^0-9+]/g, "").slice(0, 20);

    if (isProduction && (!requestedEmail || !requestedPhone)) {
      throw new Error("PayU checkout requires the employer billing email and phone number.");
    }
    const email = requestedEmail || "dev-billing@example.test";
    const phone = requestedPhone || "9999999999";
    const surl = `${appUrl}/payment/status?orderId=${encodeURIComponent(params.orderId)}&gateway=PAYU`;
    const furl = `${appUrl}/payment/status?orderId=${encodeURIComponent(params.orderId)}&gateway=PAYU&status=FAILED`;
    const udf1 = params.orderId;
    const udf2 = params.companyId;
    const udf3 = params.planId || "";
    const udf4 = "";
    const udf5 = "";

    let hash = "";
    if (merchantKey && merchantSalt) {
      // Official PayU Request Hash sequence:
      // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
      const hashSequence = `${merchantKey}|${gatewayOrderId}|${formattedAmount}|${productInfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${merchantSalt}`;
      hash = crypto.createHash("sha512").update(hashSequence).digest("hex");
    }

    // Never return the merchant salt or secrets to browser/client
    return {
      success: true,
      gateway: "PAYU",
      orderId: params.orderId,
      gatewayOrderId,
      amount: params.amount,
      currency: params.currency || "INR",
      checkoutUrl: payuEndpoint,
      checkoutParams: {
        key: merchantKey || "test_key",
        txnid: gatewayOrderId,
        amount: formattedAmount,
        productinfo: productInfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
        udf1,
        udf2,
        udf3,
        service_provider: "payu_paisa",
      },
      rawPayload: { gatewayOrderId, productInfo, txnid: gatewayOrderId },
    };
  }

  async verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult> {
    let jsonPayload: any = {};
    if (typeof params.rawBody === "string") {
      try {
        jsonPayload = JSON.parse(params.rawBody);
      } catch {
        const paramsObj = new URLSearchParams(params.rawBody);
        jsonPayload = Object.fromEntries(paramsObj.entries());
      }
    } else {
      jsonPayload = params.rawBody || {};
    }

    const gatewayTxId = jsonPayload?.mihpayid || jsonPayload?.txnid || "";
    const gatewayOrderId = jsonPayload?.txnid || jsonPayload?.udf1 || "";
    const merchantSalt = process.env.PAYU_MERCHANT_SALT?.trim();

    if (!merchantSalt) {
      return {
        isValid: false,
        gatewayTxId,
        status: "REJECTED",
        rawPayload: jsonPayload,
        error: "PayU webhook verification is not configured (missing salt)",
      };
    }

    const statusStr = jsonPayload?.status || "";
    const txnid = jsonPayload?.txnid || "";
    const amount = jsonPayload?.amount || "";
    const productinfo = jsonPayload?.productinfo || "";
    const firstname = jsonPayload?.firstname || "";
    const email = jsonPayload?.email || "";
    const udf1 = jsonPayload?.udf1 || "";
    const udf2 = jsonPayload?.udf2 || "";
    const udf3 = jsonPayload?.udf3 || "";
    const udf4 = jsonPayload?.udf4 || "";
    const udf5 = jsonPayload?.udf5 || "";
    const key = jsonPayload?.key || process.env.PAYU_MERCHANT_KEY || "";
    const additionalCharges = jsonPayload?.additionalCharges || "";
    const hashFromPayload = (jsonPayload?.hash || params.signature || "").trim().toLowerCase();

    if (!hashFromPayload) {
      return {
        isValid: false,
        gatewayTxId,
        status: "REJECTED",
        rawPayload: jsonPayload,
        error: "Missing PayU webhook cryptographic hash signature",
      };
    }

    // Official PayU Reverse Hash formula:
    // With additionalCharges: sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    // Standard: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const baseSequence = `${merchantSalt}|${statusStr}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const standardHash = crypto.createHash("sha512").update(baseSequence).digest("hex").toLowerCase();
    const additionalChargesHash = additionalCharges
      ? crypto.createHash("sha512").update(`${additionalCharges}|${baseSequence}`).digest("hex").toLowerCase()
      : null;

    let isMatch = false;
    try {
      const payloadBuf = Buffer.from(hashFromPayload, "utf-8");
      const stdBuf = Buffer.from(standardHash, "utf-8");
      if (payloadBuf.length === stdBuf.length && crypto.timingSafeEqual(payloadBuf, stdBuf)) {
        isMatch = true;
      } else if (additionalChargesHash) {
        const addBuf = Buffer.from(additionalChargesHash, "utf-8");
        if (payloadBuf.length === addBuf.length && crypto.timingSafeEqual(payloadBuf, addBuf)) {
          isMatch = true;
        }
      }
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      return {
        isValid: false,
        gatewayTxId,
        status: "REJECTED",
        rawPayload: jsonPayload,
        error: "Invalid PayU reverse SHA-512 hash signature",
      };
    }

    const status: VerifyWebhookResult["status"] =
      statusStr.toLowerCase() === "success"
        ? "SUCCESS"
        : ["failure", "failed"].includes(statusStr.toLowerCase())
          ? "FAILED"
          : "PENDING";

    return {
      isValid: true,
      gatewayTxId,
      gatewayOrderId,
      companyId: udf2 || undefined,
      planId: udf3 || undefined,
      amount: amount ? parseFloat(amount) : undefined,
      currency: "INR",
      status,
      rawPayload: jsonPayload,
    };
  }

  async getPaymentStatus(gatewayTxId: string): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; rawResponse?: any }> {
    const key = process.env.PAYU_MERCHANT_KEY?.trim();
    const salt = process.env.PAYU_MERCHANT_SALT?.trim();
    if (!key || !salt) {
      if (process.env.NODE_ENV === "production") throw new Error("PayU reconciliation credentials are not configured.");
      return { status: "PENDING" };
    }
    if (!/^[A-Za-z0-9_~-]{1,128}$/.test(gatewayTxId)) throw new Error("Invalid PayU transaction id.");

    const command = "verify_payment";
    const hash = crypto.createHash("sha512").update(`${key}|${command}|${gatewayTxId}|${salt}`).digest("hex");
    const body = new URLSearchParams({ key, command, var1: gatewayTxId, hash });
    const endpoint =
      process.env.NODE_ENV === "production" && process.env.PAYU_ENVIRONMENT !== "test"
        ? "https://info.payu.in/merchant/postservice.php?form=2"
        : "https://test.payu.in/merchant/postservice.php?form=2";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`PayU reconciliation failed with HTTP ${response.status}.`);
    const payload = await response.json();
    const details = payload?.transaction_details?.[gatewayTxId];
    const nativeStatus = String(details?.status ?? "").toLowerCase();
    const unmapped = String(details?.unmappedstatus ?? "").toLowerCase();
    const status = nativeStatus === "success" && (unmapped === "captured" || unmapped === "success")
      ? "SUCCESS"
      : ["failure", "failed"].includes(nativeStatus) ? "FAILED" : "PENDING";

    return { status, rawResponse: payload };
  }
}
