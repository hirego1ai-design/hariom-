import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError, type UserSession } from "@/lib";
import { prisma } from "@/lib/prisma";


function isEmployerSession(session: UserSession | null): session is UserSession {
  return !!session && (session.role === "EMPLOYER" || session.role === "RECRUITER");
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!isEmployerSession(session)) {
      return jsonError("Employer or recruiter access required", 403);
    }

    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
      include: { company: true },
    });

    if (!employerProfile) {
      return jsonError("Employer profile not found. Please complete registration.", 404);
    }

    return NextResponse.json({
      success: true,
      company: employerProfile.company,
      employer: {
        id: employerProfile.id,
        designation: employerProfile.designation,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!isEmployerSession(session)) {
      return jsonError("Employer or recruiter access required", 403);
    }

    const body = await req.json();

    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
    });

    if (!employerProfile?.companyId) {
      return jsonError("Employer company profile not found.", 404);
    }

    const updated = await prisma.company.update({
      where: { id: employerProfile.companyId },
      data: {
        name: body.name,
        website: body.website,
        description: body.description,
        industry: body.industry,
        size: body.size,
        location: body.location,
        logoUrl: body.logoUrl,
      },
    });

    if (body.designation) {
      await prisma.employerProfile.update({
        where: { id: employerProfile.id },
        data: { designation: body.designation },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Company profile updated successfully",
      company: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
