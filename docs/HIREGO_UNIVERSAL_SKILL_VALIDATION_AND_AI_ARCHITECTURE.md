# HireGo Universal Skill Validation & AI Architecture

## Purpose

HireGo Universal Skill Validation is a reusable, candidate-owned knowledge-validation layer. It provides deterministic evidence about foundational role skills before a candidate's job application can finish submitting. It is not a certification, practical coding examination, interview pass, employer decision, or guarantee of employment.

The system is deliberately split into deterministic business controls and AI-assisted content generation. AI models can generate questions, explanations, coaching, summaries, and practice content. They cannot decide authentication, authorization, billing, raw MCQ scoring, application ownership, application state authorization, or the authoritative job-match percentage.

## Candidate workflow

1. Candidate builds a profile and may skip Skill Validation during onboarding.
2. Candidate can browse jobs without completing Skill Validation.
3. On Apply, HireGo checks whether the candidate has a current completed Universal Skill Validation for the target role.
4. If validation is missing, HireGo first persists an application intent and an explicit UNIVERSAL_SKILL_VALIDATION application gate.
5. HireGo resolves or safely generates a production-valid role assessment.
6. The candidate is sent to the Skill Validation notice page.
7. The notice must be acknowledged server-side before the assessment can start.
8. The assessment is scored deterministically by the server.
9. Reusable skill evidence is written only for the Universal Skill Validation scope.
10. The pending application is automatically released after the universal assessment is completed while the job is still active.
11. If the employer required an additional job-specific assessment, a separate JOB_SPECIFIC_ASSESSMENT gate is created and the candidate continues to that assessment.
12. Job-specific assessment completion releases that gate. It does not overwrite the universal historical validation result.

A provider outage must not lose the candidate's application intent or create a duplicate application.

## Application gate model

Application gates separate pre-application validation from normal hiring-pipeline state.

Gate types:
- UNIVERSAL_SKILL_VALIDATION
- JOB_SPECIFIC_ASSESSMENT

Gate states:
- REQUIRED
- IN_PROGRESS
- COMPLETED
- CANCELLED

Employers must not see a saved application intent while its universal gate is still required or in progress. Once universal validation completes, the application becomes employer-visible. A job-specific assessment, when required, remains a visible assessment obligation on the submitted application.

## Assessment policy

Question count is server-authoritative and comes from knowledgeScreeningPolicy.ts.

| Role class | Allowed questions | Recommended | Recommended time |
| --- | ---: | ---: | ---: |
| Basic / Operational | 10–12 | 11 | ~10 minutes |
| Professional | 12–15 | 13 | ~12 minutes |
| Technical | 15–18 | 16 | ~15 minutes |

Every assessed skill requires at least three meaningful questions.

The same validation helper is used at publication, candidate listing, candidate start, and evidence creation boundaries. Legacy assessments that do not satisfy the current policy may retain historical attempt records, but they cannot create new reusable Skill Validation evidence.

## Universal vs job-specific assessment

### Universal Skill Validation

- Owned by HireGo.
- Reusable across applications for the target role while current.
- Creates reusable CandidateSkill / SkillEvidence only when evidence rules are satisfied.
- Candidate sees overall and per-skill results.
- Employer may see relevant reusable validated skill evidence according to access policy.
- Private coaching is not employer-visible by default.

### Job-specific assessment

- Enabled by an employer through a Yes/No setting.
- Employer does not choose question count.
- HireGo generates the assessment from the job role and canonical approved skills.
- Feature entitlement/billing authorization is separate from assessment scoring.
- A job requiring the assessment remains a draft until a valid assessment exists.
- Job posting credit is not consumed before the required assessment is ready.
- Job-specific scores remain scoped to the application and never upgrade or overwrite universal candidate skill evidence.

## Question authoring

Assessment authoring uses:

1. canonical role-to-skill mappings,
2. job-approved skills where applicable,
3. deterministic question allocation,
4. a configured AI model through the central Model Router,
5. strict structured output validation,
6. duplicate-question checks,
7. exact skill-tag validation,
8. exact option-count / one-correct-answer validation,
9. final runtime policy validation.

There is no fake/static fallback question set. Missing role taxonomy, AI routing, provider credentials, or policy causes safe failure instead of fabricated questions.

Authoring provenance is stored on the assessment: provider, model, authoring schema/version, and source.

## Scoring and evidence

MCQ scoring is deterministic server logic.

The model cannot modify answer keys, correct count, earned points, total points, raw score, passing threshold, attempt completion, application ownership, or application gate authorization.

Universal per-skill evidence is calculated from deterministic question results. Job-specific assessments calculate scoped per-skill results but do not write reusable CandidateSkill verification evidence.

Evidence labels remain Self Declared, Knowledge Validated, Verified, and Expired.

Knowledge Validated means sufficient basic evidence from the short screening. It does not mean expert or certified.

## Notice, integrity, and privacy

The candidate notice page displays only controls that are actually implemented.

Currently the Universal Skill Validation flow enforces server-side timer, candidate ownership, hidden answer keys, duplicate-submission protection, and server-side notice acknowledgement.

The flow currently does not claim webcam monitoring, microphone monitoring, screen recording, or tab-switch monitoring.

If future proctoring capabilities are implemented, the notice and persistence model must be updated before the product claims those controls.

Raw answers and answer keys are not exposed to employers. Private coaching is candidate-only by default. Integrity signals must not be converted into an automatic cheating verdict without an explicit, reviewed policy.

## Private feedback

Private assessment coaching is generated only from deterministic assessment facts: role, raw overall score, passing threshold, per-skill scores, question counts, and validation flags.

