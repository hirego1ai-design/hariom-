import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { batchMatchCandidates } from "@/lib/matching/JobMatchingEngine";
import {
  getCopilotCapacityStatus,
  reconcileCopilotReservation,
  releaseCopilotReservation,
  reserveCopilotCapacity,
} from "@/lib/copilot/capacity";
import { logAuditEvent } from "@/lib/auditLogger";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{16,128}$/;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let reservationId: string | null = null;
  try {
    await enforceRateLimit(req, "copilot_screen_job", 10, 60_000);
    const session = await requireEmployerOrAdminSession(req);
    if (session.role === "ADMIN") throw new ApiError("Administrators must use a tenant-scoped workflow.", 400);
    const company = await getSessionCompany(session);
    const { id: jobId } = await params;

    const idempotencyKey = req.headers.get("idempotency-key")?.trim() || "";
    if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
      throw new ApiError("A valid Idempotency-Key header (16-128 safe characters) is required.", 400);
    }

    const job = await prisma.jobListing.findFirst({
      where: { id: jobId, companyId: company.id },
      select: {
        id: true,
        title: true,
        _count: { select: { applications: true } },
      },
    });
    if (!job) throw new ApiError("Job not found or access denied.", 404);

    if (job._count.applications === 0) {
      return NextResponse.json({
        success: true,
        matchedCount: 0,
        results: [],
        message: "There are no applicants to screen yet.",
        policy: { automaticRejections: false, humanDecisionRequired: true },
      });
    }

    const reservation = await reserveCopilotCapacity({
      companyId: company.id,
      actionKey: "PROFILE_MATCH",
      quantity: job._count.applications,
      idempotencyKey: `copilot-screen:${jobId}:${crypto.createHash("sha256").update(idempotencyKey).digest("hex")}`,
      reference: {
        jobId,
        metadata: {
          requestedBy: session.id,
          source: "EMPLOYER_COPILOT_SCREEN_JOB",
        },
      },
    });
    reservationId = reservation.id;

    const result = await batchMatchCandidates(jobId);

    await reconcileCopilotReservation({
      reservationId,
      actualQuantity: result.matchedCount,
      metadata: {
        jobTitle: job.title,
        matchedCount: result.matchedCount,
        automaticRejections: 0,
      },
    });
    reservationId = null;

    await logAuditEvent({
      userId: session.id,
      companyId: company.id,
      action: "COPILOT_JOB_SCREENING_COMPLETED",
      resource: `JobListing:${jobId}`,
      details: `Copilot screened ${result.matchedCount} applicants. No automatic rejection was performed.`,
    });

    const capacity = await getCopilotCapacityStatus(company.id);
    return NextResponse.json({
      success: true,
      ...result,
      capacity,
      policy: {
        advisoryOnly: true,
        automaticRejections: false,
        humanDecisionRequired: true,
      },
    });
  } catch (error) {
    if (reservationId) {
      await releaseCopilotReservation(reservationId).catch(() => undefined);
    }
    return handleApiError(error);
  }
}
