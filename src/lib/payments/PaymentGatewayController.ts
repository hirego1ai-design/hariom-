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

// Production safety invariant: Incomplete providers CANNOT be enabled in production
// under any circumstances (even if DB config marks them as healthy) to prevent risk.
const PRODUCTION_BLOCKED_GATEWAYS = new Set<GatewayName>(["PAYU", "PHONEPE", "STRIPE"]);

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
        if (process.env.NODE_ENV === "production") {
          for (const gw of PRODUCTION_BLOCKED_GATEWAYS) {
            this.cachedConfig.gatewaysStatus[gw] = "DISABLED";
          }
        }
        return this.cachedConfig;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        console.error("Failed to load gateway config from DB:", error);
      }
    }

    // Default configuration (only live production-ready providers are enabled in production)
    const isProduction = process.env.NODE_ENV === "production";
    const defaultConfig: GatewayConfigState = {
      mode: "AUTO",
      primaryGateway: "RAZORPAY",
      autoFailover: true,
      allowEmployerSelection: true,
      gatewaysStatus: {
        RAZORPAY: "HEALTHY",
        PAYU: isProduction ? "DISABLED" : "HEALTHY",
        PHONEPE: isProduction ? "DISABLED" : "HEALTHY",
        STRIPE: isProduction ? "DISABLED" : "HEALTHY",
      },
      priorities: isProduction ? ["RAZORPAY"] : ["RAZORPAY", "PAYU", "PHONEPE", "STRIPE"],
    };

    if (isProduction) {
      for (const gw of PRODUCTION_BLOCKED_GATEWAYS) {
        defaultConfig.gatewaysStatus[gw] = "DISABLED";
      }
    }
    
    return defaultConfig;
  }

  /**
   * Update admin gateway configuration
   */
  static async updateConfig(newConfig: Partial<GatewayConfigState>): Promise<GatewayConfigState> {
    const current = await this.getConfig();
    const updated: GatewayConfigState = {
      ...current,
      ...newConfig,
      gatewaysStatus: {
        ...current.gatewaysStatus,
        ...(newConfig.gatewaysStatus || {})
      }
    };

    // Enforce production safety invariant
    if (process.env.NODE_ENV === "production") {
      for (const gw of PRODUCTION_BLOCKED_GATEWAYS) {
        updated.gatewaysStatus[gw] = "DISABLED";
      }
    }
    
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
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
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

      // Final production safety guard before payment creation
      if (process.env.NODE_ENV === "production" && PRODUCTION_BLOCKED_GATEWAYS.has(gwName)) {
        console.warn(`[Safe Guard] Skipped blocked provider in production: ${gwName}`);
        continue;
      }

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
