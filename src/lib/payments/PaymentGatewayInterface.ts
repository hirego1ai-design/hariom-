export type GatewayName = "PAYU" | "STRIPE";

export const APPROVED_GATEWAYS: readonly GatewayName[] = ["STRIPE", "PAYU"] as const;

export function isGateway(value: unknown): value is GatewayName {
  return typeof value === "string" && (value === "STRIPE" || value === "PAYU");
}

export class AmbiguousPaymentOrderError extends Error {
  constructor(message: string, public readonly provider: GatewayName) {
    super(message);
    this.name = "AmbiguousPaymentOrderError";
  }
}

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  planName: string;
  planId?: string;
  companyId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface CreateOrderResult {
  success: boolean;
  gateway: GatewayName;
  orderId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  checkoutUrl?: string;
  checkoutParams?: Record<string, any>;
  rawPayload?: any;
  error?: string;
}

export interface VerifyWebhookParams {
  rawBody: string;
  signature: string;
  provider: GatewayName;
  headers: Record<string, string>;
}

export interface VerifyWebhookResult {
  isValid: boolean;
  gatewayTxId: string;
  gatewayOrderId?: string;
  orderId?: string;
  companyId?: string;
  planId?: string;
  amount?: number;
  currency?: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "REJECTED";
  rawPayload: any;
  error?: string;
}

export interface PaymentGateway {
  name: GatewayName;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult>;
  getPaymentStatus(gatewayTxId: string): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; rawResponse?: any }>;
}
