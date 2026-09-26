import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "public_employer_pricing", 120, 60_000);
    const [plans, copilotConfig] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where: { isArchived: false },
        orderBy: [{ displayOrder: "asc" }, { price: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          jobPostsQuota: true,
          jobValidityDays: true,
          marketingBenefits: true,
          firstTimeOnly: true,
          copilotIncluded: true,
          copilotJobLimit: true,
          isFeatured: true,
          badgeText: true,
          displayOrder: true,
        },
      }),
      prisma.hiringCopilotConfig.findUnique({
        where: { id: "default" },
        select: { enabled: true, addonPrice: true, currency: true, addonJobLimit: true, title: true, description: true, badgeText: true, benefits: true },
      }),
    ]);
    return NextResponse.json({ success: true, plans, copilotConfig }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    return handleApiError(error);
  }
}
