import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PaymentGatewayController, type GatewayConfigState } from "@/lib/payments/PaymentGatewayController";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";

const gatewayStatusSchema = z.enum(["HEALTHY", "DEGRADED", "DISABLED"]);
const gatewayNameSchema = z.enum(["PAYU", "STRIPE"]);
const gatewayConfigSchema = z.object({
  mode: z.enum(["AUTO", "MANUAL"]).optional(),
  primaryGateway: gatewayNameSchema.optional(),
  autoFailover: z.boolean().optional(),
  allowEmployerSelection: z.boolean().optional(),
  gatewaysStatus: z.object({
    PAYU: gatewayStatusSchema.optional(),
    STRIPE: gatewayStatusSchema.optional(),
  }).strict().optional(),
  priorities: z.array(gatewayNameSchema).length(2).refine(v => new Set(v).size === v.length, "Gateway priorities must contain Stripe and PayU exactly once.").optional(),
  expectedUpdatedAt: z.string().datetime().nullable().optional(),
}).strict().refine(v=>Object.keys(v).some(key=>key!=="expectedUpdatedAt"),"At least one gateway configuration field is required.");

export async function GET(req: NextRequest) {
  try {
    const admin=await requireAdminSession(req);
    await enforceRateLimit(req,`admin_payment_gateway_config_get:${admin.id}`,30,60_000);
    const snapshot=await PaymentGatewayController.getAdminConfigSnapshot();
    return NextResponse.json({success:true,config:snapshot.config,updatedAt:snapshot.updatedAt},{headers:{"Cache-Control":"no-store"}});
  } catch(error){return handleApiError(error);}
}

export async function POST(req: NextRequest) {
  try {
    const admin=await requireAdminSession(req);
    await enforceRateLimit(req,`admin_payment_gateway_config_update:${admin.id}`,10,60_000);
    const body=await readValidatedJson(req,gatewayConfigSchema);
    const { expectedUpdatedAt, ...configUpdate }=body;
    const updatedConfig=await PaymentGatewayController.updateConfig(configUpdate as Partial<GatewayConfigState>, {
      actorId: admin.id,
      ipAddress: getClientIp(req),
    }, expectedUpdatedAt);
    const snapshot=await PaymentGatewayController.getAdminConfigSnapshot();
    return NextResponse.json({success:true,message:"Payment gateway configuration updated successfully.",config:updatedConfig,updatedAt:snapshot.updatedAt},{headers:{"Cache-Control":"no-store"}});
  } catch(error){return handleApiError(error);}
}
