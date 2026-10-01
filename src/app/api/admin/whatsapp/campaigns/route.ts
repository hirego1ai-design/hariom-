import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

type CampaignMeta = {
  source_id?: string;
  source_type?: string;
  source_url?: string;
  headline?: string;
  body?: string;
  ctwa_clid?: string;
  media_type?: string;
};

function asCampaignMeta(value: unknown): CampaignMeta {
  return value && typeof value === "object" ? value as CampaignMeta : {};
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_whatsapp_campaigns:${admin.id}`, 30, 60_000);

    const url = new URL(request.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days")) || 30));
    const since = new Date(Date.now() - days * 86_400_000);

    const sessions = await prisma.whatsAppOnboardingSession.findMany({
      where: {
        attributionSource: "meta_click_to_whatsapp",
        startedAt: { gte: since },
      },
      select: {
        id: true,
        candidateId: true,
        status: true,
        currentStep: true,
        collectedData: true,
        campaignMeta: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { startedAt: "desc" },
      take: 10_000,
    });

    const candidateIds = sessions
      .map((session) => session.candidateId)
      .filter((id): id is string => Boolean(id));

    const applications = candidateIds.length
      ? await prisma.application.findMany({
          where: { candidateProfileId: { in: candidateIds } },
          select: {
            candidateProfileId: true,
            status: true,
            createdAt: true,
          },
        })
      : [];

    const applicationByCandidate = new Map<string, typeof applications>();
    for (const application of applications) {
      const list = applicationByCandidate.get(application.candidateProfileId) || [];
      list.push(application);
      applicationByCandidate.set(application.candidateProfileId, list);
    }

    const campaigns = new Map<string, {
      sourceId: string;
      sourceType: string | null;
      sourceUrl: string | null;
      headline: string | null;
      conversations: number;
      qualified: number;
      onboarded: number;
      applicants: number;
      applications: number;
      hired: number;
      firstSeenAt: Date;
      lastSeenAt: Date;
    }>();

    for (const session of sessions) {
      const meta = asCampaignMeta(session.campaignMeta);
      const sourceId = (meta.source_id || meta.ctwa_clid || "unknown").slice(0, 200);
      const existing = campaigns.get(sourceId) || {
        sourceId,
        sourceType: meta.source_type || null,
        sourceUrl: meta.source_url || null,
        headline: meta.headline || null,
        conversations: 0,
        qualified: 0,
        onboarded: 0,
        applicants: 0,
        applications: 0,
        hired: 0,
        firstSeenAt: session.startedAt,
        lastSeenAt: session.startedAt,
      };

      existing.conversations += 1;
      const data = session.collectedData && typeof session.collectedData === "object"
        ? session.collectedData as Record<string, unknown>
        : {};
      if ((typeof data.role === "string" && data.role.trim()) || session.status === "COMPLETE") {
        existing.qualified += 1;
      }
      if (session.status === "COMPLETE") existing.onboarded += 1;

      const candidateApplications = session.candidateId
        ? applicationByCandidate.get(session.candidateId) || []
        : [];
      if (candidateApplications.length) {
        existing.applicants += 1;
        existing.applications += candidateApplications.length;
        existing.hired += candidateApplications.filter((application) => application.status === "HIRED").length;
      }

      if (session.startedAt < existing.firstSeenAt) existing.firstSeenAt = session.startedAt;
      if (session.startedAt > existing.lastSeenAt) existing.lastSeenAt = session.startedAt;
      campaigns.set(sourceId, existing);
    }

    const data = Array.from(campaigns.values()).sort((a, b) => b.conversations - a.conversations);

    return NextResponse.json({
      success: true,
      windowDays: days,
      totals: {
        conversations: sessions.length,
        qualified: data.reduce((sum, item) => sum + item.qualified, 0),
        onboarded: data.reduce((sum, item) => sum + item.onboarded, 0),
        applicants: data.reduce((sum, item) => sum + item.applicants, 0),
        applications: data.reduce((sum, item) => sum + item.applications, 0),
        hired: data.reduce((sum, item) => sum + item.hired, 0),
      },
      campaigns: data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
