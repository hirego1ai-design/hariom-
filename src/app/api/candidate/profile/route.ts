import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const optionalText = z.string().trim().max(5_000).nullable().optional();
const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().min(5).max(40).optional(),
  phoneNumber: z.string().trim().min(5).max(40).optional(),
  headline: z.string().trim().max(240).nullable().optional(),
  bio: optionalText,
  location: z.string().trim().max(240).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  experienceYears: z.coerce.number().min(0).max(80).optional(),
  resumeUrl: z.string().trim().max(2_048).nullable().optional(),
  education: z.unknown().optional(),
  experience: z.unknown().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  linkedinUrl: z.string().trim().url().max(2_048).optional(),
}).strict();

function toNullableJson(value: unknown) {
  return value === null ? Prisma.JsonNull : value as Prisma.InputJsonValue;
}

async function requireCandidate(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session) throw new ApiError("Unauthorized access", 401);
  if (session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireCandidate(request);
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true, phoneNumber: true } },
        applications: { include: { job: { select: { id: true, title: true, company: { select: { name: true, logoUrl: true } }, location: true } } } },
      },
    });
    return NextResponse.json({ success: true, profile });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireCandidate(request);
    const body = await readValidatedJson(request, profileUpdateSchema);
    const existing = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
    const existingPreferences = existing?.preferences && typeof existing.preferences === "object" && !Array.isArray(existing.preferences) ? existing.preferences as Record<string, unknown> : {};
    const preferences = body.preferences !== undefined || body.linkedinUrl ? { ...existingPreferences, ...(body.preferences ?? {}), ...(body.linkedinUrl ? { linkedinUrl: body.linkedinUrl } : {}) } : undefined;
    const profile = await prisma.$transaction(async (tx) => {
      if (body.fullName || body.name || body.phone || body.phoneNumber) await tx.user.update({ where: { id: session.id }, data: { ...(body.fullName || body.name ? { name: body.fullName || body.name } : {}), ...(body.phone || body.phoneNumber ? { phoneNumber: body.phone || body.phoneNumber } : {}) } });
      return tx.candidateProfile.upsert({
        where: { userId: session.id },
        update: { ...(body.headline !== undefined ? { headline: body.headline } : {}), ...(body.bio !== undefined ? { bio: body.bio } : {}), ...(body.location !== undefined ? { location: body.location } : {}), ...(body.skills !== undefined ? { skills: body.skills } : {}), ...(body.experienceYears !== undefined ? { experienceYears: body.experienceYears } : {}), ...(body.resumeUrl !== undefined ? { resumeUrl: body.resumeUrl } : {}), ...(body.education !== undefined ? { education: toNullableJson(body.education) } : {}), ...(body.experience !== undefined ? { experience: toNullableJson(body.experience) } : {}), ...(preferences !== undefined ? { preferences: toNullableJson(preferences) } : {}) },
        create: { userId: session.id, headline: body.headline ?? "", bio: body.bio ?? "", location: body.location ?? "", skills: body.skills ?? [], experienceYears: body.experienceYears ?? 0, resumeUrl: body.resumeUrl ?? null, education: toNullableJson(body.education ?? []), experience: toNullableJson(body.experience ?? []), preferences: toNullableJson(preferences ?? {}) },
      });
    });
    return NextResponse.json({ success: true, profile });
  } catch (error) { return handleApiError(error); }
}
