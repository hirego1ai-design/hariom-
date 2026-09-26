# HireGo Managed Hiring — Current Production Readiness Report

Date: 2026-09-26

## Intended operating model

HireGo Managed Hiring is a human-gated autonomous hiring workflow:

Requirement → signed commercial agreement → production job creation → talent-pool/inbound sourcing → evidence-first screening → assessment when evidence is incomplete → shortlist recommendation → interview scheduling → live interview → transcript/evidence evaluation → panel feedback → controlled round progression → final human decision → offer → candidate acceptance → joining confirmation → PPH billing.

Selection, rejection, offer, financial actions, destructive actions, and joining confirmation remain authorized human boundaries. This is deliberate product policy, not an unfinished automation gap.

## Implemented and wired

### Requirement and commercial boundary

- Managed-hiring requirement intake is authenticated, tenant-bound, and validated.
- Critical requirement fields no longer use fabricated production fallbacks.
- Requirement activation requires a linked signed ACTIVE commercial agreement.
- Activation atomically creates or reconciles traceable ACTIVE JobListing records.
- Managed jobs retain requirement ID, agreement ID, and a stable managed role key.
- Job content is derived from authoritative requirement data rather than invented business values.
- Job creation publishes durable outbox events.

### Sourcing and screening

- Activated managed jobs automatically enter safe HireGo talent-pool discovery through the durable outbox worker.
- Automatic sourcing only creates SOURCED relationships. It does not invite candidates, create applications, select, or reject.
- Proactive sourcing requires recent candidate availability confirmation and respects Job Ready gates when configured.
- Inbound applications remain supported independently.
- Candidate matching is deterministic and evidence-first.
- Missing profile evidence is not treated as proof of mismatch.
- Preferred skills are supporting signals, not mandatory rejection criteria.
- Automatic rejection is disabled.
- Rejection requires explicit human approval and an auditable reason.

### Assessment and application progression

- Universal validation and job-specific MCQ assessment gates are persisted.
- Required assessment gates block interview scheduling until completed.
- Assessment completion advances the application back into screening and emits a durable event.
- Assessment results do not automatically select or reject candidates.

### Interview lifecycle

- Persisted configurable interview rounds, assigned interviewers, mandatory feedback, HOLD, proceed, and controlled reject/select boundaries are implemented.
- Interview scheduling is tenant-authorized, conflict checked, gate aware, and advances the application to the interview stage atomically.
- WebRTC signaling is database-backed rather than process memory.
- Production requires TURN_URL, TURN_USERNAME, and TURN_CREDENTIAL and fails closed when they are absent.
- Live-room start and completion timestamps are persisted for runtime evidence.
- Candidate browser proctoring telemetry is linked to the actual interview and remains explicitly client-reported advisory evidence.

### Live answer-based interview evaluation

- A trusted internal transcript callback persists the completed live interview transcript with provider/model/version/confidence provenance.
- Finalized transcript evidence is immutable through the callback; corrections require a separate audited path.
- A dedicated Live Interview Evaluator agent evaluates the persisted transcript against the tenant-owned job.
- The agent uses strict bounded JSON output, protected-trait restrictions, budget/entitlement controls, lifecycle evaluation, and workflow idempotency.
- Low-confidence transcripts are blocked from AI evaluation.
- The result is persisted separately from interviewer feedback.
- AI interview output is advisory only and cannot automatically select or reject a candidate.

### Communications and durable events

- Communication delivery state, retryability, provider IDs, delivered/read/failure timestamps, and idempotency are persisted.
- Production outbox consumers are registered by an authenticated scheduled outbox worker.
- The worker processes durable application, assessment, job, workflow, and managed-job activation events.
- Vercel cron scheduling for the durable outbox worker is included.

### Offer, joining, and billing

- Offer draft/send/private document/candidate accept-decline lifecycle is persisted.
- Final interview selection/rejection uses controlled approval boundaries.
- Joining requires a persisted accepted offer.
- Joining CTC must match the accepted offer.
- PPH placement/invoice terms are tied to the signed commercial agreement and are idempotent.
- Managed-hiring agreements fail early when their commercial model cannot complete the supported production billing workflow.

## Current code-level release status

The internal Managed Hiring workflow is code-complete for the human-gated operating model described above. The application now has durable boundaries from authoritative requirement intake through joining/billing, with automated discovery and advisory AI where safe.

The following items are deployment/provider evidence rather than missing internal workflow code:

1. External job-board/ATS sourcing requires approved provider APIs, contracts, and credentials. HireGo talent-pool and inbound sourcing work without those providers.
2. Email, WhatsApp, external AI, transcription, TURN, storage/scanning, Redis, and other configured providers require valid production secrets and live provider-side smoke tests.
3. Browser proctoring telemetry is intentionally advisory and must be reviewed by a human; it is not an independently attested cheating verdict.
4. A final production-like end-to-end run must be executed after deployment: requirement → agreement → job → sourcing/application → assessment → interview → transcript/evaluation → feedback/decision → offer → acceptance → joining → PPH billing.
5. Production load testing is a separate release gate and should be run against the deployed environment rather than fabricated inside unit CI.

## Release rule

Do not claim live-provider production readiness until:
- branch/main CI, Phase 5 verification, security checks, dependency audit, migrations, and production build are green;
- production provider credentials are configured;
- the end-to-end staging/production-like proof is recorded;
- external provider failures/retries are observed safely;
- no consequential hiring action bypasses its human approval boundary.
