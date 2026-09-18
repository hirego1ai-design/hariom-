import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
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
    const result = await purgeExpiredInfectedUploads(input.limit, input.retentionDays);
    await logAuditEvent({ userId: admin.id, action: "UPLOAD_INFECTED_RETENTION_PURGE", resource: "StoredFile quarantine", details: `purged:${result.purged}; retentionDays:${result.retentionDays}` });
    return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
