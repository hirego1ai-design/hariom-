import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";

const savedJobSchema = z.object({ jobId: z.string().uuid() }).strict();
async function requireCandidate(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session) throw new ApiError("Unauthorized access", 401);
  if (session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireCandidate(request);
    const savedJobs = await prisma.savedJob.findMany({ where: { userId: session.id }, include: { job: { include: { company: { select: { name: true, logoUrl: true, location: true } } } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, savedJobs: savedJobs.map((saved) => ({ id: saved.id, jobId: saved.jobId, savedAt: saved.createdAt, job: saved.job })) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireCandidate(request);
    const { jobId } = await readValidatedJson(request, savedJobSchema);
    const job = await prisma.jobListing.findFirst({ where: { id: jobId, status: "ACTIVE" }, select: { id: true } });
    if (!job) return jsonError("Active job listing not found", 404);
    const savedJob = await prisma.savedJob.upsert({ where: { userId_jobId: { userId: session.id, jobId } }, create: { userId: session.id, jobId }, update: {} });
    return NextResponse.json({ success: true, savedJob }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireCandidate(request);
    const jobId = new URL(request.url).searchParams.get("jobId");
    const parsed = savedJobSchema.safeParse({ jobId });
    if (!parsed.success) throw new ApiError("A valid jobId parameter is required", 400);
    await prisma.savedJob.deleteMany({ where: { userId: session.id, jobId: parsed.data.jobId } });
    return NextResponse.json({ success: true });
  } catch (error) { return handleApiError(error); }
}
