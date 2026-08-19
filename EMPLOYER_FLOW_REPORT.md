# Employer Journey Verification Report

Date: 2026-08-15  
Scope: Employer sign-up through interview feedback  
Repository: Hirego3.0

## Executive verdict

**Previously FAIL; current implementation status: core flow fixed, production validation still required.** Employer registration, OTP verification, canonical business-model/plan routing, KYC single-document selection, interview feedback, scheduling, candidate tracking, and joining invoice actions are now connected to server operations. Browser E2E, provider delivery, and external infrastructure validation remain release gates.

## Journey status

| Stage | Status | Evidence | Impact |
|---|---|---|---|
| Employer sign-up form | Implemented | Company form calls the dedicated employer registration transaction and continues to OTP. | Requires browser retry/refresh E2E coverage. |
| Employer auth API | Partial | `/api/auth/register` supports `EMPLOYER`, creates a user, and sets `hirego_session`, but the employer sign-up screen does not use it. | Backend capability is disconnected from the UI. |
| Business model/plan | Partial | Business-model buttons only navigate; plan selection calls `/api/employer/subscribe`, but the registration flow skips business-model selection and routes directly to documents. | Commercial choice may not be recorded and the intended step order is inconsistent. |
| OTP verification | Implemented | OTP page calls `/api/auth/verify-otp`, requires six digits, and server verification is persisted. | SMS/email provider and rate-limit tests remain. |
| KYC document upload | Partial/Risky | Upload uses `/api/upload` and `/api/admin/document-verification`, but employer session is read from a client cookie and the verification payload uses `companyName: docs.gstin`. | Submission may be linked incorrectly; server-side ownership and identifier mapping need confirmation. |
| Registration completion | Misleading | Completion page displays active trial, job slots, and “fully configured” copy without loading backend status. | UI can report success/status that does not reflect the account. |
| Employer dashboard | Partial | Dashboard data is fetched through employer APIs and middleware protects `/employer/*`, but `EmployerContext` starts with placeholder user state and local-only jobs. | Some pages may show fabricated/default data or lose state after refresh. |
| Job creation/publish | Partial/Implemented | Review page calls `/api/employer/jobs` with a real session and idempotency key; server route validates role, credits, and job creation. | This is the strongest part, but upstream account/company setup must be fixed first. |
| Interview feedback | Implemented | `/employer/final-round-feedback` submits validated feedback to `/api/employer/interviews/[id]/feedback` and stores it on the interview record. | Requires testing with a real scheduled interview ID. |

## Critical findings

### Resolved — Employer registration

The company-info form now calls the dedicated employer registration transaction, creates the user/company/profile/credits records, sends OTP, and continues to verification. Browser retry and refresh coverage remains a release test.

Follow-up: persist a signed multi-step registration draft if users must resume the flow across devices.

### Resolved — Interview feedback

The final-round feedback screen now manages the form, validates the required narrative fields, and submits to `/api/employer/interviews/[id]/feedback`, which authorizes by company and stores structured feedback on the interview record.

Follow-up: run the screen with a real scheduled interview ID and verify the stored scorecard in the admin workflow.

### Resolved — OTP verification

The OTP page requires six digits and calls `/api/auth/verify-otp`; the server validates and persists the verification state. Provider delivery, retry limits, and expiry need live environment testing.

Follow-up: verify provider delivery and rate limiting in staging.

### Resolved — Employer login bypass

The employer sign-in page no longer creates demo employer/admin sessions after failed login. It now depends on the real authentication response.

Follow-up: test failed credentials and role boundaries in browser E2E.

### Resolved — Registration route order

The canonical flow is now company details → OTP → business model → subscription/plan → one KYC document. KYC accepts exactly one of GST, MSME, or incorporation certificate.

Follow-up: enforce server-side step tokens if resumable registration is required.

### Remaining — Completion and dashboard data depth

Some older dashboard/completion surfaces still contain generated placeholder copy and partial local context. The core registration and managed-hiring operations are server-backed, but dashboard usage counters and identity hydration should be reviewed before release.

Follow-up: replace remaining placeholder dashboard counters with authenticated API data.

## What is working or partially working

- Middleware has employer route protection for sessions with `EMPLOYER`, `RECRUITER`, or `ADMIN` roles.
- `/api/auth/register` validates input, hashes passwords, creates a user, and sets an HTTP-only session cookie.
- `/api/employer/jobs` includes server-side role validation, subscription/credit checks, an atomic transaction, and idempotency handling.
- KYC upload has a real file upload request and a real admin verification submission request, although ownership/data mapping needs hardening.
- The project lint command completed without reported lint errors in the available run output. A full browser/E2E execution was not available from static inspection alone.

## Release recommendation

The requested employer workflow is implemented in code. Release still requires browser E2E tests covering refresh, failure/retry, permissions, duplicate submit, tenant isolation, two-browser WebRTC, notification providers, and the remaining dashboard placeholder counters.
