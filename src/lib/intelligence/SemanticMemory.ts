import crypto from "crypto";
import { MemoryType, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createEmbedding, EmbeddingUnavailableError } from "@/lib/intelligence/EmbeddingDispatcher";
import { assertIntelligenceScopeAccess, IntelligenceActor, IntelligenceScope } from "@/lib/intelligence/ScopeAuthorization";
import { intelligenceDedupeKey, redactTextForIntelligence, sanitizeIntelligenceJson } from "@/lib/intelligence/SafetyRedaction";

type SemanticRow = {
  id: string; scopeLevel: any; scopeId: string; agentId: string; sourceType: string; sourceId: string | null;
  content: string; metadata: unknown; embeddingModel: string; embeddingDimensions: number;
  expiresAt: Date | null; similarity: number; createdAt: Date;
};

function vectorLiteral(vector: number[]): string {
  if (!Array.isArray(vector) || vector.length < 8 || vector.some((value) => !Number.isFinite(value))) throw new EmbeddingUnavailableError("Invalid semantic vector.");
  return `[${vector.map((value) => Number(value).toString()).join(",")}]`;
}

export class SemanticMemory {
  static async remember(params: {
    actor: IntelligenceActor; scope: IntelligenceScope; agentId: string; sourceType: string; sourceId?: string | null;
    content: string; metadata?: unknown; memoryType?: MemoryType; expiresAt?: Date | null; consentState?: string; isAnonymized?: boolean;
  }): Promise<{ id: string; model: string; dimensions: number }> {
    await assertIntelligenceScopeAccess(params.actor, params.scope);
    const content = redactTextForIntelligence(params.content);
    const metadata = sanitizeIntelligenceJson(params.metadata ?? {}).value;
    const embedding = await createEmbedding(content);
    const id = crypto.randomUUID();
    const dedupeKey = intelligenceDedupeKey([params.actor.companyId ?? null, params.actor.userId, params.scope.scopeLevel, params.scope.scopeId, params.agentId, params.sourceType, params.sourceId ?? null, content, embedding.model]);
    const vector = vectorLiteral(embedding.vector);

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO "SemanticMemoryRecord"
        ("id","dedupeKey","userId","companyId","scopeLevel","scopeId","agentId","memoryType","sourceType","sourceId","content","metadata","embeddingModel","embeddingDimensions","embedding","expiresAt","isAnonymized","consentState","createdAt","updatedAt")
      VALUES
        (${id},${dedupeKey},${params.actor.userId},${params.actor.companyId ?? null},${params.scope.scopeLevel}::"MemoryScopeLevel",${params.scope.scopeId},${params.agentId},
         ${params.memoryType ?? MemoryType.KNOWLEDGE}::"MemoryType",${params.sourceType},${params.sourceId ?? null},${content},${JSON.stringify(metadata)}::jsonb,
         ${embedding.model},${embedding.dimensions},${vector}::vector,${params.expiresAt ?? null},${params.isAnonymized ?? false},${(params.consentState ?? "NOT_REQUIRED").slice(0,80)},NOW(),NOW())
      ON CONFLICT ("dedupeKey") DO UPDATE SET "content"=EXCLUDED."content","metadata"=EXCLUDED."metadata","embeddingModel"=EXCLUDED."embeddingModel","embeddingDimensions"=EXCLUDED."embeddingDimensions","embedding"=EXCLUDED."embedding","expiresAt"=EXCLUDED."expiresAt","updatedAt"=NOW()
      RETURNING "id"
    `);
    return { id: rows[0]?.id ?? id, model: embedding.model, dimensions: embedding.dimensions };
  }

  static async search(params: { actor: IntelligenceActor; scopes: IntelligenceScope[]; query: string; agentId?: string; limit?: number; minSimilarity?: number }): Promise<SemanticRow[]> {
    if (params.scopes.length === 0) return [];
    for (const scope of params.scopes) await assertIntelligenceScopeAccess(params.actor, scope);
    const embedding = await createEmbedding(redactTextForIntelligence(params.query, 4_000));
    const vector = vectorLiteral(embedding.vector);
    const limit = Math.min(Math.max(params.limit ?? 8, 1), 20);
    const minSimilarity = Math.min(Math.max(params.minSimilarity ?? 0.2, -1), 1);
    const scopeSql = Prisma.join(params.scopes.map((scope) => Prisma.sql`("scopeLevel"=${scope.scopeLevel}::"MemoryScopeLevel" AND "scopeId"=${scope.scopeId})`), " OR ");
    const companySql = params.actor.role === Role.ADMIN ? Prisma.sql`TRUE` : params.actor.companyId ? Prisma.sql`("companyId" IS NULL OR "companyId"=${params.actor.companyId})` : Prisma.sql`"companyId" IS NULL`;
    const agentSql = params.agentId ? Prisma.sql`AND "agentId"=${params.agentId}` : Prisma.empty;

    return prisma.$queryRaw<SemanticRow[]>(Prisma.sql`
      SELECT "id","scopeLevel","scopeId","agentId","sourceType","sourceId","content","metadata","embeddingModel","embeddingDimensions","expiresAt","createdAt",
             1 - ("embedding" <=> ${vector}::vector) AS "similarity"
      FROM "SemanticMemoryRecord"
      WHERE ${companySql} AND (${scopeSql}) ${agentSql}
        AND "embedding" IS NOT NULL AND "embeddingModel"=${embedding.model} AND "embeddingDimensions"=${embedding.dimensions}
        AND ("expiresAt" IS NULL OR "expiresAt">NOW())
        AND 1 - ("embedding" <=> ${vector}::vector) >= ${minSimilarity}
      ORDER BY "embedding" <=> ${vector}::vector
      LIMIT ${limit}
    `);
  }

  static async forgetScope(params: { actor: IntelligenceActor; scope: IntelligenceScope; agentId?: string }): Promise<number> {
    await assertIntelligenceScopeAccess(params.actor, params.scope);
    const result = await prisma.semanticMemoryRecord.deleteMany({ where: {
      scopeLevel: params.scope.scopeLevel, scopeId: params.scope.scopeId, ...(params.agentId ? { agentId: params.agentId } : {}),
      ...(params.actor.role === Role.ADMIN ? {} : params.actor.companyId ? { OR: [{ companyId: null }, { companyId: params.actor.companyId }] } : { companyId: null }),
    }});
    return result.count;
  }
}
