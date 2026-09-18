import { z } from 'zod';
import { Role } from '@prisma/client';
import { ToolRegistry, PermissionDeniedError } from '@/lib/tools/ToolRegistry';
import { createTenantContext } from '@/lib/security/TenantContext';

export interface Phase5SecurityResult { name: string; category: string; passed: boolean; message?: string; }

export async function runPhase5AgentSecurityTests(): Promise<{ results: Phase5SecurityResult[] }> {
  const results: Phase5SecurityResult[] = [];
  const registry = new ToolRegistry();
  let handlerCalls = 0;

  registry.register({
    name: 'sendOffer',
    description: 'test consequential side effect',
    hasSideEffect: true,
    inputSchema: z.object({ idempotencyKey: z.string().min(1), candidateId: z.string() }).strict(),
    outputSchema: z.object({ ok: z.boolean() }),
    handler: async () => { handlerCalls += 1; return { ok: true }; },
  });

  registry.register({
    name: 'parseResume',
    description: 'test non-consequential tool',
    hasSideEffect: false,
    inputSchema: z.object({ text: z.string() }).strict(),
    outputSchema: z.object({ ok: z.boolean() }),
    handler: async () => { handlerCalls += 1; return { ok: true }; },
  });

  const context = {
    tenantContext: createTenantContext('company-a', 'user-a', Role.EMPLOYER),
    correlationId: 'corr-phase5',
    executionId: 'exec-phase5',
    agentId: 'resume-evaluator',
  };

  try {
    await registry.execute('resume-evaluator', 'sendOffer', { idempotencyKey: 'offer-1', candidateId: 'candidate-a' }, context);
    results.push({ name: 'Direct consequential tool bypass is denied', category: 'Phase 5 Agent Security', passed: false });
  } catch (error) {
    results.push({ name: 'Direct consequential tool bypass is denied', category: 'Phase 5 Agent Security', passed: error instanceof PermissionDeniedError && handlerCalls === 0, message: error instanceof Error ? error.message : undefined });
  }

  try {
    await registry.execute('candidate-matchmaker', 'parseResume', { text: 'resume' }, context);
    results.push({ name: 'Agent identity/context spoofing is denied', category: 'Phase 5 Agent Security', passed: false });
  } catch (error) {
    results.push({ name: 'Agent identity/context spoofing is denied', category: 'Phase 5 Agent Security', passed: error instanceof PermissionDeniedError && handlerCalls === 0, message: error instanceof Error ? error.message : undefined });
  }

  try {
    await registry.execute('resume-evaluator', 'parseResume', { text: 'resume' }, context);
    results.push({ name: 'Allowlisted non-consequential tool remains executable', category: 'Phase 5 Agent Security', passed: handlerCalls === 1 });
  } catch (error) {
    results.push({ name: 'Allowlisted non-consequential tool remains executable', category: 'Phase 5 Agent Security', passed: false, message: error instanceof Error ? error.message : String(error) });
  }

  return { results };
}
