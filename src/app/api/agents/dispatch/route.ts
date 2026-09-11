import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, handleApiError, getCurrentSession, jsonError, ApiError, getClientIp, readValidatedJson } from "@/lib";
import { ExecutionLoop } from "@/lib/agents/ExecutionLoop";
import { createTenantContext } from "@/lib/security/TenantContext";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { DIRECT_DISPATCH_AGENT_IDS } from "@/lib/governance/AiEntitlements";
import { incrementWithTtl, RedisUnavailableError } from "@/lib/redis";
import crypto from "crypto";
import { z } from "zod";

const dispatchSchema = z.object({
  agentId: z.enum(DIRECT_DISPATCH_AGENT_IDS),
  input: z.record(z.unknown()),
}).strict().superRefine((body, ctx) => {
  const schema = body.agentId === "jd-generator"
    ? z.object({ title: z.string().trim().min(2).max(160) }).strict()
    : z.object({ candidateProfileId: z.string().uuid(), jobId: z.string().uuid() }).strict();
  const result = schema.safeParse(body.input);
  if (!result.success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error.issues[0]?.message || "Invalid agent input.", path: ["input"] });
  }
});

const RATE_LIMIT_WINDOW_MS = 60_000;

async function enforceScopedAgentRateLimit(scope: string, subject: string, maximum: number): Promise<void> {
  // Hashing prevents client-controlled IP/header data from becoming an
  // unbounded Redis key while keeping each scope independently rate limited.
  const subjectHash = crypto.createHash("sha256").update(subject).digest("hex");
  try {
    const result = await incrementWithTtl(`ratelimit:agent_dispatch:${scope}:${subjectHash}`, RATE_LIMIT_WINDOW_MS);
    if (result.count > maximum) {
      throw new ApiError("Too many AI requests. Please retry shortly.", 429, Math.max(1, Math.ceil(result.ttlMs / 1000)));
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof RedisUnavailableError) {
      throw new ApiError("AI rate limiting is temporarily unavailable.", 503);
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Retain the general authenticated-user limit and add separate company
    // and IP limits. One account, tenant, or source network cannot consume
    // the entire provider budget by itself.
    await enforceRateLimit(req, "agent_dispatch_user", 5);

    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const role = session.role as Role;
    let resolvedCompanyId: string | null = null;

    if (role === Role.EMPLOYER || role === Role.RECRUITER) {
      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
      });
      if (!profile || !profile.companyId) {
        return jsonError("Forbidden: Employer profile not found or company not assigned.", 403);
      }
      resolvedCompanyId = profile.companyId;
    } else {
      return jsonError("Forbidden: only employer users can dispatch an AI agent.", 403);
    }

    await Promise.all([
      enforceScopedAgentRateLimit("company", resolvedCompanyId, 20),
      enforceScopedAgentRateLimit("user", session.id, 5),
      enforceScopedAgentRateLimit("ip", getClientIp(req), 10),
    ]);

    const body = await readValidatedJson(req, dispatchSchema, 8 * 1024);
    const agentId = body.agentId;

    const tenantContext = createTenantContext(resolvedCompanyId, session.id, role);
    const correlationId = `corr-dispatch-${crypto.randomUUID()}`;
    const executionId = `exec-dispatch-${crypto.randomUUID()}`;

    const result = await ExecutionLoop.runTask({
      agentId,
      taskInput: body.input,
      context: {
        tenantContext,
        correlationId,
        executionId,
        agentId,
      },
      companyId: resolvedCompanyId,
      estimatedSpendMinor: agentId === "resume-evaluator" ? BigInt(5000) : BigInt(2000),
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
