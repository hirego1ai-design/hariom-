import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auditLogger";

const schema = z.object({
  enabled: z.boolean(),
  tabSwitchEnabled: z.boolean(),
  clipboardEnabled: z.boolean(),
  contextMenuEnabled: z.boolean(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    await enforceRateLimit(request, "admin_proctoring_config_read", 60, 60_000);
    const config = await prisma.proctoringConfig.upsert({
      where: { id: "global-proctoring-config" },
      update: {},
      create: { id: "global-proctoring-config" },
    });
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, "admin_proctoring_config_write", 10, 60_000);
    const payload = await readValidatedJson(request, schema, 8 * 1024);
    const config = await prisma.proctoringConfig.upsert({
      where: { id: "global-proctoring-config" },
      update: { ...payload, updatedById: session.id },
      create: { id: "global-proctoring-config", ...payload, updatedById: session.id },
    });
    await logAuditEvent({
      userId: session.id,
      action: "PROCTORING_CONFIG_UPDATED",
      resource: "AdminConfiguration:proctoring",
      details: JSON.stringify(payload),
    });
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}
