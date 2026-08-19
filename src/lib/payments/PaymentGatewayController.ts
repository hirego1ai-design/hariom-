import { prisma } from "@/lib/prisma";
import {
  PaymentGateway,
  GatewayName,
  CreateOrderParams,
  CreateOrderResult,
  VerifyWebhookParams,
  VerifyWebhookResult,
} from "./PaymentGatewayInterface";
import { RazorpayGateway } from "./RazorpayGateway";
import { PayUGateway } from "./PayUGateway";
import { PhonePeGateway } from "./PhonePeGateway";
import { StripeGateway } from "./StripeGateway";

export interface GatewayConfigState {
  mode: "AUTO" | "MANUAL";
  primaryGateway: GatewayName;
  autoFailover: boolean;
  allowEmployerSelection: boolean;
  gatewaysStatus: Record<GatewayName, "HEALTHY" | "DEGRADED" | "DISABLED">;
  priorities: GatewayName[];
}

export class PaymentGatewayController {
  private static providers: Record<GatewayName, PaymentGateway> = {
    RAZORPAY: new RazorpayGateway(),
    PAYU: new PayUGateway(),
    PHONEPE: new PhonePeGateway(),
    STRIPE: new StripeGateway(),
  };

  private static cachedConfig: GatewayConfigState | null = null;

  /**
   * Fetch current admin gateway configuration (or initialize default)
   */
  static async getConfig(): Promise<GatewayConfigState> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    try {
      const configRecord = await prisma.paymentGatewayConfig.findUnique({
        where: { id: "global-gateway-config" },
      });

      if (configRecord) {
        this.cachedConfig = {
          mode: configRecord.mode as any,
          primaryGateway: configRecord.primaryGateway as any,
          autoFailover: configRecord.autoFailover,
          allowEmployerSelection: configRecord.allowEmployerSelection,
          gatewaysStatus: configRecord.gatewaysStatus as any,
          priorities: configRecord.priorities as any,
        };
        return this.cachedConfig;
      }
    } catch {
      // Fallback to default
    }

    // Default configuration
    return {
      mode: "AUTO",
      primaryGateway: "RAZORPAY",
      autoFailover: true,
      allowEmployerSelection: true,
      gatewaysStatus: {
        RAZORPAY: "HEALTHY",
        PAYU: "HEALTHY",
        PHONEPE: "HEALTHY",
        STRIPE: "HEALTHY",
      },
      priorities: ["RAZORPAY", "PAYU", "PHONEPE", "STRIPE"],
    };
  }

  /**
   * Update admin gateway configuration
   */
  static async updateConfig(newConfig: Partial<GatewayConfigState>): Promise<GatewayConfigState> {
    const current = await this.getConfig();
    const updated: GatewayConfigState = {
      ...current,
      ...newConfig,
    };
    this.cachedConfig = updated;

    try {
      await prisma.paymentGatewayConfig.upsert({
        where: { id: "global-gateway-config" },
        update: {
          mode: updated.mode,
          primaryGateway: updated.primaryGateway,
          autoFailover: updated.autoFailover,
          allowEmployerSelection: updated.allowEmployerSelection,
          gatewaysStatus: updated.gatewaysStatus as any,
          priorities: updated.priorities as any,
        },
        create: {
          id: "global-gateway-config",
          mode: updated.mode,
          primaryGateway: updated.primaryGateway,
          autoFailover: updated.autoFailover,
          allowEmployerSelection: updated.allowEmployerSelection,
          gatewaysStatus: updated.gatewaysStatus as any,
          priorities: updated.priorities as any,
        },
      });
    } catch {
      // Offline / test fallback
    }

    return updated;
  }

  /**
   * Authoritative order creation with safe automatic failover
   */
  static async createOrder(
    params: CreateOrderParams,
    requestedGateway?: string
  ): Promise<CreateOrderResult> {
    const config = await this.getConfig();

    // Determine gateway sequence to attempt
    let candidateSequence: GatewayName[] = [];

    if (config.allowEmployerSelection && requestedGateway && (requestedGateway in this.providers)) {
      const selected = requestedGateway as GatewayName;
      if (config.gatewaysStatus[selected] !== "DISABLED") {
        candidateSequence.push(selected);
      }
    }

    if (candidateSequence.length === 0) {
      if (config.mode === "MANUAL") {
        candidateSequence.push(config.primaryGateway);
      } else {
        // AUTO mode: use priority list filtered by HEALTHY / DEGRADED status
        candidateSequence = config.priorities.filter(
          (gw) => config.gatewaysStatus[gw] !== "DISABLED"
        );
      }
    }

    if (candidateSequence.length === 0) {
      throw new Error("No active or healthy payment gateways available.");
    }

    let lastError: Error | null = null;

    for (let i = 0; i < candidateSequence.length; i++) {
      const gwName = candidateSequence[i];
      const provider = this.providers[gwName];

      try {
        const result = await provider.createOrder(params);
        return result;
      } catch (err: any) {
        console.error(`Gateway ${gwName} order creation failed:`, err.message);
        lastError = err;

        // SAFE FAILOVER GUARD: Only failover to next gateway if autoFailover is ON and no order was created
        if (!config.autoFailover || i === candidateSequence.length - 1) {
          break;
        }
        console.warn(`[Safe Failover] Switching from ${gwName} to next available gateway...`);
      }
    }

    throw lastError || new Error("Failed to create order across all configured gateways.");
  }

  /**
   * Route webhook verification to appropriate provider
   */
  static async verifyWebhook(params: VerifyWebhookParams): Promise<VerifyWebhookResult> {
    const provider = this.providers[params.provider] || this.providers.RAZORPAY;
    return provider.verifyWebhook(params);
  }
}
