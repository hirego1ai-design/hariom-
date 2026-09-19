import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";\nimport { COMMUNICATION_CHANNELS } from "@/lib/communications/catalog";

export async function GET(request: Request) {
  try {
    const user = await getCurrentSession(request.headers);
    if (!user || user.role !== "ADMIN") throw new ApiError("Unauthorized: Admin role required.", 401);
    await enforceRateLimit(request, `admin_communication_deliveries:${user.id}`, 60, 60_000);
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || "100"), 1), 250);
    const status = url.searchParams.get("status") || undefined;
    const channel = url.searchParams.get("channel") || undefined;
    const deliveries = await prisma.communicationDelivery.findMany({
      where: { ...(status ? { status } : {}), ...(channel ? { channel } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, eventKey: true, channel: true, audience: true, provider: true, providerMessageId: true, correlationId: true, status: true, attemptCount: true, lastErrorCode: true, lastError: true, acceptedAt: true, deliveredAt: true, readAt: true, failedAt: true, createdAt: true, template: { select: { name: true, version: true, providerAlias: true } } },
    });
    return NextResponse.json({ success: true, deliveries });
  } catch (error) { return handleApiError(error); }
}
