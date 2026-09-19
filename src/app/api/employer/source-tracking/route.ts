import { NextResponse } from "next/server";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "employer_source_tracking", 60, 60_000);
    const session = await requireEmployerOrAdminSession(request);
    if (session.role === "ADMIN") throw new ApiError("Administrator access requires an explicitly scoped company endpoint.", 400);
    const company = await getSessionCompany(session);
    const applications = await prisma.application.findMany({
      where: { job: { companyId: company.id } },
      select: { status: true, candidateProfile: { select: { userId: true } } },
    });
    const totalApplications = applications.length;
    const userIds = [...new Set(applications.map((a) => a.candidateProfile.userId))];
    const attributions = userIds.length ? await prisma.referralAttribution.findMany({
      where: { referredUserId: { in: userIds } },
      select: { referredUserId: true, attributionSource: true },
    }) : [];
    // ReferralAttribution is user-level, not application-level. Count at most one
    // attribution per candidate and label the rest as direct; do not claim ROI
    // because acquisition cost is not stored by this model.
    const byUser = new Map<string, string>();
    for (const item of attributions) {
      if (item.referredUserId && item.attributionSource && !byUser.has(item.referredUserId)) byUser.set(item.referredUserId, item.attributionSource);
    }
    const counts = new Map<string, number>();
    for (const app of applications) {
      const source = byUser.get(app.candidateProfile.userId);
      const label = source ? formatSource(source) : "Direct";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const sourceBreakdown = [...counts.entries()].map(([source, count]) => ({
      source, count, pct: totalApplications ? Math.round((count / totalApplications) * 100) : 0,
    })).sort((a,b) => b.count-a.count);
    return NextResponse.json({
      success: true,
      data: {
        totalApplications,
        sourceBreakdown,
        channelRoi: [],
        channelRoiAvailable: false,
        channelRoiUnavailableReason: "Per-application acquisition cost and channel attribution are not stored.",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) { return handleApiError(error); }
}

function formatSource(raw: string): string {
  const map: Record<string,string> = { DIRECT_LINK:"Referral (Direct Link)", DIRECT_EMAIL_INVITE:"Referral (Email Invite)", EMPLOYER_REGISTRATION:"Referral (Partner)", WHATSAPP:"WhatsApp", LINKEDIN:"LinkedIn", TWITTER:"Twitter / X", QR_CODE:"QR Code" };
  return map[raw] ?? raw.replace(/_/g, " ");
}
