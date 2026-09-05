# HireGo 3.0 — Employer Portal Production Audit

**Audit date:** 2026-08-31  
**Scope:** Employer UI, employer APIs, multi-tenant authorization, hiring workflow, team access, assessments, interviews, managed-hiring billing, visible navigation, and automated verification.  
**Method:** Source-code trace from screen to API and database model, endpoint authorization review, contract comparison, static route check, TypeScript/lint/production-build verification. This is not a real-provider E2E test; email, payment, Redis, TURN/WebRTC, and WhatsApp still require staging credentials and live checks.

## Executive decision

**Do not declare the employer portal production-ready yet.**

The core job, assessment, team, and interview APIs have a sound starting point, and all employer routes are protected by the application proxy. However, several visible employer features are presentation-only, and there are confirmed P0/P1 defects affecting tenant privilege, invoice integrity, invitations, billing, and hiring-state persistence.

## Verified working foundations — no change required

- Employer pages are protected by the application proxy. Unauthenticated or candidate users are redirected away from `/employer/*`.
- Employer API routes consistently check an authenticated session; the main tenant-scoped routes verify company ownership before reading or changing jobs, candidates, interviews, assessments, and team records.
- The job API validates input, uses server-side company identity, and consumes a job-post credit transactionally when publishing a draft.
- The MCQ assessment builder has real create/read/update/delete/reorder API wiring, validation, tenant checks, audit logging, and rate limits.
- Interview creation, listing, cancellation/reschedule endpoint, feedback, and calendar-file endpoint exist and enforce company access.
- Team invitation tokens are cryptographically random, only a hash is stored, invitations expire, and sending rolls back if email delivery fails.
- Direct subscription activation is deliberately blocked; payment must start through the checkout flow.
- TypeScript check passed. Production build passed. ESLint completed with four warnings and no errors.

## P0 — fix before any employer production launch

### 1. Team invitation can grant the wrong privilege

**Evidence:** `src/app/api/employer/team/accept/route.ts` moves an existing employer profile to the invited company, but only changes the user role when the existing user is a `CANDIDATE`.

**Impact:** An existing `EMPLOYER` invited to another company as `RECRUITER` keeps the higher `EMPLOYER` role after accepting. That user can then use owner-only endpoints such as inviting/removing team members. This is a cross-tenant privilege escalation.

**Required fix:** Reject cross-company transfer by default, or require a separately authenticated transfer workflow. On acceptance, set the granted role exactly to the invitation role, revoke/rotate existing sessions, and add tests for existing `EMPLOYER`, `RECRUITER`, and `CANDIDATE` accounts.

### 2. Managed-hiring invoice generation trusts browser-controlled commercial data

**Evidence:** `src/app/employer/managed-hiring/join/page.tsx` sends `agreementId`, annual CTC, fee percentage, tax rate, candidate name, and job title from editable inputs. `src/app/api/employer/managed-hiring/join/route.ts` checks only that the application belongs to the caller's company, then creates an invoice from those values.

**Impact:** An employer/recruiter can generate an invoice using an arbitrary agreement ID, CTC, fee, tax, candidate name, and job title. The endpoint also has no durable atomic idempotency record despite accepting `idempotencyKey`.

**Required fix:** Resolve agreement, pricing model, candidate, job title, and permitted actor from database records on the server. Validate agreement ownership/status. Use the existing `IdempotencyRecord` table in the same transaction as invoice creation and application update. Limit invoice generation to the commercial role chosen in the product policy.

## P1 — production blockers

### 3. Invitation email points to a missing, protected page

**Evidence:** The team API creates `/employer/invitation/accept?token=...`, but no matching page exists. The proxy also treats this route as protected, so a new invitee cannot reach it before signing in.

**Impact:** New team invitations cannot be accepted.

**Required fix:** Build the acceptance page, make only that exact route public, submit the token/password to the existing acceptance API, and add an E2E test for new and existing users.

### 4. Team-management UI and API use incompatible roles

**Evidence:** The UI offers `Admin`, `Finance`, `Recruiter`, `Interviewer`, and `Viewer`, then sends upper-case values. The API accepts only `RECRUITER` and `EMPLOYER`. The UI also defaults its `activeSessionRole` to `Admin` instead of loading the signed-in user's role.

**Impact:** Most invitation choices fail validation; the screen displays a role simulator rather than real permissions.

**Required fix:** Choose and implement one RBAC model. Either support the five displayed roles end-to-end with permission checks, or expose only the two roles actually supported. Derive UI permissions from the authenticated session, never a client-side selector.

### 5. Employer billing screen calls administrator-only endpoints

**Evidence:** `src/app/employer/revenue-and-billing-management/page.tsx` reads and updates `/api/admin/invoices`. That API requires an `ADMIN` session.

**Impact:** Normal employers cannot load invoices, pay online, or submit a bank receipt. A default public image URL is also substituted when no receipt is uploaded.

**Required fix:** Create employer-scoped invoice endpoints that filter by the authenticated company; use the payment gateway for online payments; upload receipts to private storage; remove the placeholder receipt URL.

### 6. Job-listing actions claim success only in browser memory

**Evidence:** `src/app/employer/job-listings-management/page.tsx` fetches jobs, but bulk status, pause, delete, and single delete handlers only call React `setJobs`. They do not call the existing job update API.

