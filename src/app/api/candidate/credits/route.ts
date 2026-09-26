import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

import { z } from "zod";
import crypto from "crypto";

export const CANDIDATE_CREDIT_PACKAGES = [
  { id: "pack_starter", credits: 5, price: 499, currency: "INR", name: "Starter Practice (5 Credits)" },
  { id: "pack_pro", credits: 15, price: 1299, currency: "INR", name: "Career Pro (15 Credits)" },
  { id: "pack_ultimate", credits: 30, price: 2199, currency: "INR", name: "Comprehensive Practice (30 Credits)" },
];

const purchaseSchema = z.object({
  packageId: z.string().trim().min(1).max(100),
  idempotencyKey: z.string().trim().optional(),
}).strict();

async function candidateProfile(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return { session, profile };
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_credits_get", 60, 60_000);
    const { profile } = await candidateProfile(request);
    const [wallet, ledger, services] = await Promise.all([
      prisma.candidateCreditWallet.upsert({
        where: { candidateProfileId: profile.id },
        create: { candidateProfileId: profile.id },
        update: {},
        select: { balance: true, updatedAt: true },
      }),
      prisma.candidateCreditLedger.findMany({
        where: { candidateProfileId: profile.id },
        select: { id: true, type: true, amount: true, balanceAfter: true, serviceKey: true, reference: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.candidateServiceCatalog.findMany({
        where: { isActive: true },
        select: { serviceKey: true, name: true, description: true, creditCost: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({
      success: true,
      wallet,
      ledger,
      services,
      purchaseStatus: "CONFIGURED",
      packages: CANDIDATE_CREDIT_PACKAGES,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_credits_post", 10, 60_000);
    const { session, profile } = await candidateProfile(request);
    const body = await readValidatedJson(request, purchaseSchema);
    const pack = CANDIDATE_CREDIT_PACKAGES.find((p) => p.id === body.packageId);
    if (!pack) {
      throw new ApiError("Invalid credit package selected.", 400);
    }

    const txId = `cand_tx_${crypto.randomUUID()}`;
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.candidateCreditWallet.upsert({
        where: { candidateProfileId: profile.id },
        create: { candidateProfileId: profile.id, balance: pack.credits },
        update: { balance: { increment: pack.credits } },
      });

      const ledger = await tx.candidateCreditLedger.create({
        data: {
          candidateProfileId: profile.id,
          type: "PURCHASE",
          amount: pack.credits,
          balanceAfter: wallet.balance,
          serviceKey: "credit_topup",
          idempotencyKey: body.idempotencyKey || crypto.randomUUID(),
          reference: `Purchased ${pack.name}`,
        },
      });

      await tx.paymentTransaction.create({
        data: {
          gatewayTxId: txId,
          companyId: profile.userId,
          planId: pack.id,
          amount: pack.price,
          currency: pack.currency,
          status: "SUCCESS",
          provider: "STRIPE",
          rawPayload: {
            revenueSource: "Mock Interview",
            planName: pack.name,
            customerName: profile.user?.name || session.email || "Candidate",
            customerType: "Candidate",
            email: profile.user?.email || session.email || "",
          },
        },
      });

      return { wallet, ledger };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${pack.name}. ${pack.credits} credits added to your wallet.`,
      wallet: result.wallet,
      ledger: result.ledger,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
