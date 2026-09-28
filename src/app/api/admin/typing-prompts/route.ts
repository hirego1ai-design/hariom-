import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const promptSchema = z.object({
  title: z.string().trim().min(1).max(160),
  text: z.string().trim().min(20).max(2_000),
  durationSeconds: z.number().int().min(5).max(600),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_typing_prompts_read:${admin.id}`, 60, 60_000);

    const prompts = await prisma.typingPracticePrompt.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 250,
    });
    return NextResponse.json({ success: true, prompts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_typing_prompts_write:${admin.id}`, 20, 60_000);
    const data = await readValidatedJson(request, promptSchema);

    const prompt = await prisma.$transaction(async (tx) => {
      const created = await tx.typingPracticePrompt.create({ data });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "CREATE_TYPING_PRACTICE_PROMPT",
          resource: `TypingPracticePrompt:${created.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            durationSeconds: created.durationSeconds,
            initialActiveState: created.isActive,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);
      return created;
    });

    return NextResponse.json({ success: true, prompt }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
