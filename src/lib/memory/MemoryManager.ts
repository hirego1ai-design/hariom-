import { prisma } from '@/lib/prisma';
import { AgentMemoryRecord, MemoryType, MemoryScopeLevel, Prisma } from '@prisma/client';

export class MemoryManager {
  /**
   * Sets a memory record for one of the 3 allowed memory layers: WORKING, DOMAIN, or KNOWLEDGE.
   * Business state is NOT stored here; it lives in PostgreSQL business tables.
   */
  static async setMemory(params: {
    memoryType: MemoryType;
    scopeLevel: MemoryScopeLevel;
    scopeId: string;
    companyId?: string | null;
    agentId: string;
    key: string;
    value: unknown;
    ttlSeconds?: number;
  }): Promise<AgentMemoryRecord> {
    const expiresAt = params.ttlSeconds ? new Date(Date.now() + params.ttlSeconds * 1000) : null;

    try {
      return await prisma.agentMemoryRecord.upsert({
        where: {
          scopeLevel_scopeId_agentId_key: {
            scopeLevel: params.scopeLevel,
            scopeId: params.scopeId,
            agentId: params.agentId,
            key: params.key,
          },
        },
        update: {
          memoryType: params.memoryType,
          value: params.value as Prisma.InputJsonValue,
          ttlSeconds: params.ttlSeconds,
          expiresAt,
          companyId: params.companyId,
        },
        create: {
          memoryType: params.memoryType,
          scopeLevel: params.scopeLevel,
          scopeId: params.scopeId,
          agentId: params.agentId,
          key: params.key,
          value: params.value as Prisma.InputJsonValue,
          ttlSeconds: params.ttlSeconds,
          expiresAt,
          companyId: params.companyId,
        },
      });
    } catch {
      // Offline fallback
      return {
        id: `mem-${Date.now()}`,
        memoryType: params.memoryType,
        scopeLevel: params.scopeLevel,
        scopeId: params.scopeId,
        companyId: params.companyId || null,
        agentId: params.agentId,
        key: params.key,
        value: params.value as Prisma.JsonValue,
        ttlSeconds: params.ttlSeconds || null,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAnonymized: false,
      };
    }
  }

  /**
   * Gets a memory record. Checks expiration if ttl/expiresAt was set.
   */
  static async getMemory(params: {
    scopeLevel: MemoryScopeLevel;
    scopeId: string;
    agentId: string;
    key: string;
  }): Promise<AgentMemoryRecord | null> {
    const record = await prisma.agentMemoryRecord.findUnique({
      where: {
        scopeLevel_scopeId_agentId_key: {
          scopeLevel: params.scopeLevel,
          scopeId: params.scopeId,
          agentId: params.agentId,
          key: params.key,
        },
      },
    });

    if (!record) return null;

    if (record.expiresAt && record.expiresAt < new Date()) {
      // Expired memory
      await prisma.agentMemoryRecord.delete({ where: { id: record.id } }).catch(() => {});
      return null;
    }

    return record;
  }

  /**
   * Deletes a specific memory key.
   */
  static async deleteMemory(params: {
    scopeLevel: MemoryScopeLevel;
    scopeId: string;
    agentId: string;
    key: string;
  }): Promise<void> {
    await prisma.agentMemoryRecord
      .delete({
        where: {
          scopeLevel_scopeId_agentId_key: {
            scopeLevel: params.scopeLevel,
            scopeId: params.scopeId,
            agentId: params.agentId,
            key: params.key,
          },
        },
      })
      .catch(() => {});
  }

  /**
   * Clears all WORKING memory for an agent execution once task completes.
   */
  static async clearWorkingMemory(agentId: string, scopeId: string): Promise<number> {
    const deleted = await prisma.agentMemoryRecord.deleteMany({
      where: {
        agentId,
        scopeId,
        memoryType: 'WORKING',
      },
    });
    return deleted.count;
  }
}
