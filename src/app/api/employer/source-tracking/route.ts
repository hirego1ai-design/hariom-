import { NextResponse } from "next/server";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
} from "@/lib/apiSecurity";
import {
  getSessionCompany,
  requireEmployerOrAdminSession,
} from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "employer_source_tracking", 60, 60_000);
    const session = await requireEmployerOrAdminSession(request);
    if (session.role === "ADMIN") {
      throw new ApiError(
        "Administrator access requires an explicitly scoped company endpoint.",
        400,
      );
    }

    const company = await getSessionCompany(session);
    const applications = await prisma.application.findMany({
      where: { job: { companyId: company.id } },
      select: {
        id: true,
        jobId: true,
        candidateProfileId: true,
        status: true,
        candidateProfile: { select: { userId: true } },
      },
    });

    const totalApplications = applications.length;
    const userIds = [
      ...new Set(applications.map((application) => application.candidateProfile.userId)),
    ];

    const [referralAttributions, sourcingRelationships] = await Promise.all([
      userIds.length
        ? prisma.referralAttribution.findMany({
            where: { referredUserId: { in: userIds } },
            select: {
              referredUserId: true,
              attributionSource: true,
            },
          })
        : Promise.resolve([]),
      applications.length
        ? prisma.candidateSourcingRelationship.findMany({
            where: {
              companyId: company.id,
              OR: applications.map((application) => ({
                jobId: application.jobId,
                candidateProfileId: application.candidateProfileId,
              })),
            },
            select: {
              jobId: true,
              candidateProfileId: true,
              status: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // Referral attribution is user-level and is retained for referral/social
    // acquisition. A job + candidate sourcing relationship is stronger,
    // application-specific evidence that the candidate came from HireGo's
    // proactive talent-pool sourcing workflow.
    const referralByUser = new Map<string, string>();
    for (const item of referralAttributions) {
      if (
        item.referredUserId &&
        item.attributionSource &&
        !referralByUser.has(item.referredUserId)
      ) {
        referralByUser.set(item.referredUserId, item.attributionSource);
      }
    }

    const proactiveSourceKeys = new Set(
      sourcingRelationships.map(
        (relationship) =>
          `${relationship.jobId}:${relationship.candidateProfileId}`,
      ),
    );

    const counts = new Map<string, number>();
    for (const application of applications) {
      const sourcingKey = `${application.jobId}:${application.candidateProfileId}`;
      const referralSource = referralByUser.get(
        application.candidateProfile.userId,
      );

      const source = proactiveSourceKeys.has(sourcingKey)
        ? "HireGo Talent Pool"
        : referralSource
          ? formatSource(referralSource)
          : "Inbound Application";

      counts.set(source, (counts.get(source) ?? 0) + 1);
    }

    const sourceBreakdown = [...counts.entries()]
      .map(([source, count]) => ({
        source,
        count,
        pct: totalApplications
          ? Math.round((count / totalApplications) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: {
        totalApplications,
        sourceBreakdown,
        sourceDefinitions: {
          "HireGo Talent Pool":
            "Candidate was proactively sourced from HireGo's active confirmed candidate database and then entered this job pipeline.",
          "Inbound Application":
            "Candidate applied directly to this job without a proactive sourcing relationship or recorded referral attribution.",
        },
        channelRoi: [],
        channelRoiAvailable: false,
        channelRoiUnavailableReason:
          "Per-application acquisition cost is not stored for every sourcing channel yet.",
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
