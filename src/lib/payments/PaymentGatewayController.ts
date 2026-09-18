import { prisma } from "@/lib/prisma";
import {
  PaymentGateway,
  GatewayName,
  CreateOrderParams,
  CreateOrderResult,
  VerifyWebhookParams,
  VerifyWebhookResult,
  AmbiguousPaymentOrderError,
} from "./PaymentGatewayInterface";
import { RazorpayGateway } from "./RazorpayGateway";
import { PayUGateway } from "./PayUGateway";
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
const PRODUCTION_BLOCKED_GATEWAYS = new Set<GatewayName>(["PAYU", "STRIPE"]);

// Providers remain blocked until the release gate explicitly enables them after
// credentials, webhook secrets, reconciliation, and staging payment tests pass.
// Admin configuration can prepare routing policy but cannot bypass this invariant.

export class PaymentGatewayController {
  private static providers: Record<GatewayName, PaymentGateway> = {
    RAZORPAY: new RazorpayGateway(),
    PAYU: new PayUGateway(),
    STRIPE: new StripeGateway(),
  };

  // The database is authoritative. A short TTL avoids serving an obsolete
  // payment routing policy indefinitely across serverless instances.
  private static cachedConfig: { value: GatewayConfigState; expiresAt: number } | null = null;
  private static readonly CONFIG_CACHE_TTL_MS = 30_000;

  /**
   * Fetch current admin gateway configuration (or initialize default)
   */
  static async getConfig(): Promise<GatewayConfigState> {
    if (this.cachedConfig && this.cachedConfig.expiresAt > Date.now()) {
      return this.cachedConfig.value;
    }

    try {
      const configRecord = await prisma.paymentGatewayConfig.findUnique({
        where: { id: "global-gateway-config" },
      });

      if (configRecord) {
        const configured: GatewayConfigState = {
          mode: configRecord.mode as any,
          primaryGateway: configRecord.primaryGateway as any,
          autoFailover: configRecord.autoFailover,
          allowEmployerSelection: configRecord.allowEmployerSelection,
          gatewaysStatus: configRecord.gatewaysStatus as any,
          priorities: configRecord.priorities as any,
        };
        if (process.env.NODE_ENV === "production") {
          for (const gw of PRODUCTION_BLOCKED_GATEWAYS) {
            configured.gatewaysStatus[gw] = "DISABLED";
          }
        }
        this.cachedConfig = { value: configured, expiresAt: Date.now() + this.CONFIG_CACHE_TTL_MS };
        return configured;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        console.error("Failed to load gateway config from DB:", error);
        throw new Error("Payment gateway configuration is temporarily unavailable.");
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
        STRIPE: isProduction ? "DISABLED" : "HEALTHY",
      },
      priorities: isProduction ? ["RAZORPAY"] : ["RAZORPAY", "PAYU", "STRIPE"],
    };

    if (isProduction) {
      for (const gw of PRODUCTION_BLOCKED_GATEWAYS) {
        defaultConfig.gatewaysStatus[gw] = "DISABLED";
      }
    }
    
    if (!isProduction) {
      this.cachedConfig = { value: defaultConfig, expiresAt: Date.now() + this.CONFIG_CACHE_TTL_MS };
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
      gatewaysStatus: { ...current.gatewaysStatus, ...(newConfig.gatewaysStatus || {}) },
    };
    const providerNames = Object.keys(this.providers) as GatewayName[];
    if (!providerNames.includes(updated.primaryGateway)) throw new Error("Unknown primary payment gateway.");
    if (updated.priorities.length !== providerNames.length || new Set(updated.priorities).size !== providerNames.length || updated.priorities.some((gw) => !providerNames.includes(gw))) throw new Error("Gateway priority list must contain every configured provider exactly once.");

    // Enforce production safety invariant
    if (process.env.NODE_ENV === "production") {
      for (const gw of PRODUCTION_BLOCKED_GATEWAYS) {
        updated.gatewaysStatus[gw] = "DISABLED";
      }
    }
    const active = providerNames.filter((gw) => updated.gatewaysStatus[gw] !== "DISABLED");
    if (active.length === 0) throw new Error("At least one payment gateway must remain enabled.");
    if (updated.gatewaysStatus[updated.primaryGateway] === "DISABLED") updated.primaryGateway = active[0];
    if (updated.mode === "AUTO" && !updated.priorities.some((gw) => updated.gatewaysStatus[gw] !== "DISABLED")) throw new Error("AUTO mode requires an enabled gateway in the priority list.");
    
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

    // Persist first, then update only this instance's cache. Other instances
    // refresh from the database within the bounded TTL above.
    this.cachedConfig = { value: updated, expiresAt: Date.now() + this.CONFIG_CACHE_TTL_MS };

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
      if (config.gatewaysStatus[selected] === "DISABLED") {
        throw new Error(`Selected payment gateway ${selected} is disabled.`);
      }
      candidateSequence.push(selected);
    }

    if (candidateSequence.length === 0) {
      if (config.mode === "MANUAL") {
        if (config.gatewaysStatus[config.primaryGateway] !== "DISABLED") {
          candidateSequence.push(config.primaryGateway);
        }
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
        lastError = err instanceof Error ? err : new Error("Payment gateway order creation failed.");
        if (err instanceof AmbiguousPaymentOrderError) {
          // The provider may have accepted the order before the connection failed.
          // Never create a second provider order until the first outcome is reconciled.
          throw err;
        }

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
    // Runtime input reaches this boundary from HTTP headers/query parameters;
    // do not let an unknown name inherit Razorpay's verifier. Production-
    // blocked adapters are incomplete and therefore may not authorize any
    // financial side effect, even if stale database configuration references
    // one of them.
    if (!Object.prototype.hasOwnProperty.call(this.providers, params.provider) ||
        (process.env.NODE_ENV === "production" && PRODUCTION_BLOCKED_GATEWAYS.has(params.provider))) {
      return {
        isValid: false,
        gatewayTxId: "",
        status: "REJECTED",
        rawPayload: null,
        error: "Unsupported payment webhook provider.",
      };
    }
    const provider = this.providers[params.provider];
    return provider.verifyWebhook(params);
  }
}
