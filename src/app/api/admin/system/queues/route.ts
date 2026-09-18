import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { RecoveryWorkerState } from "@/lib/workflows/RecoveryWorkerState";

export const dynamic = "force-dynamic";

export async function readRecoveryWorkerLiveness() {
  try {
    const status = await RecoveryWorkerState.read();
    if (!status.heartbeat) {
      return { status: "NOT_STARTED" as const, stale: true, state: null, startedAt: null, finishedAt: null };
    }
    const workerStatus = status.stale
      ? "STALE"
      : status.heartbeat.state === "running" || status.heartbeat.state === "completed"
        ? "HEALTHY"
        : "ATTENTION";
    return {
      status: workerStatus,
      stale: status.stale,
      state: status.heartbeat.state,
      startedAt: status.heartbeat.startedAt,
      finishedAt: status.heartbeat.finishedAt ?? null,
    };
  } catch {
    // Preserve queue visibility during Redis outages and never expose provider
    // error text, which can contain deployment details.
    return { status: "UNAVAILABLE" as const, stale: true, state: null, startedAt: null, finishedAt: null };
  }
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_system_queues:${admin.id}`, 30, 60_000);
    const [events, audit, whatsapp, video, recoveryWorker] = await Promise.all([
      prisma.outboxEntry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.securityAuditOutboxEvent.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.whatsAppInboundEvent.groupBy({ by: ["processingStatus"], _count: { _all: true } }),
      prisma.videoAnalysisJob.groupBy({ by: ["status"], _count: { _all: true } }),
      readRecoveryWorkerLiveness(),
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
      workerLiveness: { workflowRecovery: recoveryWorker },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
