import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";

const templateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  roleTitle: z.string().trim().min(1).max(120),
  seniority: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2_000).optional(),
  instructions: z.string().trim().max(5_000).optional(),
  durationMinutes: z.number().int().min(1).max(240),
  passingPercentage: z.number().int().min(0).max(100),
  validityDays: z.number().int().min(1).max(3_650).nullable().optional(),
  retakeCooldownHours: z.number().int().min(1).max(8_760).nullable().optional(),
}).strict();

async function requireAdmin(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required", 403);
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const templates = await prisma.mcqAssessment.findMany({
      where: { scope: "PLATFORM_READINESS" },
      select: {
        id: true, title: true, roleTitle: true, seniority: true, durationMinutes: true,
        passingPercentage: true, validityDays: true, retakeCooldownHours: true, isActive: true,
        _count: { select: { questions: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, templates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    const data = await readValidatedJson(request, templateSchema);
    const template = await prisma.mcqAssessment.create({
      data: { ...data, scope: "PLATFORM_READINESS", isActive: false },
    });
    await logAuditEvent({ userId: session.id, action: "CREATE_READINESS_TEMPLATE", resource: `McqAssessment:${template.id}` });
    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
