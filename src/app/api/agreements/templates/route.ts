import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import { requireAdminSession, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { createAdminAgreementTemplate } from "@/lib/adminAgreementTemplateMutations";
import { z } from "zod";

export const agreementTemplateMutationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  category: z.string().trim().min(1).max(100),
  feeType: z.enum(["PERCENTAGE", "FIXED"]),
  feeValue: z.number().finite().positive().max(1_000_000_000),
  invoiceRule: z.enum(["ON_OFFER", "ON_JOINING", "DAY_25", "DAY_30", "SPLIT_50_50"]),
  replacementDays: z.number().int().min(0).max(3650),
  validityMonths: z.number().int().min(1).max(120),
  advancePayment: z.number().finite().min(0).max(1_000_000_000),
  creditTermsDays: z.number().int().min(0).max(365),
  standardDiscountPct: z.number().finite().min(0).max(100),
  taxRatePct: z.number().finite().min(0).max(100),
  specialClauses: z.array(z.string().trim().min(1).max(10_000)).max(100),
  commercialNotes: z.string().trim().max(10_000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.feeType === "PERCENTAGE" && value.feeValue > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["feeValue"], message: "Percentage fee cannot exceed 100%." });
  }
});

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
    const body = await readValidatedJson(req, agreementTemplateMutationSchema, 128 * 1024);

    const template = await createAdminAgreementTemplate(body, {
      actorId: session.id,
      ipAddress: getClientIp(req),
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
