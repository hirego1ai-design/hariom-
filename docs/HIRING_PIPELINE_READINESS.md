# Hiring pipeline readiness

The employer hiring-pipeline screen is a manual application board. It does not invoke the internal six-agent `HiringPipeline` class. There is no supported automatic end-to-end hiring trigger.

## Supported read-only inspection

`GET /api/employer/hiring-pipeline/readiness` requires an employer/recruiter session and a persisted company membership. An optional `applicationId` UUID is checked against that company; foreign or missing applications return 404. Responses are not cached. The endpoint never runs a model or makes a hiring decision.

The response identifies the existing `/api/agents/dispatch` capabilities (`jd-generator`, `resume-evaluator`) and their subscription, credit, budget, and provider prerequisites. These capabilities are not described as live-tested simply because readiness inspection succeeds.

## Internal orchestration safeguards

- Employer/recruiter/admin role, tenant ownership, actor binding, and an application matching the selected company/job/candidate are required.
- Required bounded job, transcript, timing, and telemetry inputs are validated before a workflow is created or any model can run.
- The normalized correlation ID is a durable unique request claim. Completed, running, and failed requests cannot be silently replayed. Failed work requires inspection before an explicit new request.
- Every agent execution ID is derived from its persisted workflow, agent, and attempt. Completion and its outbox event are committed together.
- Workflow checkpoint metadata identifies advisory-only processing and stores a digest of the supplied evidence, not the transcript itself.

## Remaining product work

Candidate matching currently lists linked candidates without measured compatibility ranking. The mock-interview agent drafts a generic question and does not evaluate real candidate answers. Communication metrics use supplied transcript/timing; security flags use supplied telemetry and do not independently attest its authenticity. A verified interview/evidence lifecycle and human review are needed before exposing a full pipeline trigger. This inspection endpoint does not implement those missing features.

## Verification

Run `node node_modules/tsx/dist/cli.mjs --test src/tests/hiring-pipeline-contract.test.ts` from the repository root. This suite installs a fake database, stubs agent execution, and blocks HTTP calls. It checks the six stage input contracts, role/tenant/actor boundaries, sequential and concurrent request claims, failed-stage stopping, and readiness authorization. It is not evidence of real database concurrency, provider quality, or staging deployment.

The historical `runE2eHiringJourneyTest.ts`, `runStagingValidationTest.ts`, and `runPhase10GoLiveValidationTest.ts` entry points now launch this offline suite. Their former hardcoded go-live claims and unsafe partial mocks are retired; they no longer send emails, create invoices, or call live providers.
