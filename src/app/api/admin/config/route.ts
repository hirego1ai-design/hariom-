import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/auditLogger";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

let platformConfig = {
  // Feature Flags
  managedHiringEnabled: true,
  aiCopilotEnabled: true,
  proctoringEnabled: true,
  autoInvoicingEnabled: true,
  replacementWarrantyEnabled: true,
  slabPricingEnabled: true,

  // Commercial Defaults
  defaultPlacementFeePct: 8.33,
  defaultReplacementDays: 60,
  defaultCreditDays: 15,
  taxRatePct: 18.0,
  currency: "INR",

  // SLA & Limits
  maxActiveRequirementsPerCompany: 10,
  slaResponseHours: 24,
  lastUpdated: new Date().toISOString(),
};

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    return NextResponse.json({ success: true, config: platformConfig });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req);
    const body = await req.json();

    platformConfig = {
      ...platformConfig,
      ...body,
      lastUpdated: new Date().toISOString(),
    };

    logAuditEvent({
      action: "ADMIN_CONFIG_UPDATED",
      resource: "Platform Configuration",
      userId: session.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: "Platform configuration updated by Super Admin",
    });

    return NextResponse.json({
      success: true,
      message: "Platform configuration updated successfully.",
      config: platformConfig,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
