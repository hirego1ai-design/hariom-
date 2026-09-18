# PPH day-25 release and verification

Updated 11 September 2026. Status: implementation present, focused offline checks passed; **not live deployment certification**.

## What is ready

The employer or HireGo administrator confirms joining, explicit terms acceptance and annual CTC against a signed active DAY_25 agreement. The application must be SHORTLISTED. The service stores approved amounts and terms, marks the application HIRED, and schedules eligibility exactly 25 × 24 hours after joining. It does not issue an invoice immediately. Payment credit days start when the worker actually issues the invoice, including after downtime.

The worker runs through `src/app/api/internal/workflows/recover/route.ts`, coordinated by a dedicated secret and Redis lease. `scripts/run-recovery-scheduler.mjs` calls it, waits 60 seconds after each result, then repeats. This is not an exact-to-the-second billing promise. It catches up eligible records on the next successful tick. A pass processes at most 20 placements, with a cooperative time budget.

## Evidence from this verification

- Command: `node --import tsx --test src/tests/pph-billing.test.ts src/tests/recovery-worker-regression.test.ts`.
- Result: **23 tests passed, zero failures**: 15 PPH tests and 8 recovery tests.
- Added checks for advances/payment windows, contract-date and tenant rejection, exhausted deadlines/zero batches, fixed-fee/zero-credit terms, and malformed-snapshot quarantine.
- Existing tests cover exact day-25 boundary, immutable amounts, replay, holds/cancellation, rollback and downtime catch-up.
- These tests use in-memory transaction doubles. They do **not** prove PostgreSQL row-lock behavior, real concurrency, authenticated browser journeys, external Redis health, or deployed operation. No real invoices were created.

## Hosting discovery and release blockers

Confirmed target architecture: Vercel hosts the Next.js web/API deployment,
Hariom Supabase (`eqsxuwlnidexlgseuogu`, `ap-southeast-2`) hosts PostgreSQL,
and Railway hosts the persistent recovery scheduler. Railway must build
`Dockerfile.scheduler`; deploying the repository's default `Dockerfile` there
would start a second web application instead of the scheduler.

Repository contains a standalone Next.js Docker build, a dedicated Railway
`Dockerfile.scheduler`, and an optional Compose `workers` profile.
`.github/workflows/deploy.yml` validates and builds; despite its title it
contains no production deployment job. Vercel and Railway still need to be
linked to their existing projects before release.

Required before deployment:

1. Confirm existing hosting project, staging URL and intended release revision. Do not move platforms or create a replacement deployment implicitly.
2. Configure the same dedicated `WORKER_RECOVERY_API_KEY` (at least 32 characters) on the app and scheduler. Use the platform secret manager; never print the value.
3. App needs working `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, database connection and existing app authentication/storage configuration. Isolate staging Redis from production because the recovery lock/heartbeat keys are fixed names.
4. Scheduler needs `APP_URL` pointing to the confirmed app. HTTPS is required except the explicitly allowed private/local HTTP case. Never send the recovery secret to an unverified host.
5. Vercel `DATABASE_URL` should use the Supabase transaction pooler for serverless traffic with Prisma pooler mode enabled. Keep `DIRECT_URL` for migrations/administrative sessions, never expose either URL to browser code.
6. Railway scheduler variables are only `APP_URL` and the same `WORKER_RECOVERY_API_KEY`. Set `RAILWAY_DOCKERFILE_PATH=Dockerfile.scheduler` on the scheduler service before its first deployment.
7. Deploy the updated app to Vercel and run the persistent scheduler on Railway. The Compose worker is optional and **does not start with the default profile**. Do not blindly use the full Compose stack against hosted Supabase: it also declares a separate local PostgreSQL service.
8. Confirm provider execution time supports the recovery endpoint's 60-second maximum. Confirm scheduler restarts after host/process restart.

The prior migration reconciliation is recorded in `PRODUCTION_READINESS_PLAN.md`. This verification did not re-read or mutate the live database. Do not blindly follow the older generic `DEPLOYMENT.md` migration command: compare migration histories first and never reapply the PPH DDL through both Prisma and Supabase.

## Staging acceptance checklist

Use an explicitly isolated staging database with synthetic companies, users, contracts and applications. Disable real messaging/payment integrations. Do not backdate live candidates for testing.

| Scenario | Required result | Current evidence |
|---|---|---|
| Owning employer/admin confirms accepted contract and CTC | One scheduled placement; no invoice yet | Offline test only |
| Foreign employer, recruiter, unsigned/wrong-rule contract | Rejected without writes | Offline test only |
| Joining at day 25 minus one millisecond | No invoice | Offline test only |
| Eligible synthetic placement; repeated/concurrent ticks | Exactly one invoice and INVOICED placement | Transaction-double test; real DB concurrency pending |
| Changed contract fee after approval | Original approved amount retained | Offline test only |
| Hold/cancel or invalid hiring/contract status | No invoice; reconciliation visible | Partial offline coverage; browser hold/resume pending |
| Worker interruption during transaction | No partial invoice; safe next attempt | Transaction-double rollback only |
| Scheduler downtime then restart | Eligible invoice issued once; credit period from issuance | Offline test only |
| Valid authenticated GET health request | Fresh completed/running heartbeat, HTTP 200 | Mocked route tests; hosted check pending |
| Missing/wrong secret or stale heartbeat | Rejection/unhealthy response | Mocked route tests; hosted check pending |

An authenticated POST triggers real work, including other recovery consumers. Never use it as a harmless production connectivity probe. The GET endpoint is read-only and should be used for hosted health verification after the scheduler is intentionally activated.

## Operations and rollback

- Alert on failed/attention/stale heartbeat, repeated recovery failures, overdue scheduled placements and unexplained invoice-count changes. A healthy heartbeat alone does not certify all business obligations.
- Record deployed revision, scheduler service identity, last successful heartbeat, synthetic acceptance evidence and rollback revision in release notes.
- If billing is incorrect, stop the scheduler first and place affected uninvoiced placements on hold through the authorized workflow. The shared scheduler also performs other recovery work, so notify operations of that pause.
- Do not delete invoices or revert additive schema to undo a release. Reconcile issued invoices through the approved financial process.
- Malformed approved snapshots now move to HOLD with an audit event in the same transaction, without an invoice, allowing the worker to continue. Database/persistence failures still propagate and fail the recovery pass rather than reporting false success. Alert and reconcile repeated failures; quarantine does not replace database-outage monitoring or operational intervention.

## Signoff still needed

Confirmed hosting target, deployed app/scheduler, hosted health evidence, isolated authenticated staging walkthrough, actual database concurrency checks, and operational owner approval. Commercial exceptions (early departure, warranty, disputed joining and advances) must follow accepted contract policy; the software must not invent them.
