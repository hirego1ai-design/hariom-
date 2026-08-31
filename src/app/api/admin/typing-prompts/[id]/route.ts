import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auditLogger";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  text: z.string().trim().min(20).max(2_000).optional(),
  durationSeconds: z.number().int().min(5).max(600).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

async function requireAdmin(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required", 403);
  return session;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request);
    const { id } = await params;
    const data = await readValidatedJson(request, updateSchema);

    const prompt = await prisma.$transaction(async (tx) => {
      const existing = await tx.typingPracticePrompt.findUnique({ where: { id } });
      if (!existing) throw new ApiError("Typing prompt not found", 404);
      if (data.isActive === true) {
        await tx.typingPracticePrompt.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } });
      }
      return tx.typingPracticePrompt.update({ where: { id }, data });
    });
    await logAuditEvent({ userId: session.id, action: "UPDATE_TYPING_PRACTICE_PROMPT", resource: `TypingPracticePrompt:${prompt.id}` });
    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    return handleApiError(error);
  }
}
