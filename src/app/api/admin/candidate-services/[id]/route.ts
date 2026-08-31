import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auditLogger";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  creditCost: z.number().int().min(1).max(1_000_000).optional(),
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
    const service = await prisma.candidateServiceCatalog.update({ where: { id }, data });
    await logAuditEvent({ userId: session.id, action: "UPDATE_CANDIDATE_SERVICE", resource: `CandidateServiceCatalog:${service.id}` });
    return NextResponse.json({ success: true, service });
  } catch (error) {
    return handleApiError(error);
  }
}