The feedback model returns a strict schema containing summary, strengths, improvement areas, next steps, practice suggestions, and Mock Interview focus skills.

The service rejects feedback that references skills outside the deterministic evidence set. Provider/model provenance is stored. Feedback generation failure does not alter the assessment result or application state.

## Mock Interview practice loop

HireGo Mock Interview remains text-only.

Skill Validation feedback can prefill role and weak-skill focus areas into Mock Interview. Focus skills are persisted on the practice session and guide subsequent questions.

Mock Interview performance is private practice evidence and does not rewrite the historical Universal Skill Validation score.

## Job matching

The authoritative application match percentage is calculated by the deterministic JobMatchingEngine.

LLMs may explain an already-calculated score, but cannot author the percentage.

Reusable validated skill evidence is surfaced separately from self-declared matching skills and verification coverage. Any future confidence weighting must be deterministic, versioned, and transparent.

## Multi-provider / multi-model AI Gateway

All production model inference routes through the central model configuration and router.

Supported provider adapters:
- OpenAI
- Google Gemini
- DeepSeek
- Kimi / Moonshot
- Qwen
- future reviewed adapters

Local/self-hosted models can be added behind the same routing boundary. Existing local/self-hosted transcription such as Whisper remains a separate media-processing concern and must be audited independently for worker/runtime configuration.

No business module should hardcode a current commercial model name or price.

## Model Registry

Each model registry entry can define registry key, provider, exact model ID, friendly name, enabled state, quality tier, capabilities, allowed task types, input token price, output token price, cached-input price, and context window.

Pricing is administrative metadata and must be updated when provider pricing changes.

Provider API keys remain server-side and are never returned to Admin UI.

## Per-task routing

Each task can configure routing mode, primary model, fallback chain, timeout, maximum output tokens, temperature or provider default, bounded same-endpoint rate-limit retry, and maximum estimated cost per request.

Routing modes:
- MANUAL
- COST_SAVER
- BALANCED
- QUALITY_FIRST
- SMART_AUTO

COST_SAVER prefers the cheapest enabled, qualified model in the approved chain.

BALANCED considers configured quality tier and cost.

QUALITY_FIRST prefers the stronger configured tier within the approved chain.

SMART_AUTO uses observed production telemetry after enough samples and optimizes cost per successful task while respecting the admin-approved chain.

No routing mode can bypass the model allowlist or provider configuration.

## Failure and fallback behavior

A fallback may be attempted for bounded provider failures such as provider errors or a rate-limit response.

The SDK does not blindly retry timed-out billable requests because a timed-out request may already have completed and been charged upstream.

Every provider attempt records real telemetry where available: provider, model, task, prompt tokens, completion tokens, total tokens, latency, estimated cost, and status.

Failed provider calls are recorded without fabricating token/cost values.

## Cost controls

Production routing requires model pricing metadata before making a billable request.

Each task can set a maximum cost per request. A conservative preflight estimate prevents a request when its maximum configured token envelope exceeds the budget cap.

The Admin UI shows configured token prices, relative token-cost index, observed average cost, success rate, failure rate, fallback rate, latency, and cost per successful task.

The meaningful optimization target is cost per successful task, not token price alone.

## Safe model comparison

Admin can run a synthetic benchmark against selected enabled models.

The benchmark contains no real candidate or employer data, uses a fixed structured-summary task, compares the same input across models, and reports schema pass/fail, latency, tokens, estimated cost, and raw synthetic output.

It does not claim a universal quality score.

## Agent safety boundary

Model routing does not weaken existing agent safety controls.

AI agent execution continues to require tool allowlists, denied tool lists, exact input/output validation, tenant/actor context, cost ceilings, tool-call limits, durable execution state where required, idempotency at side-effect boundaries, audit records, and fail-closed behavior.

Consequential actions such as offer, rejection, financial state, destructive operations, suspension, and sensitive hiring transitions require the dedicated approval boundary and cannot run through generic agent dispatch.

## Deterministic authority

AI models are never authoritative for login/authentication, RBAC, tenant isolation, session security, payment success/failure, billing calculation, MCQ score, answer keys, application ownership, application gate authorization, job-match percentage, database integrity, destructive operations, or consequential hiring decisions.

## Admin controls

Admin can configure exact provider/model registry, provider/model enablement, per-task primary model, fallback order, cost/quality routing mode, token/time/cost bounds, Universal Skill Validation policy, and job-specific assessment policy.

Routing changes are audited and affect future requests without rewriting business logic.

## External configuration required before production

A code path is not green merely because a provider name exists.

Each provider requires:
1. a working server adapter,
2. valid credentials/endpoint configuration,
3. an enabled registry model,
4. current cost metadata,
5. an approved task route,
6. successful controlled test execution.

Universal assessment generation additionally requires configured Universal Skill Validation policy, canonical role-to-skill mappings, and an enabled assessment-authoring route.

Private feedback requires feedback policy enabled and an enabled assessment-feedback route.

Job-specific assessment additionally requires configured job-specific assessment policy and employer plan entitlement JOB_SPECIFIC_ASSESSMENT or equivalent all-feature entitlement.

## Production acceptance gates

Before merge/deploy:

1. Prisma validate/generate succeeds.
2. Migrations validate.
3. TypeScript strict check succeeds.
4. ESLint succeeds.
5. Assessment/security regression tests succeed.
6. Production build succeeds.
7. CI/security checks are green.
8. New database migrations are applied to staging/production in controlled order.
9. Provider credentials/routing/policies are configured.
10. A safe staging assessment workflow is exercised end-to-end.
11. No production screen shows fabricated AI output, score, health, or model activity.

Any missing external provider/policy configuration is reported as external configuration required rather than falsely marked complete.
