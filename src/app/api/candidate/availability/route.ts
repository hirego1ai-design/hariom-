import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";

const schema = z.object({
  status: z.enum(["ACTIVE_CONFIRMED","NOT_LOOKING","JOINED","TEMPORARILY_UNAVAILABLE"]),
  note: z.string().trim().max(500).optional().nullable(),
});

async function profile(req: NextRequest) {
  const session = await getCurrentSession(req.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
  if (!candidate) throw new ApiError("Candidate profile not found.", 404);
  return { session, candidate };
}

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "candidate_availability_get", 60, 60000);
    const { candidate } = await profile(req);
    return NextResponse.json({ success: true, availability: { status: candidate.availabilityStatus, lastConfirmedAt: candidate.lastAvailabilityConfirmedAt, source: candidate.availabilitySource, note: candidate.availabilityNote } });
  } catch(e) { return handleApiError(e); }
}

export async function PUT(req: NextRequest) {
  try {
    await enforceRateLimit(req, "candidate_availability", 20, 60000);
    const { session, candidate } = await profile(req);
    const body = await readValidatedJson(req, schema, 4 * 1024);
    const now = new Date();
    const updated = await prisma.candidateProfile.update({
      where: { id: candidate.id },
      data: { availabilityStatus: body.status, lastAvailabilityConfirmedAt: now, availabilitySource: "CANDIDATE_SELF_REPORT", availabilityNote: body.note || null },
      select: { availabilityStatus: true, lastAvailabilityConfirmedAt: true, availabilitySource: true, availabilityNote: true },
    });
    await logAuditEvent({ userId: session.id, action: "CANDIDATE_AVAILABILITY_CONFIRMED", resource: `CandidateProfile:${candidate.id}`, details: `Candidate self-reported availability status ${body.status}` });
    return NextResponse.json({ success: true, availability: updated });
  } catch(e) { return handleApiError(e); }
}
