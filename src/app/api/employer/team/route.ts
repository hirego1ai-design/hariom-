import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError, type UserSession } from "@/lib";
import { prisma } from "@/lib/prisma";

const allowMockFallbacks = process.env.NODE_ENV === "development" && process.env.MOCK_DB === "true";

function isEmployerSession(session: UserSession | null): session is UserSession {
  return !!session && (session.role === "EMPLOYER" || session.role === "RECRUITER");
}

// Fallback in-memory team members store
const inMemoryTeamMembers: Array<{
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  status: string;
  joinedAt: string;
}> = [
  {
    id: "team-1",
    name: "Alex Rivera",
    email: "alex.rivera@hirego.ai",
    role: "ADMIN",
    designation: "Head of Talent Acquisition",
    status: "ACTIVE",
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "team-2",
    name: "Sarah Jenkins",
    email: "sarah.j@hirego.ai",
    role: "RECRUITER",
    designation: "Senior Technical Recruiter",
    status: "ACTIVE",
    joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "team-3",
    name: "Marcus Chen",
    email: "marcus.chen@hirego.ai",
    role: "RECRUITER",
    designation: "Hiring Manager (Engineering)",
    status: "INVITED",
    joinedAt: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!isEmployerSession(session)) {
      return jsonError("Employer or recruiter access required", 403);
    }

    try {
      const employer = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
      });

      if (employer?.companyId) {
        const team = await prisma.employerProfile.findMany({
          where: { companyId: employer.companyId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
              },
            },
          },
        });

        if (team && team.length > 0) {
          return NextResponse.json({
            success: true,
            team: team.map((member) => ({
              id: member.id,
              userId: member.user?.id,
              name: member.user?.name || "Team Member",
              email: member.user?.email,
              role: member.user?.role,
              designation: member.designation || "Recruiter",
              status: "ACTIVE",
              joinedAt: member.createdAt,
            })),
          });
        }
      }
    } catch (error) {
      if (!allowMockFallbacks) throw error;
    }

    if (!allowMockFallbacks) return jsonError("No team members found", 404);
    return NextResponse.json({
      success: true,
      team: inMemoryTeamMembers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!isEmployerSession(session)) {
      return jsonError("Employer or recruiter access required", 403);
    }

    const body = await req.json();
    const { name, email, designation, role } = body;

    if (!email || !name) {
      return jsonError("Name and email are required", 400);
    }

    if (!allowMockFallbacks) {
      return jsonError("Team invitations require the production invitation service.", 503);
    }

    const newMember = {
      id: `team-${Date.now()}`,
      name,
      email,
      designation: designation || "Recruiter",
      role: role || "RECRUITER",
      status: "INVITED",
      joinedAt: new Date().toISOString(),
    };

    inMemoryTeamMembers.push(newMember);

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      member: newMember,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!isEmployerSession(session)) {
      return jsonError("Employer or recruiter access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return jsonError("Member ID is required", 400);
    }

    if (!allowMockFallbacks) {
      return jsonError("Team access changes require the production invitation service.", 503);
    }

    const idx = inMemoryTeamMembers.findIndex((m) => m.id === memberId);
    if (idx !== -1) {
      inMemoryTeamMembers.splice(idx, 1);
    }

    return NextResponse.json({
      success: true,
      message: "Team member access revoked",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
