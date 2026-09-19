import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const schema = z.object({ decision: z.enum(["ACCEPT", "DECLINE"]) }).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "candidate_sourcing_decision", 20);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { id } = await params;
    const body = await readValidatedJson(request, schema);
    const result = await prisma.$transaction(async (tx) => {
      const relationship = await tx.candidateSourcingRelationship.findFirst({
        where: { id, candidateProfile: { userId: session.id } },
        include: { job: { select: { status: true } } },
      });
      if (!relationship) throw new ApiError("Invitation not found.", 404);
      const target = body.decision === "ACCEPT" ? "ACCEPTED" : "DECLINED";
      if (relationship.status === target) {
        const application = target === "ACCEPTED" ? await tx.application.findUnique({ where: { candidateProfileId_jobId: { candidateProfileId: relationship.candidateProfileId, jobId: relationship.jobId } }, select: { id: true, status: true } }) : null;
        return { relationshipId: relationship.id, status: relationship.status, application, idempotent: true };
      }
      if (relationship.status !== "INVITED") throw new ApiError("Invitation decision has already been recorded.", 409);
      if (target === "ACCEPTED" && relationship.job.status !== "ACTIVE") throw new ApiError("This job is no longer accepting applications.", 409);
      const now = new Date();
      const changed = await tx.candidateSourcingRelationship.updateMany({ where: { id, status: "INVITED" }, data: { status: target, ...(target === "ACCEPTED" ? { acceptedAt: now } : { declinedAt: now }) } });
      if (changed.count !== 1) throw new ApiError("Invitation state changed. Refresh and try again.", 409);
      const application = target === "ACCEPTED" ? await tx.application.upsert({
        where: { candidateProfileId_jobId: { candidateProfileId: relationship.candidateProfileId, jobId: relationship.jobId } },
        update: {},
        create: { candidateProfileId: relationship.candidateProfileId, jobId: relationship.jobId, status: "APPLIED" },
        select: { id: true, status: true },
      }) : null;
      return { relationshipId: relationship.id, status: target, application, idempotent: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ success: true, ...result });
  } catch (error) { return handleApiError(error); }
}
