import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

const allowMockFallbacks = process.env.NODE_ENV !== "production" || process.env.MOCK_DB === "true";

// Development-only in-memory store. It contains only data entered by the
// current user; it must never invent candidate history, skills, or scores.
const inMemoryProfiles: Map<string, any> = new Map();

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "CANDIDATE") {
      return jsonError("Candidate access required", 403);
    }

    try {
      const candidateProfile = await prisma.candidateProfile.findUnique({
        where: { userId: session.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              phoneNumber: true,
            },
          },
          applications: {
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: { select: { name: true, logoUrl: true } },
                  location: true,
                },
              },
            },
          },
        },
      });

      if (candidateProfile) {
        return NextResponse.json({ success: true, profile: candidateProfile });
      }
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to load candidate profile.");
      }
    }

    if (!allowMockFallbacks) {
      return NextResponse.json({ success: true, profile: null });
    }

    if (!inMemoryProfiles.has(session.id)) {
      inMemoryProfiles.set(session.id, {
        id: session.id,
        userId: session.id,
        name: session.name || "",
        email: session.email,
        headline: "",
        bio: "",
        location: "",
        skills: [],
        experienceYears: 0,
        hireGoScore: null,
        isVerified: false,
        resumeUrl: null,
        education: [],
        experience: [],
        preferences: {},
        applications: [],
      });
    }

    return NextResponse.json({
      success: true,
      profile: inMemoryProfiles.get(session.id),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }
    if (session.role !== "CANDIDATE") {
      return jsonError("Candidate access required", 403);
    }

    const body = await req.json();

    try {
      const existing = await prisma.candidateProfile.findUnique({ where: { userId: session.id } });
      const existingPreferences = existing?.preferences && typeof existing.preferences === "object" && !Array.isArray(existing.preferences)
        ? (existing.preferences as Record<string, unknown>)
        : {};
      const nextPreferences = body.preferences !== undefined || body.linkedinUrl
        ? { ...existingPreferences, ...(body.preferences || {}), ...(body.linkedinUrl ? { linkedinUrl: body.linkedinUrl } : {}) }
        : undefined;

      const updated = await prisma.$transaction(async (tx) => {
        if (body.fullName || body.name || body.phone || body.phoneNumber) {
          await tx.user.update({
            where: { id: session.id },
            data: {
              ...(body.fullName || body.name ? { name: body.fullName || body.name } : {}),
              ...(body.phone || body.phoneNumber ? { phoneNumber: body.phone || body.phoneNumber } : {}),
            },
          });
        }

        return tx.candidateProfile.upsert({
          where: { userId: session.id },
          update: {
            ...(body.headline !== undefined ? { headline: body.headline } : {}),
            ...(body.bio !== undefined ? { bio: body.bio } : {}),
            ...(body.location !== undefined ? { location: body.location } : {}),
            ...(body.skills !== undefined ? { skills: body.skills } : {}),
            ...(body.experienceYears !== undefined ? { experienceYears: Number(body.experienceYears) || 0 } : {}),
            ...(body.resumeUrl !== undefined ? { resumeUrl: body.resumeUrl } : {}),
            ...(body.education !== undefined ? { education: body.education } : {}),
            ...(body.experience !== undefined ? { experience: body.experience } : {}),
            ...(nextPreferences !== undefined ? { preferences: nextPreferences } : {}),
          },
          create: {
            userId: session.id,
            headline: body.headline || "",
            bio: body.bio || "",
            location: body.location || "",
            skills: body.skills || [],
            experienceYears: Number(body.experienceYears) || 0,
            resumeUrl: body.resumeUrl || null,
            education: body.education || [],
            experience: body.experience || [],
            preferences: nextPreferences || {},
          },
        });
      });

      return NextResponse.json({ success: true, profile: updated });
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to update candidate profile.");
      }
      const existing = inMemoryProfiles.get(session.id) || {
        id: session.id,
        userId: session.id,
        name: session.name,
        email: session.email,
      };

      const merged = {
        ...existing,
        ...body,
        skills: body.skills !== undefined ? body.skills : existing.skills,
        education: body.education !== undefined ? body.education : existing.education,
        experience: body.experience !== undefined ? body.experience : existing.experience,
        preferences: body.preferences !== undefined
          ? { ...(existing.preferences || {}), ...body.preferences }
          : existing.preferences,
      };

      inMemoryProfiles.set(session.id, merged);

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        profile: merged,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