**Impact:** The user sees a job paused/deleted until refresh; the database remains unchanged.

**Required fix:** Wire each action to a server endpoint, show failure/rollback state, and add a bulk operation API only if bulk actions are required.

### 7. Main hiring-pipeline stage changes are not persisted

**Evidence:** `src/app/employer/hiring-pipeline/page.tsx` calls `updateCandidateStage` from `EmployerContext`; that context only changes client state and never calls `/api/employer/candidates/[id]/stage`.

**Impact:** Candidate stage changes disappear on refresh and can mislead recruiters.

**Required fix:** Use the application ID from the candidate API, call the stage endpoint, and only update the UI after a successful response. The smaller managed-hiring tracker already demonstrates the correct API call pattern.

### 8. Interview reschedule screen sends the wrong API field

**Evidence:** `src/app/employer/interview-reschedule-employer-view/page.tsx` sends `{ status: ... }`; the API validates `{ action: "CANCEL" | "RESCHEDULE" }`.

**Impact:** Rescheduling/cancelling fails validation.

**Required fix:** Align the client to the API contract and add an endpoint test for both actions.

### 9. “Live interview” and proctoring monitor are not live records

**Evidence:** `active-video-interview-interviewer-view` hard-codes room ID, candidate, interviewer, and round. `active-proctoring-monitor` is a static HTML visual with sample status and images; it makes no authenticated telemetry request.

**Impact:** A real employer can be shown the wrong interview context, while the proctoring screen can imply monitoring that is not occurring.

**Required fix:** Resolve interview by an authorized interview ID/room ID, fetch `/api/interviews/room`, and bind the UI to real WebRTC/TURN and proctoring telemetry. Until then, hide these routes from production navigation and label them as unavailable.

### 10. Offer management has no backend model or API

**Evidence:** The Prisma schema has no `Offer` model and there is no offer API. The offer dashboard and send-offer page have no API reference.

**Impact:** Offer creation, approval, acceptance, expiry, audit trail, and document delivery are not production features.

**Required fix:** Either remove these screens from the production portal or implement a scoped offer domain with server-side authorization, audit trail, private document delivery, and acceptance workflow.

### 11. Local test command can write test records to the configured database

**Evidence:** `src/tests/suite.test.ts` creates invoices, subscriptions, OTPs, and other records. It is safe in CI because CI uses disposable PostgreSQL, but this workstation is configured for a live database.

**Impact:** Running `npm test` locally can pollute production data.

**Required fix:** Make the test runner refuse to start unless `HIREGO_TEST_DATABASE=1` and the database host/name positively matches a disposable test database. Keep real-provider checks in staging only.

## P2 — incomplete or misleading product surface

- 71 employer pages exist; only 26 directly reference an API. The remaining 45 require individual product review before being advertised as live.
- Candidate search, comparison, profile, ranking explanation, AI insights/evaluation, analytics, department management, company reviews, notifications, recruiter interaction, job boost/performance, and several job-creation helpers are largely static or use example values. They should not be presented as live data products until backend contracts exist.
- The main dashboard uses real aggregate metrics through `EmployerContext`, but urgent priorities, plan/company labels, growth values, chart lines, and several AI insights are hard-coded. Persist dashboard preferences or remove the controls that only affect the current browser session.
- Candidate profile links do not pass a candidate/application identifier, so the full profile screen cannot reliably open the selected real candidate.
- Interview scheduler requires manually entered application ID and ignores the application ID supplied by the tracker link. Add a protected candidate picker and query-parameter prefill.
- Static links to `/employer/pipeline`, `/employer/interviews`, `/employer/messages`, `/employer/candidate-pipeline-kanban`, and the invitation-accept page resolve to missing employer pages. Replace them with actual routes or remove them.
- Employer company settings can be updated by `RECRUITER` because the company API authorizes both `EMPLOYER` and `RECRUITER`. This conflicts with the UI’s stated owner/admin model; define the policy and enforce it server-side.
- Candidate, company, dashboard, and interview APIs lack consistent rate limiting and request schemas compared with the hardened assessment/job/team routes.
- `Invoice`, `PaymentTransaction`, and some commercial calculations use `Float`. This is a financial precision risk. Do not alter live money columns automatically; plan a staged, backwards-compatible migration to integer minor units or `Decimal` with reconciliation.

## Validation performed

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | Passed |
| ESLint | Passed with 4 warnings, 0 errors |
| Next.js production build | Passed; 323 static pages generated |
| Employer page/API inventory | 71 pages, 23 employer API route files |
| Local full test suite | Not run — unsafe against the live configured database |
| Real email/payment/Redis/TURN/WhatsApp E2E | Blocked until staging credentials are configured |

## Safe release order

1. Fix the two P0 authorization/financial issues and add regression tests.
2. Repair invitation acceptance, team RBAC, billing ownership, job/pipeline persistence, and interview contracts.
3. Hide or label non-live screens until their API/data model is complete.
4. Make local test execution fail-safe, then run the full suite against disposable CI PostgreSQL.
5. Configure email, payment, Redis, storage, TURN, and WhatsApp in staging; run real acceptance tests with two companies and two roles.
6. Run a security regression and production smoke test before release.
