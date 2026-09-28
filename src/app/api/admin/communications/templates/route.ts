import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import {
  COMMUNICATION_AUDIENCES,
  COMMUNICATION_CHANNELS,
  COMMUNICATION_EVENTS,
  communicationEventDefinition,
  validateTemplateVariables,
} from "@/lib/communications/catalog";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const createSchema = z.object({
  eventKey: z.enum(COMMUNICATION_EVENTS),
  channel: z.enum(COMMUNICATION_CHANNELS),
  audience: z.enum(COMMUNICATION_AUDIENCES),
  name: z.string().trim().min(3).max(120),
  locale: z.string().regex(/^[a-z]{2,3}(?:_[A-Z]{2})?$/).default("en"),
  provider: z.enum(["ZEPTOMAIL", "META"]).optional(),
  providerTemplateId: z.string().trim().max(512).optional(),
  providerAlias: z.string().trim().max(512).optional(),
  subject: z.string().trim().max(200).optional(),
  body: z.string().min(1).max(20000),
  providerParameterOrder: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  enabled: z.literal(false).default(false),
}).strict();

export async function GET(request: Request) {
  try {
    const user = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_communication_templates_get:${user.id}`, 60, 60_000);

    const [templates, total] = await prisma.$transaction([
      prisma.communicationTemplate.findMany({
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 250,
      }),
      prisma.communicationTemplate.count(),
    ]);

    return NextResponse.json({
      success: true,
      templates,
      total,
      truncated: total > templates.length,
      events: COMMUNICATION_EVENTS.map((eventKey) => ({
        eventKey,
        ...communicationEventDefinition(eventKey),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_communication_templates_create:${user.id}`, 20, 60_000);
    const body = await readValidatedJson(request, createSchema, 32 * 1024);

    const definition = communicationEventDefinition(body.eventKey);
    if (!definition?.channels.includes(body.channel) || !definition.audiences.includes(body.audience)) {
      throw new ApiError("Event does not permit this audience/channel.", 422);
    }

    const variableCheck = validateTemplateVariables(body.eventKey, body.subject, body.body);
    if (variableCheck.unknown.length) {
      throw new ApiError(`Unapproved variables: ${variableCheck.unknown.join(", ")}`, 422);
    }
    if (variableCheck.missing.length) {
      throw new ApiError(`Missing required variables: ${variableCheck.missing.join(", ")}`, 422);
    }

    if (body.channel === "WHATSAPP") {
      if (body.provider !== "META") throw new ApiError("WhatsApp templates must use META.", 422);
      const mapping = body.providerParameterOrder || [];
      const unknownMappings = mapping.filter((key) => !definition.variables.includes(key));
      const duplicateMappings = mapping.filter((key, index) => mapping.indexOf(key) !== index);
      if (unknownMappings.length) {
        throw new ApiError(`Unapproved provider parameter mappings: ${unknownMappings.join(", ")}`, 422);
      }
      if (duplicateMappings.length) {
        throw new ApiError(`Duplicate provider parameter mappings: ${[...new Set(duplicateMappings)].join(", ")}`, 422);
      }
      if (!mapping.length) {
        throw new ApiError("WhatsApp templates require explicit provider parameter order.", 422);
      }
    }

    if (body.channel === "EMAIL" && body.provider !== "ZEPTOMAIL") {
      throw new ApiError("Stored email templates must use ZEPTOMAIL.", 422);
    }

    const template = await prisma.$transaction(async (tx) => {
      const lockKey = `communication-template:${body.eventKey}:${body.channel}:${body.audience}:${body.locale}`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const latest = await tx.communicationTemplate.findFirst({
        where: {
          eventKey: body.eventKey,
          channel: body.channel,
          audience: body.audience,
          locale: body.locale,
        },
        orderBy: { version: "desc" },
        select: { version: true },
      });

      const created = await tx.communicationTemplate.create({
        data: {
          ...body,
          enabled: false,
          version: (latest?.version || 0) + 1,
          status: "DRAFT",
          variableSchema: { allowed: definition.variables },
          createdById: user.id,
          updatedById: user.id,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "COMMUNICATION_TEMPLATE_CREATED",
          resource: `CommunicationTemplate:${created.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: `event=${created.eventKey}; channel=${created.channel}; audience=${created.audience}; version=${created.version}; state=DRAFT`,
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, user.id);

      return created;
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
