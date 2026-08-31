# Candidate Portal Production Audit

Audit date: 2026-08-30  
Scope: candidate UI routes, candidate-accessible APIs, authentication, files, applications, assessments, credits, referrals, payments, interviews, and legacy routes.

## Method and limits

- Reviewed the 110 API route modules and candidate-accessible route families for authentication, authorization, ownership, validation, error truthfulness, duplicate actions, and fake fallback behavior.
- Reviewed candidate navigation and direct legacy URLs for prototype exposure.
- Used static review plus TypeScript, Prisma, and lint verification. No database-writing test or migration was run because the configured database has not been identified as disposable staging.
- Supabase Realtime is not used by the current code. The project uses Prisma/PostgreSQL; provider/RLS verification is therefore `BLOCKED_EXTERNAL` until a real Supabase project is connected.

## Fixed findings

| ID | Priority | Finding and evidence | Fix | Status |
| --- | --- | --- | --- | --- |
| CAN-001 | P1 | `api/notifications` created hard-coded score, job, and employer notifications when data was empty. | Removed memory fallback; empty database returns an honest empty list. PUT now validates the request and scopes updates to the authenticated user. | FIXED |
| CAN-002 | P1 | `api/candidate/saved-jobs` used a process-local Map and accepted unvalidated job IDs. A restart lost the candidate action while reporting success. | Removed fallback; added bounded UUID validation, active-job validation, and database-only idempotent save/remove. | FIXED |
| CAN-003 | P1 | `api/candidate/profile` accepted unbounded unvalidated body data and persisted a development-only profile outside the database. | Added bounded, allow-listed request validation and removed the memory fallback. Profile results now always describe database state. | FIXED |
| CAN-004 | P1 | `api/applications` returned an empty list on a database error outside production. | Removed the false empty-list fallback. | FIXED |
| CAN-005 | P1 | Video-resume UI used `video-resumes`, but upload API rejected it. Browser-recorded WebM was also rejected despite UI allowing it. | Added candidate-owned `video-resumes`, WebM signature/MIME handling, and role-specific upload categories. | FIXED |
| CAN-006 | P1 | A candidate could submit an arbitrary URL as a video resume. | Video-resume API now accepts only an owned, private HireGo video upload in the proper category. | FIXED |

## Verified controls — no change required

| Area | Evidence |
| --- | --- |
| Candidate application ownership | `api/applications` resolves the profile from the authenticated session and database has a unique candidate/job application constraint. |
| Job-Ready gate | Application API checks configured role/seniority and a non-expired `JOB_READY` record before an application is created. |
| MCQ answer secrecy | Start endpoint strips correct-answer fields and explanations before returning questions. |
| MCQ concurrent start | Partial unique index plus unique-conflict recovery protects a single active attempt. |
| File download IDOR | `api/files/[id]` checks owner, company membership, or administrator role before a private download. |
| Interview-room IDOR | `api/interviews/room` authorizes candidate ownership or matching employer company before reading/signaling. |
| Credit debit concurrency | Candidate service requests use atomic `balance >= cost` update and an idempotency key in one transaction. |
| Candidate/admin separation | Credit grants, typing prompts, readiness templates, and candidate-service configuration require administrator role. |

## Remaining findings and production blockers

| ID | Priority | Finding | Required action | Status |
| --- | --- | --- | --- | --- |
| CAN-007 | P1 | Referral invite/payout routes still use raw `request.json()` rather than bounded schemas. | Add strict Zod schemas, request-size limits, payout-address validation, and idempotency before enabling financial payouts at scale. | DEFERRED |
| CAN-008 | P1 | Candidate self-service credit purchase is intentionally unavailable; only administrator credit grants exist. | Select a payment gateway, implement a candidate order model and verified webhook, then test with provider credentials. | BLOCKED_EXTERNAL |
| CAN-009 | P1 | AI mock-interview API has safe provider failure handling but candidate UI is redirected until a real end-to-end interface is built. | Build and test the interface only after configured AI provider credentials are available. | BLOCKED_EXTERNAL |
| CAN-010 | P1 | Resume upload is private storage only; it does not parse or score content. | Add a private document-processing provider and explicit consent/retention design before enabling analysis. | BLOCKED_EXTERNAL |
| CAN-011 | P1 | Typing, Job-Ready, and candidate-credit tables are not live until migrations are applied. | Apply additive migrations to disposable staging, test, back up production, then deploy. | BLOCKED_EXTERNAL |
| CAN-012 | P1 | The local production build did not complete because this computer runs Node 26 while `package.json` specifies Node 20 only. | Use Node 20 for this repository, then run build and CI. | BLOCKED_EXTERNAL |
| CAN-013 | P2 | Several legacy direct URLs are redirects to supported flows rather than feature implementations. | Keep redirects, or build each feature with real data before re-exposing it in navigation. | DEFERRED |

## Candidate route inventory

| Route family | Current status |
| --- | --- |
| `/dashboard`, `/profile`, `/jobs`, `/applications`, `/notifications` | Database/API backed; audit fixes applied where listed. |
| `/assessment/readiness`, `/assessment/mcq` | Database-backed; requires administrator-created and published assessments. |
| `/assessment/typing/active` | Database-backed; requires one administrator-published typing prompt. |
| `/credits` | Database-backed ledger/services; no fake checkout. Requires credits or an administrator grant. |
| `/onboarding/resume-upload`, `/onboarding/document-upload`, `/onboarding/video-resume` | Private-upload backed; no fake AI result or verification claim. |
| Legacy AI/onboarding/prototype routes | Redirected; not exposed in candidate navigation. |
| Coding assessment/IDE | Removed/retired. |

## Required final validation

1. Use Node 20 and complete `npm run build`.
2. Apply the three additive migrations to a disposable staging database only.
3. Run authenticated integration tests for two candidate accounts to prove ownership isolation.
4. Configure real provider credentials before testing external AI, storage, payment, TURN, Redis, QStash, or Supabase services.
5. Run load tests only after the staging deployment is configured.
