import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireEmployerOrAdminSession, getSessionCompany } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { batchMatchCandidates } from "@/lib/matching/JobMatchingEngine";
import { logAuditEvent } from "@/lib/auditLogger";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{16,128}$/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let recordKey = "";
  let companyId = "";
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, "employer_match_job", 10, 60_000);

    const { id: jobId } = await params;
    const rawKey = req.headers.get("idempotency-key")?.trim() || "";
    if (!IDEMPOTENCY_KEY.test(rawKey)) {
      throw new ApiError(
        "A valid Idempotency-Key header (16-128 safe characters) is required.",
        400,
      );
    }

    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { id: true, companyId: true },
    });
    if (!job) throw new ApiError("Job not found.", 404);
    companyId = job.companyId;

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== job.companyId) {
        throw new ApiError("Job not found or access denied.", 403);
      }
    }

    recordKey = `JOB_MATCH:${jobId}:${rawKey}`;
    const requestHash = crypto
      .createHash("sha256")
      .update(`job-match:${jobId}`)
      .digest("hex");

    const existing = await prisma.idempotencyRecord.findUnique({
      where: {
        companyId_idempotencyKey: {
          companyId,
          idempotencyKey: recordKey,
        },
      },
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ApiError(
          "Idempotency key already used with a different matching request.",
          409,
        );
      }
      if (existing.status === "SUCCESS" && existing.responsePayload) {
        return NextResponse.json(existing.responsePayload as any);
      }
      if (existing.status === "PROCESSING") {
        throw new ApiError(
          "This matching request is already processing.",
          409,
        );
      }

      await prisma.idempotencyRecord.update({
        where: {
          companyId_idempotencyKey: {
            companyId,
            idempotencyKey: recordKey,
          },
        },
        data: {
          status: "PROCESSING",
          responsePayload: undefined,
        },
      });
    } else {
      try {
        await prisma.idempotencyRecord.create({
          data: {
            companyId,
            idempotencyKey: recordKey,
            requestHash,
            status: "PROCESSING",
            jobId,
          },
        });
      } catch {
        const concurrent = await prisma.idempotencyRecord.findUnique({
          where: {
            companyId_idempotencyKey: {
              companyId,
              idempotencyKey: recordKey,
            },
          },
        });
        if (concurrent?.requestHash === requestHash) {
          if (concurrent.status === "SUCCESS" && concurrent.responsePayload) {
            return NextResponse.json(concurrent.responsePayload as any);
          }
          throw new ApiError(
            "This matching request is already processing.",
            409,
          );
        }
        throw new ApiError(
          "Unable to reserve this matching request safely.",
          409,
        );
      }
    }

    const result = await batchMatchCandidates(jobId);
    const responsePayload = { success: true, ...result };

    await prisma.idempotencyRecord.update({
      where: {
        companyId_idempotencyKey: {
          companyId,
          idempotencyKey: recordKey,
        },
      },
      data: {
        status: "SUCCESS",
        jobId,
        responsePayload: responsePayload as any,
      },
    });

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "JOB_MATCHING_TRIGGERED",
      resource: `JobListing:${jobId}`,
      details: `Matched ${result.matchedCount} candidates; idempotencyKey=${recordKey}`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    if (recordKey && companyId) {
      await prisma.idempotencyRecord.updateMany({
        where: {
          companyId,
          idempotencyKey: recordKey,
          status: "PROCESSING",
        },
        data: { status: "FAILED" },
      }).catch(() => undefined);
    }
    return handleApiError(error);
  }
}
