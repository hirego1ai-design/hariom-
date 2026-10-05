import { AiArtifactStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const NEXT: Record<AiArtifactStage, AiArtifactStage[]> = {
  DRAFT: [AiArtifactStage.SHADOW],
  SHADOW: [AiArtifactStage.EVALUATED, AiArtifactStage.ROLLED_BACK],
  EVALUATED: [AiArtifactStage.APPROVED, AiArtifactStage.ROLLED_BACK],
  APPROVED: [AiArtifactStage.CANARY, AiArtifactStage.ROLLED_BACK],
  CANARY: [AiArtifactStage.PRODUCTION, AiArtifactStage.ROLLED_BACK],
  PRODUCTION: [AiArtifactStage.ROLLED_BACK],
  ROLLED_BACK: [],
};

const EVALUABLE_STAGES = new Set<AiArtifactStage>([
  AiArtifactStage.SHADOW,
  AiArtifactStage.EVALUATED,
  AiArtifactStage.CANARY,
]);

export function canTransitionAiArtifact(
  from: AiArtifactStage,
  to: AiArtifactStage,
): boolean {
  return NEXT[from].includes(to);
}

export class EvalGate {
  static async createArtifact(params: {
    artifactType: string;
    artifactKey: string;
    version: string;
    config: unknown;
    createdBy: string;
  }) {
    return prisma.aiArtifactVersion.create({
      data: {
        artifactType: params.artifactType.trim().slice(0, 80),
        artifactKey: params.artifactKey.trim().slice(0, 160),
        version: params.version.trim().slice(0, 80),
        config: params.config as Prisma.InputJsonValue,
        createdBy: params.createdBy,
      },
    });
  }

  static async beginShadow(id: string) {
    return this.transition(id, AiArtifactStage.SHADOW);
  }

  static async recordEvaluation(params: {
    artifactVersionId: string;
    suite: string;
    scores: unknown;
    passed: boolean;
    notes?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const artifact = await tx.aiArtifactVersion.findUniqueOrThrow({
        where: { id: params.artifactVersionId },
      });

      if (!EVALUABLE_STAGES.has(artifact.stage)) {
        throw new Error(
          `Evaluation is not allowed while artifact is ${artifact.stage}.`,
        );
      }

      const run = await tx.aiEvaluationRun.create({
        data: {
          artifactVersionId: artifact.id,
          suite: params.suite.trim().slice(0, 160),
          scores: params.scores as Prisma.InputJsonValue,
          passed: params.passed,
          notes: params.notes?.trim().slice(0, 2_000) ?? null,
        },
      });

      if (artifact.stage === AiArtifactStage.SHADOW && params.passed) {
        await tx.aiArtifactVersion.update({
          where: { id: artifact.id },
          data: { stage: AiArtifactStage.EVALUATED },
        });
      }
      return run;
    });
  }

  static async approve(id: string, approvedBy: string) {
    const artifact = await prisma.aiArtifactVersion.findUniqueOrThrow({
      where: { id },
      include: {
        evaluationRuns: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (
      artifact.stage !== AiArtifactStage.EVALUATED ||
      artifact.evaluationRuns[0]?.passed !== true
    ) {
      throw new Error(
        "Artifact cannot be approved without a passing evaluation.",
      );
    }
    return prisma.aiArtifactVersion.update({
      where: { id },
      data: { stage: AiArtifactStage.APPROVED, approvedBy },
    });
  }

  static async promoteToCanary(id: string) {
    return this.transition(id, AiArtifactStage.CANARY);
  }

  static async promoteToProduction(id: string) {
    const artifact = await prisma.aiArtifactVersion.findUniqueOrThrow({
      where: { id },
      include: {
        evaluationRuns: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (
      artifact.stage !== AiArtifactStage.CANARY ||
      artifact.evaluationRuns[0]?.passed !== true
    ) {
      throw new Error(
        "Canary artifact needs a passing evaluation before production promotion.",
      );
    }
    return this.transition(id, AiArtifactStage.PRODUCTION);
  }

  static async rollback(id: string, rollbackOf?: string | null) {
    const artifact = await prisma.aiArtifactVersion.findUniqueOrThrow({
      where: { id },
    });
    if (!canTransitionAiArtifact(artifact.stage, AiArtifactStage.ROLLED_BACK)) {
      throw new Error(`Artifact cannot roll back from ${artifact.stage}.`);
    }
    return prisma.aiArtifactVersion.update({
      where: { id },
      data: {
        stage: AiArtifactStage.ROLLED_BACK,
        rollbackOf: rollbackOf?.slice(0, 80) ?? null,
      },
    });
  }

  private static async transition(id: string, to: AiArtifactStage) {
    const artifact = await prisma.aiArtifactVersion.findUniqueOrThrow({
      where: { id },
    });
    if (!canTransitionAiArtifact(artifact.stage, to)) {
      throw new Error(
        `Invalid AI artifact transition ${artifact.stage} -> ${to}.`,
      );
    }
    return prisma.aiArtifactVersion.update({
      where: { id },
      data: { stage: to },
    });
  }
}
