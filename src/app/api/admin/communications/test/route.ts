import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { dispatchCommunication } from "@/lib/communications/dispatcher";
import { COMMUNICATION_AUDIENCES, COMMUNICATION_CHANNELS, COMMUNICATION_EVENTS, communicationEventDefinition } from "@/lib/communications/catalog";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logCriticalAuditEvent } from "@/lib/auditLogger";

const schema = z.object({
  eventKey: z.enum(COMMUNICATION_EVENTS),
  channel: z.enum(COMMUNICATION_CHANNELS),
  audience: z.enum(COMMUNICATION_AUDIENCES),
  recipient: z.string().trim().min(3).max(320),
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  locale: z.string().regex(/^[a-z]{2,3}(?:_[A-Z]{2})?$/).default("en"),
}).strict();

export async function POST(request: Request) {
  try {
    const user = await getCurrentSession(request.headers);
    if (!user || user.role !== "ADMIN") throw new ApiError("Unauthorized: Admin role required.", 401);
    await enforceRateLimit(request, `admin_communication_test:${user.id}`, 5, 10 * 60_000);
    const body = await readValidatedJson(request, schema);
    const definition = communicationEventDefinition(body.eventKey);
    if (!definition || !definition.channels.includes(body.channel) || !definition.audiences.includes(body.audience)) {
      throw new ApiError("Event does not permit this audience/channel.", 422);
    }
    if (process.env.NODE_ENV === "production") {
      const allowlist = (process.env.COMMUNICATION_TEST_RECIPIENT_ALLOWLIST || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
      if (!allowlist.length || !allowlist.includes(body.recipient.trim().toLowerCase())) {
        throw new ApiError("Production test sends are restricted to the configured recipient allowlist.", 403);
      }
    }
    const idempotencyKey = `admin-test:${user.id}:${crypto.randomUUID()}`;
    const delivery = await dispatchCommunication({ ...body, idempotencyKey, correlationId: idempotencyKey, recipientRef: `admin-test:${user.id}`, testMode: true });
    await logCriticalAuditEvent({ userId: user.id, action: "COMMUNICATION_TEMPLATE_TEST_SENT", resource: `CommunicationDelivery:${delivery.id}`, details: `event=${body.eventKey}; channel=${body.channel}; status=${delivery.status}` });
    return NextResponse.json({ success: delivery.status === "ACCEPTED", delivery: { id: delivery.id, status: delivery.status, provider: delivery.provider, providerMessageId: delivery.providerMessageId } }, { status: delivery.status === "ACCEPTED" ? 200 : 502 });
  } catch (error) { return handleApiError(error); }
}
