# HIREGO AI — COMPLETE PORTAL PRODUCTION WIRING AUDIT

Generated: 2026-08-18T17:04:59.269Z
Repository: Hirego3.0
Audit mode: read-only static source audit plus route/build checks. Application code was not modified for this audit.

## 1. EXECUTIVE VERDICT

**NOT READY for production.**

The portal contains a large implemented surface, but the repository still contains simulated AI output, local upload persistence, and many UI/API paths that require runtime E2E verification. The recently fixed auth gates still need production revalidation. The machine-readable inventory contains one record per discovered screen, handler, frontend API call, API method, and server action.

### Scope discovered

| Artifact | Count |
| --- | --- |
| Screen/page files | 245 |
| API route files | 78 |
| API method records | 120 |
| User-action records | 1015 |
| Frontend API-call records | 151 |
| Server-action files | 0 |
| Source files scanned | 437 |
| Inventory records | 1531 |

### Repository verification checks

| Check | Result | Evidence |
| --- | --- | --- |
| Inventory generator syntax | PASS | node --check scripts/generate-production-wiring-inventory.mjs |
| Report generator syntax | PASS | node --check scripts/generate-production-wiring-report.mjs |
| JSON/CSV reconciliation | PASS | 1,531 JSON records and 1,531 CSV data rows; 0 missing evidence |
| TypeScript | NOT EVALUATED | WhatsApp-related failure excluded from this non-WhatsApp remediation pass |
| Full ESLint | FAIL | 40 errors and 4 warnings across repository source/scripts |
| Production build | NOT YET VERIFIED | Run after resolving type/lint blockers |

The audit does not treat a passing static inventory generator as an application build pass. TypeScript and lint failures block release independently of feature wiring.

## 2. COMPLETE SCREEN INVENTORY

The complete 245-screen registry is in [production-wiring-inventory.json](./production-wiring-inventory.json) and [production-wiring-inventory.csv](./production-wiring-inventory.csv). The following table is generated directly from every `src/app/**/page.*` file:

