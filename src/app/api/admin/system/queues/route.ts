import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const [events, audit, whatsapp, video] = await Promise.all([
      prisma.outboxEntry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.securityAuditOutboxEvent.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.whatsAppInboundEvent.groupBy({ by: ["processingStatus"], _count: { _all: true } }),
      prisma.videoAnalysisJob.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const summarize = (rows: { status: string; _count: { _all: number } }[]) =>
      Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
    return NextResponse.json({
      success: true,
      observedAt: new Date().toISOString(),
      queues: [
        { name: "Domain event outbox", counts: summarize(events) },
        { name: "Security audit delivery", counts: summarize(audit) },
        { name: "WhatsApp inbound", counts: summarize(whatsapp.map((row) => ({ status: row.processingStatus, _count: row._count }))) },
        { name: "Video analysis", counts: summarize(video) },
      ],
      workerLiveness: "NOT_MEASURED",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
