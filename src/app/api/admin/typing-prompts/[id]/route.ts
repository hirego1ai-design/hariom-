import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  text: z.string().trim().min(20).max(2_000).optional(),
  durationSeconds: z.number().int().min(5).max(600).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_typing_prompts_write:${admin.id}`, 20, 60_000);
    const { id } = await params;
    const data = await readValidatedJson(request, updateSchema);

    const prompt = await prisma.$transaction(async (tx) => {
      const existing = await tx.typingPracticePrompt.findUnique({ where: { id } });
      if (!existing) throw new ApiError("Typing prompt not found", 404);

      if (data.isActive === true) {
        await tx.typingPracticePrompt.updateMany({
          where: { isActive: true, id: { not: id } },
          data: { isActive: false },
        });
      }

      const updated = await tx.typingPracticePrompt.update({
        where: { id },
        data,
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "UPDATE_TYPING_PRACTICE_PROMPT",
          resource: `TypingPracticePrompt:${updated.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            fields: Object.keys(data),
            activeBefore: existing.isActive,
            activeAfter: updated.isActive,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return updated;
    });

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    return handleApiError(error);
  }
}
