import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import {
  DEFAULT_LIVE_INTERVIEW_PROCTORING_POLICY,
  liveInterviewProctoringPolicySchema,
} from "@/lib/proctoringPolicy";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const CONFIG_ID = "global-admin-config";

const updateSchema = z.object({
  enabled: z.boolean(),
  trackTabSwitch: z.boolean(),
  trackClipboard: z.boolean(),
  trackContextMenu: z.boolean(),
  expectedPolicyVersion: z.string().trim().min(1).max(64),
  reason: z.string().trim().min(3).max(500),
}).strict();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function policyFromSecurityPolicy(
  securityPolicy: Prisma.JsonValue | null | undefined,
  strict: boolean,
) {
  const root = isRecord(securityPolicy) ? securityPolicy : {};
  const raw = root.liveInterviewProctoring;
  if (raw === undefined) {
    return {
      policy: DEFAULT_LIVE_INTERVIEW_PROCTORING_POLICY,
      configured: false,
      root,
    };
  }

  const parsed = liveInterviewProctoringPolicySchema.safeParse(raw);
  if (!parsed.success) {
    if (strict) {
      throw new ApiError(
        "Stored live-interview proctoring policy is invalid and requires administrator repair.",
        500,
      );
    }
    return {
      policy: DEFAULT_LIVE_INTERVIEW_PROCTORING_POLICY,
      configured: false,
      root,
    };
  }
  return { policy: parsed.data, configured: true, root };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_proctoring_policy_read:${admin.id}`,
      60,
      60_000,
    );

    const stored = await prisma.adminConfiguration.findUnique({
      where: { id: CONFIG_ID },
      select: { securityPolicy: true },
    });
    const snapshot = policyFromSecurityPolicy(stored?.securityPolicy, true);

    return NextResponse.json({
      success: true,
      configured: snapshot.configured,
      policy: snapshot.policy,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(
      request,
      `admin_proctoring_policy_write:${admin.id}`,
      10,
      60_000,
    );
    const body = await readValidatedJson(request, updateSchema, 8 * 1024);

    const policy = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('live-interview-proctoring-policy'))`;

      const stored = await tx.adminConfiguration.findUnique({
        where: { id: CONFIG_ID },
        select: { securityPolicy: true },
      });
      const snapshot = policyFromSecurityPolicy(stored?.securityPolicy, true);
      if (snapshot.policy.policyVersion !== body.expectedPolicyVersion) {
        throw new ApiError(
          "Proctoring policy changed; reload before saving.",
          409,
        );
      }

      const next = liveInterviewProctoringPolicySchema.parse({
        enabled: body.enabled,
        trackTabSwitch: body.trackTabSwitch,
        trackClipboard: body.trackClipboard,
        trackContextMenu: body.trackContextMenu,
        policyVersion: `live-interview-browser-${new Date().toISOString()}`,
      });
      const securityPolicy = {
        ...snapshot.root,
        liveInterviewProctoring: next,
      };

      await tx.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: {
          id: CONFIG_ID,
          securityPolicy: securityPolicy as Prisma.InputJsonValue,
        },
        update: {
          securityPolicy: securityPolicy as Prisma.InputJsonValue,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "LIVE_INTERVIEW_PROCTORING_POLICY_UPDATED",
          resource: "AdminConfiguration:liveInterviewProctoring",
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            previousPolicyVersion: snapshot.policy.policyVersion,
            nextPolicyVersion: next.policyVersion,
            reason: body.reason,
            enabled: next.enabled,
            trackTabSwitch: next.trackTabSwitch,
            trackClipboard: next.trackClipboard,
            trackContextMenu: next.trackContextMenu,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return next;
    });

    return NextResponse.json({
      success: true,
      message: "Live interview proctoring policy saved and audited.",
      policy,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
