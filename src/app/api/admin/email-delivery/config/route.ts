import { NextResponse } from "next/server";
import { z } from "zod";
import {
  EMAIL_PROVIDERS,
  encryptEmailProviderSecret,
  getEmailDeliverySettingsStrict,
} from "@/lib/email-delivery-config";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

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
  expectedUpdatedAt: z.string().datetime().nullable(),
}).strict().superRefine((value, context) => {
  if (value.primaryProvider === value.fallbackProvider && value.autoFailover) {
    context.addIssue({
      code: "custom",
      message: "Primary and fallback providers must be different when failover is enabled.",
    });
  }

  const enabled = (provider: (typeof EMAIL_PROVIDERS)[number]) =>
    provider === "SENDGRID" ? value.sendgridEnabled : value.zeptoMailEnabled;

  if (!enabled(value.primaryProvider)) {
    context.addIssue({
      code: "custom",
      message: `Enable ${value.primaryProvider === "SENDGRID" ? "SendGrid" : "ZeptoMail"} or select an enabled primary provider.`,
    });
  }
  if (value.autoFailover && !enabled(value.fallbackProvider)) {
    context.addIssue({
      code: "custom",
      message: "Automatic failover requires the fallback provider to be enabled.",
    });
  }
});

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_email_delivery_config_get:${admin.id}`, 30, 60_000);
    return NextResponse.json({
      success: true,
      config: await getEmailDeliverySettingsStrict(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_email_delivery_config:${admin.id}`, 10, 60_000);
    const body = await readValidatedJson(request, updateSchema, 8 * 1024);

    const encryptedSendgridKey = body.sendgridApiKey
      ? encryptEmailProviderSecret(body.sendgridApiKey)
      : undefined;
    const encryptedZeptoMailKey = body.zeptoMailApiKey
      ? encryptEmailProviderSecret(body.zeptoMailApiKey)
      : undefined;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.emailDeliveryConfig.findUnique({
        where: { id: "global-email-delivery" },
      });
      const currentVersion = existing?.updatedAt.toISOString() ?? null;
      if (currentVersion !== body.expectedUpdatedAt) {
        throw new ApiError("Email delivery configuration changed; reload before saving.", 409);
      }

      const data = {
        primaryProvider: body.primaryProvider,
        fallbackProvider: body.fallbackProvider,
        autoFailover: body.autoFailover,
        sendgridEnabled: body.sendgridEnabled,
        zeptoMailEnabled: body.zeptoMailEnabled,
        sendgridFromEmail: body.sendgridFromEmail || null,
        zeptoMailFromEmail: body.zeptoMailFromEmail || null,
        ...(encryptedSendgridKey
          ? { sendgridApiKeyEncrypted: encryptedSendgridKey }
          : {}),
        ...(encryptedZeptoMailKey
          ? { zeptoMailApiKeyEncrypted: encryptedZeptoMailKey }
          : {}),
      };

      const updated = existing
        ? await tx.emailDeliveryConfig.update({
            where: { id: existing.id },
            data,
          })
        : await tx.emailDeliveryConfig.create({
            data: { id: "global-email-delivery", ...data },
          });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "EMAIL_DELIVERY_CONFIG_UPDATED",
          resource: "EmailDeliveryConfig:global-email-delivery",
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            primaryProvider: updated.primaryProvider,
            fallbackProvider: updated.autoFailover ? updated.fallbackProvider : null,
            autoFailover: updated.autoFailover,
            sendgridEnabled: updated.sendgridEnabled,
            zeptoMailEnabled: updated.zeptoMailEnabled,
            sendgridKeyChanged: Boolean(encryptedSendgridKey),
            zeptoMailKeyChanged: Boolean(encryptedZeptoMailKey),
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);
    });

    const config = await getEmailDeliverySettingsStrict();
    return NextResponse.json({
      success: true,
      message: "Email delivery settings updated.",
      config,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
