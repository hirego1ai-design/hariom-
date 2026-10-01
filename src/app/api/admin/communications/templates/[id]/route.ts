import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import {
  communicationEventDefinition,
  validateTemplateVariables,
  type CommunicationEventKey,
} from "@/lib/communications/catalog";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const schema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  providerTemplateId: z.string().trim().max(512).nullable().optional(),
  providerAlias: z.string().trim().max(512).nullable().optional(),
  subject: z.string().trim().max(200).nullable().optional(),
  body: z.string().min(1).max(20000).optional(),
  providerParameterOrder: z.array(z.string().trim().min(1).max(100)).max(50).nullable().optional(),
  enabled: z.boolean().optional(),
  reason: z.string().trim().min(3).max(500),
  expectedUpdatedAt: z.string().datetime(),
}).strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_communication_template_update:${user.id}`, 20, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(request, schema, 32 * 1024);

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.communicationTemplate.findUnique({ where: { id } });
      if (!current) throw new ApiError("Template not found.", 404);
      if (current.updatedAt.toISOString() !== body.expectedUpdatedAt) {
        throw new ApiError("Communication template changed; reload before saving.", 409);
      }

      const nextSubject = body.subject === undefined ? current.subject : body.subject;
      const nextBody = body.body ?? current.body;
      const check = validateTemplateVariables(
        current.eventKey as CommunicationEventKey,
        nextSubject || undefined,
        nextBody,
      );
      if (check.unknown.length) {
        throw new ApiError(`Unapproved variables: ${check.unknown.join(", ")}`, 422);
      }
      if (check.missing.length) {
        throw new ApiError(`Missing required variables: ${check.missing.join(", ")}`, 422);
      }

      const nextProviderAlias = body.providerAlias === undefined ? current.providerAlias : body.providerAlias;
      const nextProviderTemplateId = body.providerTemplateId === undefined ? current.providerTemplateId : body.providerTemplateId;

      if (body.enabled === true) {
        if (current.channel === "WHATSAPP") {
          if (current.provider !== "META") {
            throw new ApiError("WhatsApp templates must use META.", 422);
          }
          if (!(nextProviderAlias || nextProviderTemplateId)) {
            throw new ApiError("Provider mapping is required before activation.", 422);
          }
        }
        if (current.channel === "EMAIL") {
          if (current.provider !== "ZEPTOMAIL" && current.provider !== "SENDGRID") {
            throw new ApiError("Email templates must use ZEPTOMAIL or SENDGRID.", 422);
          }
          if (!nextSubject?.trim()) {
            throw new ApiError("Email templates require a subject before activation.", 422);
          }
          if (current.provider === "ZEPTOMAIL" && !(nextProviderAlias || nextProviderTemplateId)) {
            throw new ApiError("ZeptoMail template mapping is required before activation.", 422);
          }
        }
      }

      if (current.channel === "WHATSAPP") {
        const definition = communicationEventDefinition(current.eventKey);
        const mapping = body.providerParameterOrder === undefined
          ? current.providerParameterOrder
          : body.providerParameterOrder;
        if (!Array.isArray(mapping) || !mapping.length) {
          throw new ApiError("WhatsApp templates require explicit provider parameter order.", 422);
        }
        const unknown = mapping.filter(
          (key): key is string =>
            typeof key !== "string" || !definition?.variables.includes(key),
        );
        if (unknown.length) {
          throw new ApiError("Provider parameter mapping contains unapproved variables.", 422);
        }
        const duplicate = mapping.filter((key, index) => mapping.indexOf(key) !== index);
        if (duplicate.length) {
          throw new ApiError("Provider parameter mapping contains duplicate variables.", 422);
        }
      }

      if (body.enabled === true) {
        await tx.communicationTemplate.updateMany({
          where: {
            eventKey: current.eventKey,
            channel: current.channel,
            audience: current.audience,
            locale: current.locale,
            enabled: true,
            id: { not: id },
          },
          data: { enabled: false, status: "SUPERSEDED" },
        });
      }

      const changed = await tx.communicationTemplate.updateMany({
        where: { id, updatedAt: current.updatedAt },
        data: {
          name: body.name,
          providerTemplateId: body.providerTemplateId,
          providerAlias: body.providerAlias,
          subject: body.subject,
          body: body.body,
          providerParameterOrder:
            body.providerParameterOrder === undefined
              ? undefined
              : body.providerParameterOrder === null
                ? Prisma.JsonNull
                : body.providerParameterOrder as Prisma.InputJsonValue,
          enabled: body.enabled,
          status:
            body.enabled === true
              ? "ACTIVE"
              : body.enabled === false
                ? "DRAFT"
                : current.status,
          updatedById: user.id,
        },
      });
      if (changed.count !== 1) {
        throw new ApiError("Communication template changed; reload before saving.", 409);
      }

      const next = await tx.communicationTemplate.findUniqueOrThrow({ where: { id } });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: user.id,
          action:
            body.enabled === true
              ? "COMMUNICATION_TEMPLATE_ACTIVATED"
              : body.enabled === false
                ? "COMMUNICATION_TEMPLATE_DEACTIVATED"
                : "COMMUNICATION_TEMPLATE_UPDATED",
          resource: `CommunicationTemplate:${id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            event: next.eventKey,
            channel: next.channel,
            audience: next.audience,
            version: next.version,
            enabled: next.enabled,
            reason: body.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, user.id);

      return next;
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
