import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);

    const prompt = await prisma.typingPracticePrompt.findFirst({
      where: { isActive: true },
      select: { id: true, title: true, text: true, durationSeconds: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!prompt) throw new ApiError("Typing practice is not configured yet.", 503);

    return NextResponse.json({ success: true, prompt, mode: "SELF_REPORTED_PRACTICE" });
  } catch (error) {
    return handleApiError(error);
  }
}
