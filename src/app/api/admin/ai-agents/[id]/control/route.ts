import { NextRequest, NextResponse } from "next/server";
import { KillSwitchType } from "@prisma/client";
import { z } from "zod";
import { AgentRegistry } from "@/lib/agents/AgentRegistry";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const agentIdSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/);

const controlSchema = z.object({
  action: z.enum(["PAUSE", "RESUME"]),
  reason: z.string().trim().min(3).max(500),
  expectedUpdatedAt: z.string().datetime().nullable(),
}).strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    const { id: rawAgentId } = await params;
    const agentId = agentIdSchema.parse(rawAgentId);
    await enforceRateLimit(request, `admin_ai_agent_control_write:${admin.id}:${agentId}`, 10, 60_000);
    const input = await readValidatedJson(request, controlSchema, 8 * 1024);

    const registered = AgentRegistry.getInstance()
      .getRegisteredAgents()
      .some((agent) => agent.agentId === agentId);
    if (!registered) throw new ApiError("Registered AI agent not found.", 404);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.killSwitchConfig.findUnique({
        where: {
          targetType_targetId: {
            targetType: KillSwitchType.AGENT,
            targetId: agentId,
          },
        },
      });
      const currentVersion = existing?.updatedAt.toISOString() ?? null;
      if (currentVersion !== input.expectedUpdatedAt) {
        throw new ApiError("Agent control state changed; reload before saving.", 409);
      }

      const shouldPause = input.action === "PAUSE";
      let control;

      if (existing) {
        const changed = await tx.killSwitchConfig.updateMany({
          where: {
            id: existing.id,
            updatedAt: existing.updatedAt,
          },
          data: {
            isActive: shouldPause,
            reason: shouldPause ? input.reason : null,
            activatedBy: admin.id,
          },
        });
        if (changed.count !== 1) {
          throw new ApiError("Agent control state changed; reload before saving.", 409);
        }
        control = await tx.killSwitchConfig.findUniqueOrThrow({ where: { id: existing.id } });
      } else {
        if (!shouldPause) {
          throw new ApiError("Agent is not paused.", 409);
        }
        control = await tx.killSwitchConfig.create({
          data: {
            targetType: KillSwitchType.AGENT,
            targetId: agentId,
            isActive: true,
            reason: input.reason,
            activatedBy: admin.id,
          },
        });
      }

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: shouldPause ? "AI_AGENT_PAUSED" : "AI_AGENT_RESUMED",
          resource: `Agent:${agentId}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            reason: input.reason,
            controlUpdatedAt: control.updatedAt.toISOString(),
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return control;
    });

    return NextResponse.json({
      success: true,
      agentId,
      paused: result.isActive,
      reason: result.reason,
      updatedAt: result.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
