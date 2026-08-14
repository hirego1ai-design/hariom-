import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ShadowExecutor {
  /**
   * Non-blocking shadow execution for evaluating new model/algorithm versions in parallel.
   */
  static executeShadow(params: {
    correlationId: string;
    agentId: string;
    algorithmVersion: string;
    productionResult: unknown;
    shadowFn: () => Promise<unknown>;
  }): void {
    const startTime = Date.now();

    // Asynchronous non-blocking background execution
    (async () => {
      try {
        const shadowResult = await params.shadowFn();
        const latencyMs = Date.now() - startTime;

        const diffSummary = {
          productionEqualsShadow: JSON.stringify(params.productionResult) === JSON.stringify(shadowResult),
        };

        try {
          await prisma.shadowExecutionLog.create({
            data: {
              correlationId: params.correlationId,
              agentId: params.agentId,
              algorithmVersion: params.algorithmVersion,
              productionResult: (params.productionResult ?? {}) as Prisma.InputJsonValue,
              shadowResult: (shadowResult ?? {}) as Prisma.InputJsonValue,
              diffSummary: diffSummary as Prisma.InputJsonValue,
              latencyMs,
            },
          });
        } catch {
          // Ignore offline DB errors in background shadow logger
        }
      } catch (error) {
        // Shadow execution failure should never affect production flow
        const latencyMs = Date.now() - startTime;
        try {
          await prisma.shadowExecutionLog.create({
            data: {
              correlationId: params.correlationId,
              agentId: params.agentId,
              algorithmVersion: params.algorithmVersion,
              productionResult: (params.productionResult ?? {}) as Prisma.InputJsonValue,
              shadowResult: { error: error instanceof Error ? error.message : String(error) } as Prisma.InputJsonValue,
              diffSummary: { error: true } as Prisma.InputJsonValue,
              latencyMs,
            },
          });
        } catch {
          // Ignore secondary logging failures
        }
      }
    })();
  }
}
