import { prisma } from '@/lib/prisma';
import { FairnessAuditor } from './FairnessAuditor';

export type EvaluatorVerdict = 'ACCEPT' | 'RETRY' | 'FALLBACK' | 'ESCALATE';

export interface EvaluationResult {
  score: number;
  verdict: EvaluatorVerdict;
  logId: string;
  fairnessChecked: boolean;
  policyCompliant: boolean;
  biasScore: number;
  schemaValid: boolean;
  factualConsistency: boolean;
}

function validateSchema(output: unknown, outputSchema?: unknown): boolean {
  if (output === null || output === undefined) return false;
  if (!outputSchema) return true;

  if (typeof outputSchema === 'object' && outputSchema !== null && 'safeParse' in outputSchema && typeof (outputSchema as any).safeParse === 'function') {
    return (outputSchema as any).safeParse(output).success;
  }

  if (typeof outputSchema === 'object' && outputSchema !== null && 'required' in outputSchema && Array.isArray((outputSchema as any).required)) {
    if (typeof output !== 'object' || output === null) return false;
    const reqFields = (outputSchema as any).required as string[];
    const outputRecord = output as Record<string, unknown>;
    for (const field of reqFields) {
      if (!(field in outputRecord) || outputRecord[field] === undefined || outputRecord[field] === null) {
        return false;
      }
    }
    return true;
  }

  return true;
}

export class AgentEvaluator {
  static async evaluate(params: {
    companyId?: string | null;
    correlationId: string;
    executionId: string;
    agentId: string;
    output: unknown;
    outputSchema?: unknown;
  }): Promise<EvaluationResult> {
    const outputString = typeof params.output === 'string' ? params.output : JSON.stringify(params.output);

    const fairness = FairnessAuditor.audit(outputString);
    const schemaValid = validateSchema(params.output, params.outputSchema);
    // No factual verifier is implemented; do not attest model claims as true.
    const factualConsistency = false;

    let score = 0.9; // Base quality score
    if (!schemaValid) score -= 0.5;
    if (!fairness.policyCompliant) score -= 0.4;
    score = Math.max(0.0, Math.min(1.0, score));

    let verdict: EvaluatorVerdict;
    if (!fairness.policyCompliant) {
      verdict = 'ESCALATE';
    } else if (score >= 0.8 && schemaValid) {
      verdict = 'ACCEPT';
    } else if (score >= 0.5) {
      verdict = 'RETRY';
    } else {
      verdict = 'FALLBACK';
    }

    let logId = `eval-${Date.now()}`;
    try {
      const log = await prisma.agentEvaluationLog.create({
        data: {
          companyId: params.companyId,
          correlationId: params.correlationId,
          executionId: params.executionId,
          agentId: params.agentId,
          algorithmVersion: 'hirego-score-v1.2',
          score,
          fairnessChecked: fairness.fairnessChecked,
          policyCompliant: fairness.policyCompliant,
          biasScore: fairness.biasScore,
          schemaValid,
          factualConsistency,
          verdict,
        },
      });
      logId = log.id;
    } catch (error) {
      if (process.env.NODE_ENV === 'production' || process.env.MOCK_DB !== 'true') throw error;
    }

    return {
      score,
      verdict,
      logId,
      fairnessChecked: fairness.fairnessChecked,
      policyCompliant: fairness.policyCompliant,
      biasScore: fairness.biasScore,
      schemaValid,
      factualConsistency,
    };
  }
}
