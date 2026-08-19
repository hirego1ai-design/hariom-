# Employer Workflow Check

## Current intended workflow

### 1. Employer entry

`/employer/employer-onboarding-welcome`

The user chooses to create an employer account or sign in. This screen is still marked auto-generated and does not save onboarding progress.

### 2. Account and company registration

`/employer/employer-registration-company-info`

The form now calls `/api/auth/employer-register`. The backend creates the user, company, employer profile, and initial credits, then sends an email OTP.

### 3. Email/OTP verification

`/employer/employer-registration-otp-verification`

The page calls `/api/auth/verify-otp`, requires six digits, marks the user email as verified, and creates the authenticated employer session.

### 4. Commercial model

`/employer/employer-registration-business-model`

The employer chooses Managed Hiring or Subscription. Managed Hiring goes to a separate request flow; Subscription goes to plan selection.

### 5. Plan selection

`/employer/employer-registration-plan-selection`

The page loads plans and calls `/api/employer/subscribe`. It then routes to KYC.

### 6. KYC verification

`/employer/employer-registration-document-verification`

The employer selects exactly one document type: GST, MSME/Udyam, or Incorporation. The selected identifier and certificate are uploaded and submitted for admin review.

### 7. Registration completion

`/employer/employer-registration-complete`

The employer can go to the first-job prompt or dashboard. The screen still contains hard-coded trial and job-slot values.

### 8. First job prompt

`/employer/employer-onboarding-first-job-prompt`

The user can start job creation.

### 9. Job creation

The intended sequence is:

`create-job-basic-info` → `create-job-ai-jd-writing` → `create-job-requirements` → `create-job-matching-config` → `create-job-ai-screening` → `create-job-review-and-publish`

The final publish request uses `/api/employer/jobs`, with server-side role checks, credit checks, an atomic transaction, and idempotency handling.

### 10. Dashboard and hiring pipeline

After publishing, the employer should review candidates, move candidates through the pipeline, schedule interviews, and open the interview room.

### 11. Interview and final feedback

The intended sequence is:

`upcoming-interviews-list` → `active-video-interview-interviewer-view` → `final-round-feedback`

The final feedback form calls `/api/employer/interviews/[id]/feedback` and saves the scorecard into the interview record.

## Missing or broken steps found

| Priority | Missing step | Evidence | Result |
|---|---|---|---|
| P0 | Job creation does not continue through all steps | `create-job-requirements/page.tsx` routes back to AI JD writing; no route to matching config, screening, or review was found. | The employer cannot reliably reach the publish page through the normal flow. |
| P0 | Interview cards use the old feedback page | `upcoming-interviews-list/page.tsx` links to `/employer/interview-feedback-form`, not `/employer/final-round-feedback`. | Users can still open the old non-functional feedback screen. |
| P0 | Interview ID is not passed | Interview links are static and do not include `interviewId`. | The new API cannot know which interview to update. |
| P1 | End-interview persistence is missing | Live interviewer screen is marked auto-generated and its controls are mostly visual. | Ending an interview does not clearly update the real interview status before feedback. |
| P1 | Candidate/application/interview data is static in interview screens | The screens display fixed names/session IDs. | Feedback and pipeline changes cannot be trusted to affect the correct candidate. |
| P1 | KYC ownership is not fully enforced by the admin document POST endpoint | The request body supplies `employerId`; the endpoint checks that a profile exists but should also require it to match the authenticated session for non-admin users. | An employer could potentially submit a document against another employer ID. |
| P1 | Completion screen uses hard-coded status | It displays fixed “14 Days Left” and “0/5 Jobs Used” values. | The employer may see inaccurate subscription/credit state. |
| P2 | Onboarding progress is not persisted | Welcome and first-job prompt are auto-generated navigation screens. | Refreshing or returning later does not resume a known onboarding step. |
| P2 | Panel feedback collaboration is separate from final feedback | Panel collaboration is a visual screen and is not linked to the saved final scorecard. | Panel input may not be included in the final hiring decision. |

## Correct fix order

1. Connect job requirements → matching configuration → AI screening → review/publish.
2. Make interview records real and pass `interviewId` in every interview action link.
3. Replace all interview-card links to the final feedback form.
4. Persist interview completion before opening feedback.
5. Enforce KYC employer ownership server-side.
6. Load completion/subscription/credit values from the backend.
7. Persist onboarding progress and connect panel feedback to the final scorecard.

## Verdict

The employer workflow is now understandable and the registration/OTP/KYC foundation is connected, but it is **not yet a complete end-to-end hiring workflow**. The largest remaining blocker is the missing job-creation transition chain, followed by static interview data and missing feedback IDs.
