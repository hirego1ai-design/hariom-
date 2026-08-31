import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auditLogger";

const promptSchema = z.object({
  title: z.string().trim().min(1).max(160),
  text: z.string().trim().min(20).max(2_000),
  durationSeconds: z.number().int().min(5).max(600),
}).strict();

async function requireAdmin(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required", 403);
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const prompts = await prisma.typingPracticePrompt.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ success: true, prompts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    const data = await readValidatedJson(request, promptSchema);
    const prompt = await prisma.typingPracticePrompt.create({ data });
    await logAuditEvent({ userId: session.id, action: "CREATE_TYPING_PRACTICE_PROMPT", resource: `TypingPracticePrompt:${prompt.id}` });
    return NextResponse.json({ success: true, prompt }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
