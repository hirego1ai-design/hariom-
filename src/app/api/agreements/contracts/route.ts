import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { getSessionCompany, requireAdminSession, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

// Guard: Tenant isolation enforced via authoritative EmployerProfile.companyId → Company FK boundary
export async function GET(req: NextRequest) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company");
    const status = searchParams.get("status");

    let list = await agreementsDb.getAgreements();

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      list = list.filter((agreement) => agreement.companyId === company.id);
    }

    if (company) {
      list = list.filter((a) => a.companyName.toLowerCase().includes(company.toLowerCase()));
    }

    if (status) {
      list = list.filter((a) => a.status === status);
    }

    return NextResponse.json({ success: true, count: list.length, agreements: list });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const body = await req.json();

    const targetCompany = await prisma.company.findUnique({ where: { id: String(body.companyId || "") } });
    if (!targetCompany) {
      return NextResponse.json({ success: false, error: "A valid companyId is required." }, { status: 400 });
    }

    if (!body.clientEmail) {
      return NextResponse.json(
        { success: false, error: "Client email is required." },
        { status: 400 }
      );
    }

    if (body.requirementId) {
      const requirement = await prisma.hiringRequirement.findUnique({ where: { id: String(body.requirementId) } });
      if (!requirement || requirement.companyId !== targetCompany.id) {
        return NextResponse.json({ success: false, error: "Requirement does not belong to the selected company." }, { status: 403 });
      }
    }

    // Default 1-year validity if not specified
    const startDate = body.validityStartDate || new Date().toISOString();
    const endDate =
      body.validityEndDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const newAgreement = await agreementsDb.createAgreement({
      requirementId: body.requirementId,
      templateId: body.templateId,
      companyId: targetCompany.id,
      companyName: targetCompany.name,
      clientLegalName: body.clientLegalName || targetCompany.name,
      contactPerson: body.contactPerson || "Hiring Manager",
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone || "",
      feeType: body.feeType || "PERCENTAGE",
      feeValue: Number(body.feeValue) || 8.33,
      invoiceRule: body.invoiceRule || "ON_JOINING",
      replacementDays: Number(body.replacementDays) || 90,
      validityStartDate: startDate,
      validityEndDate: endDate,
      advancePaymentAmount: Number(body.advancePaymentAmount) || 0,
      discountPercentage: Number(body.discountPercentage) || 0,
      creditDays: Number(body.creditDays) || 15,
      taxRatePct: Number(body.taxRatePct) || 18.0,
      customClauses: Array.isArray(body.customClauses) ? body.customClauses : [],
      commercialNotes: body.commercialNotes || "",
      salesExecutiveNotes: body.salesExecutiveNotes || "",
    });

    return NextResponse.json({
      success: true,
      message: "Commercial agreement drafted successfully.",
      agreement: newAgreement,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
