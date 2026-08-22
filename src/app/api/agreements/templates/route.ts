import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { requireAdminSession, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    requireEmployerOrAdminSession(req);
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const templates = await agreementsDb.getTemplates(includeArchived);
    return NextResponse.json({ success: true, count: templates.length, templates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdminSession(req);
    const body = await req.json();

    if (!body.name || !body.category) {
      return NextResponse.json(
        { success: false, error: "Template name and category are required." },
        { status: 400 }
      );
    }

    const newTpl = await agreementsDb.createTemplate({
      name: body.name,
      description: body.description || "",
      category: body.category || "Custom",
      feeType: body.feeType || "PERCENTAGE",
      feeValue: Number(body.feeValue) || 8.33,
      invoiceRule: body.invoiceRule || "ON_JOINING",
      replacementDays: Number(body.replacementDays) || 90,
      validityMonths: Number(body.validityMonths) || 12,
      advancePayment: Number(body.advancePayment) || 0,
      creditTermsDays: Number(body.creditTermsDays) || 15,
      standardDiscountPct: Number(body.standardDiscountPct) || 0,
      taxRatePct: Number(body.taxRatePct) || 18.0,
      specialClauses: Array.isArray(body.specialClauses) ? body.specialClauses : [],
      commercialNotes: body.commercialNotes || "",
      isArchived: false,
    });

    return NextResponse.json({
      success: true,
      message: "Agreement template created successfully",
      template: newTpl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
