import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/apiSecurity";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.jobListing.findFirst({
      where: {
        id,
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true, description: true, location: true, website: true },
        },
      },
    });
    if (!job) throw new ApiError("Job listing not found or no longer active.", 404);
    const { publishedAt: _publishedAt, expiresAt: _expiresAt, copilotEnabled: _copilotEnabled, copilotActivatedAt: _copilotActivatedAt, ...publicJob } = job;
    return NextResponse.json({ success: true, job: publicJob });
  } catch (error) {
    return handleApiError(error);
  }
}
