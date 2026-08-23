import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

// Guard: Tenant isolation enforced via authoritative EmployerProfile.companyId → Company FK boundary
export async function GET(req: NextRequest) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    let requirements = await agreementsDb.getRequirements();
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      requirements = requirements.filter((requirement) => requirement.companyId === company.id);
    }
    return NextResponse.json({ success: true, count: requirements.length, requirements });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    const body = await req.json();

    // Validation for core fields
    const requiredFields = ["companyName", "contactPerson", "email", "primaryMobile"];
    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    const targetCompany = session.role === "ADMIN"
      ? await prisma.company.findUnique({ where: { id: String(body.companyId || "") } })
      : await getSessionCompany(session);
    if (!targetCompany) {
      return NextResponse.json({ success: false, error: "A valid companyId is required." }, { status: 400 });
    }

    const newReq = await agreementsDb.createRequirement({
      companyId: targetCompany.id,
      companyName: targetCompany.name,
      contactPerson: body.contactPerson,
      email: body.email,
      primaryMobile: body.primaryMobile,
      secondaryMobile: body.secondaryMobile || body.alternatePhone || "",
      gstin: body.gstin || body.gst || "",
      pan: body.pan || "",
      billingAddress: body.billingAddress || "",
      industry: body.industry || "Information Technology",
      numberOfPositions: Number(body.numberOfPositions) || 1,
      jobTitles: Array.isArray(body.jobTitles)
        ? body.jobTitles
        : typeof body.jobTitles === "string"
        ? body.jobTitles.split(",").map((s: string) => s.trim())
        : ["Software Engineer"],
      experienceYears: body.experienceYears || "0-3 Years",
      skillsRequired: Array.isArray(body.mandatorySkills)
        ? body.mandatorySkills
        : Array.isArray(body.skillsRequired)
        ? body.skillsRequired
        : typeof body.skillsRequired === "string"
        ? body.skillsRequired.split(",").map((s: string) => s.trim())
        : [],
      education: body.education || "Bachelor's Degree",
      certifications: body.certifications || "",
      salaryRangeMin: Number(body.salaryRangeMin || body.budgetMin) || 0,
      salaryRangeMax: Number(body.salaryRangeMax || body.budgetMax) || 0,
      currency: body.currency || "INR",
      workMode: body.workMode || "Hybrid",
      location: body.location || "Remote",
      joiningTimeline: body.joiningTimeline || "Immediate to 30 Days",
      hiringPriority: body.hiringPriority || "Standard",
      replacementExpectation: body.replacementExpectation || "90 Days",
      additionalNotes: body.additionalNotes || body.notes || "",
      jdFileName: body.jdFileName,
      jdFileUrl: body.jdFileUrl,
      assignedSalesLead: undefined,
      activeAgreementId: undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Hiring requirement submitted successfully.",
      referenceCode: newReq.referenceCode,
      requirement: newReq,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