| Route | Status | Component | Notes |
| --- | --- | --- | --- |
| /admin/agreements/builder | YELLOW | src/app/admin/agreements/builder/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/agreements/templates | YELLOW | src/app/admin/agreements/templates/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/ai-command-centre-dashboard | BLUE | src/app/admin/ai-command-centre-dashboard/page.tsx | No interactive handler detected by static scan. |
| /admin/dashboard | BLUE | src/app/admin/dashboard/page.tsx | No interactive handler detected by static scan. |
| /admin/document-verification | YELLOW | src/app/admin/document-verification/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/employers | BLUE | src/app/admin/employers/page.tsx | No interactive handler detected by static scan. |
| /admin/invoices | YELLOW | src/app/admin/invoices/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/jobs | RED | src/app/admin/jobs/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/licenses/allocator | RED | src/app/admin/licenses/allocator/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/login | RED | src/app/admin/login/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/logs/stream | BLUE | src/app/admin/logs/stream/page.tsx | No interactive handler detected by static scan. |
| /admin/managed-hiring/agreements/builder | RED | src/app/admin/managed-hiring/agreements/builder/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/managed-hiring/operations | YELLOW | src/app/admin/managed-hiring/operations/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/managed-hiring/pipeline | YELLOW | src/app/admin/managed-hiring/pipeline/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/managed-hiring/requests | YELLOW | src/app/admin/managed-hiring/requests/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/managed-hiring/templates | YELLOW | src/app/admin/managed-hiring/templates/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/models/playground | RED | src/app/admin/models/playground/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/models/registry | RED | src/app/admin/models/registry/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin | BLUE | src/app/admin/page.tsx | No interactive handler detected by static scan. |
| /admin/payment-gateways | RED | src/app/admin/payment-gateways/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/pricing-engine | YELLOW | src/app/admin/pricing-engine/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/proctoring-control-panel | RED | src/app/admin/proctoring-control-panel/page.tsx | No interactive handler detected by static scan. |
| /admin/referrals | RED | src/app/admin/referrals/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/revenue | BLUE | src/app/admin/revenue/page.tsx | No interactive handler detected by static scan. |
| /admin/roles | BLUE | src/app/admin/roles/page.tsx | No interactive handler detected by static scan. |
| /admin/security/vulnerability-inspector | RED | src/app/admin/security/vulnerability-inspector/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/ai-agents | BLUE | src/app/admin/settings/ai-agents/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/analytics | BLUE | src/app/admin/settings/analytics/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/audit-log | RED | src/app/admin/settings/audit-log/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/domain | BLUE | src/app/admin/settings/domain/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/hub | BLUE | src/app/admin/settings/hub/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/integrations | BLUE | src/app/admin/settings/integrations/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/llm-usage | YELLOW | src/app/admin/settings/llm-usage/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/managed-hiring | YELLOW | src/app/admin/settings/managed-hiring/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/payment-gateway | BLUE | src/app/admin/settings/payment-gateway/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/plan-management | BLUE | src/app/admin/settings/plan-management/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/security | YELLOW | src/app/admin/settings/security/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/smtp | BLUE | src/app/admin/settings/smtp/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/terms-privacy | BLUE | src/app/admin/settings/terms-privacy/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/whatsapp | BLUE | src/app/admin/settings/whatsapp/page.tsx | No interactive handler detected by static scan. |
| /admin/signups | YELLOW | src/app/admin/signups/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/sla/monitor | BLUE | src/app/admin/sla/monitor/page.tsx | No interactive handler detected by static scan. |
| /admin/subscriptions | RED | src/app/admin/subscriptions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/system/backup-recovery | RED | src/app/admin/system/backup-recovery/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/system/db-pool | RED | src/app/admin/system/db-pool/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/system/infrastructure | YELLOW | src/app/admin/system/infrastructure/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/system/queue-broker | RED | src/app/admin/system/queue-broker/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/system-health | YELLOW | src/app/admin/system-health/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/users | BLUE | src/app/admin/users/page.tsx | No interactive handler detected by static scan. |
| /ai/career-insights | RED | src/app/ai/career-insights/page.tsx | No interactive handler detected by static scan. |
| /ai/career-prediction | BLUE | src/app/ai/career-prediction/page.tsx | No interactive handler detected by static scan. |
| /ai/coach/active | YELLOW | src/app/ai/coach/active/page.tsx | Interactive handlers detected; action-level rows follow. |
| /ai/coach/results | RED | src/app/ai/coach/results/page.tsx | No interactive handler detected by static scan. |
| /ai/mock-interview/active | RED | src/app/ai/mock-interview/active/page.tsx | Interactive handlers detected; action-level rows follow. |
| /ai/mock-interview/setup | RED | src/app/ai/mock-interview/setup/page.tsx | No interactive handler detected by static scan. |
| /ai/mock-interview/summary | RED | src/app/ai/mock-interview/summary/page.tsx | No interactive handler detected by static scan. |
| /ai/practice-hub | RED | src/app/ai/practice-hub/page.tsx | Interactive handlers detected; action-level rows follow. |
| /ai/resume-score | BLUE | src/app/ai/resume-score/page.tsx | No interactive handler detected by static scan. |
| /ai/skill-gap | BLUE | src/app/ai/skill-gap/page.tsx | No interactive handler detected by static scan. |
| /applications/history | RED | src/app/applications/history/page.tsx | Interactive handlers detected; action-level rows follow. |
| /applications | YELLOW | src/app/applications/page.tsx | Interactive handlers detected; action-level rows follow. |
| /applications/pipeline | YELLOW | src/app/applications/pipeline/page.tsx | Interactive handlers detected; action-level rows follow. |
| /applications/timeline | RED | src/app/applications/timeline/page.tsx | Interactive handlers detected; action-level rows follow. |
| /applications/withdraw | RED | src/app/applications/withdraw/page.tsx | No interactive handler detected by static scan. |
| /assessment/coding/ide | RED | src/app/assessment/coding/ide/page.tsx | Interactive handlers detected; action-level rows follow. |
| /assessment/coding/results | RED | src/app/assessment/coding/results/page.tsx | No interactive handler detected by static scan. |
| /assessment/coding/running | RED | src/app/assessment/coding/running/page.tsx | No interactive handler detected by static scan. |
| /assessment/coding/setup | RED | src/app/assessment/coding/setup/page.tsx | No interactive handler detected by static scan. |
| /assessment/env-check | RED | src/app/assessment/env-check/page.tsx | No interactive handler detected by static scan. |
| /assessment/instructions | RED | src/app/assessment/instructions/page.tsx | No interactive handler detected by static scan. |
| /assessment/interview-replay | RED | src/app/assessment/interview-replay/page.tsx | No interactive handler detected by static scan. |
| /assessment/mcq/active | RED | src/app/assessment/mcq/active/page.tsx | No interactive handler detected by static scan. |
| /assessment/mcq/results | RED | src/app/assessment/mcq/results/page.tsx | No interactive handler detected by static scan. |
| /assessment/mcq/review | RED | src/app/assessment/mcq/review/page.tsx | No interactive handler detected by static scan. |
| /assessment/mcq/warning | RED | src/app/assessment/mcq/warning/page.tsx | No interactive handler detected by static scan. |
| /assessment/mock-interview/dna | RED | src/app/assessment/mock-interview/dna/page.tsx | No interactive handler detected by static scan. |
| /assessment/typing/active | RED | src/app/assessment/typing/active/page.tsx | Interactive handlers detected; action-level rows follow. |
| /assessment/typing/results | RED | src/app/assessment/typing/results/page.tsx | No interactive handler detected by static scan. |
| /assessment/typing/setup | RED | src/app/assessment/typing/setup/page.tsx | Interactive handlers detected; action-level rows follow. |
| /billing | RED | src/app/billing/page.tsx | No interactive handler detected by static scan. |
| /candidate/dashboard | BLUE | src/app/candidate/dashboard/page.tsx | No interactive handler detected by static scan. |
| /candidate/job-search | BLUE | src/app/candidate/job-search/page.tsx | No interactive handler detected by static scan. |
| /candidate/profile | BLUE | src/app/candidate/profile/page.tsx | No interactive handler detected by static scan. |
| /candidate/universal-profile | BLUE | src/app/candidate/universal-profile/page.tsx | No interactive handler detected by static scan. |
| /checkout | YELLOW | src/app/checkout/page.tsx | Interactive handlers detected; action-level rows follow. |
| /company | RED | src/app/company/page.tsx | Interactive handlers detected; action-level rows follow. |
| /dashboard | RED | src/app/dashboard/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/active-proctoring-monitor | RED | src/app/employer/active-proctoring-monitor/page.tsx | No interactive handler detected by static scan. |
| /employer/active-video-interview-interviewer-view | YELLOW | src/app/employer/active-video-interview-interviewer-view/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/ai-candidate-ranking-explanation | RED | src/app/employer/ai-candidate-ranking-explanation/page.tsx | No interactive handler detected by static scan. |
| /employer/ai-evaluation-scores | RED | src/app/employer/ai-evaluation-scores/page.tsx | No interactive handler detected by static scan. |
| /employer/ai-hiring-copilot-hub | RED | src/app/employer/ai-hiring-copilot-hub/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/ai-hiring-insights | BLUE | src/app/employer/ai-hiring-insights/page.tsx | No interactive handler detected by static scan. |
| /employer/ai-interview-question-generator | RED | src/app/employer/ai-interview-question-generator/page.tsx | No interactive handler detected by static scan. |
| /employer/candidate-comparison | RED | src/app/employer/candidate-comparison/page.tsx | No interactive handler detected by static scan. |
| /employer/candidate-user-management | RED | src/app/employer/candidate-user-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/career-command-center | RED | src/app/employer/career-command-center/page.tsx | No interactive handler detected by static scan. |
| /employer/company-profile-editor | RED | src/app/employer/company-profile-editor/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/company-reviews-management | RED | src/app/employer/company-reviews-management/page.tsx | No interactive handler detected by static scan. |
| /employer/create-job-ai-jd-writing | RED | src/app/employer/create-job-ai-jd-writing/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/create-job-ai-screening | BLUE | src/app/employer/create-job-ai-screening/page.tsx | No interactive handler detected by static scan. |
| /employer/create-job-basic-info | RED | src/app/employer/create-job-basic-info/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/create-job-matching-config | YELLOW | src/app/employer/create-job-matching-config/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/create-job-requirements | YELLOW | src/app/employer/create-job-requirements/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/create-job-review-and-publish | YELLOW | src/app/employer/create-job-review-and-publish/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/dashboard | RED | src/app/employer/dashboard/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/department-hiring-management | BLUE | src/app/employer/department-hiring-management/page.tsx | No interactive handler detected by static scan. |
| /employer/edit-job-post | YELLOW | src/app/employer/edit-job-post/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-analytics-dashboard | YELLOW | src/app/employer/employer-analytics-dashboard/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-company-management | RED | src/app/employer/employer-company-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-company-settings-hub | RED | src/app/employer/employer-company-settings-hub/page.tsx | No interactive handler detected by static scan. |
| /employer/employer-forgot-password | RED | src/app/employer/employer-forgot-password/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-notifications-center | BLUE | src/app/employer/employer-notifications-center/page.tsx | No interactive handler detected by static scan. |
| /employer/employer-onboarding-first-job-prompt | RED | src/app/employer/employer-onboarding-first-job-prompt/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-onboarding-welcome | YELLOW | src/app/employer/employer-onboarding-welcome/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-business-model | YELLOW | src/app/employer/employer-registration-business-model/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-company-info | RED | src/app/employer/employer-registration-company-info/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-complete | YELLOW | src/app/employer/employer-registration-complete/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-document-verification | RED | src/app/employer/employer-registration-document-verification/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-otp-verification | YELLOW | src/app/employer/employer-registration-otp-verification/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-plan-selection | YELLOW | src/app/employer/employer-registration-plan-selection/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-sign-in | RED | src/app/employer/employer-sign-in/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-subscription-and-plans | YELLOW | src/app/employer/employer-subscription-and-plans/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/enterprise-talent-pool-database | RED | src/app/employer/enterprise-talent-pool-database/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/final-round-feedback | RED | src/app/employer/final-round-feedback/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/full-candidate-profile-employer-view | RED | src/app/employer/full-candidate-profile-employer-view/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/hiring-funnel-detail | BLUE | src/app/employer/hiring-funnel-detail/page.tsx | No interactive handler detected by static scan. |
| /employer/hiring-pipeline | RED | src/app/employer/hiring-pipeline/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/import-jobs | RED | src/app/employer/import-jobs/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/interview-feedback-form | RED | src/app/employer/interview-feedback-form/page.tsx | No interactive handler detected by static scan. |
| /employer/interview-panel-collaboration | RED | src/app/employer/interview-panel-collaboration/page.tsx | No interactive handler detected by static scan. |
| /employer/interview-reschedule-employer-view | RED | src/app/employer/interview-reschedule-employer-view/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/interview-round-builder | BLUE | src/app/employer/interview-round-builder/page.tsx | No interactive handler detected by static scan. |
| /employer/interview-scheduler | RED | src/app/employer/interview-scheduler/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/job-boost-promote | BLUE | src/app/employer/job-boost-promote/page.tsx | No interactive handler detected by static scan. |
| /employer/job-listings-management | RED | src/app/employer/job-listings-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/job-performance-analytics | RED | src/app/employer/job-performance-analytics/page.tsx | No interactive handler detected by static scan. |
| /employer/managed-hiring/agreements/:id | RED | src/app/employer/managed-hiring/agreements/[id]/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring/candidate-tracking | YELLOW | src/app/employer/managed-hiring/candidate-tracking/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring/join | YELLOW | src/app/employer/managed-hiring/join/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring | RED | src/app/employer/managed-hiring/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring/request | RED | src/app/employer/managed-hiring/request/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring/service-plan | YELLOW | src/app/employer/managed-hiring/service-plan/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/offer-letter-create-and-send | RED | src/app/employer/offer-letter-create-and-send/page.tsx | No interactive handler detected by static scan. |
| /employer/offer-management-dashboard | BLUE | src/app/employer/offer-management-dashboard/page.tsx | No interactive handler detected by static scan. |
| /employer/panel-interview-view | RED | src/app/employer/panel-interview-view/page.tsx | No interactive handler detected by static scan. |
| /employer/proactive-candidate-search | RED | src/app/employer/proactive-candidate-search/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/proctoring-security-report | RED | src/app/employer/proctoring-security-report/page.tsx | No interactive handler detected by static scan. |
| /employer/recruiter-interaction-hub | RED | src/app/employer/recruiter-interaction-hub/page.tsx | No interactive handler detected by static scan. |
| /employer/referral-and-source-tracking | RED | src/app/employer/referral-and-source-tracking/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/referrals | RED | src/app/employer/referrals/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/revenue-and-billing-management | RED | src/app/employer/revenue-and-billing-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/roles-and-permissions | RED | src/app/employer/roles-and-permissions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/salary-benchmark-insights | RED | src/app/employer/salary-benchmark-insights/page.tsx | No interactive handler detected by static scan. |
| /employer/subscriptions | RED | src/app/employer/subscriptions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/team-members-management | RED | src/app/employer/team-members-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/upcoming-interviews-list | BLUE | src/app/employer/upcoming-interviews-list/page.tsx | No interactive handler detected by static scan. |
| /forgot-password/otp | RED | src/app/forgot-password/otp/page.tsx | Interactive handlers detected; action-level rows follow. |
| /forgot-password | RED | src/app/forgot-password/page.tsx | Interactive handlers detected; action-level rows follow. |
| /interviews/confirmed | RED | src/app/interviews/confirmed/page.tsx | No interactive handler detected by static scan. |
| /interviews | RED | src/app/interviews/page.tsx | Interactive handlers detected; action-level rows follow. |
| /interviews/replay | RED | src/app/interviews/replay/page.tsx | Interactive handlers detected; action-level rows follow. |
| /interviews/reschedule | RED | src/app/interviews/reschedule/page.tsx | Interactive handlers detected; action-level rows follow. |
| /interviews/room/:roomId | YELLOW | src/app/interviews/room/[roomId]/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/alerts | RED | src/app/jobs/alerts/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/apply/success | RED | src/app/jobs/apply/success/page.tsx | No interactive handler detected by static scan. |
| /jobs/compare | RED | src/app/jobs/compare/page.tsx | No interactive handler detected by static scan. |
| /jobs/filters | RED | src/app/jobs/filters/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs | RED | src/app/jobs/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/recommended | RED | src/app/jobs/recommended/page.tsx | No interactive handler detected by static scan. |
| /jobs/report | RED | src/app/jobs/report/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/saved | RED | src/app/jobs/saved/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/suggestions | RED | src/app/jobs/suggestions/page.tsx | No interactive handler detected by static scan. |
| /jobs/:id/ai-insights | RED | src/app/jobs/[id]/ai-insights/page.tsx | No interactive handler detected by static scan. |
| /jobs/:id/apply | RED | src/app/jobs/[id]/apply/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/:id | RED | src/app/jobs/[id]/page.tsx | Interactive handlers detected; action-level rows follow. |
| /leaderboard | BLUE | src/app/leaderboard/page.tsx | No interactive handler detected by static scan. |
| /login | RED | src/app/login/page.tsx | Interactive handlers detected; action-level rows follow. |
| /messages/chat | RED | src/app/messages/chat/page.tsx | Interactive handlers detected; action-level rows follow. |
| /messages | RED | src/app/messages/page.tsx | No interactive handler detected by static scan. |
| /notifications | RED | src/app/notifications/page.tsx | Interactive handlers detected; action-level rows follow. |
| /offers | RED | src/app/offers/page.tsx | No interactive handler detected by static scan. |
| /onboarding/baseline-assessment | YELLOW | src/app/onboarding/baseline-assessment/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/checklist | RED | src/app/onboarding/checklist/page.tsx | No interactive handler detected by static scan. |
| /onboarding/complete | BLUE | src/app/onboarding/complete/page.tsx | No interactive handler detected by static scan. |
| /onboarding/document-upload | YELLOW | src/app/onboarding/document-upload/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/education | RED | src/app/onboarding/education/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/experience | RED | src/app/onboarding/experience/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/hire-score | BLUE | src/app/onboarding/hire-score/page.tsx | No interactive handler detected by static scan. |
| /onboarding/matching | RED | src/app/onboarding/matching/page.tsx | No interactive handler detected by static scan. |
| /onboarding/mock-interview | RED | src/app/onboarding/mock-interview/page.tsx | No interactive handler detected by static scan. |
| /onboarding | RED | src/app/onboarding/page.tsx | No interactive handler detected by static scan. |
| /onboarding/personal-details | RED | src/app/onboarding/personal-details/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/preferences | RED | src/app/onboarding/preferences/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/readiness-report | BLUE | src/app/onboarding/readiness-report/page.tsx | No interactive handler detected by static scan. |
| /onboarding/resume-upload | YELLOW | src/app/onboarding/resume-upload/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/reward | RED | src/app/onboarding/reward/page.tsx | No interactive handler detected by static scan. |
| /onboarding/role-select | YELLOW | src/app/onboarding/role-select/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/skills | YELLOW | src/app/onboarding/skills/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/video-resume | YELLOW | src/app/onboarding/video-resume/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/welcome | BLUE | src/app/onboarding/welcome/page.tsx | No interactive handler detected by static scan. |
| /otp | RED | src/app/otp/page.tsx | Interactive handlers detected; action-level rows follow. |
| /page | YELLOW | src/app/page.tsx | Interactive handlers detected; action-level rows follow. |
| /payment/status | RED | src/app/payment/status/page.tsx | Interactive handlers detected; action-level rows follow. |
| /payment/success | YELLOW | src/app/payment/success/page.tsx | Interactive handlers detected; action-level rows follow. |
| /pricing | RED | src/app/pricing/page.tsx | Interactive handlers detected; action-level rows follow. |
| /pricing/upgrade | RED | src/app/pricing/upgrade/page.tsx | No interactive handler detected by static scan. |
| /profile/certificates | RED | src/app/profile/certificates/page.tsx | No interactive handler detected by static scan. |
| /profile/completion | RED | src/app/profile/completion/page.tsx | No interactive handler detected by static scan. |
| /profile | RED | src/app/profile/page.tsx | Interactive handlers detected; action-level rows follow. |
| /profile/passport | RED | src/app/profile/passport/page.tsx | No interactive handler detected by static scan. |
| /profile/public | RED | src/app/profile/public/page.tsx | Interactive handlers detected; action-level rows follow. |
| /profile/resume/optimize | RED | src/app/profile/resume/optimize/page.tsx | No interactive handler detected by static scan. |
| /profile/resume | RED | src/app/profile/resume/page.tsx | Interactive handlers detected; action-level rows follow. |
| /profile/resume/templates | RED | src/app/profile/resume/templates/page.tsx | Interactive handlers detected; action-level rows follow. |
| /profile/skills-management | RED | src/app/profile/skills-management/page.tsx | No interactive handler detected by static scan. |
| /profile/video-resume | BLUE | src/app/profile/video-resume/page.tsx | No interactive handler detected by static scan. |
| /profile/wizard/details | RED | src/app/profile/wizard/details/page.tsx | No interactive handler detected by static scan. |
| /profile/wizard/resume | RED | src/app/profile/wizard/resume/page.tsx | No interactive handler detected by static scan. |
| /referrals/dashboard | RED | src/app/referrals/dashboard/page.tsx | Interactive handlers detected; action-level rows follow. |
| /referrals | RED | src/app/referrals/page.tsx | Interactive handlers detected; action-level rows follow. |
| /register/complete | RED | src/app/register/complete/page.tsx | No interactive handler detected by static scan. |
| /register | RED | src/app/register/page.tsx | Interactive handlers detected; action-level rows follow. |
| /reset-password | RED | src/app/reset-password/page.tsx | Interactive handlers detected; action-level rows follow. |
| /screens | RED | src/app/screens/page.tsx | No interactive handler detected by static scan. |
| /settings/ai-agents | RED | src/app/settings/ai-agents/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/analytics | BLUE | src/app/settings/analytics/page.tsx | No interactive handler detected by static scan. |
| /settings/audit-log | BLUE | src/app/settings/audit-log/page.tsx | No interactive handler detected by static scan. |
| /settings/domain | RED | src/app/settings/domain/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/hub | RED | src/app/settings/hub/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/integrations | RED | src/app/settings/integrations/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/llm-usage | RED | src/app/settings/llm-usage/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/managed-hiring | RED | src/app/settings/managed-hiring/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/notifications | RED | src/app/settings/notifications/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings | RED | src/app/settings/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/payment-gateway | RED | src/app/settings/payment-gateway/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/plan-management | RED | src/app/settings/plan-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/security | RED | src/app/settings/security/page.tsx | No interactive handler detected by static scan. |
| /settings/smtp | RED | src/app/settings/smtp/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/terms-privacy | RED | src/app/settings/terms-privacy/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/whatsapp | RED | src/app/settings/whatsapp/page.tsx | Interactive handlers detected; action-level rows follow. |
| /subscriptions | RED | src/app/subscriptions/page.tsx | No interactive handler detected by static scan. |
| /video-assessment/active | RED | src/app/video-assessment/active/page.tsx | Interactive handlers detected; action-level rows follow. |
| /video-assessment/complete | RED | src/app/video-assessment/complete/page.tsx | No interactive handler detected by static scan. |
| /video-assessment/setup | RED | src/app/video-assessment/setup/page.tsx | Interactive handlers detected; action-level rows follow. |

## 3. COMPLETE USER-ACTION INVENTORY

1015 handler records were discovered from `onClick`, `onSubmit`, `onChange`, `onKeyDown`, `onBlur`, and router navigation patterns. The exact file, line, action, nearby API association, persistence signal, and status are in the JSON/CSV inventory. A nearby API association is heuristic and must be confirmed during runtime testing.

## 4. COMPLETE API INVENTORY

