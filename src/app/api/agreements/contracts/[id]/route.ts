import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agreementsDb } from "@/lib/agreements-db";
import { assertCompanyIdAccess, requireAdminSession, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { ApiError, handleApiError, readValidatedJson } from "@/lib/apiSecurity";

const agreementUpdateSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  clientLegalName: z.string().min(1).max(200).optional(),
  contactPerson: z.string().min(1).max(200).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().max(40).optional(),
  feeType: z.enum(["PERCENTAGE", "FIXED", "SLAB"]).optional(),
  feeValue: z.number().finite().nonnegative().optional(),
  invoiceRule: z.string().min(1).max(200).optional(),
  replacementDays: z.number().int().min(0).max(365).optional(),
  validityStartDate: z.string().datetime().optional(),
  validityEndDate: z.string().datetime().optional(),
  advancePaymentAmount: z.number().finite().nonnegative().optional(),
  discountPercentage: z.number().finite().min(0).max(100).optional(),
  creditDays: z.number().int().min(0).max(365).optional(),
  taxRatePct: z.number().finite().min(0).max(100).optional(),
  customClauses: z.array(z.string().max(10_000)).max(100).optional(),
  commercialNotes: z.string().max(10_000).optional(),
  salesExecutiveNotes: z.string().max(10_000).optional(),
  note: z.string().max(2_000).optional(),
}).strict();

const agreementActionSchema = z.object({
  action: z.enum(["accept", "request_amendment", "send_to_employer"]),
  signedByName: z.string().trim().min(2).max(200).optional(),
  signedByDesignation: z.string().trim().min(2).max(200).optional(),
  amendmentNotes: z.string().trim().min(2).max(10_000).optional(),
}).strict();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
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
    const session = await requireAdminSession(req);
    const { id } = await params;
    const agreement = await agreementsDb.getAgreementById(id);
    if (!agreement) {
      return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
    }
    await assertCompanyIdAccess(session, agreement.companyId);
    const body = await readValidatedJson(req, agreementUpdateSchema);
    const performedBy = session.name || session.email;
    const note = body.note || undefined;

    const { note: _note, ...updates } = body;
    const updated = await agreementsDb.updateAgreement(id, updates, performedBy, note);
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
    const session = await requireEmployerOrAdminSession(req);
    const { id } = await params;
    const body = await readValidatedJson(req, agreementActionSchema);
    const action = body.action;
    const agreement = await agreementsDb.getAgreementById(id);
    if (!agreement) {
      return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
    }
    await assertCompanyIdAccess(session, agreement.companyId);

    if (action === "accept") {
      if (session.role === "ADMIN") {
        throw new ApiError("Administrators may send agreements but cannot sign on behalf of an employer.", 403);
      }
      if (agreement.status !== "SENT_TO_EMPLOYER") {
        return NextResponse.json({ success: false, error: "Agreement must be sent to the employer before acceptance." }, { status: 409 });
      }
      const signerName = body.signedByName;
      const designation = body.signedByDesignation;
      if (!signerName || !designation) throw new ApiError("Signer name and designation are required.", 422);
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
      if (session.role === "ADMIN") {
        throw new ApiError("Administrators may revise and resend agreements; they cannot request employer amendments.", 403);
      }
      if (agreement.status !== "SENT_TO_EMPLOYER") {
        return NextResponse.json({ success: false, error: "Agreement must be sent to the employer before requesting an amendment." }, { status: 409 });
      }
      const notes = body.amendmentNotes;
      if (!notes) throw new ApiError("Amendment notes are required.", 422);
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
