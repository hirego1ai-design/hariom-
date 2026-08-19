# Candidate Feature & Workflow Audit Report

**Audit date:** 17 August 2026  
**Scope:** Candidate-facing screens, candidate application/interview workflow, backend persistence and authorization, hardcoded/mock data, duplicate features, and missing wiring.

## Executive result

The candidate area is **partially functional, not production-ready**.

The core path is present:

`Register/Login → OTP → Onboarding → Profile → Job Search → Apply → Application Tracker`

The main production blockers are:

1. Candidate screens can show fabricated data when the database is empty or unavailable.
2. Interview screens are mostly static and the WebRTC room is process-memory only.
3. Application creation can use the wrong company (`comp-1`) and allows duplicates.
4. Candidate routes and employer candidate pipelines are duplicated or misrouted.
5. Security bypasses exist in authentication and admin access.

## 1. Candidate workflow status

| Workflow step | Current status | Evidence / issue |
|---|---|---|
| Registration and login | Partial | `/src/app/register/page.tsx`, `/src/app/login/page.tsx`, and `/src/app/otp/page.tsx` call the auth APIs, but auth has bypass risks in `/src/lib/auth.ts`, `/src/proxy.ts`, and `/src/app/api/auth/register/route.ts`. |
| Candidate onboarding | Partial | Profile fields are saved through onboarding pages, but preferences and video resume are not reliably persisted. Several fields start with fake defaults. |
| Candidate profile | Partial | `/src/app/profile/page.tsx` calls `/api/candidate/profile`, but the API falls back to fabricated in-memory profile data. |
| Universal profile | Not correctly wired | `/src/app/candidate/universal-profile/page.tsx` renders the employer-facing profile page and the profile service uses localStorage/mock data. |
| Job search | Partial | `/src/app/jobs/page.tsx` calls `/api/jobs/search`, but falls back to three static jobs when the API returns no results. |
| Job details | Partial | `/src/app/jobs/[id]/page.tsx` can fabricate a job when the requested record is missing. |
| Save job | Partial | `/api/candidate/saved-jobs` exists, but it has a process-memory fallback and returns a fabricated job when the database is unavailable. |
| Apply to job | Partial / high risk | `/api/applications` exists, but application tenant is hardcoded to `comp-1`, duplicate applications are allowed, and writes are not atomic. |
| Application tracker | Partial | `/src/app/applications/page.tsx` is API-backed. Status mapping is incomplete and tabs contain fixed counts such as `Active (1)`. |
| Application timeline | Partial | `/src/app/applications/timeline/page.tsx` is API-backed but inserts a fake default application when no record exists. |
| Application history | Not live | `/src/app/applications/history/page.tsx` is a static raw HTML screen with fixed metrics and records. |
| Application pipeline | Not live | `/src/app/applications/pipeline/page.tsx` hardcodes counts and candidate records while claiming real-time analytics. |
| Withdraw application | Missing | `/src/app/applications/withdraw/page.tsx` is a static confirmation screen; its actions have no persistence endpoint or working behavior. |
| Interview list/calendar | Not live | `/src/app/interviews/page.tsx` uses fixed October 2024 events and fixed dates instead of reading candidate interviews. |
| Interview scheduling | Employer-side only / partial | Employer scheduling exists, but candidate confirmation, cancellation, rescheduling, and notification delivery are incomplete. |
| Online interview room | Not production-ready | `/api/interviews/room` stores signaling in a process-local Map, accepts arbitrary room IDs, creates synthetic interview IDs, and does not authorize access against `Interview`. |
| Interview feedback | Employer-side partial | Feedback is stored by overwriting `Interview.aiFeedback`; there is no feedback history model and no candidate notification after submission. |
| Offer | Not live | `/src/app/offers/page.tsx` contains a complete-looking but fully hardcoded offer, salary, company, manager, and buttons without working actions. |
| Candidate notifications | Partial / unsafe | `/api/notifications` has fallback notifications and its update query does not filter by `userId`. |
| Video resume | Partial / simulated | `/src/components/candidate/VideoResumeModule.tsx` records in-browser but upload/save is simulated with timers and object URLs. |
| Assessment | Partial | Several assessment screens are static; `/src/app/assessment/typing/setup/page.tsx` contains literal HTML-style handlers that are not React-wired. |