| Method | Endpoint | Status | Detected DB | Static callers | Evidence |
| --- | --- | --- | --- | --- | --- |
| GET | /api/admin/audit-logs | YELLOW |  | 1 | src/app/api/admin/audit-logs/route.ts:4 — GET /api/admin/audit-logs |
| GET | /api/admin/config | YELLOW |  | 1 | src/app/api/admin/config/route.ts:26 — GET /api/admin/config |
| POST | /api/admin/config | YELLOW |  | 1 | src/app/api/admin/config/route.ts:34 — POST /api/admin/config |
| GET | /api/admin/document-verification | YELLOW | prisma.documentVerification, prisma.employerProfile | 3 | src/app/api/admin/document-verification/route.ts:49 — GET /api/admin/document-verification |
| POST | /api/admin/document-verification | YELLOW | prisma.documentVerification, prisma.employerProfile | 3 | src/app/api/admin/document-verification/route.ts:121 — POST /api/admin/document-verification |
| POST | /api/admin/document-verification/:id | YELLOW | prisma.documentVerification | 1 | src/app/api/admin/document-verification/[id]/route.ts:5 — POST /api/admin/document-verification/:id |
| GET | /api/admin/invoices | YELLOW |  | 3 | src/app/api/admin/invoices/route.ts:4 — GET /api/admin/invoices |
| POST | /api/admin/invoices | YELLOW |  | 3 | src/app/api/admin/invoices/route.ts:21 — POST /api/admin/invoices |
| GET | /api/admin/llm-usage | YELLOW |  | 1 | src/app/api/admin/llm-usage/route.ts:4 — GET /api/admin/llm-usage |
| GET | /api/admin/managed-hiring/config | YELLOW |  | 2 | src/app/api/admin/managed-hiring/config/route.ts:292 — GET /api/admin/managed-hiring/config |
| POST | /api/admin/managed-hiring/config | YELLOW |  | 2 | src/app/api/admin/managed-hiring/config/route.ts:300 — POST /api/admin/managed-hiring/config |
| GET | /api/admin/payment-gateway/config | YELLOW |  | 2 | src/app/api/admin/payment-gateway/config/route.ts:5 — GET /api/admin/payment-gateway/config |
| POST | /api/admin/payment-gateway/config | YELLOW |  | 2 | src/app/api/admin/payment-gateway/config/route.ts:19 — POST /api/admin/payment-gateway/config |
| POST | /api/admin/pricing/calculate | YELLOW |  | 0 | src/app/api/admin/pricing/calculate/route.ts:4 — POST /api/admin/pricing/calculate |
| GET | /api/admin/referrals/analytics | RED |  | 1 | src/app/api/admin/referrals/analytics/route.ts:6 — GET /api/admin/referrals/analytics |
| GET | /api/admin/referrals/config | YELLOW |  | 1 | src/app/api/admin/referrals/config/route.ts:22 — GET /api/admin/referrals/config |
| PUT | /api/admin/referrals/config | YELLOW |  | 1 | src/app/api/admin/referrals/config/route.ts:45 — PUT /api/admin/referrals/config |
| GET | /api/admin/referrals/fraud | YELLOW |  | 0 | src/app/api/admin/referrals/fraud/route.ts:7 — GET /api/admin/referrals/fraud |
| POST | /api/admin/referrals/fraud | YELLOW |  | 0 | src/app/api/admin/referrals/fraud/route.ts:38 — POST /api/admin/referrals/fraud |
| GET | /api/admin/referrals/payouts | YELLOW |  | 1 | src/app/api/admin/referrals/payouts/route.ts:5 — GET /api/admin/referrals/payouts |
| POST | /api/admin/referrals/payouts | YELLOW |  | 1 | src/app/api/admin/referrals/payouts/route.ts:28 — POST /api/admin/referrals/payouts |
| GET | /api/admin/release/status | YELLOW |  | 0 | src/app/api/admin/release/status/route.ts:3 — GET /api/admin/release/status |
| GET | /api/admin/revenue/audit-logs | YELLOW |  | 0 | src/app/api/admin/revenue/audit-logs/route.ts:101 — GET /api/admin/revenue/audit-logs |
| GET | /api/admin/revenue/export | RED |  | 0 | src/app/api/admin/revenue/export/route.ts:4 — GET /api/admin/revenue/export |
| GET | /api/admin/revenue/job-boost | YELLOW |  | 0 | src/app/api/admin/revenue/job-boost/route.ts:72 — GET /api/admin/revenue/job-boost |
| GET | /api/admin/revenue/managed-hiring | YELLOW |  | 0 | src/app/api/admin/revenue/managed-hiring/route.ts:11 — GET /api/admin/revenue/managed-hiring |
| GET | /api/admin/revenue/mock-interviews | RED |  | 0 | src/app/api/admin/revenue/mock-interviews/route.ts:87 — GET /api/admin/revenue/mock-interviews |
| GET | /api/admin/revenue/pph | YELLOW |  | 0 | src/app/api/admin/revenue/pph/route.ts:135 — GET /api/admin/revenue/pph |
| GET | /api/admin/revenue/subscriptions | YELLOW |  | 0 | src/app/api/admin/revenue/subscriptions/route.ts:148 — GET /api/admin/revenue/subscriptions |
| GET | /api/admin/revenue/summary | RED |  | 0 | src/app/api/admin/revenue/summary/route.ts:3 — GET /api/admin/revenue/summary |
| GET | /api/admin/revenue/transactions | RED |  | 0 | src/app/api/admin/revenue/transactions/route.ts:360 — GET /api/admin/revenue/transactions |
| GET | /api/admin/security/status | YELLOW |  | 1 | src/app/api/admin/security/status/route.ts:18 — GET /api/admin/security/status |
| POST | /api/admin/security/status | YELLOW |  | 1 | src/app/api/admin/security/status/route.ts:55 — POST /api/admin/security/status |
| GET | /api/admin/subscription-plans | YELLOW |  | 1 | src/app/api/admin/subscription-plans/route.ts:6 — GET /api/admin/subscription-plans |
| POST | /api/admin/subscription-plans | YELLOW |  | 1 | src/app/api/admin/subscription-plans/route.ts:20 — POST /api/admin/subscription-plans |
| PUT | /api/admin/subscription-plans | YELLOW |  | 1 | src/app/api/admin/subscription-plans/route.ts:54 — PUT /api/admin/subscription-plans |
| DELETE | /api/admin/subscription-plans | YELLOW |  | 1 | src/app/api/admin/subscription-plans/route.ts:78 — DELETE /api/admin/subscription-plans |
| GET | /api/admin/subscriptions/settings | YELLOW |  | 2 | src/app/api/admin/subscriptions/settings/route.ts:6 — GET /api/admin/subscriptions/settings |
| POST | /api/admin/subscriptions/settings | YELLOW |  | 2 | src/app/api/admin/subscriptions/settings/route.ts:21 — POST /api/admin/subscriptions/settings |
| PUT | /api/admin/subscriptions/settings | YELLOW |  | 2 | src/app/api/admin/subscriptions/settings/route.ts:48 — PUT /api/admin/subscriptions/settings |
| DELETE | /api/admin/subscriptions/settings | YELLOW |  | 2 | src/app/api/admin/subscriptions/settings/route.ts:77 — DELETE /api/admin/subscriptions/settings |
| GET | /api/admin/system-health | RED |  | 2 | src/app/api/admin/system-health/route.ts:4 — GET /api/admin/system-health |
| POST | /api/admin/tests/run | YELLOW |  | 0 | src/app/api/admin/tests/run/route.ts:4 — POST /api/admin/tests/run |
| POST | /api/agents/dispatch | YELLOW |  | 3 | src/app/api/agents/dispatch/route.ts:7 — POST /api/agents/dispatch |
| GET | /api/agreements/contracts | YELLOW |  | 5 | src/app/api/agreements/contracts/route.ts:5 — GET /api/agreements/contracts |
| POST | /api/agreements/contracts | YELLOW |  | 5 | src/app/api/agreements/contracts/route.ts:27 — POST /api/agreements/contracts |
| GET | /api/agreements/contracts/:id | YELLOW |  | 2 | src/app/api/agreements/contracts/[id]/route.ts:4 — GET /api/agreements/contracts/:id |
| PUT | /api/agreements/contracts/:id | YELLOW |  | 2 | src/app/api/agreements/contracts/[id]/route.ts:32 — PUT /api/agreements/contracts/:id |
| POST | /api/agreements/contracts/:id | YELLOW |  | 2 | src/app/api/agreements/contracts/[id]/route.ts:57 — POST /api/agreements/contracts/:id |
| GET | /api/agreements/requirements | YELLOW | prisma.employerProfile | 6 | src/app/api/agreements/requirements/route.ts:6 — GET /api/agreements/requirements |
| POST | /api/agreements/requirements | YELLOW | prisma.employerProfile | 6 | src/app/api/agreements/requirements/route.ts:27 — POST /api/agreements/requirements |
| GET | /api/agreements/requirements/:id | YELLOW |  | 1 | src/app/api/agreements/requirements/[id]/route.ts:4 — GET /api/agreements/requirements/:id |
| PATCH | /api/agreements/requirements/:id | YELLOW |  | 1 | src/app/api/agreements/requirements/[id]/route.ts:23 — PATCH /api/agreements/requirements/:id |
| GET | /api/agreements/templates | YELLOW |  | 4 | src/app/api/agreements/templates/route.ts:4 — GET /api/agreements/templates |
| POST | /api/agreements/templates | YELLOW |  | 4 | src/app/api/agreements/templates/route.ts:15 — POST /api/agreements/templates |
| GET | /api/agreements/templates/:id | YELLOW |  | 1 | src/app/api/agreements/templates/[id]/route.ts:4 — GET /api/agreements/templates/:id |
| PUT | /api/agreements/templates/:id | YELLOW |  | 1 | src/app/api/agreements/templates/[id]/route.ts:20 — PUT /api/agreements/templates/:id |
| POST | /api/agreements/templates/:id | YELLOW |  | 1 | src/app/api/agreements/templates/[id]/route.ts:43 — POST /api/agreements/templates/:id |
| DELETE | /api/agreements/templates/:id | YELLOW |  | 1 | src/app/api/agreements/templates/[id]/route.ts:69 — DELETE /api/agreements/templates/:id |
| GET | /api/applications | RED | prisma.candidateProfile, prisma.application | 7 | src/app/api/applications/route.ts:5 — GET /api/applications |
| POST | /api/applications | RED | prisma.candidateProfile, prisma.application | 7 | src/app/api/applications/route.ts:44 — POST /api/applications |
| POST | /api/auth/employer-register | YELLOW | prisma.user | 1 | src/app/api/auth/employer-register/route.ts:16 — POST /api/auth/employer-register |
| POST | /api/auth/forgot-password | YELLOW | db.findUserByEmail | 3 | src/app/api/auth/forgot-password/route.ts:11 — POST /api/auth/forgot-password |
| POST | /api/auth/login | YELLOW | db.findUserByEmail | 3 | src/app/api/auth/login/route.ts:13 — POST /api/auth/login |
| POST | /api/auth/logout | YELLOW |  | 0 | src/app/api/auth/logout/route.ts:5 — POST /api/auth/logout |
| GET | /api/auth/me | YELLOW |  | 0 | src/app/api/auth/me/route.ts:4 — GET /api/auth/me |
| POST | /api/auth/register | YELLOW | db.findUserByEmail, db.createUser | 1 | src/app/api/auth/register/route.ts:17 — POST /api/auth/register |
| POST | /api/auth/reset-password | YELLOW | prisma.user, db.findUserByEmail | 1 | src/app/api/auth/reset-password/route.ts:15 — POST /api/auth/reset-password |
| POST | /api/auth/verify-otp | YELLOW | prisma.user, db.findUserByEmail | 3 | src/app/api/auth/verify-otp/route.ts:15 — POST /api/auth/verify-otp |
| GET | /api/candidate/profile | RED | prisma.candidateProfile | 11 | src/app/api/candidate/profile/route.ts:8 — GET /api/candidate/profile |
| PUT | /api/candidate/profile | RED | prisma.candidateProfile | 11 | src/app/api/candidate/profile/route.ts:107 — PUT /api/candidate/profile |
| GET | /api/candidate/saved-jobs | RED |  | 3 | src/app/api/candidate/saved-jobs/route.ts:8 — GET /api/candidate/saved-jobs |
| POST | /api/candidate/saved-jobs | RED |  | 3 | src/app/api/candidate/saved-jobs/route.ts:68 — POST /api/candidate/saved-jobs |
| DELETE | /api/candidate/saved-jobs | RED |  | 3 | src/app/api/candidate/saved-jobs/route.ts:119 — DELETE /api/candidate/saved-jobs |
| GET | /api/candidate/video-resume | YELLOW | prisma.candidateProfile, prisma.videoResume | 1 | src/app/api/candidate/video-resume/route.ts:12 — GET /api/candidate/video-resume |
| POST | /api/candidate/video-resume | YELLOW | prisma.candidateProfile, prisma.videoResume | 1 | src/app/api/candidate/video-resume/route.ts:28 — POST /api/candidate/video-resume |
| GET | /api/cron/referrals-reconciliation | RED |  | 0 | src/app/api/cron/referrals-reconciliation/route.ts:110 — GET /api/cron/referrals-reconciliation |
| POST | /api/cron/referrals-reconciliation | RED |  | 0 | src/app/api/cron/referrals-reconciliation/route.ts:114 — POST /api/cron/referrals-reconciliation |
| GET | /api/employer/candidates | YELLOW | prisma.employerProfile, prisma.application | 1 | src/app/api/employer/candidates/route.ts:5 — GET /api/employer/candidates |
| PATCH | /api/employer/candidates/:id/stage | YELLOW | prisma.application, prisma.employerProfile | 0 | src/app/api/employer/candidates/[id]/stage/route.ts:7 — PATCH /api/employer/candidates/:id/stage |
| GET | /api/employer/company | RED | prisma.employerProfile, prisma.company | 1 | src/app/api/employer/company/route.ts:17 — GET /api/employer/company |
| PUT | /api/employer/company | RED | prisma.employerProfile, prisma.company | 1 | src/app/api/employer/company/route.ts:57 — PUT /api/employer/company |
| GET | /api/employer/dashboard | YELLOW | prisma.employerProfile, prisma.jobListing, prisma.application, prisma.companyCredits, prisma.interview | 0 | src/app/api/employer/dashboard/route.ts:5 — GET /api/employer/dashboard |
| POST | /api/employer/interviews/schedule | YELLOW | prisma.application, prisma.employerProfile, prisma.interview, prisma.notification | 1 | src/app/api/employer/interviews/schedule/route.ts:24 — POST /api/employer/interviews/schedule |
| GET | /api/employer/interviews/:id/calendar | YELLOW | prisma.interview, prisma.employerProfile | 0 | src/app/api/employer/interviews/[id]/calendar/route.ts:5 — GET /api/employer/interviews/:id/calendar |
| POST | /api/employer/interviews/:id/feedback | YELLOW | prisma.interview, prisma.employerProfile | 0 | src/app/api/employer/interviews/[id]/feedback/route.ts:19 — POST /api/employer/interviews/:id/feedback |
| PATCH | /api/employer/interviews/:id | YELLOW | prisma.interview, prisma.employerProfile | 3 | src/app/api/employer/interviews/[id]/route.ts:17 — PATCH /api/employer/interviews/:id |
| GET | /api/employer/jobs | YELLOW | prisma.employerProfile, prisma.idempotencyRecord, db.getJobs | 3 | src/app/api/employer/jobs/route.ts:19 — GET /api/employer/jobs |
| POST | /api/employer/jobs | YELLOW | prisma.employerProfile, prisma.idempotencyRecord, db.getJobs | 3 | src/app/api/employer/jobs/route.ts:24 — POST /api/employer/jobs |
| GET | /api/employer/jobs/:id | YELLOW | prisma.jobListing, prisma.employerProfile | 1 | src/app/api/employer/jobs/[id]/route.ts:19 — GET /api/employer/jobs/:id |
| PUT | /api/employer/jobs/:id | YELLOW | prisma.jobListing, prisma.employerProfile | 1 | src/app/api/employer/jobs/[id]/route.ts:37 — PUT /api/employer/jobs/:id |
| POST | /api/employer/managed-hiring/join | YELLOW | prisma.application, prisma.employerProfile | 1 | src/app/api/employer/managed-hiring/join/route.ts:9 — POST /api/employer/managed-hiring/join |
| GET | /api/employer/promo/validate | YELLOW |  | 1 | src/app/api/employer/promo/validate/route.ts:5 — GET /api/employer/promo/validate |
| GET | /api/employer/source-tracking | YELLOW |  | 1 | src/app/api/employer/source-tracking/route.ts:11 — GET /api/employer/source-tracking |
| GET | /api/employer/subscribe | YELLOW | prisma.employerProfile | 4 | src/app/api/employer/subscribe/route.ts:7 — GET /api/employer/subscribe |
| POST | /api/employer/subscribe | YELLOW | prisma.employerProfile | 4 | src/app/api/employer/subscribe/route.ts:85 — POST /api/employer/subscribe |
| GET | /api/employer/team | RED | prisma.employerProfile | 1 | src/app/api/employer/team/route.ts:44 — GET /api/employer/team |
| POST | /api/employer/team | RED | prisma.employerProfile | 1 | src/app/api/employer/team/route.ts:102 — POST /api/employer/team |
| DELETE | /api/employer/team | RED | prisma.employerProfile | 1 | src/app/api/employer/team/route.ts:138 — DELETE /api/employer/team |
| GET | /api/interviews/room | RED |  | 0 | src/app/api/interviews/room/route.ts:19 — GET /api/interviews/room |
| POST | /api/interviews/room | RED |  | 0 | src/app/api/interviews/room/route.ts:62 — POST /api/interviews/room |
| GET | /api/jobs/search | YELLOW | prisma.jobListing | 1 | src/app/api/jobs/search/route.ts:5 — GET /api/jobs/search |
| GET | /api/notifications | RED | prisma.notification | 1 | src/app/api/notifications/route.ts:19 — GET /api/notifications |
| PUT | /api/notifications | RED | prisma.notification | 1 | src/app/api/notifications/route.ts:90 — PUT /api/notifications |
| POST | /api/payments/checkout | RED | prisma.subscriptionPlan, prisma.promoCode, prisma.employerProfile | 1 | src/app/api/payments/checkout/route.ts:5 — POST /api/payments/checkout |
| GET | /api/payments/status | YELLOW | prisma.employerProfile, prisma.paymentTransaction, prisma.companySubscription, prisma.companyCredits | 1 | src/app/api/payments/status/route.ts:5 — GET /api/payments/status |
| POST | /api/payments/webhook | RED | prisma.paymentTransaction, prisma.subscriptionPlan | 0 | src/app/api/payments/webhook/route.ts:7 — POST /api/payments/webhook |
| GET | /api/proctoring/telemetry | RED | prisma.auditLog | 0 | src/app/api/proctoring/telemetry/route.ts:16 — GET /api/proctoring/telemetry |
| POST | /api/proctoring/telemetry | RED | prisma.auditLog | 0 | src/app/api/proctoring/telemetry/route.ts:50 — POST /api/proctoring/telemetry |
| POST | /api/referrals/payout | YELLOW |  | 2 | src/app/api/referrals/payout/route.ts:7 — POST /api/referrals/payout |
| GET | /api/referrals | YELLOW |  | 4 | src/app/api/referrals/route.ts:7 — GET /api/referrals |
| POST | /api/referrals | YELLOW |  | 4 | src/app/api/referrals/route.ts:48 — POST /api/referrals |
| GET | /api/referrals/validate | YELLOW |  | 1 | src/app/api/referrals/validate/route.ts:5 — GET /api/referrals/validate |
| GET | /api/skill-master | RED | prisma.customSkillRequest | 0 | src/app/api/skill-master/route.ts:8 — GET /api/skill-master |
| POST | /api/skill-master | RED | prisma.customSkillRequest | 0 | src/app/api/skill-master/route.ts:20 — POST /api/skill-master |
| POST | /api/upload | YELLOW |  | 4 | src/app/api/upload/route.ts:18 — POST /api/upload |
| GET | /api/whatsapp/auth/handoff | RED |  | 0 | src/app/api/whatsapp/auth/handoff/route.ts:28 — GET /api/whatsapp/auth/handoff |
| POST | /api/whatsapp/onboard | YELLOW |  | 0 | src/app/api/whatsapp/onboard/route.ts:16 — POST /api/whatsapp/onboard |
| GET | /api/whatsapp/webhook | YELLOW |  | 0 | src/app/api/whatsapp/webhook/route.ts:27 — GET /api/whatsapp/webhook |
| POST | /api/whatsapp/webhook | YELLOW |  | 0 | src/app/api/whatsapp/webhook/route.ts:47 — POST /api/whatsapp/webhook |

