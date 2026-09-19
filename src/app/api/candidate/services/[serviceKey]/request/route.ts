import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const requestSchema = z.object({ idempotencyKey: z.string().uuid() }).strict();

async function candidateProfile(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return { session, profile };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ serviceKey: string }> }) {
  try {
    await enforceRateLimit(request, "candidate_service_request", 20, 60_000);
    const { session, profile } = await candidateProfile(request);
    const { serviceKey } = await params;
    const { idempotencyKey } = await readValidatedJson(request, requestSchema, 4 * 1024);

    const usage = await prisma.$transaction(async (tx) => {
      const prior = await tx.candidateCreditLedger.findFirst({
        where: { idempotencyKey, candidateProfileId: profile.id },
        include: { serviceUsage: { include: { service: true } } },
      });
      if (prior?.serviceUsage) return prior.serviceUsage;
      if (prior) throw new ApiError("This request key was already used for a different action.", 409);

      const service = await tx.candidateServiceCatalog.findFirst({ where: { serviceKey, isActive: true } });
      if (!service) throw new ApiError("This coaching service is not available.", 404);

      await tx.candidateCreditWallet.upsert({
        where: { candidateProfileId: profile.id },
        create: { candidateProfileId: profile.id },
        update: {},
      });
      const debit = await tx.candidateCreditWallet.updateMany({
        where: { candidateProfileId: profile.id, balance: { gte: service.creditCost } },
        data: { balance: { decrement: service.creditCost } },
      });
      if (debit.count !== 1) throw new ApiError("Insufficient candidate credits for this service.", 409);

      const wallet = await tx.candidateCreditWallet.findUniqueOrThrow({ where: { candidateProfileId: profile.id } });
      const ledger = await tx.candidateCreditLedger.create({
        data: {
          candidateProfileId: profile.id,
          type: "SPEND",
          amount: -service.creditCost,
          balanceAfter: wallet.balance,
          serviceKey: service.serviceKey,
          idempotencyKey,
          reference: `Candidate service request: ${service.name}`,
        },
      });
      const usage = await tx.candidateServiceUsage.create({
        data: { candidateProfileId: profile.id, serviceId: service.id, ledgerId: ledger.id, status: "REQUESTED" },
        include: { service: true },
      });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "CANDIDATE_SERVICE_REQUESTED",
          resource: `CandidateServiceUsage:${usage.id}`,
          details: `serviceKey:${usage.service.serviceKey}`,
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      return usage;
    });

    return NextResponse.json({ success: true, usage }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
