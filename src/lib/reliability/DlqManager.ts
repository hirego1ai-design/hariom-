import { prisma } from '@/lib/prisma';
import { DeadLetterJob, Prisma } from '@prisma/client';

export class DlqManager {
  static async enqueue(params: {
    sourceType: string;
    sourceId: string;
    correlationId: string;
    errorType: string;
    errorMessage: string;
    payload?: unknown;
  }): Promise<DeadLetterJob> {
    return prisma.deadLetterJob.create({
      data: {
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        correlationId: params.correlationId,
        errorType: params.errorType,
        errorMessage: params.errorMessage,
        payload: params.payload ? (params.payload as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: 'OPEN',
        retryCount: 0,
      },
    });
  }

  static async getOpenJobs(correlationId?: string): Promise<DeadLetterJob[]> {
    return prisma.deadLetterJob.findMany({
      where: {
        status: 'OPEN',
        ...(correlationId ? { correlationId } : {}),
      },
    });
  }

  static async resolveJob(jobId: string, resolvedBy: string): Promise<DeadLetterJob> {
    return prisma.deadLetterJob.update({
      where: { id: jobId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  }

  static async retryJob(jobId: string): Promise<void> {
    await prisma.deadLetterJob.update({
      where: { id: jobId },
      data: {
        retryCount: { increment: 1 },
      },
    });
    // Further logic to actually re-trigger would depend on sourceType
  }
}
