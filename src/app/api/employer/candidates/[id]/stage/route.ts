import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";
import { ApplicationStatus } from "@prisma/client";

const schema = z.object({ stage: z.enum(["SCREENING", "ASSESSMENT", "AI_INTERVIEW", "SHORTLISTED", "HIRED", "REJECTED"]) });
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await enforceRateLimit(req, "employer_candidate_stage", 30, 60_000);
  const session = await getCurrentSession(req.headers);
  if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const { stage } = await readValidatedJson(req, schema, 8 * 1024);
    if (stage === "HIRED" || stage === "REJECTED") {
      return NextResponse.json({ success: false, error: "Selection and rejection are consequential actions and must use the persisted approval workflow." }, { status: 409 });
    }
    const application = await prisma.application.findUnique({ where: { id }, include: { job: true } });
    if (!application) return NextResponse.json({ success: false, error: "Candidate application not found." }, { status: 404 });
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== application.job.companyId) {
        return NextResponse.json({ success: false, error: "Candidate is not in your company pipeline." }, { status: 403 });
      }
    }
    await prisma.application.update({ where: { id }, data: { status: stage as ApplicationStatus } });
    await logAuditEvent({
      userId: session.id,
      companyId: application.job.companyId,
      action: "CANDIDATE_STAGE_UPDATED",
      resource: `Application:${id}`,
      details: `Stage changed to ${stage}`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });
    return NextResponse.json({ success: true, applicationId: id, stage });
  } catch (error) { return handleApiError(error); }
}
