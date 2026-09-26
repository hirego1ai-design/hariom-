import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import {
  getSessionCompany,
  requireEmployerOrAdminSession,
} from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { resolveManagedHiringNextAction } from "@/lib/workflows/ManagedHiringOrchestrator";

export const dynamic = "force-dynamic";

/**
 * Read-only orchestration state. It never performs a consequential hiring
 * action; it tells the UI/worker what the next safe step is.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployerOrAdminSession(request);
    await enforceRateLimit(
      request,
      `managed_hiring_orchestration:${session.id}`,
      60,
      60_000,
    );

    const { id: applicationId } = await params;
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { job: { select: { companyId: true } } },
    });
    if (!application) throw new ApiError("Application not found.", 404);

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== application.job.companyId) {
        throw new ApiError("Application access denied.", 403);
      }
    }

    const state = await resolveManagedHiringNextAction(applicationId);
    return NextResponse.json(
      {
        success: true,
        state,
        executionPolicy: {
          automaticRejection: false,
          consequentialActionsRequireHumanApproval: true,
          missingEvidenceCanReject: false,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
