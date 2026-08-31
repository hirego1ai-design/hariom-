import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

async function candidateProfile(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return profile;
}

export async function GET(request: NextRequest) {
  try {
    const profile = await candidateProfile(request);
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
    return NextResponse.json({ success: true, wallet, ledger, services, purchaseStatus: "NOT_CONFIGURED" });
  } catch (error) {
    return handleApiError(error);
  }
}
