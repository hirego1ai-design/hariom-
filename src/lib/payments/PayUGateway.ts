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
    const merchantKey = process.env.PAYU_MERCHANT_KEY;
    const merchantSalt = process.env.PAYU_MERCHANT_SALT;

    if (process.env.NODE_ENV === "production" && (!merchantKey || !merchantSalt)) {
      throw new Error("PayU merchant credentials missing in production environment.");
    }

    const gatewayOrderId = `payu_tx_${crypto.randomUUID()}`;
    let hash = "";

    if (merchantKey && merchantSalt) {
      // PayU hash format: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
      const hashString = `${merchantKey}|${gatewayOrderId}|${params.amount.toFixed(2)}|${params.planName}|HireGo|billing@hirego.ai|||||||||||${merchantSalt}`;
      hash = crypto.createHash("sha512").update(hashString).digest("hex");
    }

    return {
      success: true,
      gateway: "PAYU",
      orderId: params.orderId,
      gatewayOrderId,
      amount: params.amount,
      currency: params.currency || "INR",
      checkoutUrl: `/payment/status?orderId=${params.orderId}&gatewayOrderId=${gatewayOrderId}&gateway=PAYU&hash=${hash}`,
      rawPayload: { merchantKey, gatewayOrderId, hash },
    };
  }

  async verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult> {
    const jsonPayload = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;
    const gatewayTxId = jsonPayload?.txnid || jsonPayload?.mihpayid || "";
    const status = jsonPayload?.status === "success" ? "SUCCESS" : "FAILED";
    const merchantSalt = process.env.PAYU_MERCHANT_SALT;

    if (!merchantSalt) {
      return {
        isValid: false,
        gatewayTxId,
        status: "REJECTED",
        rawPayload: jsonPayload,
        error: "PayU webhook verification is not configured",
      };
    }

    {
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
      const hashFromPayload = jsonPayload?.hash || params.signature || "";

      if (!hashFromPayload) {
        return {
          isValid: false,
          gatewayTxId,
          status: "REJECTED",
          rawPayload: jsonPayload,
          error: "Missing PayU webhook signature",
        };
      }

      // Reverse hash formula: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
      const reverseHashSequence = `${merchantSalt}|${statusStr}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const calculatedHash = crypto.createHash("sha512").update(reverseHashSequence).digest("hex");

      if (calculatedHash.toLowerCase() !== hashFromPayload.toLowerCase()) {
        return {
          isValid: false,
          gatewayTxId,
          status: "REJECTED",
          rawPayload: jsonPayload,
          error: "Invalid PayU reverse SHA512 hash signature",
        };
      }
    }

    const body = typeof params.rawBody === "string" ? JSON.parse(params.rawBody) : params.rawBody;
    const gatewayOrderId = jsonPayload?.txnid || body?.txnid;

    return {
      isValid: true,
      gatewayTxId,
      gatewayOrderId,
      companyId: jsonPayload?.udf1,
      planId: jsonPayload?.udf2,
      amount: jsonPayload?.amount ? parseFloat(jsonPayload.amount) : undefined,
      currency: "INR",
      status,
      rawPayload: jsonPayload,
    };
  }

  async getPaymentStatus(gatewayTxId: string): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; rawResponse?: any }> {
    return { status: "SUCCESS" };
  }
}