## 5. SCREEN → API MATRIX

| Screen | Method | API | Status | Evidence |
| --- | --- | --- | --- | --- |
| /admin/agreements/builder | GET | /api/agreements/requirements | YELLOW | src/app/admin/agreements/builder/page.tsx:31 — frontend call GET /api/agreements/requirements |
| /admin/agreements/builder | GET | /api/agreements/templates | YELLOW | src/app/admin/agreements/builder/page.tsx:32 — frontend call GET /api/agreements/templates |
| /admin/agreements/builder | POST | /api/agreements/contracts | YELLOW | src/app/admin/agreements/builder/page.tsx:86 — frontend call POST /api/agreements/contracts |
| /admin/agreements/templates | POST | /api/agreements/templates | YELLOW | src/app/admin/agreements/templates/page.tsx:15 — frontend call POST /api/agreements/templates |
| /admin/agreements/templates | POST | /api/agreements/templates | YELLOW | src/app/admin/agreements/templates/page.tsx:29 — frontend call POST /api/agreements/templates |
| /admin/document-verification | GET | /api/admin/document-verification?status=${filter} | YELLOW | src/app/admin/document-verification/page.tsx:25 — frontend call GET /api/admin/document-verification?status=${filter} |
| /admin/document-verification | POST | /api/admin/document-verification/${id} | YELLOW | src/app/admin/document-verification/page.tsx:43 — frontend call POST /api/admin/document-verification/${id} |
| /admin/invoices | POST | /api/admin/invoices | YELLOW | src/app/admin/invoices/page.tsx:22 — frontend call POST /api/admin/invoices |
| /admin/invoices | POST | /api/admin/invoices | YELLOW | src/app/admin/invoices/page.tsx:39 — frontend call POST /api/admin/invoices |
| /admin/invoices | POST | /api/admin/invoices | YELLOW | src/app/admin/invoices/page.tsx:57 — frontend call POST /api/admin/invoices |
| /admin/invoices | POST | /api/admin/invoices | YELLOW | src/app/admin/invoices/page.tsx:73 — frontend call POST /api/admin/invoices |
| /admin/login | POST | /api/auth/login | RED | src/app/admin/login/page.tsx:39 — frontend call POST /api/auth/login |
| /admin/managed-hiring/agreements/builder | GET | /api/agreements/templates | RED | src/app/admin/managed-hiring/agreements/builder/page.tsx:34 — frontend call GET /api/agreements/templates |
| /admin/managed-hiring/agreements/builder | GET | /api/agreements/requirements/${reqId} | RED | src/app/admin/managed-hiring/agreements/builder/page.tsx:35 — frontend call GET /api/agreements/requirements/${reqId} |
| /admin/managed-hiring/agreements/builder | POST | /api/agreements/contracts | RED | src/app/admin/managed-hiring/agreements/builder/page.tsx:100 — frontend call POST /api/agreements/contracts |
| /admin/managed-hiring/agreements/builder | POST | /api/agreements/contracts/${data.agreement.id} | RED | src/app/admin/managed-hiring/agreements/builder/page.tsx:110 — frontend call POST /api/agreements/contracts/${data.agreement.id} |
| /admin/managed-hiring/agreements/builder | PATCH | /api/agreements/requirements/${reqId} | RED | src/app/admin/managed-hiring/agreements/builder/page.tsx:118 — frontend call PATCH /api/agreements/requirements/${reqId} |
| /admin/managed-hiring/operations | GET | /api/admin/managed-hiring/config | YELLOW | src/app/admin/managed-hiring/operations/page.tsx:24 — frontend call GET /api/admin/managed-hiring/config |
| /admin/managed-hiring/operations | GET | /api/admin/invoices | YELLOW | src/app/admin/managed-hiring/operations/page.tsx:25 — frontend call GET /api/admin/invoices |
| /admin/managed-hiring/pipeline | GET | /api/agreements/requirements | YELLOW | src/app/admin/managed-hiring/pipeline/page.tsx:13 — frontend call GET /api/agreements/requirements |
| /admin/managed-hiring/requests | GET | /api/agreements/requirements | YELLOW | src/app/admin/managed-hiring/requests/page.tsx:14 — frontend call GET /api/agreements/requirements |
| /admin/managed-hiring/templates | POST | /api/agreements/templates | YELLOW | src/app/admin/managed-hiring/templates/page.tsx:17 — frontend call POST /api/agreements/templates |
| /admin/managed-hiring/templates | POST | /api/agreements/templates/${id} | YELLOW | src/app/admin/managed-hiring/templates/page.tsx:31 — frontend call POST /api/agreements/templates/${id} |
| /admin/managed-hiring/templates | DELETE | /api/agreements/templates/${id} | YELLOW | src/app/admin/managed-hiring/templates/page.tsx:50 — frontend call DELETE /api/agreements/templates/${id} |
| /admin/payment-gateways | POST | /api/admin/payment-gateway/config | RED | src/app/admin/payment-gateways/page.tsx:26 — frontend call POST /api/admin/payment-gateway/config |
| /admin/payment-gateways | POST | /api/admin/payment-gateway/config | RED | src/app/admin/payment-gateways/page.tsx:45 — frontend call POST /api/admin/payment-gateway/config |
| /admin/referrals | GET | /api/admin/referrals/config | RED | src/app/admin/referrals/page.tsx:23 — frontend call GET /api/admin/referrals/config |
| /admin/referrals | GET | /api/admin/referrals/payouts | RED | src/app/admin/referrals/page.tsx:24 — frontend call GET /api/admin/referrals/payouts |
| /admin/referrals | GET | /api/admin/referrals/analytics | RED | src/app/admin/referrals/page.tsx:25 — frontend call GET /api/admin/referrals/analytics |
| /admin/referrals | PUT | /api/admin/referrals/config | RED | src/app/admin/referrals/page.tsx:40 — frontend call PUT /api/admin/referrals/config |
| /admin/referrals | POST | /api/admin/referrals/payouts | RED | src/app/admin/referrals/page.tsx:58 — frontend call POST /api/admin/referrals/payouts |
| /admin/referrals | POST | /api/admin/referrals/payouts | RED | src/app/admin/referrals/page.tsx:87 — frontend call POST /api/admin/referrals/payouts |
| /admin/referrals | POST | /api/admin/referrals/payouts | RED | src/app/admin/referrals/page.tsx:112 — frontend call POST /api/admin/referrals/payouts |
| /admin/settings/audit-log | GET | /api/admin/audit-logs | RED | src/app/admin/settings/audit-log/page.tsx:14 — frontend call GET /api/admin/audit-logs |
| /admin/settings/llm-usage | POST | /api/admin/llm-usage | YELLOW | src/app/admin/settings/llm-usage/page.tsx:17 — frontend call POST /api/admin/llm-usage |
| /admin/settings/llm-usage | POST | /api/agents/dispatch | YELLOW | src/app/admin/settings/llm-usage/page.tsx:36 — frontend call POST /api/agents/dispatch |
| /admin/settings/managed-hiring | GET | /api/admin/config | YELLOW | src/app/admin/settings/managed-hiring/page.tsx:27 — frontend call GET /api/admin/config |
| /admin/settings/managed-hiring | POST | /api/admin/config | YELLOW | src/app/admin/settings/managed-hiring/page.tsx:53 — frontend call POST /api/admin/config |
| /admin/settings/security | GET | /api/admin/security/status | YELLOW | src/app/admin/settings/security/page.tsx:13 — frontend call GET /api/admin/security/status |
| /admin/settings/security | POST | /api/admin/security/status | YELLOW | src/app/admin/settings/security/page.tsx:37 — frontend call POST /api/admin/security/status |
| /admin/subscriptions | GET | /api/admin/subscription-plans?includeArchived=true | RED | src/app/admin/subscriptions/page.tsx:42 — frontend call GET /api/admin/subscription-plans?includeArchived=true |
| /admin/subscriptions | GET | /api/admin/subscriptions/settings | RED | src/app/admin/subscriptions/page.tsx:45 — frontend call GET /api/admin/subscriptions/settings |
| /admin/subscriptions | POST | /api/admin/subscriptions/settings | RED | src/app/admin/subscriptions/page.tsx:114 — frontend call POST /api/admin/subscriptions/settings |
| /admin/subscriptions | PUT | /api/admin/subscriptions/settings | RED | src/app/admin/subscriptions/page.tsx:149 — frontend call PUT /api/admin/subscriptions/settings |
| /admin/subscriptions | DELETE | /api/admin/subscription-plans?id=${id} | RED | src/app/admin/subscriptions/page.tsx:176 — frontend call DELETE /api/admin/subscription-plans?id=${id} |
| /admin/subscriptions | DELETE | /api/admin/subscriptions/settings?code=${code} | RED | src/app/admin/subscriptions/page.tsx:193 — frontend call DELETE /api/admin/subscriptions/settings?code=${code} |
| /admin/system/infrastructure | GET | /api/admin/system-health | YELLOW | src/app/admin/system/infrastructure/page.tsx:12 — frontend call GET /api/admin/system-health |
| /admin/system-health | GET | /api/admin/system-health | YELLOW | src/app/admin/system-health/page.tsx:12 — frontend call GET /api/admin/system-health |
| /applications | GET | /api/applications | YELLOW | src/app/applications/page.tsx:15 — frontend call GET /api/applications |
| /applications/timeline | GET | /api/applications | RED | src/app/applications/timeline/page.tsx:28 — frontend call GET /api/applications |
| /dashboard | GET | /api/candidate/profile | RED | src/app/dashboard/page.tsx:16 — frontend call GET /api/candidate/profile |
| /dashboard | GET | /api/applications | RED | src/app/dashboard/page.tsx:28 — frontend call GET /api/applications |
| /employer/company-profile-editor | GET | /api/employer/company | RED | src/app/employer/company-profile-editor/page.tsx:22 — frontend call GET /api/employer/company |
| /employer/company-profile-editor | PUT | /api/employer/company | RED | src/app/employer/company-profile-editor/page.tsx:40 — frontend call PUT /api/employer/company |
| /employer/create-job-basic-info | GET | /api/employer/subscribe | RED | src/app/employer/create-job-basic-info/page.tsx:313 — frontend call GET /api/employer/subscribe |
| /employer/create-job-review-and-publish | POST | /api/employer/jobs | YELLOW | src/app/employer/create-job-review-and-publish/page.tsx:22 — frontend call POST /api/employer/jobs |
| /employer/employer-registration-company-info | GET | /api/referrals/validate?code=${encodeURIComponent(code)} | RED | src/app/employer/employer-registration-company-info/page.tsx:30 — frontend call GET /api/referrals/validate?code=${encodeURIComponent(code)} |
| /employer/employer-registration-company-info | POST | /api/auth/employer-register | RED | src/app/employer/employer-registration-company-info/page.tsx:163 — frontend call POST /api/auth/employer-register |
| /employer/employer-registration-document-verification | POST | /api/upload | RED | src/app/employer/employer-registration-document-verification/page.tsx:99 — frontend call POST /api/upload |
| /employer/employer-registration-document-verification | POST | /api/admin/document-verification | RED | src/app/employer/employer-registration-document-verification/page.tsx:116 — frontend call POST /api/admin/document-verification |
| /employer/employer-registration-otp-verification | POST | /api/auth/verify-otp | YELLOW | src/app/employer/employer-registration-otp-verification/page.tsx:142 — frontend call POST /api/auth/verify-otp |
| /employer/employer-registration-plan-selection | GET | /api/employer/subscribe | YELLOW | src/app/employer/employer-registration-plan-selection/page.tsx:29 — frontend call GET /api/employer/subscribe |
| /employer/employer-registration-plan-selection | POST | /api/employer/subscribe | YELLOW | src/app/employer/employer-registration-plan-selection/page.tsx:46 — frontend call POST /api/employer/subscribe |
| /employer/employer-sign-in | POST | /api/auth/login | RED | src/app/employer/employer-sign-in/page.tsx:47 — frontend call POST /api/auth/login |
| /employer/employer-subscription-and-plans | GET | /api/agreements/contracts | YELLOW | src/app/employer/employer-subscription-and-plans/page.tsx:14 — frontend call GET /api/agreements/contracts |
| /employer/final-round-feedback | POST | /api/employer/interviews/${encodeURIComponent(interviewId)}/feedback | RED | src/app/employer/final-round-feedback/page.tsx:31 — frontend call POST /api/employer/interviews/${encodeURIComponent(interviewId)}/feedback |
| /employer/interview-reschedule-employer-view | PATCH | /api/employer/interviews/${encodeURIComponent(interviewId)} | RED | src/app/employer/interview-reschedule-employer-view/page.tsx:21 — frontend call PATCH /api/employer/interviews/${encodeURIComponent(interviewId)} |
| /employer/interview-scheduler | POST | /api/employer/interviews/schedule | RED | src/app/employer/interview-scheduler/page.tsx:9 — frontend call POST /api/employer/interviews/schedule |
| /employer/job-listings-management | GET | /api/employer/jobs | RED | src/app/employer/job-listings-management/page.tsx:100 — frontend call GET /api/employer/jobs |
| /employer/job-listings-management | GET | /api/employer/jobs | RED | src/app/employer/job-listings-management/page.tsx:348 — frontend call GET /api/employer/jobs |
| /employer/managed-hiring/agreements/:id | GET | /api/agreements/contracts/${agreementId} | RED | src/app/employer/managed-hiring/agreements/[id]/page.tsx:26 — frontend call GET /api/agreements/contracts/${agreementId} |
| /employer/managed-hiring/agreements/:id | POST | /api/agreements/contracts/${agreementId} | RED | src/app/employer/managed-hiring/agreements/[id]/page.tsx:48 — frontend call POST /api/agreements/contracts/${agreementId} |
| /employer/managed-hiring/agreements/:id | POST | /api/agreements/contracts/${agreementId} | RED | src/app/employer/managed-hiring/agreements/[id]/page.tsx:74 — frontend call POST /api/agreements/contracts/${agreementId} |
| /employer/managed-hiring/candidate-tracking | GET | /api/employer/candidates | YELLOW | src/app/employer/managed-hiring/candidate-tracking/page.tsx:28 — frontend call GET /api/employer/candidates |
| /employer/managed-hiring/candidate-tracking | PATCH | /api/employer/candidates/${encodeURIComponent(id)}/stage | YELLOW | src/app/employer/managed-hiring/candidate-tracking/page.tsx:39 — frontend call PATCH /api/employer/candidates/${encodeURIComponent(id)}/stage |
| /employer/managed-hiring/join | POST | /api/employer/managed-hiring/join | YELLOW | src/app/employer/managed-hiring/join/page.tsx:30 — frontend call POST /api/employer/managed-hiring/join |
| /employer/managed-hiring | GET | /api/agreements/requirements | RED | src/app/employer/managed-hiring/page.tsx:69 — frontend call GET /api/agreements/requirements |
| /employer/managed-hiring | GET | /api/agreements/contracts | RED | src/app/employer/managed-hiring/page.tsx:70 — frontend call GET /api/agreements/contracts |
| /employer/managed-hiring/request | POST | /api/agreements/requirements | RED | src/app/employer/managed-hiring/request/page.tsx:194 — frontend call POST /api/agreements/requirements |
| /employer/referral-and-source-tracking | GET | /api/employer/source-tracking?days=${period} | RED | src/app/employer/referral-and-source-tracking/page.tsx:49 — frontend call GET /api/employer/source-tracking?days=${period} |
| /employer/referrals | GET | /api/referrals | RED | src/app/employer/referrals/page.tsx:83 — frontend call GET /api/referrals |
| /employer/referrals | POST | /api/referrals/payout | RED | src/app/employer/referrals/page.tsx:134 — frontend call POST /api/referrals/payout |
| /employer/referrals | GET | /api/referrals | RED | src/app/employer/referrals/page.tsx:152 — frontend call GET /api/referrals |
| /employer/referrals | POST | /api/referrals | RED | src/app/employer/referrals/page.tsx:171 — frontend call POST /api/referrals |
| /employer/revenue-and-billing-management | POST | /api/admin/invoices | RED | src/app/employer/revenue-and-billing-management/page.tsx:31 — frontend call POST /api/admin/invoices |
| /employer/revenue-and-billing-management | GET | /api/admin/invoices | RED | src/app/employer/revenue-and-billing-management/page.tsx:42 — frontend call GET /api/admin/invoices |
| /employer/revenue-and-billing-management | POST | /api/admin/invoices | RED | src/app/employer/revenue-and-billing-management/page.tsx:62 — frontend call POST /api/admin/invoices |
| /employer/revenue-and-billing-management | GET | /api/admin/invoices | RED | src/app/employer/revenue-and-billing-management/page.tsx:80 — frontend call GET /api/admin/invoices |
| /employer/revenue-and-billing-management | GET | /api/admin/invoices | RED | src/app/employer/revenue-and-billing-management/page.tsx:94 — frontend call GET /api/admin/invoices |
| /employer/subscriptions | GET | /api/employer/subscribe | RED | src/app/employer/subscriptions/page.tsx:39 — frontend call GET /api/employer/subscribe |
| /employer/subscriptions | GET | /api/admin/subscriptions/settings | RED | src/app/employer/subscriptions/page.tsx:42 — frontend call GET /api/admin/subscriptions/settings |
| /employer/subscriptions | GET | /api/admin/payment-gateway/config | RED | src/app/employer/subscriptions/page.tsx:45 — frontend call GET /api/admin/payment-gateway/config |
| /employer/subscriptions | GET | /api/employer/promo/validate?code=${couponCode.toUpperCase()}&planId=${checkoutPlan.id} | RED | src/app/employer/subscriptions/page.tsx:94 — frontend call GET /api/employer/promo/validate?code=${couponCode.toUpperCase()}&planId=${checkoutPlan.id} |
| /employer/subscriptions | POST | /api/payments/checkout | RED | src/app/employer/subscriptions/page.tsx:114 — frontend call POST /api/payments/checkout |
| /employer/subscriptions | POST | /api/employer/subscribe | RED | src/app/employer/subscriptions/page.tsx:182 — frontend call POST /api/employer/subscribe |
| /employer/team-members-management | GET | /api/employer/team | RED | src/app/employer/team-members-management/page.tsx:35 — frontend call GET /api/employer/team |
| /employer/team-members-management | POST | /api/employer/team | RED | src/app/employer/team-members-management/page.tsx:69 — frontend call POST /api/employer/team |
| /employer/team-members-management | DELETE | /api/employer/team?id=${encodeURIComponent(id)} | RED | src/app/employer/team-members-management/page.tsx:110 — frontend call DELETE /api/employer/team?id=${encodeURIComponent(id)} |
| /forgot-password/otp | POST | /api/auth/verify-otp | RED | src/app/forgot-password/otp/page.tsx:57 — frontend call POST /api/auth/verify-otp |
| /forgot-password/otp | POST | /api/auth/forgot-password | RED | src/app/forgot-password/otp/page.tsx:89 — frontend call POST /api/auth/forgot-password |
| /forgot-password | POST | /api/auth/forgot-password | RED | src/app/forgot-password/page.tsx:21 — frontend call POST /api/auth/forgot-password |
| /jobs | GET | /api/candidate/saved-jobs | RED | src/app/jobs/page.tsx:178 — frontend call GET /api/candidate/saved-jobs |
| /jobs | GET | /api/jobs/search?q=${encodeURIComponent(searchQuery)} | RED | src/app/jobs/page.tsx:193 — frontend call GET /api/jobs/search?q=${encodeURIComponent(searchQuery)} |
| /jobs | POST | /api/applications | RED | src/app/jobs/page.tsx:260 — frontend call POST /api/applications |
| /jobs | DELETE | /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} | RED | src/app/jobs/page.tsx:282 — frontend call DELETE /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} |
| /jobs | POST | /api/candidate/saved-jobs | RED | src/app/jobs/page.tsx:286 — frontend call POST /api/candidate/saved-jobs |
| /jobs/saved | GET | /api/candidate/saved-jobs | RED | src/app/jobs/saved/page.tsx:32 — frontend call GET /api/candidate/saved-jobs |
| /jobs/saved | DELETE | /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} | RED | src/app/jobs/saved/page.tsx:46 — frontend call DELETE /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} |
| /jobs/saved | POST | /api/applications | RED | src/app/jobs/saved/page.tsx:59 — frontend call POST /api/applications |
| /jobs/:id/apply | POST | /api/candidate/profile | RED | src/app/jobs/[id]/apply/page.tsx:25 — frontend call POST /api/candidate/profile |
| /jobs/:id/apply | POST | /api/applications | RED | src/app/jobs/[id]/apply/page.tsx:42 — frontend call POST /api/applications |
| /jobs/:id | GET | /api/employer/jobs/${jobId} | RED | src/app/jobs/[id]/page.tsx:41 — frontend call GET /api/employer/jobs/${jobId} |
| /jobs/:id | POST | /api/candidate/saved-jobs | RED | src/app/jobs/[id]/page.tsx:88 — frontend call POST /api/candidate/saved-jobs |
| /jobs/:id | POST | /api/applications | RED | src/app/jobs/[id]/page.tsx:104 — frontend call POST /api/applications |
| /jobs/:id | POST | /api/candidate/saved-jobs | RED | src/app/jobs/[id]/page.tsx:122 — frontend call POST /api/candidate/saved-jobs |
| /jobs/:id | DELETE | /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} | RED | src/app/jobs/[id]/page.tsx:128 — frontend call DELETE /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} |
| /login | POST | /api/auth/login | RED | src/app/login/page.tsx:39 — frontend call POST /api/auth/login |
| /notifications | PUT | /api/notifications | RED | src/app/notifications/page.tsx:25 — frontend call PUT /api/notifications |
| /notifications | PUT | /api/notifications | RED | src/app/notifications/page.tsx:40 — frontend call PUT /api/notifications |
| /notifications | PUT | /api/notifications | RED | src/app/notifications/page.tsx:55 — frontend call PUT /api/notifications |
| /onboarding/document-upload | POST | /api/upload | YELLOW | src/app/onboarding/document-upload/page.tsx:42 — frontend call POST /api/upload |
| /onboarding/document-upload | POST | /api/admin/document-verification | YELLOW | src/app/onboarding/document-upload/page.tsx:51 — frontend call POST /api/admin/document-verification |
| /onboarding/education | PUT | /api/candidate/profile | RED | src/app/onboarding/education/page.tsx:38 — frontend call PUT /api/candidate/profile |
| /onboarding/experience | PUT | /api/candidate/profile | RED | src/app/onboarding/experience/page.tsx:45 — frontend call PUT /api/candidate/profile |
| /onboarding/personal-details | GET | /api/candidate/profile | RED | src/app/onboarding/personal-details/page.tsx:23 — frontend call GET /api/candidate/profile |
| /onboarding/personal-details | PUT | /api/candidate/profile | RED | src/app/onboarding/personal-details/page.tsx:44 — frontend call PUT /api/candidate/profile |
| /onboarding/preferences | GET | /api/candidate/profile | RED | src/app/onboarding/preferences/page.tsx:27 — frontend call GET /api/candidate/profile |
| /onboarding/preferences | PUT | /api/candidate/profile | RED | src/app/onboarding/preferences/page.tsx:76 — frontend call PUT /api/candidate/profile |
| /onboarding/resume-upload | POST | /api/upload | YELLOW | src/app/onboarding/resume-upload/page.tsx:40 — frontend call POST /api/upload |
| /onboarding/resume-upload | POST | /api/agents/dispatch | YELLOW | src/app/onboarding/resume-upload/page.tsx:52 — frontend call POST /api/agents/dispatch |
| /onboarding/resume-upload | PUT | /api/candidate/profile | YELLOW | src/app/onboarding/resume-upload/page.tsx:84 — frontend call PUT /api/candidate/profile |
| /onboarding/role-select | PUT | /api/candidate/profile | YELLOW | src/app/onboarding/role-select/page.tsx:24 — frontend call PUT /api/candidate/profile |
| /onboarding/skills | PUT | /api/candidate/profile | YELLOW | src/app/onboarding/skills/page.tsx:25 — frontend call PUT /api/candidate/profile |
| /onboarding/video-resume | POST | /api/upload | YELLOW | src/app/onboarding/video-resume/page.tsx:129 — frontend call POST /api/upload |
| /onboarding/video-resume | POST | /api/candidate/video-resume | YELLOW | src/app/onboarding/video-resume/page.tsx:134 — frontend call POST /api/candidate/video-resume |
| /otp | POST | /api/auth/verify-otp | RED | src/app/otp/page.tsx:55 — frontend call POST /api/auth/verify-otp |
| /otp | POST | /api/auth/forgot-password | RED | src/app/otp/page.tsx:83 — frontend call POST /api/auth/forgot-password |
| /payment/status | GET | /api/payments/status?${queryParams.toString()} | RED | src/app/payment/status/page.tsx:39 — frontend call GET /api/payments/status?${queryParams.toString()} |
| /payment/success | GET | /api/employer/subscribe | YELLOW | src/app/payment/success/page.tsx:13 — frontend call GET /api/employer/subscribe |
| /profile | GET | /api/candidate/profile | RED | src/app/profile/page.tsx:47 — frontend call GET /api/candidate/profile |
| /profile | PUT | /api/candidate/profile | RED | src/app/profile/page.tsx:71 — frontend call PUT /api/candidate/profile |
| /referrals/dashboard | GET | /api/referrals | RED | src/app/referrals/dashboard/page.tsx:20 — frontend call GET /api/referrals |
| /referrals/dashboard | POST | /api/referrals/payout | RED | src/app/referrals/dashboard/page.tsx:57 — frontend call POST /api/referrals/payout |
| /referrals | GET | /api/referrals | RED | src/app/referrals/page.tsx:29 — frontend call GET /api/referrals |
| /register | POST | /api/auth/register | RED | src/app/register/page.tsx:54 — frontend call POST /api/auth/register |
| /reset-password | POST | /api/auth/reset-password | RED | src/app/reset-password/page.tsx:49 — frontend call POST /api/auth/reset-password |
| /settings/managed-hiring | GET | /api/admin/managed-hiring/config | RED | src/app/settings/managed-hiring/page.tsx:143 — frontend call GET /api/admin/managed-hiring/config |
| /settings/managed-hiring | POST | /api/admin/managed-hiring/config | RED | src/app/settings/managed-hiring/page.tsx:192 — frontend call POST /api/admin/managed-hiring/config |
| /settings | GET | /api/candidate/profile | RED | src/app/settings/page.tsx:17 — frontend call GET /api/candidate/profile |
| /settings | PUT | /api/candidate/profile | RED | src/app/settings/page.tsx:36 — frontend call PUT /api/candidate/profile |
| /video-assessment/active | POST | /api/agents/dispatch | RED | src/app/video-assessment/active/page.tsx:81 — frontend call POST /api/agents/dispatch |