## 2. Backend and data findings

### Critical

- **Authentication bypass:** `/src/lib/auth.ts` accepts tokens ending in `.mockSignature`; `/src/proxy.ts` grants admin access with `?bypass=true`; public registration permits `ADMIN` role.
- **Database failure can appear successful:** `/src/lib/prisma.ts` contains hardcoded users/jobs and returns mock state when Prisma fails. Candidate profile, saved jobs, applications, and notifications also use silent in-memory fallbacks.
- **Wrong application tenant:** `/src/app/api/applications/route.ts` passes `companyId: "comp-1"` instead of deriving the company from the selected job. This can corrupt tenant ownership and telemetry.
- **Application duplicates:** `Application` has no unique constraint on `(candidateProfileId, jobId)`, and POST does not check for an existing application or active job.
- **Interview room security:** `/src/app/api/interviews/room/route.ts` does not bind a room to a Prisma interview or verify candidate/employer ownership. A known room ID is enough to read signaling data.

### High

- Application creation, outbox, and telemetry writes are not atomic in `/src/lib/ros/RosGateway.ts`.
- Candidate profile GET/PUT reports success with fabricated or volatile data when Prisma is unavailable.
- Candidate registration data in `/src/services/candidateProfileService.ts` is localStorage-only and is not connected to `/api/candidate/profile`.
- Interview scheduling creates the interview, notification, and external messages as separate side effects; failures can be swallowed while the API reports success.
- Interview duplicates are allowed because there is no idempotency key or uniqueness rule.
- Notification update by ID does not include `userId`, allowing cross-user notification updates.
- Email delivery in `/src/lib/email.ts` only logs and returns success; it does not send mail.
- Prisma migration history is absent; only `schema.prisma` and `seed.ts` are present.

### Medium

- Feedback is stored as JSON text in `Interview.aiFeedback` and overwritten on every submission. There is no dedicated feedback record or audit history.
- Feedback submission does not create a candidate notification.
- The outbox worker reads and updates pending entries without atomic row claiming, allowing duplicate processing by concurrent workers.
- Side-effect tools validate idempotency keys but do not persist or enforce them.
- Employer candidate API returns placeholder education, salary, notice period, source, recommendation, and name values instead of actual candidate data.
- Candidate and employer stage vocabularies do not match. The UI, API, and database need one shared stage enum.

## 3. Missing screens or missing wiring

These screens/routes exist but are not fully connected to the workflow:

- Candidate-owned Universal Profile screen.
- Candidate interview inbox/calendar loaded from the candidate's scheduled interviews.
- Interview details with online/offline mode, address/contact details, round number, and join-room authorization.
- Candidate reschedule and cancellation flow connected to backend state.
- Candidate interview feedback/result screen after each round.
- Candidate notification preferences and delivery status for app, email, and WhatsApp.
- Candidate application withdraw endpoint and confirmation persistence.
- Live application history/statistics derived from actual applications.
- Candidate offer detail, accept, decline, revision request, and downloadable offer document.
- Persisted video resume upload, metadata, transcript, and playback.
- Persisted candidate preferences and readiness/matching result.
- Assessment setup/results actions connected to saved assessment attempts.
- Candidate-facing status history/audit trail for screening, shortlist, interview, offer, hired, rejected, and withdrawn.

## 4. Hardcoded or mock data to remove from production

### Candidate-facing

- `/src/mocks/candidateProfileData.ts` — full fabricated Universal Candidate Profile.
- `/src/services/candidateProfileService.ts` — mock/localStorage fallback.
- `/src/app/api/candidate/profile/route.ts` — fabricated default profile and score.
- `/src/app/onboarding/skills/page.tsx` — fake default skills.
- `/src/app/onboarding/experience/page.tsx` — fake TechNova experience.
- `/src/app/onboarding/education/page.tsx` — fake Stanford education.
- `/src/app/onboarding/resume-upload/page.tsx` — fake `Alex_Chen_Resume_2026.pdf` default.
- `/src/app/jobs/page.tsx` — three static jobs and fake API-mapping defaults.
- `/src/app/jobs/[id]/page.tsx` — fabricated fallback job details.
- `/src/app/applications/pipeline/page.tsx` — fixed counts and candidate names.
- `/src/app/applications/history/page.tsx` — fixed application history and metrics.
- `/src/app/applications/timeline/page.tsx` — fake default application.
- `/src/app/applications/withdraw/page.tsx` — fixed company, role, date, and copy.
- `/src/app/jobs/apply/success/page.tsx` — fixed application ID, date, role, and score.
- `/src/app/interviews/page.tsx` — fixed candidate, company, rounds, dates, and October 2024 calendar.
- `/src/app/offers/page.tsx` — fixed offer letter, salary, manager, benefits, and action buttons.
- `/src/components/candidate/VideoResumeModule.tsx` — sample video and simulated save behavior.
- `/src/app/api/notifications/route.ts` — seeded fallback notifications.

