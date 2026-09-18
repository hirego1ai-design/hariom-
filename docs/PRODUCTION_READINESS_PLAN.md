# HireGo production-readiness execution plan

Started 11 September 2026. This is an execution tracker, not production certification.
Baseline findings: CTO_BLUEPRINT.md (G01–G18). The blueprint describes the pre-fix audit snapshot; this tracker records subsequent work.

## Release standard

An item moves through: pending → implemented locally → regression-tested → staging-verified → deployed and verified. Source/build success alone cannot close a live workflow. Preserve existing data and security controls. No real charges, candidate messages, invented commercial terms or blind production migrations.

## Ordered delivery

| Phase | Work | Exit evidence | Current state |
|---|---|---|---|
| 1A | Subscription plan identifiers, validation and truthful quotas (G02, part of G13) | Create/edit contract tests, checkout acceptance, zero quota preservation; then staging purchase | Code, immutable snapshots and Hariom schema complete; approved live catalog and signed provider checkout pending |
| 1B | Approved PPH compensation, placement uniqueness, invoice receipt lifecycle (G03, G04, G06, G07) | Employer/admin authorisation, concurrent joining/replay, invoice review tests | DAY_25 scheduling and receipt review implemented; Hariom schema complete; app/scheduler deployment and authenticated staging verification pending |
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

Subscription batch: UUIDs for newly created plans, backward-compatible validated legacy checkout IDs, strict create/update input schemas, preserved zero quotas in persistence and API output, and offline regression suite added to CI. Missing/archived/zero-value plans now fail before an order or promo reservation is created; disabled gateway selection cannot silently reroute; signed webhooks can finish only an order already bound to that provider. Purchased price/currency/duration/quotas/features are frozen at checkout and used for fulfillment and AI entitlements, so later plan edits cannot alter paid terms.

Hariom migration `20260912033758 subscription_purchase_snapshots` is applied. Matching local Supabase/Prisma migration is `20260912032444_subscription_purchase_snapshots`; Prisma history is reconciled and both JSONB columns are verified. The live catalog, subscriptions and payment-order tables contained zero rows at migration time. No prices or quotas were invented. A real signed sandbox checkout, replay test, approved catalog and provider credentials remain required.

Invoice batch: `PENDING_VERIFICATION` is present in Prisma and Hariom, with local migration `20260911171031_invoice_pending_verification` reconciled to Supabase migration `20260912031705`. Employer receipt submission is private and tenant-bound; PNG/JPEG/PDF signatures are checked; the invoice transition, audit log and SIEM outbox are atomic; admin approve/reject is compare-and-swap protected; and recruiters cannot download payment receipts. Direct UNPAID-to-PAID UI bypass was removed. A disposable-database integration run, malware scanning/quarantine and retention policy remain outstanding.

Combined verification on 12 September 2026: 134 offline production-readiness tests passed, targeted ESLint passed, full TypeScript compilation passed, `git diff --check` passed, and the production Next.js build completed across 349 routes. This is build evidence, not deployment or payment-provider evidence.

### PPH follow-up — 11 September 2026

- Implemented authenticated employer/HireGo admin confirmation, approved CTC and signed DAY_25 terms snapshot, exact 25 x 24-hour eligibility, deterministic one-placement/one-invoice handling, hold/cancel/admin-resume and transactional billing worker.
- Existing shortlisted applications only; legacy HIRED records require reconciliation, not automatic backfill. Existing contracts are not silently changed to DAY_25. Advances require manual reconciliation; contractual discount, tax and credit days are respected.
- Worker is connected to the existing dedicated-key/Redis-coordinated recovery scheduler. It creates the invoice at eligibility or the next successful tick after downtime; payment credit days start on actual issuance.
- 134 offline regressions passed in the combined release suite, including 15 focused PPH tests plus 8 recovery-scheduler tests. Full TypeScript, targeted lint and production build passed. These are not live authenticated end-to-end or real multi-process database concurrency tests.
- Hariom schema applied via Supabase migration 20260911063102. Matching local scaffold/Prisma migration: 20260911061751_pph_joining_day25. Prisma bookkeeping reconciled after comparing the recorded SQL with local SQL (line endings/trailing newline normalized) and verifying the schema. Local SHA256: fee15d5a1bf6a629eab12ec358d2c54bd54ca89967660c3d9138cdee99159659. Do not reapply the same DDL through both migration systems.
- Verified RLS enabled, no anon/authenticated SELECT access, 0 placements and 11 unchanged invoices. Temporary-table constraint tests passed for eligibility, uniqueness and invoice state; all probe rows rolled back. No real invoice was generated.
- Supabase security advisor reports INFO-level RLS-without-policy notices, consistent with this server-only access model. Guidance: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy . Do not add permissive browser policies to silence this notice.
- **Not yet live-activated:** app release, running scheduler, healthy heartbeat and authenticated staging walkthrough remain unverified. Local .env inspection found no APP_URL/WORKER_RECOVERY_API_KEY/Upstash configuration; this does not establish hosted environment settings. No active commercial agreement was present at initial inspection.

### Deployment handoff required

Identify the existing production/staging hosting target; deploy the updated app there without moving platforms. Configure the recovery scheduler's dedicated secret and Redis settings through its secret manager, run the persistent scheduler, and verify its authenticated health endpoint. Create/accept an actual DAY_25 agreement through the normal approval process before confirming a placement. Do not invent contract acceptance or use live candidate invoices as test fixtures. Finish authenticated staging tests before production signoff.

Also provide the founder-approved subscription catalog and payment sandbox credentials. Run checkout → signed success webhook → replay and failure flows against staging. Add provider-aware expiry/reconciliation before automatically releasing abandoned promo reservations; blind time-based release could undercount a payment that the provider captured late.
