import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const [candidateSignups, applications, interviews, paidSubscriptions] = await prisma.$transaction([
      prisma.user.count({ where: { role: "CANDIDATE" } }),
      prisma.application.count(),
      prisma.interview.count({ where: { status: "COMPLETED" } }),
      prisma.companySubscription.count({ where: { status: "ACTIVE", paymentId: { not: null } } }),
    ]);
    return NextResponse.json({ success: true, data: { candidateSignups, applications, interviewsCompleted: interviews, paidSubscriptions } });
  } catch (error) {
    return handleApiError(error);
  }
}
