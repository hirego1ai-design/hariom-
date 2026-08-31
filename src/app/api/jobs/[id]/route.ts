import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/apiSecurity";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.jobListing.findFirst({
      where: { id, status: "ACTIVE" },
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true, description: true, location: true, website: true },
        },
      },
    });
    if (!job) throw new ApiError("Job listing not found or no longer active.", 404);
    return NextResponse.json({ success: true, job });
  } catch (error) {
    return handleApiError(error);
  }
}
