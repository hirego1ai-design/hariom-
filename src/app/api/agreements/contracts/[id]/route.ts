import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agreement = await agreementsDb.getAgreementById(id);
    if (!agreement) {
      return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
    }

    const events = await agreementsDb.getEventsByAgreementId(agreement.id);
    let linkedRequirement = null;
    if (agreement.requirementId) {
      linkedRequirement = await agreementsDb.getRequirementById(agreement.requirementId);
    }

    return NextResponse.json({
      success: true,
      agreement,
      events,
      linkedRequirement,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const performedBy = body.performedBy || "Sales Executive";
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = body.action;

    if (action === "accept") {
      const signerName = body.signedByName || "Authorized Signatory";
      const designation = body.signedByDesignation || "Director / Talent Leader";
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
      const notes = body.amendmentNotes || "Requested commercial terms adjustment.";
      const performedBy = body.performedBy || "Employer Representative";

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
      const updated = await agreementsDb.updateAgreement(
        id,
        { status: "SENT_TO_EMPLOYER" },
        body.performedBy || "Sales Lead",
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
