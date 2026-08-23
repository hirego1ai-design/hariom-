import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { assertCompanyIdAccess, requireAdminSession, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    const { id } = await params;
    const requirement = await agreementsDb.getRequirementById(id);
    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "Requirement not found" },
        { status: 404 }
      );
    }
    await assertCompanyIdAccess(session, requirement.companyId);
    return NextResponse.json({ success: true, requirement });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession(req);
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
  } catch (error) {
    return handleApiError(error);
  }
}
