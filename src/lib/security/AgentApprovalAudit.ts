import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';

type AuditTx = Prisma.TransactionClient;

function canonicalPayload(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

export async function writeAgentApprovalAudit(
  tx: AuditTx,
  params: {
    userId: string;
    companyId: string | null;
    action: 'AGENT_APPROVAL_REQUESTED' | 'AGENT_APPROVAL_APPROVED' | 'AGENT_APPROVAL_REJECTED' | 'AGENT_APPROVAL_CONSUMED';
    workflowId: string;
    approvalId: string;
    stepName: string;
    actionType: string;
    actionDigest: string;
    role?: string;
  },
): Promise<void> {
  const payload = {
    version: 1,
    action: params.action,
    workflowId: params.workflowId,
    approvalId: params.approvalId,
    stepName: params.stepName,
    actionType: params.actionType,
    actionDigest: params.actionDigest,
    userId: params.userId,
    companyId: params.companyId,
    role: params.role ?? null,
  };
  const serialized = canonicalPayload(payload);
  const payloadSha256 = createHash('sha256').update(serialized).digest('hex');

  const audit = await tx.auditLog.create({
    data: {
      userId: params.userId,
      companyId: params.companyId,
      action: params.action,
      resource: `WorkflowApproval:${params.approvalId}`,
      details: serialized,
    },
  });
  await tx.securityAuditOutboxEvent.create({
    data: {
      auditLogId: audit.id,
      eventType: 'security.agent-approval.v1',
      payload: payload as Prisma.InputJsonValue,
      payloadSha256,
    },
  });
}
