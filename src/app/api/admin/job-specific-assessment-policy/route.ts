import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { jobSpecificAssessmentPolicySchema } from "@/lib/jobSpecificAssessmentPolicy";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const CONFIG_ID = "global-admin-config";

const updateSchema = z.object({
  policy: jobSpecificAssessmentPolicySchema,
  reason: z.string().trim().max(500).optional(),
}).strict();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_job_specific_assessment_policy_read:${session.id}`, 60, 60_000);

    const row = await prisma.adminConfiguration.findUnique({
      where: { id: CONFIG_ID },
      select: { platformConfig: true },
    });

    let policy = null;
    const rawPolicy = isRecord(row?.platformConfig)
      ? row.platformConfig.jobSpecificAssessment
      : undefined;

    if (rawPolicy !== undefined) {
      const parsed = jobSpecificAssessmentPolicySchema.safeParse(rawPolicy);
      if (!parsed.success) {
        throw new ApiError("Stored job-specific assessment policy is invalid and requires administrator repair.", 500);
      }
      policy = parsed.data;
    }

    return NextResponse.json({
      success: true,
      configured: Boolean(policy),
      policy,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_job_specific_assessment_policy_write:${session.id}`, 10, 60_000);
    const { policy, reason } = await readValidatedJson(request, updateSchema, 16 * 1024);

    await prisma.$transaction(async (tx) => {
      await tx.adminConfiguration.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, platformConfig: {} },
        update: {},
      });

      await tx.$queryRaw`SELECT id FROM "AdminConfiguration" WHERE id = ${CONFIG_ID} FOR UPDATE`;
      const row = await tx.adminConfiguration.findUniqueOrThrow({
        where: { id: CONFIG_ID },
        select: { platformConfig: true },
      });

      const platformConfig = isRecord(row.platformConfig)
        ? { ...row.platformConfig }
        : {};
      const previousRaw = platformConfig.jobSpecificAssessment;
      const previousParsed = jobSpecificAssessmentPolicySchema.safeParse(previousRaw);
      const previous = previousParsed.success ? previousParsed.data : null;

      platformConfig.jobSpecificAssessment = policy;

      await tx.adminConfiguration.update({
        where: { id: CONFIG_ID },
        data: { platformConfig: platformConfig as Prisma.InputJsonValue },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "JOB_SPECIFIC_ASSESSMENT_POLICY_UPDATED",
          resource: "AdminConfiguration:jobSpecificAssessment",
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            previous,
            previousStoredValueValid: previousRaw === undefined || previousParsed.success,
            next: policy,
            reason: reason || null,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
    });

    return NextResponse.json({ success: true, policy });
  } catch (error) {
    return handleApiError(error);
  }
}