### Employer-side candidate surfaces that affect the same workflow

- `/src/app/employer/full-candidate-profile-employer-view/page.tsx` — hardcoded profile sections and public sample videos.
- `/src/app/employer/candidate-comparison/page.tsx` — hardcoded Sarah Jenkins and Marcus Chen; actions are not wired.
- `/src/app/employer/enterprise-talent-pool-database/page.tsx` — separate hardcoded talent list; profile links omit candidate IDs.
- `/src/app/api/employer/candidates/route.ts` — placeholder candidate fields and incorrect name/avatar mapping.

## 5. Duplicate or misrouted features

### Candidate route duplication

These wrappers duplicate the generic routes and should be consolidated or redirected:

- `/src/app/candidate/dashboard/page.tsx` → `/dashboard`
- `/src/app/candidate/job-search/page.tsx` → `/jobs`
- `/src/app/candidate/profile/page.tsx` → `/profile`
- `/src/app/candidate/universal-profile/page.tsx` → employer-facing profile route

`/src/components/candidate/CandidateSidebar.tsx` links to generic routes and, for Universal Profile, routes candidates through an employer URL.

### Employer pipeline duplication

Three separate candidate-pipeline implementations exist:

- `/src/app/employer/hiring-pipeline/page.tsx`
- `/src/app/employer/proactive-candidate-search/page.tsx`
- `/src/app/employer/managed-hiring/candidate-tracking/page.tsx`

They use different data sources and stage vocabularies. The managed-hiring tracker is the strongest backend-wired surface; the others should become views over one canonical candidate/application pipeline or be removed from production navigation.

## 6. Recommended canonical design

Use one source of truth:

```text
CandidateProfile
  └── Application
        ├── status history / audit events
        ├── InterviewRound[]
        │     ├── schedule + online/offline details
        │     ├── notifications
        │     └── feedback history
        ├── Offer
        └── Invoice / joining outcome where applicable
```

Recommended canonical candidate URLs:

- `/candidate/dashboard`
- `/candidate/jobs`
- `/candidate/profile`
- `/candidate/applications`
- `/candidate/applications/[id]`
- `/candidate/interviews`
- `/candidate/interviews/[id]`
- `/candidate/offers/[id]`
- `/candidate/notifications`

Generic legacy routes can redirect to these URLs during migration. No candidate route should render an employer-only screen.

## 7. Production fix order

1. Remove auth/admin bypasses and disable fabricated production fallbacks.
2. Fix application tenant derivation, duplicate prevention, active-job validation, and atomic writes.
3. Replace in-memory interview rooms with persisted, authorized interview sessions and durable signaling infrastructure.
4. Add persisted interview rounds, reschedule/cancel actions, feedback history, and candidate notifications.
5. Replace hardcoded candidate/jobs/application/offer screens with API-backed empty/loading/error states.
6. Consolidate candidate routes and employer pipeline screens around one shared stage model.
7. Persist candidate preferences, video resume, assessments, and offer actions.
8. Add Prisma migration history and run end-to-end candidate tests with the real database.

## Audit conclusion

The project has a good visual prototype and several real API paths, but the candidate workflow currently mixes live data with fabricated fallback data. That makes the application look complete while hiding database, authorization, and persistence failures. The hardcoded and duplicate screens should be treated as prototype material until replaced or explicitly removed from production navigation.

**No hardcoded or duplicate feature was destructively deleted during this audit.** The report identifies exactly what should be removed or consolidated so implementation can be done without accidentally breaking navigation or existing employer workflows.
