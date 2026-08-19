import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

const allowMockFallbacks = process.env.NODE_ENV !== "production" || process.env.MOCK_DB === "true";

// Fallback in-memory company store
let inMemoryCompany = {
  id: "comp-1",
  name: "HireGo Enterprises Ltd",
  logoUrl: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150",
  website: "https://hirego.ai",
  description: "Next-generation AI recruitment and workforce intelligence platform.",
  industry: "Information Technology & AI",
  size: "50-200 Employees",
  location: "Bangalore, India",
};

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    try {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
        include: { company: true },
      });

      if (employerProfile?.company) {
        return NextResponse.json({
          success: true,
          company: employerProfile.company,
          employer: {
            id: employerProfile.id,
            designation: employerProfile.designation,
          },
        });
      }
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to load employer company profile.");
      }
    }

    if (!allowMockFallbacks) {
      return NextResponse.json({
        success: true,
        company: null,
        employer: null,
      });
    }

    return NextResponse.json({
      success: true,
      company: inMemoryCompany,
      employer: {
        id: "emp-1",
        designation: "Talent Acquisition Lead",
      },
    });
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

    try {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
      });

      if (employerProfile?.companyId) {
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

        return NextResponse.json({ success: true, company: updated });
      }
    } catch {
      if (!allowMockFallbacks) {
        throw new Error("Failed to update employer company profile.");
      }
    }

    inMemoryCompany = {
      ...inMemoryCompany,
      ...body,
    };

    return NextResponse.json({
      success: true,
      message: "Company profile updated successfully",
      company: inMemoryCompany,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
