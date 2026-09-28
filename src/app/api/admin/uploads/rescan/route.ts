import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent, logCriticalAuditEvent } from "@/lib/auditLogger";
import { rescanQuarantinedUploads } from "@/lib/uploadSecurity";

const schema = z.object({
  limit: z.number().int().min(1).max(100).default(25),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, "admin_upload_rescan", 2, 60_000);
    const { limit } = await readValidatedJson(request, schema);

    await logCriticalAuditEvent({
      userId: admin.id,
      action: "UPLOAD_SECURITY_RESCAN_REQUESTED",
      resource: "StoredFile quarantine",
      ipAddress: getClientIp(request) || "unknown",
      details: `limit:${limit}`,
    });

    const result = await rescanQuarantinedUploads(limit);
    const counts = result.results.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});

    // The scanner has already touched persisted quarantine state. Completion
    // audit remains best-effort so an audit sink outage cannot make an
    // already-completed rescan look retryable to the administrator.
    await logAuditEvent({
      userId: admin.id,
      action: "UPLOAD_SECURITY_RESCAN",
      resource: "StoredFile quarantine",
      ipAddress: getClientIp(request) || "unknown",
      details: `processed:${result.processed}; clean:${counts.CLEAN ?? 0}; infected:${counts.INFECTED ?? 0}; error:${counts.ERROR ?? 0}`,
    });

    return NextResponse.json(
      { success: true, processed: result.processed, counts },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
