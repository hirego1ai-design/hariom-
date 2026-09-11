# HireGo production-readiness execution plan

Started 11 September 2026. This is an execution tracker, not production certification.
Baseline findings: CTO_BLUEPRINT.md (G01–G18). The blueprint describes the pre-fix audit snapshot; this tracker records subsequent work.

## Release standard

An item moves through: pending → implemented locally → regression-tested → staging-verified → deployed and verified. Source/build success alone cannot close a live workflow. Preserve existing data and security controls. No real charges, candidate messages, invented commercial terms or blind production migrations.

## Ordered delivery

| Phase | Work | Exit evidence | Current state |
|---|---|---|---|
| 1A | Subscription plan identifiers, validation and truthful quotas (G02, part of G13) | Create/edit contract tests, checkout acceptance, zero quota preservation; then staging purchase | Implemented locally; 6 new tests and 103 total offline regressions pass; live purchase pending |
| 1B | Approved PPH compensation, placement uniqueness, invoice receipt lifecycle (G03, G04, G06, G07) | Employer/admin authorisation, concurrent joining/replay, invoice review tests | Pending; founder confirmation of billing trigger and CTC approver requested |
| 1C | Publish/draft transition and recruiter/plan enforcement (G05, G13) | Draft unpublished, publish credit consumed once, cross-tenant denial | Pending |
| 2 | Live approved catalogs and provider test checkout (G01) | Verified webhook grants exact quotas once; rejection/replay/refund tests | Pending approved commercial configuration |
| 3 | Candidate purchase, service execution and refunds (G08, G09) | Service delivered once or refunded; no free/paid ambiguity | Pending product policy and implementation |
| 4 | Video, assessment, score provenance and matching (G10, G12, G16) | Durable dispatch, restart recovery, evidence-based result and continuation | Pending |
| 5 | Safe agent and managed-hiring orchestration (G11) | Typed permitted actions, human approvals, budgets, idempotency, visible status | Pending |
| 6 | Notifications, backups and operations (G14, G18) | Honest UI, real delivery state, successful restore drill | Pending |
| 7 | Full authenticated QA and release (G15, G17) | Candidate/employer/advisor/admin journeys, tenant isolation, build, provider tests, deployed revision, rollback | Pending |

## Acceptance matrix for every phase

- Happy path with persisted results and accurate UI.
- Invalid input, unauthenticated request, wrong role and cross-company resource access.
- Duplicate/replayed request and concurrent changes where credits/money/state are involved.
- Provider failure, database failure and worker restart where relevant.
- No exposed secrets or synthetic success; missing configuration fails clearly.
- Automated regressions plus staging evidence; record limitations explicitly.

## Business decisions (do not invent defaults)

Founder confirmed: automatically raise the PPH invoice 25 days after confirmed candidate joining, subject to agreed terms. Mixed employer/HireGo decision-making is required. Proposed implementation: agreement-level approval ownership and immutable approved commercial terms; automated calculation is not permission for AI to invent salary or fees.

Still to specify: precise agreement approval rules, early departure/dispute handling, replacement/warranty terms, final subscription catalog, candidate free versus paid services, PPH AI allowances and native app repository scope.

Phase 1B must persist joining date, approved terms, eligibility date and a durable scheduled billing record. The worker must create one invoice only when eligible, re-check holds/cancellation and recover safely after downtime. Scheduling an invoice is different from making an invoice payable 25 days later; do not implement the latter as a substitute.

## Session results

Subscription batch: UUIDs for newly created plans, backward-compatible validated legacy checkout IDs, strict create/update input schemas, preserved zero quotas in persistence and API output, and offline regression suite added to CI. These do not configure live catalogs or prove payment-provider checkout. No deployment or Supabase write has been performed in this phase. CodeRabbit CLI is unavailable; an external CodeRabbit review is pending and is not replaced by a claimed tool result.
