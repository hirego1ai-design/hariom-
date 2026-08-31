import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auditLogger";

const grantSchema = z.object({
  candidateProfileId: z.string().uuid(),
  amount: z.number().int().min(1).max(1_000_000),
  type: z.enum(["BONUS", "ADJUSTMENT"]),
  reference: z.string().trim().min(3).max(500),
  idempotencyKey: z.string().uuid(),
}).strict();

async function requireAdmin(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required", 403);
  return session;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    const data = await readValidatedJson(request, grantSchema);
    const ledger = await prisma.$transaction(async (tx) => {
      const prior = await tx.candidateCreditLedger.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
      if (prior) {
        if (prior.candidateProfileId !== data.candidateProfileId) throw new ApiError("This request key was already used for a different candidate.", 409);
        return prior;
      }
      const profile = await tx.candidateProfile.findUnique({ where: { id: data.candidateProfileId } });
      if (!profile) throw new ApiError("Candidate profile not found", 404);
      const wallet = await tx.candidateCreditWallet.upsert({
        where: { candidateProfileId: data.candidateProfileId },
        create: { candidateProfileId: data.candidateProfileId, balance: data.amount },
        update: { balance: { increment: data.amount } },
      });
      return tx.candidateCreditLedger.create({
        data: {
          candidateProfileId: data.candidateProfileId,
          type: data.type,
          amount: data.amount,
          balanceAfter: wallet.balance,
          idempotencyKey: data.idempotencyKey,
          reference: data.reference,
        },
      });
    });
    await logAuditEvent({ userId: session.id, action: "GRANT_CANDIDATE_CREDITS", resource: `CandidateCreditLedger:${ledger.id}`, details: `amount:${ledger.amount}; reference:${ledger.reference}` });
    return NextResponse.json({ success: true, ledger }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