## 6. API → DATABASE MATRIX

| Method | API | Detected DB model | Persistence signal | Evidence |
| --- | --- | --- | --- | --- |
| GET | /api/admin/audit-logs |  | referenced | src/app/api/admin/audit-logs/route.ts:4 — GET /api/admin/audit-logs |
| GET | /api/admin/config |  | referenced | src/app/api/admin/config/route.ts:26 — GET /api/admin/config |
| POST | /api/admin/config |  | referenced | src/app/api/admin/config/route.ts:34 — POST /api/admin/config |
| GET | /api/admin/document-verification | prisma.documentVerification, prisma.employerProfile | referenced | src/app/api/admin/document-verification/route.ts:49 — GET /api/admin/document-verification |
| POST | /api/admin/document-verification | prisma.documentVerification, prisma.employerProfile | referenced | src/app/api/admin/document-verification/route.ts:121 — POST /api/admin/document-verification |
| POST | /api/admin/document-verification/:id | prisma.documentVerification | referenced | src/app/api/admin/document-verification/[id]/route.ts:5 — POST /api/admin/document-verification/:id |
| GET | /api/admin/invoices |  | referenced | src/app/api/admin/invoices/route.ts:4 — GET /api/admin/invoices |
| POST | /api/admin/invoices |  | referenced | src/app/api/admin/invoices/route.ts:21 — POST /api/admin/invoices |
| GET | /api/admin/llm-usage |  | none/unknown | src/app/api/admin/llm-usage/route.ts:4 — GET /api/admin/llm-usage |
| GET | /api/admin/managed-hiring/config |  | none/unknown | src/app/api/admin/managed-hiring/config/route.ts:292 — GET /api/admin/managed-hiring/config |
| POST | /api/admin/managed-hiring/config |  | none/unknown | src/app/api/admin/managed-hiring/config/route.ts:300 — POST /api/admin/managed-hiring/config |
| GET | /api/admin/payment-gateway/config |  | referenced | src/app/api/admin/payment-gateway/config/route.ts:5 — GET /api/admin/payment-gateway/config |
| POST | /api/admin/payment-gateway/config |  | referenced | src/app/api/admin/payment-gateway/config/route.ts:19 — POST /api/admin/payment-gateway/config |
| POST | /api/admin/pricing/calculate |  | none/unknown | src/app/api/admin/pricing/calculate/route.ts:4 — POST /api/admin/pricing/calculate |
| GET | /api/admin/referrals/analytics |  | referenced | src/app/api/admin/referrals/analytics/route.ts:6 — GET /api/admin/referrals/analytics |
| GET | /api/admin/referrals/config |  | referenced | src/app/api/admin/referrals/config/route.ts:22 — GET /api/admin/referrals/config |
| PUT | /api/admin/referrals/config |  | referenced | src/app/api/admin/referrals/config/route.ts:45 — PUT /api/admin/referrals/config |
| GET | /api/admin/referrals/fraud |  | referenced | src/app/api/admin/referrals/fraud/route.ts:7 — GET /api/admin/referrals/fraud |
| POST | /api/admin/referrals/fraud |  | referenced | src/app/api/admin/referrals/fraud/route.ts:38 — POST /api/admin/referrals/fraud |
| GET | /api/admin/referrals/payouts |  | referenced | src/app/api/admin/referrals/payouts/route.ts:5 — GET /api/admin/referrals/payouts |
| POST | /api/admin/referrals/payouts |  | referenced | src/app/api/admin/referrals/payouts/route.ts:28 — POST /api/admin/referrals/payouts |
| GET | /api/admin/release/status |  | none/unknown | src/app/api/admin/release/status/route.ts:3 — GET /api/admin/release/status |
| GET | /api/admin/revenue/audit-logs |  | none/unknown | src/app/api/admin/revenue/audit-logs/route.ts:101 — GET /api/admin/revenue/audit-logs |
| GET | /api/admin/revenue/export |  | referenced | src/app/api/admin/revenue/export/route.ts:4 — GET /api/admin/revenue/export |
| GET | /api/admin/revenue/job-boost |  | none/unknown | src/app/api/admin/revenue/job-boost/route.ts:72 — GET /api/admin/revenue/job-boost |
| GET | /api/admin/revenue/managed-hiring |  | referenced | src/app/api/admin/revenue/managed-hiring/route.ts:11 — GET /api/admin/revenue/managed-hiring |
| GET | /api/admin/revenue/mock-interviews |  | none/unknown | src/app/api/admin/revenue/mock-interviews/route.ts:87 — GET /api/admin/revenue/mock-interviews |
| GET | /api/admin/revenue/pph |  | none/unknown | src/app/api/admin/revenue/pph/route.ts:135 — GET /api/admin/revenue/pph |
| GET | /api/admin/revenue/subscriptions |  | none/unknown | src/app/api/admin/revenue/subscriptions/route.ts:148 — GET /api/admin/revenue/subscriptions |
| GET | /api/admin/revenue/summary |  | none/unknown | src/app/api/admin/revenue/summary/route.ts:3 — GET /api/admin/revenue/summary |
| GET | /api/admin/revenue/transactions |  | none/unknown | src/app/api/admin/revenue/transactions/route.ts:360 — GET /api/admin/revenue/transactions |
| GET | /api/admin/security/status |  | none/unknown | src/app/api/admin/security/status/route.ts:18 — GET /api/admin/security/status |
| POST | /api/admin/security/status |  | none/unknown | src/app/api/admin/security/status/route.ts:55 — POST /api/admin/security/status |
| GET | /api/admin/subscription-plans |  | referenced | src/app/api/admin/subscription-plans/route.ts:6 — GET /api/admin/subscription-plans |
| POST | /api/admin/subscription-plans |  | referenced | src/app/api/admin/subscription-plans/route.ts:20 — POST /api/admin/subscription-plans |
| PUT | /api/admin/subscription-plans |  | referenced | src/app/api/admin/subscription-plans/route.ts:54 — PUT /api/admin/subscription-plans |
| DELETE | /api/admin/subscription-plans |  | referenced | src/app/api/admin/subscription-plans/route.ts:78 — DELETE /api/admin/subscription-plans |
| GET | /api/admin/subscriptions/settings |  | referenced | src/app/api/admin/subscriptions/settings/route.ts:6 — GET /api/admin/subscriptions/settings |
| POST | /api/admin/subscriptions/settings |  | referenced | src/app/api/admin/subscriptions/settings/route.ts:21 — POST /api/admin/subscriptions/settings |
| PUT | /api/admin/subscriptions/settings |  | referenced | src/app/api/admin/subscriptions/settings/route.ts:48 — PUT /api/admin/subscriptions/settings |
| DELETE | /api/admin/subscriptions/settings |  | referenced | src/app/api/admin/subscriptions/settings/route.ts:77 — DELETE /api/admin/subscriptions/settings |
| GET | /api/admin/system-health |  | referenced | src/app/api/admin/system-health/route.ts:4 — GET /api/admin/system-health |
| POST | /api/admin/tests/run |  | none/unknown | src/app/api/admin/tests/run/route.ts:4 — POST /api/admin/tests/run |
| POST | /api/agents/dispatch |  | referenced | src/app/api/agents/dispatch/route.ts:7 — POST /api/agents/dispatch |
| GET | /api/agreements/contracts |  | referenced | src/app/api/agreements/contracts/route.ts:5 — GET /api/agreements/contracts |
| POST | /api/agreements/contracts |  | referenced | src/app/api/agreements/contracts/route.ts:27 — POST /api/agreements/contracts |
| GET | /api/agreements/contracts/:id |  | referenced | src/app/api/agreements/contracts/[id]/route.ts:4 — GET /api/agreements/contracts/:id |
| PUT | /api/agreements/contracts/:id |  | referenced | src/app/api/agreements/contracts/[id]/route.ts:32 — PUT /api/agreements/contracts/:id |
| POST | /api/agreements/contracts/:id |  | referenced | src/app/api/agreements/contracts/[id]/route.ts:57 — POST /api/agreements/contracts/:id |
| GET | /api/agreements/requirements | prisma.employerProfile | referenced | src/app/api/agreements/requirements/route.ts:6 — GET /api/agreements/requirements |
| POST | /api/agreements/requirements | prisma.employerProfile | referenced | src/app/api/agreements/requirements/route.ts:27 — POST /api/agreements/requirements |
| GET | /api/agreements/requirements/:id |  | referenced | src/app/api/agreements/requirements/[id]/route.ts:4 — GET /api/agreements/requirements/:id |
| PATCH | /api/agreements/requirements/:id |  | referenced | src/app/api/agreements/requirements/[id]/route.ts:23 — PATCH /api/agreements/requirements/:id |
| GET | /api/agreements/templates |  | referenced | src/app/api/agreements/templates/route.ts:4 — GET /api/agreements/templates |
| POST | /api/agreements/templates |  | referenced | src/app/api/agreements/templates/route.ts:15 — POST /api/agreements/templates |
| GET | /api/agreements/templates/:id |  | referenced | src/app/api/agreements/templates/[id]/route.ts:4 — GET /api/agreements/templates/:id |
| PUT | /api/agreements/templates/:id |  | referenced | src/app/api/agreements/templates/[id]/route.ts:20 — PUT /api/agreements/templates/:id |
| POST | /api/agreements/templates/:id |  | referenced | src/app/api/agreements/templates/[id]/route.ts:43 — POST /api/agreements/templates/:id |
| DELETE | /api/agreements/templates/:id |  | referenced | src/app/api/agreements/templates/[id]/route.ts:69 — DELETE /api/agreements/templates/:id |
| GET | /api/applications | prisma.candidateProfile, prisma.application | referenced | src/app/api/applications/route.ts:5 — GET /api/applications |
| POST | /api/applications | prisma.candidateProfile, prisma.application | referenced | src/app/api/applications/route.ts:44 — POST /api/applications |
| POST | /api/auth/employer-register | prisma.user | referenced | src/app/api/auth/employer-register/route.ts:16 — POST /api/auth/employer-register |
| POST | /api/auth/forgot-password | db.findUserByEmail | referenced | src/app/api/auth/forgot-password/route.ts:11 — POST /api/auth/forgot-password |
| POST | /api/auth/login | db.findUserByEmail | referenced | src/app/api/auth/login/route.ts:13 — POST /api/auth/login |
| POST | /api/auth/logout |  | referenced | src/app/api/auth/logout/route.ts:5 — POST /api/auth/logout |
| GET | /api/auth/me |  | referenced | src/app/api/auth/me/route.ts:4 — GET /api/auth/me |
| POST | /api/auth/register | db.findUserByEmail, db.createUser | referenced | src/app/api/auth/register/route.ts:17 — POST /api/auth/register |
| POST | /api/auth/reset-password | prisma.user, db.findUserByEmail | referenced | src/app/api/auth/reset-password/route.ts:15 — POST /api/auth/reset-password |
| POST | /api/auth/verify-otp | prisma.user, db.findUserByEmail | referenced | src/app/api/auth/verify-otp/route.ts:15 — POST /api/auth/verify-otp |
| GET | /api/candidate/profile | prisma.candidateProfile | referenced | src/app/api/candidate/profile/route.ts:8 — GET /api/candidate/profile |
| PUT | /api/candidate/profile | prisma.candidateProfile | referenced | src/app/api/candidate/profile/route.ts:107 — PUT /api/candidate/profile |
| GET | /api/candidate/saved-jobs |  | referenced | src/app/api/candidate/saved-jobs/route.ts:8 — GET /api/candidate/saved-jobs |
| POST | /api/candidate/saved-jobs |  | referenced | src/app/api/candidate/saved-jobs/route.ts:68 — POST /api/candidate/saved-jobs |
| DELETE | /api/candidate/saved-jobs |  | referenced | src/app/api/candidate/saved-jobs/route.ts:119 — DELETE /api/candidate/saved-jobs |
| GET | /api/candidate/video-resume | prisma.candidateProfile, prisma.videoResume | referenced | src/app/api/candidate/video-resume/route.ts:12 — GET /api/candidate/video-resume |
| POST | /api/candidate/video-resume | prisma.candidateProfile, prisma.videoResume | referenced | src/app/api/candidate/video-resume/route.ts:28 — POST /api/candidate/video-resume |
| GET | /api/cron/referrals-reconciliation |  | referenced | src/app/api/cron/referrals-reconciliation/route.ts:110 — GET /api/cron/referrals-reconciliation |
| POST | /api/cron/referrals-reconciliation |  | referenced | src/app/api/cron/referrals-reconciliation/route.ts:114 — POST /api/cron/referrals-reconciliation |
| GET | /api/employer/candidates | prisma.employerProfile, prisma.application | referenced | src/app/api/employer/candidates/route.ts:5 — GET /api/employer/candidates |
| PATCH | /api/employer/candidates/:id/stage | prisma.application, prisma.employerProfile | referenced | src/app/api/employer/candidates/[id]/stage/route.ts:7 — PATCH /api/employer/candidates/:id/stage |
| GET | /api/employer/company | prisma.employerProfile, prisma.company | referenced | src/app/api/employer/company/route.ts:17 — GET /api/employer/company |
| PUT | /api/employer/company | prisma.employerProfile, prisma.company | referenced | src/app/api/employer/company/route.ts:57 — PUT /api/employer/company |
| GET | /api/employer/dashboard | prisma.employerProfile, prisma.jobListing, prisma.application, prisma.companyCredits, prisma.interview | referenced | src/app/api/employer/dashboard/route.ts:5 — GET /api/employer/dashboard |
| POST | /api/employer/interviews/schedule | prisma.application, prisma.employerProfile, prisma.interview, prisma.notification | referenced | src/app/api/employer/interviews/schedule/route.ts:24 — POST /api/employer/interviews/schedule |
| GET | /api/employer/interviews/:id/calendar | prisma.interview, prisma.employerProfile | referenced | src/app/api/employer/interviews/[id]/calendar/route.ts:5 — GET /api/employer/interviews/:id/calendar |
| POST | /api/employer/interviews/:id/feedback | prisma.interview, prisma.employerProfile | referenced | src/app/api/employer/interviews/[id]/feedback/route.ts:19 — POST /api/employer/interviews/:id/feedback |
| PATCH | /api/employer/interviews/:id | prisma.interview, prisma.employerProfile | referenced | src/app/api/employer/interviews/[id]/route.ts:17 — PATCH /api/employer/interviews/:id |
| GET | /api/employer/jobs | prisma.employerProfile, prisma.idempotencyRecord, db.getJobs | referenced | src/app/api/employer/jobs/route.ts:19 — GET /api/employer/jobs |
| POST | /api/employer/jobs | prisma.employerProfile, prisma.idempotencyRecord, db.getJobs | referenced | src/app/api/employer/jobs/route.ts:24 — POST /api/employer/jobs |
| GET | /api/employer/jobs/:id | prisma.jobListing, prisma.employerProfile | referenced | src/app/api/employer/jobs/[id]/route.ts:19 — GET /api/employer/jobs/:id |
| PUT | /api/employer/jobs/:id | prisma.jobListing, prisma.employerProfile | referenced | src/app/api/employer/jobs/[id]/route.ts:37 — PUT /api/employer/jobs/:id |
| POST | /api/employer/managed-hiring/join | prisma.application, prisma.employerProfile | referenced | src/app/api/employer/managed-hiring/join/route.ts:9 — POST /api/employer/managed-hiring/join |
| GET | /api/employer/promo/validate |  | referenced | src/app/api/employer/promo/validate/route.ts:5 — GET /api/employer/promo/validate |
| GET | /api/employer/source-tracking |  | referenced | src/app/api/employer/source-tracking/route.ts:11 — GET /api/employer/source-tracking |
| GET | /api/employer/subscribe | prisma.employerProfile | referenced | src/app/api/employer/subscribe/route.ts:7 — GET /api/employer/subscribe |
| POST | /api/employer/subscribe | prisma.employerProfile | referenced | src/app/api/employer/subscribe/route.ts:85 — POST /api/employer/subscribe |
| GET | /api/employer/team | prisma.employerProfile | referenced | src/app/api/employer/team/route.ts:44 — GET /api/employer/team |
| POST | /api/employer/team | prisma.employerProfile | referenced | src/app/api/employer/team/route.ts:102 — POST /api/employer/team |
| DELETE | /api/employer/team | prisma.employerProfile | referenced | src/app/api/employer/team/route.ts:138 — DELETE /api/employer/team |
| GET | /api/interviews/room |  | referenced | src/app/api/interviews/room/route.ts:19 — GET /api/interviews/room |
| POST | /api/interviews/room |  | referenced | src/app/api/interviews/room/route.ts:62 — POST /api/interviews/room |
| GET | /api/jobs/search | prisma.jobListing | referenced | src/app/api/jobs/search/route.ts:5 — GET /api/jobs/search |
| GET | /api/notifications | prisma.notification | referenced | src/app/api/notifications/route.ts:19 — GET /api/notifications |
| PUT | /api/notifications | prisma.notification | referenced | src/app/api/notifications/route.ts:90 — PUT /api/notifications |
| POST | /api/payments/checkout | prisma.subscriptionPlan, prisma.promoCode, prisma.employerProfile | referenced | src/app/api/payments/checkout/route.ts:5 — POST /api/payments/checkout |
| GET | /api/payments/status | prisma.employerProfile, prisma.paymentTransaction, prisma.companySubscription, prisma.companyCredits | referenced | src/app/api/payments/status/route.ts:5 — GET /api/payments/status |
| POST | /api/payments/webhook | prisma.paymentTransaction, prisma.subscriptionPlan | referenced | src/app/api/payments/webhook/route.ts:7 — POST /api/payments/webhook |
| GET | /api/proctoring/telemetry | prisma.auditLog | referenced | src/app/api/proctoring/telemetry/route.ts:16 — GET /api/proctoring/telemetry |
| POST | /api/proctoring/telemetry | prisma.auditLog | referenced | src/app/api/proctoring/telemetry/route.ts:50 — POST /api/proctoring/telemetry |
| POST | /api/referrals/payout |  | referenced | src/app/api/referrals/payout/route.ts:7 — POST /api/referrals/payout |
| GET | /api/referrals |  | referenced | src/app/api/referrals/route.ts:7 — GET /api/referrals |
| POST | /api/referrals |  | referenced | src/app/api/referrals/route.ts:48 — POST /api/referrals |
| GET | /api/referrals/validate |  | referenced | src/app/api/referrals/validate/route.ts:5 — GET /api/referrals/validate |
| GET | /api/skill-master | prisma.customSkillRequest | referenced | src/app/api/skill-master/route.ts:8 — GET /api/skill-master |
| POST | /api/skill-master | prisma.customSkillRequest | referenced | src/app/api/skill-master/route.ts:20 — POST /api/skill-master |
| POST | /api/upload |  | none/unknown | src/app/api/upload/route.ts:18 — POST /api/upload |
| GET | /api/whatsapp/auth/handoff |  | referenced | src/app/api/whatsapp/auth/handoff/route.ts:28 — GET /api/whatsapp/auth/handoff |
| POST | /api/whatsapp/onboard |  | referenced | src/app/api/whatsapp/onboard/route.ts:16 — POST /api/whatsapp/onboard |
| GET | /api/whatsapp/webhook |  | referenced | src/app/api/whatsapp/webhook/route.ts:27 — GET /api/whatsapp/webhook |
| POST | /api/whatsapp/webhook |  | referenced | src/app/api/whatsapp/webhook/route.ts:47 — POST /api/whatsapp/webhook |

