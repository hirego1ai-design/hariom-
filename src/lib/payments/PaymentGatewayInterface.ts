export type GatewayName = "RAZORPAY" | "PAYU" | "PHONEPE" | "STRIPE";

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  planName: string;
  companyId: string;
}

export interface CreateOrderResult {
  success: boolean;
  gateway: GatewayName;
  orderId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  checkoutUrl?: string;
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
  companyId?: string;
  planId?: string;
  amount?: number;
  currency?: string;
  status: "SUCCESS" | "FAILED" | "REJECTED";
  rawPayload: any;
  error?: string;
}

export interface PaymentGateway {
  name: GatewayName;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult>;
  getPaymentStatus(gatewayTxId: string): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; rawResponse?: any }>;
}
