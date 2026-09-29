import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { requireAdminSession, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { createAdminAgreementTemplate } from "@/lib/adminAgreementTemplateMutations";
import { agreementTemplateCreateSchema } from "@/lib/agreementTemplateContracts";

export async function GET(req: NextRequest) {
  try {
    const session = await requireEmployerOrAdminSession(req);
    await enforceRateLimit(req, `agreement_templates_read:${session.id}`, 60, 60_000);
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
    const session = await requireAdminSession(req);
    await enforceRateLimit(req, `agreement_templates_create:${session.id}`, 20, 60_000);
    const body = await readValidatedJson(req, agreementTemplateCreateSchema, 128 * 1024);
    const { reason, ...templateInput } = body;

    const template = await createAdminAgreementTemplate(templateInput, {
      actorId: session.id,
      ipAddress: getClientIp(req),
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "Agreement template created successfully",
      template,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
