import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requirement = await agreementsDb.getRequirementById(id);
    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "Requirement not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, requirement });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await agreementsDb.updateRequirementStatus(
      id,
      body.status,
      body.assignedSalesLead,
      body.activeAgreementId
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Requirement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Requirement updated successfully",
      requirement: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
