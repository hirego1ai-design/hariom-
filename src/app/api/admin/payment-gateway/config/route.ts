import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";

const gatewayConfigSchema = z.object({
  razorpayEnabled: z.boolean().optional(),
  cashfreeEnabled: z.boolean().optional(),
  stripeEnabled: z.boolean().optional(),
  primaryGateway: z.enum(["RAZORPAY","CASHFREE","STRIPE"]).optional(),
  autoFailover: z.boolean().optional(),
  testMode: z.boolean().optional(),
}).strict().refine(v=>Object.keys(v).length>0,"At least one gateway configuration field is required.");

export async function GET(req: NextRequest) {
  try {
    const admin=await requireAdminSession(req);
    await enforceRateLimit(req,`admin_payment_gateway_config_get:${admin.id}`,30,60_000);
    const config=await PaymentGatewayController.getConfig();
    return NextResponse.json({success:true,config},{headers:{"Cache-Control":"no-store"}});
  } catch(error){return handleApiError(error);}
}

export async function POST(req: NextRequest) {
  try {
    const admin=await requireAdminSession(req);
    await enforceRateLimit(req,`admin_payment_gateway_config_update:${admin.id}`,10,60_000);
    const body=await readValidatedJson(req,gatewayConfigSchema);
    const updatedConfig=await PaymentGatewayController.updateConfig(body);
    await logAuditEvent({userId:admin.id,action:"PAYMENT_GATEWAY_CONFIG_UPDATED",resource:"Payment gateway configuration",ipAddress:req.headers.get("x-forwarded-for")||undefined,details:"Payment gateway routing configuration updated; credentials were not accepted by this endpoint."});
    return NextResponse.json({success:true,message:"Payment gateway configuration updated successfully.",config:updatedConfig},{headers:{"Cache-Control":"no-store"}});
  } catch(error){return handleApiError(error);}
}
