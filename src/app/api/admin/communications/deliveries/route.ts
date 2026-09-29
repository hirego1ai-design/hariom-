import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { COMMUNICATION_CHANNELS } from "@/lib/communications/catalog";

const querySchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "ACCEPTED", "DELIVERED", "READ", "FAILED"]).optional(),
  channel: z.enum(COMMUNICATION_CHANNELS).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  try {
    const user = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_communication_deliveries:${user.id}`, 60, 60_000);
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    const rawChannel = url.searchParams.get("channel");
    const allowedStatuses = new Set(["PENDING", "PROCESSING", "ACCEPTED", "DELIVERED", "READ", "FAILED"]);
    if (rawStatus && !allowedStatuses.has(rawStatus)) {
      throw new ApiError("Invalid communication delivery status filter.", 400);
    }
    if (rawChannel && !COMMUNICATION_CHANNELS.includes(rawChannel as (typeof COMMUNICATION_CHANNELS)[number])) {
      throw new ApiError("Invalid communication channel filter.", 400);
    }
    const query = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
    };

    const [total, deliveries] = await prisma.$transaction([
      prisma.communicationDelivery.count({ where }),
      prisma.communicationDelivery.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          eventKey: true,
          channel: true,
          audience: true,
          provider: true,
          providerMessageId: true,
          correlationId: true,
          status: true,
          attemptCount: true,
          lastErrorCode: true,
          lastError: true,
          acceptedAt: true,
          deliveredAt: true,
          readAt: true,
          failedAt: true,
          createdAt: true,
          template: {
            select: {
              name: true,
              version: true,
              providerAlias: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page: query.page,
      limit: query.limit,
      deliveries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
