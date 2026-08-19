import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/auditLogger";
import {
  EMAIL_PROVIDERS,
  getEmailDeliverySettings,
  saveEmailDeliverySettings,
} from "@/lib/email-delivery-config";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";

const providerSchema = z.enum(EMAIL_PROVIDERS);
const updateSchema = z.object({
  primaryProvider: providerSchema,
  fallbackProvider: providerSchema,
  autoFailover: z.boolean(),
  sendgridEnabled: z.boolean(),
  zeptoMailEnabled: z.boolean(),
  sendgridFromEmail: z.string().email().optional().or(z.literal("")),
  zeptoMailFromEmail: z.string().email().optional().or(z.literal("")),
  sendgridApiKey: z.string().trim().min(12).max(512).optional().or(z.literal("")),
  zeptoMailApiKey: z.string().trim().min(12).max(512).optional().or(z.literal("")),
}).superRefine((value, context) => {
  if (value.primaryProvider === value.fallbackProvider && value.autoFailover) {
    context.addIssue({ code: "custom", message: "Primary and fallback providers must be different when failover is enabled." });
  }
  if (value.primaryProvider === "SENDGRID" && !value.sendgridEnabled) {
    context.addIssue({ code: "custom", message: "Enable SendGrid or select ZeptoMail as the primary provider." });
  }
  if (value.primaryProvider === "ZEPTOMAIL" && !value.zeptoMailEnabled) {
    context.addIssue({ code: "custom", message: "Enable ZeptoMail or select SendGrid as the primary provider." });
  }
});

function requireAdmin(request: Request) {
  const session = getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") throw new ApiError("Unauthorized: Admin role required.", 401);
  return session;
}

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    return NextResponse.json({ success: true, config: await getEmailDeliverySettings() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = requireAdmin(request);
    enforceRateLimit(request, `admin_email_delivery_config:${admin.id}`, 10, 60_000);
    const body = await readValidatedJson(request, updateSchema);
    const config = await saveEmailDeliverySettings(body);
    logAuditEvent({
      userId: admin.id,
      action: "EMAIL_DELIVERY_CONFIG_UPDATED",
      resource: "Email delivery configuration",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      details: `Updated primary=${config.primaryProvider}, fallback=${config.autoFailover ? config.fallbackProvider : "disabled"}; API keys were ${body.sendgridApiKey || body.zeptoMailApiKey ? "updated" : "unchanged"}.`,
    });
    return NextResponse.json({ success: true, message: "Email delivery settings updated.", config });
  } catch (error) {
    return handleApiError(error);
  }
}
