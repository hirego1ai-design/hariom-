import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { requireAdminSession, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import {
  archiveAdminAgreementTemplate,
  duplicateAdminAgreementTemplate,
  updateAdminAgreementTemplate,
} from "@/lib/adminAgreementTemplateMutations";
import {
  agreementTemplateActionSchema,
  agreementTemplateUpdateSchema,
} from "@/lib/agreementTemplateContracts";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, `agreement_template_read:${session.id}`, 60, 60_000);
    const { id } = await params;
    const template = await agreementsDb.getTemplateById(id);
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, template });
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
    await enforceRateLimit(req, `agreement_template_update:${session.id}`, 20, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(req, agreementTemplateUpdateSchema, 128 * 1024);
    const { expectedUpdatedAt, ...templateInput } = body;

    const updated = await updateAdminAgreementTemplate(
      id,
      templateInput,
      expectedUpdatedAt,
      { actorId: session.id, ipAddress: getClientIp(req) },
    );
    if (!updated) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Template updated successfully",
      template: updated,
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
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `agreement_template_duplicate:${session.id}`, 10, 60_000);
    const { id } = await params;
    await readValidatedJson(req, agreementTemplateActionSchema);

    const duplicated = await duplicateAdminAgreementTemplate(id, {
      actorId: session.id,
      ipAddress: getClientIp(req),
    });
    if (!duplicated) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: "Template duplicated successfully",
      template: duplicated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `agreement_template_archive:${session.id}`, 10, 60_000);
    const { id } = await params;
    const archived = await archiveAdminAgreementTemplate(id, {
      actorId: session.id,
      ipAddress: getClientIp(req),
    });
    if (!archived) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: "Template archived successfully",
      template: archived,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
