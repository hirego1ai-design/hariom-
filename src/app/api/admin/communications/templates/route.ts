import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { logCriticalAuditEvent } from "@/lib/auditLogger";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { COMMUNICATION_AUDIENCES, COMMUNICATION_CHANNELS, COMMUNICATION_EVENTS, communicationEventDefinition, validateTemplateVariables } from "@/lib/communications/catalog";

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
  body: z.string().min(1).max(20000),\n  providerParameterOrder: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  enabled: z.boolean().default(false),
}).strict();

async function admin(request: Request) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") throw new ApiError("Unauthorized: Admin role required.", 401);
  return session;
}

export async function GET(request: Request) {
  try {
    const user = await admin(request);
    await enforceRateLimit(request, `admin_communication_templates_get:${user.id}`, 60, 60_000);
    const templates = await prisma.communicationTemplate.findMany({ orderBy: [{ updatedAt: "desc" }], take: 250 });
    return NextResponse.json({ success: true, templates, events: COMMUNICATION_EVENTS.map((eventKey) => ({ eventKey, ...communicationEventDefinition(eventKey) })) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await admin(request);
    await enforceRateLimit(request, `admin_communication_templates_create:${user.id}`, 20, 60_000);
    const body = await readValidatedJson(request, createSchema);
    const definition = communicationEventDefinition(body.eventKey);
    if (!definition?.channels.includes(body.channel) || !definition.audiences.includes(body.audience)) throw new ApiError("Event does not permit this audience/channel.", 422);
    const variableCheck = validateTemplateVariables(body.eventKey, body.subject, body.body);
    if (variableCheck.unknown.length) throw new ApiError(`Unapproved variables: ${variableCheck.unknown.join(", ")}`, 422);
    if (variableCheck.missing.length) throw new ApiError(`Missing required variables: ${variableCheck.missing.join(", ")}`, 422);
    if (body.channel === "WHATSAPP" && body.provider !== "META") throw new ApiError("WhatsApp templates must use META.", 422);\n    if (body.channel === "WHATSAPP") {\n      const mapping = body.providerParameterOrder || [];\n      const unknownMappings = mapping.filter((key) => !definition.variables.includes(key));\n      if (unknownMappings.length) throw new ApiError(`Unapproved provider parameter mappings: ${unknownMappings.join(", ")}`, 422);\n      if (!mapping.length) throw new ApiError("WhatsApp templates require explicit provider parameter order.", 422);\n    }
    if (body.channel === "EMAIL" && body.provider !== "ZEPTOMAIL") throw new ApiError("Stored email templates must use ZEPTOMAIL.", 422);
    if (body.enabled && !body.providerAlias && !body.providerTemplateId) throw new ApiError("An enabled template requires a provider template mapping.", 422);

    const latest = await prisma.communicationTemplate.findFirst({ where: { eventKey: body.eventKey, channel: body.channel, audience: body.audience, locale: body.locale }, orderBy: { version: "desc" }, select: { version: true } });
    const template = await prisma.communicationTemplate.create({ data: { ...body, version: (latest?.version || 0) + 1, status: body.enabled ? "ACTIVE" : "DRAFT", variableSchema: { allowed: definition.variables }, createdById: user.id, updatedById: user.id } });
    await logCriticalAuditEvent({ userId: user.id, action: "COMMUNICATION_TEMPLATE_CREATED", resource: `CommunicationTemplate:${template.id}`, details: `event=${template.eventKey}; channel=${template.channel}; audience=${template.audience}; version=${template.version}` });
    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
