import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/employer/source-tracking
 * Returns real candidate application source breakdown for the authenticated employer's company.
 * Falls back to empty state if no data exists yet.
 */
export async function GET(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Resolve employer's companyId
    const employerProfile = await (prisma as any).employerProfile?.findUnique({
      where: { userId: session.id },
      select: { companyId: true },
    });

    if (!employerProfile?.companyId) {
      return NextResponse.json({ success: false, error: "Employer profile not found" }, { status: 404 });
    }

    const companyId = employerProfile.companyId;

    // Aggregate applications for this company grouped by attributionSource
    // Applications are linked via JobListing → Company
    const jobs = await (prisma as any).jobListing?.findMany({
      where: { companyId },
      select: { id: true },
    }) ?? [];

    const jobIds: string[] = jobs.map((j: { id: string }) => j.id);

    // Total applications across company's jobs
    const totalApps: number = jobIds.length > 0
      ? await (prisma as any).application?.count({ where: { jobId: { in: jobIds } } }) ?? 0
      : 0;

    // Applications by source — pulled from ReferralAttribution where the referred entity
    // matches the job applicant. For direct applications (no attribution), label as "Direct".
    let sourceBreakdown: Array<{ source: string; count: number; pct: number }> = [];

    if (jobIds.length > 0 && totalApps > 0) {
      // Get all candidate IDs who applied to company jobs
      const applications = await (prisma as any).application?.findMany({
        where: { jobId: { in: jobIds } },
        select: { candidateProfileId: true },
      }) ?? [];

      const candidateProfileIds: string[] = applications.map((a: { candidateProfileId: string }) => a.candidateProfileId);

      // Get user IDs from candidate profiles
      const candidateProfiles = await (prisma as any).candidateProfile?.findMany({
        where: { id: { in: candidateProfileIds } },
        select: { id: true, userId: true },
      }) ?? [];

      const userIds: string[] = candidateProfiles.map((cp: { userId: string }) => cp.userId);

      // Check which users came from referral attributions
      const referralAttrs = userIds.length > 0
        ? await (prisma as any).referralAttribution?.findMany({
            where: { referredUserId: { in: userIds } },
            select: { attributionSource: true },
          }) ?? []
        : [];

      // Count by source
      const sourceCounts: Record<string, number> = {};
      for (const a of referralAttrs) {
        const src = formatSource(a.attributionSource as string);
        sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
      }

      const referralTotal = referralAttrs.length;
      const directCount = totalApps - referralTotal;

      if (directCount > 0) sourceCounts["Direct"] = (sourceCounts["Direct"] ?? 0) + directCount;

      sourceBreakdown = Object.entries(sourceCounts)
        .map(([source, count]) => ({
          source,
          count,
          pct: Math.round((count / totalApps) * 100),
        }))
        .sort((a, b) => b.count - a.count);
    }

    // Channel ROI — derived from attribution source and application conversion rates
    const channelRoi = await computeChannelRoi(jobIds);

    return NextResponse.json({
      success: true,
      data: {
        totalApplications: totalApps,
        sourceBreakdown,
        channelRoi,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function formatSource(raw: string): string {
  const map: Record<string, string> = {
    DIRECT_LINK: "Referral (Direct Link)",
    DIRECT_EMAIL_INVITE: "Referral (Email Invite)",
    EMPLOYER_REGISTRATION: "Referral (Partner)",
    WHATSAPP: "WhatsApp",
    LINKEDIN: "LinkedIn",
    TWITTER: "Twitter / X",
    QR_CODE: "QR Code",
  };
  return map[raw] ?? raw.replace(/_/g, " ");
}

async function computeChannelRoi(jobIds: string[]): Promise<Array<{ channel: string; hiredCount: number; totalApps: number; conversionRate: number }>> {
  if (jobIds.length === 0) return [];

  try {
    const apps = await (prisma as any).application?.findMany({
      where: { jobId: { in: jobIds } },
      select: { status: true, candidateProfileId: true },
    }) ?? [];

    const hiredApps = apps.filter((a: { status: string }) => a.status === "HIRED");

    // For now group all hired as "Platform" since we don't store per-application channel
    return [
      {
        channel: "HireGo AI Platform",
        hiredCount: hiredApps.length,
        totalApps: apps.length,
        conversionRate: apps.length > 0 ? Math.round((hiredApps.length / apps.length) * 100) : 0,
      },
    ];
  } catch {
    return [];
  }
}
