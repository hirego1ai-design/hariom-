import { Role, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeIntelligenceJson } from "@/lib/intelligence/SafetyRedaction";

export class LearningEventStore {
  static async record(params: {
    idempotencyKey: string; correlationId: string; actorUserId?: string | null; actorRole?: Role | null; companyId?: string | null;
    channel: string; feature: string; task: string; modelProvider?: string | null; modelId?: string | null; promptVersion?: string | null;
    evidenceRefs?: unknown; aiOutput?: unknown; correction?: unknown; acceptedResult?: unknown; outcome?: unknown; explicitRating?: number | null; consentState?: string;
  }) {
    const fields = {
      evidenceRefs: sanitizeIntelligenceJson(params.evidenceRefs ?? null),
      aiOutput: sanitizeIntelligenceJson(params.aiOutput ?? null),
      correction: sanitizeIntelligenceJson(params.correction ?? null),
      acceptedResult: sanitizeIntelligenceJson(params.acceptedResult ?? null),
      outcome: sanitizeIntelligenceJson(params.outcome ?? null),
    };
    const asJson = (value: unknown) => value === null ? Prisma.JsonNull : value as Prisma.InputJsonValue;
    const rating = params.explicitRating == null ? null : Math.min(5, Math.max(1, Math.round(params.explicitRating)));
    const key = params.idempotencyKey.trim().slice(0,240);
    return prisma.learningEvent.upsert({
      where: { idempotencyKey: key },
      create: {
        idempotencyKey: key, correlationId: params.correlationId.trim().slice(0,240), actorUserId: params.actorUserId ?? null, actorRole: params.actorRole ?? null,
        companyId: params.companyId ?? null, channel: params.channel.trim().slice(0,80), feature: params.feature.trim().slice(0,120), task: params.task.trim().slice(0,120),
        modelProvider: params.modelProvider?.trim().slice(0,80) ?? null, modelId: params.modelId?.trim().slice(0,200) ?? null, promptVersion: params.promptVersion?.trim().slice(0,120) ?? null,
        evidenceRefs: asJson(fields.evidenceRefs.value), aiOutput: asJson(fields.aiOutput.value), correction: asJson(fields.correction.value),
        acceptedResult: asJson(fields.acceptedResult.value), outcome: asJson(fields.outcome.value), explicitRating: rating,
        consentState: (params.consentState ?? "NOT_REQUIRED").slice(0,80), containsSensitiveData: false,
      },
      update: {},
    });
  }
}
