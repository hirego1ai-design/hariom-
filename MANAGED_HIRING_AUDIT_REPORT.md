# HireGo Managed Hiring Audit & Implementation Report

Date: 2026-08-15

## Product workflow

When an employer selects HireGo Managed Hiring, the service should run:

1. Requirement intake and validation.
2. Commercial agreement / MSA review and signature.
3. HireGo agent sourcing and resume screening.
4. Candidate shortlist and employer review.
5. Candidate assessments and integrity/proctoring checks.
6. Interview plan and availability collection.
7. Online HireGo portal interview or offline in-person interview.
8. HR, technical, operations/leadership, and final employer rounds.
9. Candidate scorecards and final employer recommendation.
10. Offer, joining confirmation, replacement warranty, and invoice.

## Existing implementation found

### Already present

- Managed hiring requirement wizard with six intake steps.
- Hiring requirement, agreement, agreement event, invoice, interview, notification, and application database models.
- Agreement and requirement repositories with Prisma plus memory fallback.
- Admin revenue and invoice screens.
- Resume evaluator, candidate matchmaker, interview copilot, security judge, communication coach, and other operational agents.
- Side-effect tools for email, WhatsApp placeholder dispatch, application status, interview scheduling, and invoice generation.
- In-app notification API.
- Interview room signaling API.

### Implemented in this pass

- Added a managed-hiring service plan screen at `/employer/managed-hiring/service-plan`.
- Added the four-round default plan: HR, Technical, Operations/Leadership, Final Employer.
- Added online/offline interview logistics guidance and notification-channel selection UI.
- Added authenticated employer interview scheduling API with round, mode, date/time, duration, offline address/contact, and email/in-app notification creation.
- Added a real browser media interview room with camera/microphone access, local/remote video elements, screen sharing, peer connection setup, ICE signaling, room polling, and end-session handling.
- Mounted the WebRTC room in the employer live interview page.
- Added room interview ID handoff to the final-feedback route.
- Added authentication to managed-hiring requirement and contract API endpoints.

## Important limitations still remaining

### WebRTC

The previous component was only a visual mock. It is now connected to browser media and peer-connection signaling, and both employer and candidate room screens use the room ID. The signaling store is still process memory, so production still requires Redis or another shared signaling store, TURN servers, connection authorization, room expiry, and a two-browser validation run.

### Notifications

- In-app notification persistence is available.
- Email notification is now queued by the scheduling API.
- WhatsApp delivery now uses a Meta Graph API adapter when `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are configured; without those values it safely reports that delivery is not configured.
- Calendar `.ics` download, cancel, and reschedule APIs/screens are implemented. A production outbox/provider should still be used for reliable retries and calendar-provider synchronization.

### Candidate tracking

The managed-hiring tracker now reads the real employer candidate/application API and persists stage changes through an authenticated endpoint. It supports screening, assessment, interview, shortlisted, joined, and rejected columns, scheduling, and the joining/invoice action. A requirement-scoped pipeline relation is still recommended for multiple concurrent managed-hiring requests.

### Interview rounds

The default four-round plan is visible and the scheduler creates real `Interview` records for an existing application. A persisted, configurable interview-plan record and automatic requirement-to-shortlist linking are still recommended for multi-request production operations.

### Invoice automation

Invoice models, repository, admin API, and an agent tool exist. The new managed-hiring join screen/API marks the application hired and creates an idempotent invoice from the submitted commercial values. The remaining production hardening is to source fee, tax, currency, and warranty rules directly from the signed agreement and emit the same action from a domain `CANDIDATE_JOINED` event.

## Recommended production sequence

1. Add a shared Redis signaling layer, TURN credentials, room authorization, and room expiry.
2. Create a managed-hiring candidate pipeline relation for requirement-scoped tracking.
3. Persist configurable interview-plan rounds and event history.
4. Connect email, in-app, WhatsApp, and calendar adapters through a retryable outbox.
5. Source invoice terms from the signed agreement and emit a domain `CANDIDATE_JOINED` event.
6. Expand admin queue buttons into agent assignment, shortlist approval, escalation, and warranty actions.
7. Run two-browser online interview tests, offline scheduling tests, cancellation/reschedule tests, provider delivery tests, tenant-isolation tests, and duplicate-event tests.

## Release verdict

The managed-hiring experience now has the requested employer screens and core server flows: service-plan selection, interview scheduling, online/offline logistics, candidate room, WebRTC media, feedback, tracking, cancel/reschedule, calendar invite, joining, invoice generation, and admin operations visibility. It is **code-complete for the requested workflow but not infrastructure-complete** until shared signaling/TURN, provider credentials/outbox delivery, agreement-driven invoice terms, and full browser/E2E validation are completed.
