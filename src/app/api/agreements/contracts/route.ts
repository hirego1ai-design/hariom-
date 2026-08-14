import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company");
    const status = searchParams.get("status");

    let list = await agreementsDb.getAgreements();
    if (company) {
      list = list.filter((a) => a.companyName.toLowerCase().includes(company.toLowerCase()));
    }
    if (status) {
      list = list.filter((a) => a.status === status);
    }

    return NextResponse.json({ success: true, count: list.length, agreements: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.companyName || !body.clientEmail) {
      return NextResponse.json(
        { success: false, error: "Company name and client email are required." },
        { status: 400 }
      );
    }

    // Default 1-year validity if not specified
    const startDate = body.validityStartDate || new Date().toISOString();
    const endDate =
      body.validityEndDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const newAgreement = await agreementsDb.createAgreement({
      requirementId: body.requirementId,
      templateId: body.templateId,
      companyName: body.companyName,
      clientLegalName: body.clientLegalName || body.companyName,
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