## 7. API → EXTERNAL PROVIDER MATRIX

| Provider | Evidence files | Assessment | Status |
| --- | --- | --- | --- |
| OpenAI / Gemini / Anthropic / DeepSeek / Kimi | src/utils/aiRouter.ts; src/lib/ai/ModelRouter.ts | Provider routing and fallback code exists; real-key, cost, persistence, and UI proof are not universal. | YELLOW/RED |
| WhatsApp Cloud API | src/lib/whatsapp.ts; src/app/api/whatsapp/* | Transport, webhook, identity, onboarding, and auth handoff code exists; production credentials and live delivery require verification. | YELLOW |
| Razorpay / PhonePe / Stripe | src/lib/payments/*; src/app/api/payments/* | Multiple gateway paths exist; payment lifecycle and webhook runtime validation are not proven by this static audit. | YELLOW/RED |
| SMTP / SendGrid | src/lib/email.ts | Email transport checks environment configuration and can return provider-unavailable responses. | YELLOW |
| WebRTC | src/components/interview/WebRTCInterviewRoom.tsx; src/app/interviews/room/:roomId/page.tsx | In-browser room component exists; signaling, recording, persistence, and production TURN configuration require E2E proof. | YELLOW |
| Local upload storage | src/app/api/upload/route.ts | Writes to public/uploads; not production durable storage. | RED |

## 8. SCREEN → ROS MATRIX

Static ROS references were detected in the inventory. A source module existing is not proof of a live request path. Most screen records remain YELLOW until a route-level E2E trace proves the complete ROS chain.

| ROS component | Static evidence | Current classification |
| --- | --- | --- |
| RosGateway | src/lib/ros/RosGateway.ts | Implemented; route callers require verification |
| TenantContext / RbacGuard | src/lib/security/* | Implemented and referenced by tests; not universal across APIs |
| ExecutionLoop / AgentRegistry | src/lib/agents/* | Implemented; screen-to-agent coverage incomplete |
| Outbox / EventDispatcher / ConsumerRegistry | src/lib/events/* | Implemented; worker/runtime deployment not proven |
| BudgetManager / AgentEvaluator / FairnessAuditor | src/lib/governance/* | Implemented; usage across all AI paths not proven |
| WorkflowEngine / HiringPipeline | src/lib/workflows/* | Implemented/tested in harness; production route integration incomplete |
| ModelRouter / CircuitBreaker | src/lib/ai/* | Implemented; provider configuration and persistence require runtime verification |

## 9. AGENT WIRING MATRIX

| Agent | Finding | Status |
| --- | --- | --- |
| ResumeEvaluatorAgent | Implemented in source/tests; portal/API call path must be proven for every resume scoring screen. | YELLOW |
| MockInterviewCopilotAgent | Referenced by test/agent infrastructure; runtime screen-to-agent evidence is incomplete. | YELLOW |
| SecurityJudgeAgent | Referenced by agent infrastructure; no complete production screen trace found by static scan. | YELLOW |
| CommunicationCoachAgent | Referenced by agent infrastructure; no complete production screen trace found by static scan. | YELLOW |
| JdGeneratorAgent | ROS gateway and execution loop references found; verify employer JD action reaches it in production. | YELLOW |
| CandidateMatchmakerAgent | ROS/test references found; API-to-screen persistence trace remains incomplete. | YELLOW |

## 10. LLM MATRIX

| Area | Required mode | Finding | Status |
| --- | --- | --- | --- |
| Resume scoring / evaluation | LLM or hybrid | Real provider path and deterministic fallback exist; fallback can produce simulated output. | RED/YELLOW |
| JD generation | LLM | AI router and ROS references exist; production provider, budget, output schema, and persistence need proof. | YELLOW |
| Interview copilot | LLM | Agent/model infrastructure exists; complete UI-to-persistence trace is not established. | YELLOW |
| Skill master / role mapping | Deterministic | Central role/skill data can be deterministic; no LLM is required for the basic suggestion path. | YELLOW |
| Matching / ranking | Hybrid | Candidate/job API and agent infrastructure exist; real persisted scoring trace remains incomplete. | YELLOW |

## 11. HARDCODED / MOCK AUDIT

| Severity | Evidence | Finding | Impact |
| --- | --- | --- | --- |
| INFO | src/proxy.ts:55 | The `?bypass=true` query parameter is now limited to non-production environments. | Development convenience only; production auth bypass is no longer exposed by this branch. |
| INFO | src/lib/prisma.ts:95 | Seeded mock users remain available only for development or explicit mock-db mode. | Development fallback only; production now fails closed instead of authenticating against seeded users. |
| HIGH | src/utils/aiRouter.ts:108 | AI router returns simulated resume/JD/interview-style output when a real provider is unavailable. | Users may see fabricated AI results while the UI appears successful. |
| HIGH | src/services/candidateProfileService.ts:4 | Candidate profile service imports mock profile data as a source dependency. | Candidate profile can be presented as persisted while actually using fixtures. |
| HIGH | src/app/video-assessment/setup/page.tsx:7 | Assessment setup is rendered from a large embedded static HTML string. | Screen can look complete while actions and data are not connected. |
| MEDIUM | src/lib/otp.ts:90 | Master OTP is accepted outside production only; this is safe only if environment classification is correct. | Environment misconfiguration weakens identity verification. |

Static scanner summary: 500 records contain mock/fallback/static indicators. This is intentionally conservative; each RED record must be reviewed using its exact evidence row in the inventory.

## 12. SECURITY FINDINGS

| Priority | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| INFO | Development-only auth bypass | src/proxy.ts:55 | The bypass gate is now limited to non-production environments; keep it out of production deployments and revalidate environment settings. |
| INFO | Development-only mock-user fallback | src/lib/prisma.ts:93 | Mock users now remain behind non-production / mock-db guards; revalidate fail-closed behavior in production once the database is reachable. |
| P1 | Mixed admin route authorization | src/app/api/admin/document-verification/route.ts:107 | POST accepts any authenticated session by design; confirm employer submission is separated from admin review endpoints. |
| P1 | Upload storage is local filesystem | src/app/api/upload/route.ts:44 | Production requires durable object storage, malware scanning, signed URLs, and tenant-scoped access. |
| P1 | Webhook/provider verification requires runtime proof | src/app/api/payments/webhook/route.ts:7 | Verify signature, replay protection, idempotency, and persisted event state against production configuration. |

## 13. PAYMENT FINDINGS

The repository contains plan, checkout, payment status, webhook, subscription, credit, invoice, revenue, and gateway configuration paths. The lifecycle is not production-ready until the following are demonstrated against a real provider sandbox: signed webhook acceptance, replay rejection, idempotent checkout and webhook handling, persisted entitlement changes, failed payment recovery, refund/cancellation behavior, and tenant-scoped invoice access. Several admin revenue endpoints are static/mock-like according to the inventory and must not be used as financial truth.

## 14. WHATSAPP STATUS

**Implemented in source, not production-verified.** Webhook verification, identity resolution, onboarding state, persisted inbound events, auth handoff, and outbound transport modules exist. Required production proof includes Meta credentials, webhook signature verification, duplicate-event behavior, consent/template policy, 24-hour window enforcement, tenant binding, and delivery failure recovery.

## 15. DEPLOYMENT FINDINGS

- Docker and docker-compose files exist, but no complete staging/production deployment proof was found in the source inventory.
- Prisma schema and migrations exist; production migration execution and rollback procedure must be verified.
- `/public/uploads` local filesystem storage is not durable production storage.
- Worker/cron runtime for outbox, DLQ, referral reconciliation, and scheduled operations is not proven by the Next app alone.
- Environment variables and secrets must be validated in the deployment environment, including JWT secret, database URL, provider keys, webhook secrets, storage, email, WhatsApp, and payment credentials.
- Build, start, health check, migration, and rollback need to be tested in a production-like environment.

## 16. E2E JOURNEY BREAKPOINTS

### Candidate

Registration and onboarding screens exist, with candidate profile/resume/video/skill APIs present. The first high-risk breakpoint is persistence truth: `src/services/candidateProfileService.ts` imports mock profile data, and several API/UI paths contain fallback/static behavior. The journey must be tested through job search, apply, assessment, interview, AI preparation, and result persistence.

### Employer

Registration → OTP → business model → plan → one-document KYC is implemented and was previously verified in development. Production blockers remain database connectivity, durable upload storage, subscription/payment truth, job persistence, candidate pipeline authorization, and interview scheduling/video signaling.

### Admin

Admin login and dashboard/navigation exist. Verification, revenue, subscription, agreements, audit, security, and system-health screens exist, but the admin surface includes static/mock findings and must be validated with real persisted records. The recently fixed dev-only auth gate still needs production revalidation.

## 17. PRODUCTION BLOCKERS

1. Revalidate the dev-only `?bypass=true` gate in `src/proxy.ts` so production requests cannot activate it.
2. Revalidate fail-closed authentication in `src/lib/prisma.ts` so seeded mock users remain development-only.
3. Replace simulated AI success output with explicit provider-unavailable errors or an explicitly labeled non-production mode.
4. Replace local upload storage with durable, access-controlled object storage and scanning.
5. Prove payment webhook signature, replay protection, idempotency, and entitlement persistence.
6. Run true E2E tests with a real database and provider sandboxes; current harness tests are not equivalent to production E2E.
7. Verify tenant and RBAC enforcement for every employer/admin/candidate API, including dynamic resource routes.
8. Resolve the current TypeScript failure and full-lint failures before declaring the repository build-ready.

## 18. NON-BLOCKING GAPS

- Static/generated screens and visual prototypes remain in the route tree and should be clearly labeled or removed from production navigation.
- API caller matching is partly dynamic-string based and needs runtime contract tests.
- Several pages have hardcoded demo content, fixed analytics, or placeholder links.
- Server actions were not discovered; the portal is API-route driven.
- Loading, empty, retry, duplicate-submit, and stale-data behavior is inconsistent across the route inventory.
- Admin navigation and feature labels should be validated against every route after final IA decisions.

## 19. DUPLICATE / FOMO FEATURES

- Do not add more AI agents until the six required agents have complete production traces.
- Do not add more payment gateways until one provider has a complete verified lifecycle.
- Do not add more dashboards until existing dashboard metrics are database-backed.
- Do not add new WhatsApp workflows until webhook identity, consent, deduplication, and tenant safety are live.
- Do not expand interview modes until WebRTC signaling, recording, feedback, notifications, and persistence are verified.

## 20. REQUIRED FIX ORDER

### P0

- No current P0 blockers remain from the recently fixed auth bypass and mock-user fallback. Revalidate production environment configuration before release.

### P1

- Replace simulated AI fallback in src/utils/aiRouter.ts:108 with explicit provider-unavailable behavior or labeled sandbox mode.
- Move uploads from src/app/api/upload/route.ts:44 to durable object storage with signed access and malware scanning.
- Complete payment/webhook runtime tests for src/app/api/payments/* and persist all entitlement transitions.
- Run tenant/RBAC contract tests against all dynamic employer, candidate, admin, agreement, document, and payment routes.

### P2

- Remove or isolate mock candidate profile service dependencies.
- Replace static visual prototype screens and hardcoded analytics in launch navigation.
- Add explicit UI error, empty, retry, and duplicate-submit states to the highest-volume flows.

### P3

- Improve inventory-to-runtime contract tests and add a CI reconciliation gate.
- Document deployment, migrations, worker, cron, rollback, and provider sandbox procedures.

## 21. FINAL PRODUCTION CHECKLIST

- [ ] Production bypass parameter removed or disabled.
- [ ] Production authentication fails closed when database is unavailable.
- [ ] Database migrations applied and rollback tested.
- [ ] Tenant and RBAC tests pass for every protected API.
- [ ] Durable upload storage and malware scanning are live.
- [ ] Payment checkout, webhook, refunds, cancellation, expiry, and idempotency are tested.
- [ ] AI provider keys, routing, budgets, cost tracking, timeouts, and failure behavior are verified.
- [ ] Six required agents have screen-to-persistence traces.
- [ ] WebRTC signaling, TURN, recording, feedback, and persistence are verified.
- [ ] WhatsApp webhook, identity, consent, deduplication, and delivery recovery are verified.
- [ ] Outbox, worker, DLQ, cron, and recovery processes run in staging.
- [ ] Loading/error/empty/retry/duplicate-submit states are verified on launch flows.
- [ ] Build, start, health check, migration, and rollback pass in production-like environment.
- [ ] Machine-readable inventory is reconciled in CI.

## 22. FINAL ANSWER

**CAN HIREGO GO TO PRODUCTION TODAY? NO.**

Exact conditions: remove the authentication bypass and mock-user production fallback, replace simulated AI and local upload persistence, complete payment/provider/tenant/RBAC verification, and pass true production-like E2E tests.

## 23. MACHINE-READABLE INVENTORY SUMMARY

- JSON: [production-wiring-inventory.json](./production-wiring-inventory.json)
- CSV: [production-wiring-inventory.csv](./production-wiring-inventory.csv)
- Records: 1531
- Screens: 245
- User actions: 1015
- Frontend API calls: 151
- API method records: 120
- Server actions: 0
- Records missing evidence: 0

## 24. INVENTORY RECONCILIATION

| Check | Result |
| --- | --- |
| Every discovered page has a screen record | PASS |
| Every API route method has an endpoint record | PASS |
| Every handler has evidence | PASS |
| Frontend calls with no exact static endpoint match | See inventory notes; dynamic paths require contract verification |
| RED records | 500 |
| BLACK records | 0 |

The scanner is intentionally conservative. GREEN is not assigned by static source presence alone; runtime verification is required before any feature can be called production-ready.
