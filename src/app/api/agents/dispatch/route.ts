import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, handleApiError, getCurrentSession } from "@/lib";
import { ExecutionLoop } from "@/lib/agents/ExecutionLoop";
import { createTenantContext } from "@/lib/security/TenantContext";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, "agent_dispatch");

    const session = getCurrentSession(req.headers);
    const body = await req.json();

    const agentId = body.agentId || body.agent || "resume-evaluator";
    const companyId = body.companyId || "comp-1";
    const userId = session?.id || "user-anon";
    const userRole = (session?.role as Role) || Role.EMPLOYER;

    const tenantContext = createTenantContext(companyId, userId, userRole);
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
      companyId,
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
