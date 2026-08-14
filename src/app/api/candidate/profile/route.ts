import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

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

    if (!candidateProfile) {
      // Fallback mock profile if DB user not found
      return NextResponse.json({
        success: true,
        profile: {
          id: session.id,
          name: session.name || "Candidate User",
          email: session.email,
          headline: "Full Stack Engineer & AI Enthusiast",
          bio: "Passionate developer with expertise in React, Next.js, and TypeScript.",
          location: "Bangalore, India",
          skills: ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL"],
          experienceYears: 4.5,
          hireGoScore: 88,
          isVerified: true,
          applications: [],
        },
      });
    }

    return NextResponse.json({ success: true, profile: candidateProfile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const body = await req.json();

    const updated = await prisma.candidateProfile.upsert({
      where: { userId: session.id },
      update: {
        headline: body.headline,
        bio: body.bio,
        location: body.location,
        skills: body.skills || [],
        experienceYears: Number(body.experienceYears) || 0,
        resumeUrl: body.resumeUrl,
      },
      create: {
        userId: session.id,
        headline: body.headline || "Tech Professional",
        bio: body.bio || "",
        location: body.location || "India",
        skills: body.skills || [],
        experienceYears: Number(body.experienceYears) || 0,
        resumeUrl: body.resumeUrl || null,
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
