import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import { llmProviderSchema } from "@/lib/ai/AiRoutingConfig";
import {
  encryptAiProviderKey, getAiProviderCredentialAdminView, validateAiProviderEndpoint,
} from "@/lib/ai/AiProviderCredentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const saveSchema = z.object({
  provider: llmProviderSchema,
  apiKey: z.string().trim().min(8).max(4096).optional(),
  baseUrl: z.string().trim().max(2048).optional(),
  reason: z.string().trim().min(3).max(300),
}).strict().refine((input) => input.apiKey !== undefined || input.baseUrl !== undefined, {
  message: "Specify a new API key or endpoint to update.",
});
const deleteSchema = z.object({
  provider: llmProviderSchema,
  reason: z.string().trim().min(3).max(300),
}).strict();

function noStore(data: object) {
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, "ai_provider_credentials_read:" + admin.id, 30, 60_000);
    return noStore({ success: true, providers: await getAiProviderCredentialAdminView() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, "ai_provider_credentials_write:" + admin.id, 8, 60_000);
    const input = await readValidatedJson(request, saveSchema, 8 * 1024);
    const encrypted = input.apiKey ? encryptAiProviderKey(input.provider, input.apiKey) : undefined;
    let baseUrl: string | null | undefined = undefined;
    if (input.baseUrl !== undefined) {
      baseUrl = input.baseUrl ? validateAiProviderEndpoint(input.provider, input.baseUrl) : null;
    }
    await prisma.$transaction(async (tx) => {
      const prior = await tx.aiProviderCredential.findUnique({ where: { provider: input.provider } });
      if (!prior && !encrypted && baseUrl === null) {
        throw new ApiError("Nothing to change for this provider.", 422);
      }
      await tx.aiProviderCredential.upsert({
        where: { provider: input.provider },
        create: {
          provider: input.provider, apiKeyEncrypted: encrypted || null,
          baseUrl: baseUrl ?? null, updatedBy: admin.id,
        },
        update: {
          ...(encrypted ? { apiKeyEncrypted: encrypted } : {}),
          ...(baseUrl !== undefined ? { baseUrl } : {}),
          updatedBy: admin.id,
        },
      });
      const audit = await tx.auditLog.create({
        data: {
          userId: admin.id, action: "AI_PROVIDER_CREDENTIAL_UPDATED",
          resource: "AiProviderCredential:" + input.provider,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            provider: input.provider, keyRotated: Boolean(encrypted),
            endpointUpdated: baseUrl !== undefined, reason: input.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, audit, admin.id);
    });
    return noStore({ success: true, message: "Provider credential settings saved.", providers: await getAiProviderCredentialAdminView() });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Removes the admin override, not the underlying provider account's key. */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, "ai_provider_credentials_delete:" + admin.id, 5, 60_000);
    const input = await readValidatedJson(request, deleteSchema, 4 * 1024);
    await prisma.$transaction(async (tx) => {
      const removed = await tx.aiProviderCredential.deleteMany({ where: { provider: input.provider } });
      if (!removed.count) throw new ApiError("No Admin credential override exists for this provider.", 404);
      const audit = await tx.auditLog.create({
        data: {
          userId: admin.id, action: "AI_PROVIDER_CREDENTIAL_OVERRIDE_CLEARED",
          resource: "AiProviderCredential:" + input.provider,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({ provider: input.provider, reason: input.reason }),
        },
      });
      await enqueueSecurityAuditEvent(tx, audit, admin.id);
    });
    return noStore({
      success: true,
      message: "Admin override cleared. Environment credentials, if present, remain active.",
      providers: await getAiProviderCredentialAdminView(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
