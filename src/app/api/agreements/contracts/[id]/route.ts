import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { assertCompanyIdAccess, requireAdminSession, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireEmployerOrAdminSession(req);
    const { id } = await params;
    const agreement = await agreementsDb.getAgreementById(id);
    if (!agreement) {
      return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
    }
    await assertCompanyIdAccess(session, agreement.companyId);

    const events = await agreementsDb.getEventsByAgreementId(agreement.id);
    let linkedRequirement = null;
    if (agreement.requirementId) {
      linkedRequirement = await agreementsDb.getRequirementById(agreement.requirementId);
      if (linkedRequirement?.companyId !== agreement.companyId) linkedRequirement = null;
    }

    return NextResponse.json({
      success: true,
      agreement,
      events,
      linkedRequirement,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireEmployerOrAdminSession(req);
    const { id } = await params;
    const body = await req.json();
    const performedBy = session.name || session.email;
    const note = body.note || undefined;

    const updated = await agreementsDb.updateAgreement(id, body.updates || body, performedBy, note);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Agreement updated successfully",
      agreement: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAdminSession(req);
    const { id } = await params;
    const body = await req.json();
    const action = body.action;
    const agreement = await agreementsDb.getAgreementById(id);
    if (!agreement) {
      return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
    }
    await assertCompanyIdAccess(session, agreement.companyId);

    if (action === "accept") {
      if (session.role !== "ADMIN" && agreement.status !== "SENT_TO_EMPLOYER") {
        return NextResponse.json({ success: false, error: "Agreement must be sent to the employer before acceptance." }, { status: 409 });
      }
      const signerName = session.name || "Authorized Signatory";
      const designation = session.role === "ADMIN" ? "Administrator" : "Authorized Employer Representative";
      const ipAddress =
        req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

      const signed = await agreementsDb.acceptAgreement(id, signerName, designation, ipAddress);
      if (!signed) {
        return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Commercial agreement successfully accepted and activated.",
        agreement: signed,
      });
    }

    if (action === "request_amendment") {
      if (session.role !== "ADMIN" && agreement.status !== "SENT_TO_EMPLOYER") {
        return NextResponse.json({ success: false, error: "Agreement must be sent to the employer before requesting an amendment." }, { status: 409 });
      }
      const notes = body.amendmentNotes || "Requested commercial terms adjustment.";
      const performedBy = session.name || session.email;

      const amended = await agreementsDb.requestAmendment(id, notes, performedBy);
      if (!amended) {
        return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Amendment request recorded and forwarded to sales.",
        agreement: amended,
      });
    }

    if (action === "send_to_employer") {
      if (session.role !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Administrator access required." }, { status: 403 });
      }
      const updated = await agreementsDb.updateAgreement(
        id,
        { status: "SENT_TO_EMPLOYER" },
        session.name || session.email,
        "Dispatched finalized commercial agreement to client."
      );
      if (!updated) {
        return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Agreement successfully sent to employer portal.",
        agreement: updated,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
