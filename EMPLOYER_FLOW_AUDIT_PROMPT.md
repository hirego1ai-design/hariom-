# Detailed Employer Flow Verification Prompt

Use this prompt to perform a complete end-to-end QA audit of the HireGo employer journey.

## Objective

Verify that an employer can move from account creation to a completed interview feedback submission using real data, real authentication, correct permissions, and durable persistence. Do not treat navigation, demo text, alerts, or local React state as proof that a feature works.

## Journey under test

1. Open the employer onboarding/sign-up entry point.
2. Create an employer account with a new company email, company name, industry, size, password, and confirmation password.
3. Confirm password mismatch, invalid email, weak password, duplicate email, empty required fields, and refresh/back-button behavior.
4. Confirm that registration calls the employer registration API, creates a database user with role `EMPLOYER`, creates or links the employer/company profile, and establishes a secure session.
5. Complete business model and plan selection. Confirm plans are loaded from the API, plan selection is saved for the correct company, payment/trial state is accurate, and no step can be bypassed accidentally.
6. Complete OTP verification with an actual generated OTP. Test incorrect, expired, reused, incomplete, resend, rate-limit, and refresh cases.
7. Upload required KYC documents. Test file type, file size, missing identifiers, upload failure, verification submission failure, duplicate submission, and retry behavior. Confirm documents are linked to the authenticated employer and visible to an administrator.
8. Reach the completion screen. Confirm status text matches backend state and that trial/credits are not hard-coded.
9. Enter the employer dashboard. Confirm the session is accepted by middleware, role checks are enforced, company-scoped data is loaded, and refresh does not lose data.
10. Create a job through every step. Confirm draft data survives navigation, validation is real, publish calls the API, credits are deducted exactly once, idempotency works, and the created job appears after refresh.
11. Review candidates and schedule/open an interview. Confirm candidate, job, interview, and employer IDs are real and correctly related.
12. Open the feedback form from an interview. Confirm the interview/candidate context is passed in the URL or server state.
13. Complete overall rating, competency scores, strengths, improvements, red flags, and recommendation. Confirm the submit control becomes enabled only when valid.
14. Submit feedback. Confirm an authenticated API request is made, the payload is validated server-side, feedback is saved, duplicate submissions are handled, and the user receives a success/error state.
15. Refresh or revisit the interview. Confirm feedback remains available to the authorized hiring panel, is hidden from unauthorized users, and affects the pipeline/dashboard only according to the product rules.

## Evidence to collect

For every step record:

- URL and entry action.
- Expected result and observed result.
- Network request, HTTP status, request payload, and response payload.
- Database record created or updated.
- Authentication cookie/session and role.
- Whether the result survives refresh and a new browser session.
- Console/runtime errors.
- Severity: Blocker, Critical, Major, Minor, or Pass.

## Acceptance criteria

- No employer account or company is created solely by client-side navigation.
- No authentication or authorization bypass exists in UI or API routes.
- OTP and KYC verification cannot be completed with fabricated or empty values.
- Every displayed success state corresponds to a successful backend operation.
- Every form submission has a real handler and a corresponding API or clearly documented intentional local-only behavior.
- Feedback is saved with employer, interview, candidate, and job relationships.
- All employer data is tenant-scoped and protected on the server.
- Critical failures show actionable messages and leave the user able to retry safely.

## Final report format

Produce:

1. Executive verdict: Pass, Pass with risks, or Fail.
2. Journey status table from sign-up through feedback.
3. Findings with severity, evidence, impact, and remediation.
4. Missing API/data-model coverage.
5. Recommended test cases for browser QA and automated E2E coverage.
6. Release recommendation and priority order.
