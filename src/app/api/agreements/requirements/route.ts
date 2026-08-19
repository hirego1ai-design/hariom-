import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    let requirements = await agreementsDb.getRequirements();
    if (session.role !== "ADMIN") {
      try {
        const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id }, include: { company: true } });
        if (!profile) return NextResponse.json({ success: false, error: "Employer profile not found" }, { status: 404 });
        requirements = requirements.filter((item) => item.companyName.toLowerCase() === profile.company.name.toLowerCase());
      } catch {
        if (process.env.NODE_ENV === "production") throw new Error("Employer profile database is unavailable.");
        // Development mode can use the in-memory requirements store without PostgreSQL.
      }
    }
    return NextResponse.json({ success: true, count: requirements.length, requirements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session || !["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
    if (session.role !== "ADMIN") {
      try {
        const profile = await prisma.employerProfile.findUnique({ where: { userId: session.id }, include: { company: true } });
        if (!profile || profile.company.name.toLowerCase() !== String(body.companyName).trim().toLowerCase()) return NextResponse.json({ success: false, error: "Company does not match the signed-in employer." }, { status: 403 });
      } catch {
        if (process.env.NODE_ENV === "production") throw new Error("Employer profile database is unavailable.");
        // Development mode can create an in-memory requirement before the database is connected.
      }
    }

    const newReq = await agreementsDb.createRequirement({
      companyName: body.companyName,
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
