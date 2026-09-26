import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit, handleApiError, jsonError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Authentication required.", 401);
    await enforceRateLimit(request, "proctoring_config_read", 60, 60_000);

    const config = await prisma.proctoringConfig.upsert({
      where: { id: "global-proctoring-config" },
      update: {},
      create: { id: "global-proctoring-config" },
      select: {
        enabled: true,
        tabSwitchEnabled: true,
        clipboardEnabled: true,
        contextMenuEnabled: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        faceDetectionEnabled: false,
        audioAnalysisEnabled: false,
        evidenceSource: "CLIENT_REPORTED_UNVERIFIED",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
