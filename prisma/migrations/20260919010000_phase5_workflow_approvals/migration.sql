-- Phase 5: durable, tenant-bound human approval evidence.
CREATE TYPE "WorkflowApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "WorkflowApproval" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "companyId" TEXT,
    "stepName" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionDigest" TEXT NOT NULL,
    "decision" "WorkflowApprovalDecision" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "decidedBy" TEXT,
    "decidedByRole" "Role",
    "decisionNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowApproval_workflowInstanceId_stepName_actionDigest_key"
ON "WorkflowApproval"("workflowInstanceId", "stepName", "actionDigest");

CREATE INDEX "WorkflowApproval_companyId_decision_requestedAt_idx"
ON "WorkflowApproval"("companyId", "decision", "requestedAt");

ALTER TABLE "WorkflowApproval"
ADD CONSTRAINT "WorkflowApproval_workflowInstanceId_fkey"
FOREIGN KEY ("workflowInstanceId") REFERENCES "WorkflowInstance"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
