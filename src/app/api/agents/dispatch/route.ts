import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, handleApiError, getCurrentSession, jsonError } from "@/lib";
import { ExecutionLoop } from "@/lib/agents/ExecutionLoop";
import { createTenantContext } from "@/lib/security/TenantContext";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "agent_dispatch");

    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const role = session.role as Role;
    let resolvedCompanyId: string | null = null;

    if (role === Role.ADMIN) {
      resolvedCompanyId = null;
    } else if (role === Role.EMPLOYER || role === Role.RECRUITER) {
      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
      });
      if (!profile || !profile.companyId) {
        return jsonError("Forbidden: Employer profile not found or company not assigned.", 403);
      }
      resolvedCompanyId = profile.companyId;
    } else {
      return jsonError("Forbidden: Candidates are not authorized for agent dispatch.", 403);
    }

    const body = await req.json();
    const agentId = body.agentId || body.agent || "resume-evaluator";

    const tenantContext = createTenantContext(resolvedCompanyId, session.id, role);
    const correlationId = `corr-dispatch-${Date.now()}`;
    const executionId = `exec-dispatch-${Date.now()}`;

    const result = await ExecutionLoop.runTask({
      agentId,
      taskInput: body.input || body.metadata || { prompt: body.prompt },
      context: {
        tenantContext,
        correlationId,
        executionId,
        agentId,
      },
      companyId: resolvedCompanyId || "global",
      estimatedSpendMinor: BigInt(3000),
    });

    return NextResponse.json({
      success: true,
      result,
      correlationId,
      executionId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
