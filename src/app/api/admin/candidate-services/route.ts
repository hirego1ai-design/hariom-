import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auditLogger";

const serviceSchema = z.object({
  serviceKey: z.string().trim().min(3).max(80).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2_000).optional(),
  creditCost: z.number().int().min(1).max(1_000_000),
}).strict();

async function requireAdmin(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required", 403);
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const services = await prisma.candidateServiceCatalog.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ success: true, services });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    const data = await readValidatedJson(request, serviceSchema);
    const service = await prisma.candidateServiceCatalog.create({ data });
    await logAuditEvent({ userId: session.id, action: "CREATE_CANDIDATE_SERVICE", resource: `CandidateServiceCatalog:${service.id}` });
    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
