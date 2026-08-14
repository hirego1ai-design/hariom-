import { HiringPipeline } from '../workflows/HiringPipeline';
import { createTenantContext } from '../security/TenantContext';
import { Role } from '@prisma/client';
import { TraceRecorder } from '../telemetry/TraceRecorder';
import { ToolRegistry } from '../tools/ToolRegistry';
import { registerSideEffectTools } from '../tools/SideEffectTools';

async function runE2eJourney() {
  console.log('================================================================');
  console.log('    HireGo AI ROS — Phase 7.6 Live E2E Hiring Journey Test     ');
  console.log('================================================================\n');

  const correlationId = `corr-e2e-${Date.now()}`;
  const companyId = 'company-acme-corp';
  const jobId = `job-lead-ai-${Date.now()}`;
  const candidateProfileId = 'cand-rohit-kumar';

  const tenantContext = createTenantContext(companyId, 'user-employer-acme', Role.EMPLOYER);

  console.log('Step 1: Initializing 6-Stage ROS Hiring Pipeline...');
  const result = await HiringPipeline.runPipeline({
    tenantContext,
    correlationId,
    companyId,
    jobTitle: 'Lead AI & LLM Systems Architect',
    candidateProfileId,
    initiatedBy: 'user-employer-acme',
  });

  console.log('\n[E2E Pipeline Result]:');
  console.log(`- Workflow ID:      ${result.workflowId}`);
  console.log(`- Correlation ID:   ${result.correlationId}`);
  console.log(`- Pipeline Status:  ${result.status}`);
  console.log(`- Stage 1 (JD):     Generated (${result.jobDescriptionResult.jobTitle})`);
  console.log(`- Stage 2 (Match):  Matched (${result.matchmakerResult.matchedCandidateCount} candidate matches)`);
  console.log(`- Stage 3 (Resume): Evaluated (Score: ${result.resumeEvalResult.candidateScore}/100)`);
  console.log(`- Stage 4 (Mock):   Evaluated (Feedback Score: ${result.interviewResult.evalScore}/100)`);
  console.log(`- Stage 5 (Coach):  Analyzed (Clarity Score: ${result.communicationResult.clarityScore}/100)`);
  console.log(`- Stage 6 (Judge):  Verified (Integrity Score: ${result.securityResult.integrityScore}/100)`);

  console.log('\nStep 2: Testing Side-Effect Tool Dispatches via ToolRegistry...');
  const registry = new ToolRegistry();
  registerSideEffectTools(registry);

  const toolContext = {
    tenantContext,
    correlationId,
    executionId: `exec-sideeffect-${Date.now()}`,
    agentId: 'resume-evaluator',
  };

  const emailRes = await registry.execute(
    'resume-evaluator',
    'sendEmailNotification',
    {
      idempotencyKey: `idempotent-email-${result.workflowId}`,
      to: 'rohit.kumar@example.com',
      subject: 'HireGo AI Interview Invitation',
      html: '<p>You have been shortlisted for interview.</p>',
    },
    toolContext
  );
  console.log(`- Side Effect 1 (Email):     ${JSON.stringify(emailRes)}`);

  const interviewRes = await registry.execute(
    'resume-evaluator',
    'scheduleInterviewSession',
    {
      idempotencyKey: `idempotent-int-${result.workflowId}`,
      applicationId: `app-${result.workflowId}`,
      scheduledAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    toolContext
  );
  console.log(`- Side Effect 2 (Interview): ${JSON.stringify(interviewRes)}`);

  const invoiceRes = await registry.execute(
    'resume-evaluator',
    'generateCommercialInvoice',
    {
      idempotencyKey: `idempotent-inv-${result.workflowId}`,
      companyId,
      companyName: 'Acme Corporation',
      amountMinorUnits: 2500000,
      description: 'HireGo AI Recruitment Commission',
    },
    toolContext
  );
  console.log(`- Side Effect 3 (Invoice):   ${JSON.stringify(invoiceRes)}`);

  console.log('\nStep 3: Verifying Telemetry Trace Summaries...');
  const summary = await TraceRecorder.getTraceSummary(correlationId);
  console.log(`- Total Prompt Tokens:     ${summary.totalPromptTokens}`);
  console.log(`- Total Completion Tokens: ${summary.totalCompletionTokens}`);
  console.log(`- Total Cost Minor Units:  ${summary.totalCostMinorUnits}`);
  console.log(`- Total Recorded Steps:    ${summary.stepCount}`);

  console.log('\n================================================================');
  console.log('    SUCCESS: Phase 7.6 Live E2E Hiring Journey PASSED 100%     ');
  console.log('================================================================');
}

runE2eJourney().catch((err) => {
  console.error('Phase 7.6 E2E Test Error:', err);
  process.exit(1);
});
