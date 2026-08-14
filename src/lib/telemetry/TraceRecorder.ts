import { prisma } from '@/lib/prisma';
import { TraceRecord, Prisma } from '@prisma/client';

export class TraceRecorder {
  static async record(
    params: {
      traceId: string;
      correlationId: string;
      executionId?: string;
      companyId?: string | null;
      jobId?: string | null;
      candidateId?: string | null;
      agentId?: string;
      workflowId?: string;
      stepName?: string;
      provider?: string;
      model?: string;
      promptTokens?: number;
      completionTokens?: number;
      costMinorUnits?: bigint;
      latencyMs?: number;
      status: string;
      toolCalls?: unknown;
      metadata?: Record<string, unknown>;
    },
    tx?: any
  ): Promise<TraceRecord> {
    const db = tx || prisma;
    try {
      return await db.traceRecord.upsert({
        where: { traceId: params.traceId },
        update: {
          status: params.status,
          promptTokens: params.promptTokens ?? 0,
          completionTokens: params.completionTokens ?? 0,
          costMinorUnits: params.costMinorUnits ?? BigInt(0),
          latencyMs: params.latencyMs ?? 0,
          toolCalls: params.toolCalls ? (params.toolCalls as Prisma.InputJsonValue) : undefined,
          metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
        },
        create: {
          traceId: params.traceId,
          correlationId: params.correlationId,
          executionId: params.executionId,
          companyId: params.companyId,
          jobId: params.jobId,
          candidateId: params.candidateId,
          agentId: params.agentId,
          workflowId: params.workflowId,
          stepName: params.stepName,
          provider: params.provider,
          model: params.model,
          promptTokens: params.promptTokens ?? 0,
          completionTokens: params.completionTokens ?? 0,
          costMinorUnits: params.costMinorUnits ?? BigInt(0),
          latencyMs: params.latencyMs ?? 0,
          status: params.status,
          toolCalls: params.toolCalls ? (params.toolCalls as Prisma.InputJsonValue) : undefined,
          metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (err) {
      if (tx) throw err; // Re-throw inside transaction to trigger rollback
      console.error("Failed to record trace", err);
      throw err;
    }
  }

  static async getTraceSummary(correlationId: string): Promise<{
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCostMinorUnits: bigint;
    stepCount: number;
  }> {
    let traces: TraceRecord[] = [];
    try {
      traces = await prisma.traceRecord.findMany({
        where: { correlationId },
      });
    } catch {
      // Offline fallback
    }

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCostMinorUnits = BigInt(0);

    for (const trace of traces) {
      totalPromptTokens += trace.promptTokens;
      totalCompletionTokens += trace.completionTokens;
      totalCostMinorUnits += trace.costMinorUnits;
    }

    return {
      totalPromptTokens,
      totalCompletionTokens,
      totalCostMinorUnits,
      stepCount: traces.length,
    };
  }

  /**
   * Phase 11 Operational Pilot Metric: Cost Per Successful Hire
   * @param totalCostMinorUnits Total AI + Infra + Comms cost in minor units (cents)
   * @param successfulHires Number of verified successful hires completed
   */
  static calculateCostPerHire(totalCostMinorUnits: bigint, successfulHires: number): {
    costPerHireMinorUnits: bigint;
    costPerHireFormatted: string;
  } {
    if (successfulHires <= 0) {
      return { costPerHireMinorUnits: BigInt(0), costPerHireFormatted: '$0.00' };
    }
    const costPerHire = totalCostMinorUnits / BigInt(successfulHires);
    const dollars = (Number(costPerHire) / 100).toFixed(2);
    return {
      costPerHireMinorUnits: costPerHire,
      costPerHireFormatted: `$${dollars}`,
    };
  }
}

