import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent, logCriticalAuditEvent } from "@/lib/auditLogger";
import { purgeExpiredInfectedUploads } from "@/lib/uploadSecurity";

const schema = z.object({
  limit: z.number().int().min(1).max(100).default(25),
  retentionDays: z.number().int().min(7).max(365).default(30),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, "admin_upload_purge_infected", 2, 60_000);
    const input = await readValidatedJson(request, schema);

    await logCriticalAuditEvent({
      userId: admin.id,
      action: "UPLOAD_INFECTED_RETENTION_PURGE_REQUESTED",
      resource: "StoredFile quarantine",
      ipAddress: getClientIp(request) || "unknown",
      details: `limit:${input.limit}; retentionDays:${input.retentionDays}`,
    });

    const result = await purgeExpiredInfectedUploads(input.limit, input.retentionDays);

    // Outcome evidence is best-effort because the destructive operation has
    // already occurred. Never convert a completed purge into a retryable 500
    // solely because the completion-audit write is temporarily unavailable.
    await logAuditEvent({
      userId: admin.id,
      action: "UPLOAD_INFECTED_RETENTION_PURGE",
      resource: "StoredFile quarantine",
      ipAddress: getClientIp(request) || "unknown",
      details: `purged:${result.purged}; retentionDays:${result.retentionDays}`,
    });

    return NextResponse.json(
      { success: true, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
