# HIREGO AI — COMPLETE PORTAL PRODUCTION WIRING AUDIT

Generated: 2026-09-21T03:59:41.513Z
Repository: Hirego-marketing
Audit mode: read-only static source audit plus route/build checks. Application code was not modified for this audit.

## 1. EXECUTIVE VERDICT

**NOT READY for production.**

The portal contains a large implemented surface, but the repository still contains simulated AI output, local upload persistence, and many UI/API paths that require runtime E2E verification. The recently fixed auth gates still need production revalidation. The machine-readable inventory contains one record per discovered screen, handler, frontend API call, API method, and server action.

### Scope discovered

| Artifact | Count |
| --- | --- |
| Screen/page files | 263 |
| API route files | 160 |
| API method records | 232 |
| User-action records | 967 |
| Frontend API-call records | 220 |
| Server-action files | 0 |
| Source files scanned | 581 |
| Inventory records | 1682 |

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
| /about | GREEN | src/app/about/page.tsx | No interactive handler detected by static scan. |
| /admin/agreements/builder | GREEN | src/app/admin/agreements/builder/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/agreements/templates | GREEN | src/app/admin/agreements/templates/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/ai-command-centre-dashboard | GREEN | src/app/admin/ai-command-centre-dashboard/page.tsx | No interactive handler detected by static scan. |
| /admin/communications | GREEN | src/app/admin/communications/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/dashboard | GREEN | src/app/admin/dashboard/page.tsx | No interactive handler detected by static scan. |
| /admin/document-verification | GREEN | src/app/admin/document-verification/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/employers | GREEN | src/app/admin/employers/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/invoices | GREEN | src/app/admin/invoices/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/jobs | GREEN | src/app/admin/jobs/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/licenses/allocator | GREEN | src/app/admin/licenses/allocator/page.tsx | No interactive handler detected by static scan. |
| /admin/login | GREEN | src/app/admin/login/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/logs/stream | GREEN | src/app/admin/logs/stream/page.tsx | No interactive handler detected by static scan. |
| /admin/managed-hiring/agreements/builder | GREEN | src/app/admin/managed-hiring/agreements/builder/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/managed-hiring/operations | GREEN | src/app/admin/managed-hiring/operations/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/managed-hiring/pipeline | GREEN | src/app/admin/managed-hiring/pipeline/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/managed-hiring/requests | GREEN | src/app/admin/managed-hiring/requests/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/managed-hiring/templates | GREEN | src/app/admin/managed-hiring/templates/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/models/playground | GREEN | src/app/admin/models/playground/page.tsx | No interactive handler detected by static scan. |
| /admin/models/registry | GREEN | src/app/admin/models/registry/page.tsx | No interactive handler detected by static scan. |
| /admin | GREEN | src/app/admin/page.tsx | No interactive handler detected by static scan. |
| /admin/payment-gateways | GREEN | src/app/admin/payment-gateways/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/pricing-engine | GREEN | src/app/admin/pricing-engine/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/proctoring-control-panel | GREEN | src/app/admin/proctoring-control-panel/page.tsx | No interactive handler detected by static scan. |
| /admin/recorded-assessment/questions | GREEN | src/app/admin/recorded-assessment/questions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/recorded-assessment/restrictions | GREEN | src/app/admin/recorded-assessment/restrictions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/referrals | GREEN | src/app/admin/referrals/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/revenue | GREEN | src/app/admin/revenue/page.tsx | No interactive handler detected by static scan. |
| /admin/roles | GREEN | src/app/admin/roles/page.tsx | No interactive handler detected by static scan. |
| /admin/security/vulnerability-inspector | GREEN | src/app/admin/security/vulnerability-inspector/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/ai-agents | GREEN | src/app/admin/settings/ai-agents/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/analytics | GREEN | src/app/admin/settings/analytics/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/audit-log | GREEN | src/app/admin/settings/audit-log/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/domain | GREEN | src/app/admin/settings/domain/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/hub | GREEN | src/app/admin/settings/hub/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/integrations | GREEN | src/app/admin/settings/integrations/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/llm-usage | GREEN | src/app/admin/settings/llm-usage/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/managed-hiring | GREEN | src/app/admin/settings/managed-hiring/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/payment-gateway | GREEN | src/app/admin/settings/payment-gateway/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/plan-management | GREEN | src/app/admin/settings/plan-management/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/security | GREEN | src/app/admin/settings/security/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/settings/smtp | GREEN | src/app/admin/settings/smtp/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/terms-privacy | GREEN | src/app/admin/settings/terms-privacy/page.tsx | No interactive handler detected by static scan. |
| /admin/settings/whatsapp | GREEN | src/app/admin/settings/whatsapp/page.tsx | No interactive handler detected by static scan. |
| /admin/signups | GREEN | src/app/admin/signups/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/sla/monitor | GREEN | src/app/admin/sla/monitor/page.tsx | No interactive handler detected by static scan. |
| /admin/subscriptions | GREEN | src/app/admin/subscriptions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/system/backup-recovery | GREEN | src/app/admin/system/backup-recovery/page.tsx | No interactive handler detected by static scan. |
| /admin/system/db-pool | GREEN | src/app/admin/system/db-pool/page.tsx | No interactive handler detected by static scan. |
| /admin/system/infrastructure | GREEN | src/app/admin/system/infrastructure/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/system/queue-broker | GREEN | src/app/admin/system/queue-broker/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/system-health | GREEN | src/app/admin/system-health/page.tsx | Interactive handlers detected; action-level rows follow. |
| /admin/users | GREEN | src/app/admin/users/page.tsx | Interactive handlers detected; action-level rows follow. |
| /ai/career-insights | GREEN | src/app/ai/career-insights/page.tsx | No interactive handler detected by static scan. |
| /ai/career-prediction | GREEN | src/app/ai/career-prediction/page.tsx | No interactive handler detected by static scan. |
| /ai/coach/active | GREEN | src/app/ai/coach/active/page.tsx | No interactive handler detected by static scan. |
| /ai/coach/results | GREEN | src/app/ai/coach/results/page.tsx | No interactive handler detected by static scan. |
| /ai/mock-interview/active | GREEN | src/app/ai/mock-interview/active/page.tsx | Interactive handlers detected; action-level rows follow. |
| /ai/mock-interview/setup | GREEN | src/app/ai/mock-interview/setup/page.tsx | Interactive handlers detected; action-level rows follow. |
| /ai/mock-interview/summary | GREEN | src/app/ai/mock-interview/summary/page.tsx | Interactive handlers detected; action-level rows follow. |
| /ai/practice-hub | GREEN | src/app/ai/practice-hub/page.tsx | Interactive handlers detected; action-level rows follow. |
| /ai/resume-score | GREEN | src/app/ai/resume-score/page.tsx | No interactive handler detected by static scan. |
| /ai/skill-gap | GREEN | src/app/ai/skill-gap/page.tsx | No interactive handler detected by static scan. |
| /ai-features | GREEN | src/app/ai-features/page.tsx | No interactive handler detected by static scan. |
| /applications/history | RED | src/app/applications/history/page.tsx | Interactive handlers detected; action-level rows follow. |
| /applications | GREEN | src/app/applications/page.tsx | Interactive handlers detected; action-level rows follow. |
| /applications/pipeline | GREEN | src/app/applications/pipeline/page.tsx | Interactive handlers detected; action-level rows follow. |
| /applications/timeline | GREEN | src/app/applications/timeline/page.tsx | Interactive handlers detected; action-level rows follow. |
| /applications/withdraw | RED | src/app/applications/withdraw/page.tsx | No interactive handler detected by static scan. |
| /assessment/mcq/active | GREEN | src/app/assessment/mcq/active/page.tsx | Interactive handlers detected; action-level rows follow. |
| /assessment/mcq | GREEN | src/app/assessment/mcq/page.tsx | Interactive handlers detected; action-level rows follow. |
| /assessment/mock-interview/dna | GREEN | src/app/assessment/mock-interview/dna/page.tsx | No interactive handler detected by static scan. |
| /assessment/readiness | GREEN | src/app/assessment/readiness/page.tsx | Interactive handlers detected; action-level rows follow. |
| /assessment/typing/active | GREEN | src/app/assessment/typing/active/page.tsx | Interactive handlers detected; action-level rows follow. |
| /assessment/typing/results | GREEN | src/app/assessment/typing/results/page.tsx | Interactive handlers detected; action-level rows follow. |
| /assessment/typing/setup | RED | src/app/assessment/typing/setup/page.tsx | Interactive handlers detected; action-level rows follow. |
| /billing | RED | src/app/billing/page.tsx | No interactive handler detected by static scan. |
| /blog | GREEN | src/app/blog/page.tsx | No interactive handler detected by static scan. |
| /candidate/assessment-restrictions | GREEN | src/app/candidate/assessment-restrictions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /candidate/dashboard | GREEN | src/app/candidate/dashboard/page.tsx | No interactive handler detected by static scan. |
| /candidate/job-search | GREEN | src/app/candidate/job-search/page.tsx | No interactive handler detected by static scan. |
| /candidate/profile | GREEN | src/app/candidate/profile/page.tsx | No interactive handler detected by static scan. |
| /candidate/universal-profile | GREEN | src/app/candidate/universal-profile/page.tsx | No interactive handler detected by static scan. |
| /career-resources | GREEN | src/app/career-resources/page.tsx | No interactive handler detected by static scan. |
| /careers | GREEN | src/app/careers/page.tsx | No interactive handler detected by static scan. |
| /certifications | GREEN | src/app/certifications/page.tsx | No interactive handler detected by static scan. |
| /checkout | GREEN | src/app/checkout/page.tsx | Interactive handlers detected; action-level rows follow. |
| /company | GREEN | src/app/company/page.tsx | No interactive handler detected by static scan. |
| /contact | GREEN | src/app/contact/page.tsx | No interactive handler detected by static scan. |
| /credits | GREEN | src/app/credits/page.tsx | Interactive handlers detected; action-level rows follow. |
| /dashboard | GREEN | src/app/dashboard/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/active-proctoring-monitor | GREEN | src/app/employer/active-proctoring-monitor/page.tsx | No interactive handler detected by static scan. |
| /employer/active-video-interview-interviewer-view | GREEN | src/app/employer/active-video-interview-interviewer-view/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/ai-candidate-ranking-explanation | GREEN | src/app/employer/ai-candidate-ranking-explanation/page.tsx | No interactive handler detected by static scan. |
| /employer/ai-evaluation-scores | GREEN | src/app/employer/ai-evaluation-scores/page.tsx | No interactive handler detected by static scan. |
| /employer/ai-hiring-copilot-hub | GREEN | src/app/employer/ai-hiring-copilot-hub/page.tsx | No interactive handler detected by static scan. |
| /employer/ai-hiring-insights | GREEN | src/app/employer/ai-hiring-insights/page.tsx | No interactive handler detected by static scan. |
| /employer/ai-interview-question-generator | GREEN | src/app/employer/ai-interview-question-generator/page.tsx | No interactive handler detected by static scan. |
| /employer/assessments/builder | GREEN | src/app/employer/assessments/builder/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/assessments/recorded/configure | GREEN | src/app/employer/assessments/recorded/configure/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/assessments/recorded | GREEN | src/app/employer/assessments/recorded/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/candidate-comparison | GREEN | src/app/employer/candidate-comparison/page.tsx | No interactive handler detected by static scan. |
| /employer/candidate-user-management | GREEN | src/app/employer/candidate-user-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/career-command-center | GREEN | src/app/employer/career-command-center/page.tsx | No interactive handler detected by static scan. |
| /employer/company-profile-editor | GREEN | src/app/employer/company-profile-editor/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/company-reviews-management | GREEN | src/app/employer/company-reviews-management/page.tsx | No interactive handler detected by static scan. |
| /employer/create-job-ai-jd-writing | GREEN | src/app/employer/create-job-ai-jd-writing/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/create-job-ai-screening | GREEN | src/app/employer/create-job-ai-screening/page.tsx | No interactive handler detected by static scan. |
| /employer/create-job-basic-info | GREEN | src/app/employer/create-job-basic-info/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/create-job-matching-config | GREEN | src/app/employer/create-job-matching-config/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/create-job-requirements | GREEN | src/app/employer/create-job-requirements/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/create-job-review-and-publish | GREEN | src/app/employer/create-job-review-and-publish/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/dashboard | GREEN | src/app/employer/dashboard/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/department-hiring-management | GREEN | src/app/employer/department-hiring-management/page.tsx | No interactive handler detected by static scan. |
| /employer/edit-job-post | GREEN | src/app/employer/edit-job-post/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-analytics-dashboard | GREEN | src/app/employer/employer-analytics-dashboard/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-company-management | GREEN | src/app/employer/employer-company-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-company-settings-hub | GREEN | src/app/employer/employer-company-settings-hub/page.tsx | No interactive handler detected by static scan. |
| /employer/employer-forgot-password | GREEN | src/app/employer/employer-forgot-password/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-notifications-center | GREEN | src/app/employer/employer-notifications-center/page.tsx | No interactive handler detected by static scan. |
| /employer/employer-onboarding-first-job-prompt | GREEN | src/app/employer/employer-onboarding-first-job-prompt/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-onboarding-welcome | GREEN | src/app/employer/employer-onboarding-welcome/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-business-model | GREEN | src/app/employer/employer-registration-business-model/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-company-info | GREEN | src/app/employer/employer-registration-company-info/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-complete | GREEN | src/app/employer/employer-registration-complete/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-document-verification | GREEN | src/app/employer/employer-registration-document-verification/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-otp-verification | GREEN | src/app/employer/employer-registration-otp-verification/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-registration-plan-selection | GREEN | src/app/employer/employer-registration-plan-selection/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-sign-in | GREEN | src/app/employer/employer-sign-in/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/employer-subscription-and-plans | GREEN | src/app/employer/employer-subscription-and-plans/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/enterprise-talent-pool-database | GREEN | src/app/employer/enterprise-talent-pool-database/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/final-round-feedback | GREEN | src/app/employer/final-round-feedback/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/full-candidate-profile-employer-view | GREEN | src/app/employer/full-candidate-profile-employer-view/page.tsx | No interactive handler detected by static scan. |
| /employer/hiring-funnel-detail | GREEN | src/app/employer/hiring-funnel-detail/page.tsx | No interactive handler detected by static scan. |
| /employer/hiring-pipeline | GREEN | src/app/employer/hiring-pipeline/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/import-jobs | GREEN | src/app/employer/import-jobs/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/interview-feedback-form | GREEN | src/app/employer/interview-feedback-form/page.tsx | No interactive handler detected by static scan. |
| /employer/interview-panel-collaboration | GREEN | src/app/employer/interview-panel-collaboration/page.tsx | No interactive handler detected by static scan. |
| /employer/interview-reschedule-employer-view | GREEN | src/app/employer/interview-reschedule-employer-view/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/interview-round-builder | GREEN | src/app/employer/interview-round-builder/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/interview-scheduler | GREEN | src/app/employer/interview-scheduler/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/invitation/accept | GREEN | src/app/employer/invitation/accept/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/job-boost-promote | GREEN | src/app/employer/job-boost-promote/page.tsx | No interactive handler detected by static scan. |
| /employer/job-listings-management | GREEN | src/app/employer/job-listings-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/job-performance-analytics | GREEN | src/app/employer/job-performance-analytics/page.tsx | No interactive handler detected by static scan. |
| /employer/managed-hiring/agreements/:id | GREEN | src/app/employer/managed-hiring/agreements/[id]/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring/candidate-tracking | GREEN | src/app/employer/managed-hiring/candidate-tracking/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring/join | GREEN | src/app/employer/managed-hiring/join/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring | GREEN | src/app/employer/managed-hiring/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring/request | GREEN | src/app/employer/managed-hiring/request/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/managed-hiring/service-plan | GREEN | src/app/employer/managed-hiring/service-plan/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/offer-letter-create-and-send | GREEN | src/app/employer/offer-letter-create-and-send/page.tsx | No interactive handler detected by static scan. |
| /employer/offer-management-dashboard | GREEN | src/app/employer/offer-management-dashboard/page.tsx | No interactive handler detected by static scan. |
| /employer/panel-interview-view | GREEN | src/app/employer/panel-interview-view/page.tsx | No interactive handler detected by static scan. |
| /employer/proactive-candidate-search | GREEN | src/app/employer/proactive-candidate-search/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/proctoring-security-report | GREEN | src/app/employer/proctoring-security-report/page.tsx | No interactive handler detected by static scan. |
| /employer/recruiter-interaction-hub | GREEN | src/app/employer/recruiter-interaction-hub/page.tsx | No interactive handler detected by static scan. |
| /employer/referral-and-source-tracking | GREEN | src/app/employer/referral-and-source-tracking/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/referrals | GREEN | src/app/employer/referrals/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/revenue-and-billing-management | GREEN | src/app/employer/revenue-and-billing-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/roles-and-permissions | GREEN | src/app/employer/roles-and-permissions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/salary-benchmark-insights | GREEN | src/app/employer/salary-benchmark-insights/page.tsx | No interactive handler detected by static scan. |
| /employer/subscriptions | GREEN | src/app/employer/subscriptions/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/team-members-management | GREEN | src/app/employer/team-members-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/upcoming-interviews-list | GREEN | src/app/employer/upcoming-interviews-list/page.tsx | Interactive handlers detected; action-level rows follow. |
| /employer/video-resume/:videoId | GREEN | src/app/employer/video-resume/[videoId]/page.tsx | No interactive handler detected by static scan. |
| /enterprise | GREEN | src/app/enterprise/page.tsx | No interactive handler detected by static scan. |
| /features | GREEN | src/app/features/page.tsx | No interactive handler detected by static scan. |
| /find-jobs | GREEN | src/app/find-jobs/page.tsx | No interactive handler detected by static scan. |
| /forgot-password/otp | GREEN | src/app/forgot-password/otp/page.tsx | Interactive handlers detected; action-level rows follow. |
| /forgot-password | GREEN | src/app/forgot-password/page.tsx | Interactive handlers detected; action-level rows follow. |
| /interviews | GREEN | src/app/interviews/page.tsx | Interactive handlers detected; action-level rows follow. |
| /interviews/room/:roomId | GREEN | src/app/interviews/room/[roomId]/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/alerts | RED | src/app/jobs/alerts/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/apply/success | GREEN | src/app/jobs/apply/success/page.tsx | No interactive handler detected by static scan. |
| /jobs/compare | GREEN | src/app/jobs/compare/page.tsx | No interactive handler detected by static scan. |
| /jobs/filters | RED | src/app/jobs/filters/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs | GREEN | src/app/jobs/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/recommended | GREEN | src/app/jobs/recommended/page.tsx | No interactive handler detected by static scan. |
| /jobs/report | RED | src/app/jobs/report/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/saved | GREEN | src/app/jobs/saved/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/suggestions | RED | src/app/jobs/suggestions/page.tsx | No interactive handler detected by static scan. |
| /jobs/:id/ai-insights | RED | src/app/jobs/[id]/ai-insights/page.tsx | No interactive handler detected by static scan. |
| /jobs/:id/apply | GREEN | src/app/jobs/[id]/apply/page.tsx | Interactive handlers detected; action-level rows follow. |
| /jobs/:id | GREEN | src/app/jobs/[id]/page.tsx | Interactive handlers detected; action-level rows follow. |
| /landing-old | GREEN | src/app/landing-old/page.tsx | No interactive handler detected by static scan. |
| /leaderboard | GREEN | src/app/leaderboard/page.tsx | No interactive handler detected by static scan. |
| /login | GREEN | src/app/login/page.tsx | Interactive handlers detected; action-level rows follow. |
| /messages/chat | GREEN | src/app/messages/chat/page.tsx | Interactive handlers detected; action-level rows follow. |
| /messages | RED | src/app/messages/page.tsx | No interactive handler detected by static scan. |
| /notifications | GREEN | src/app/notifications/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/baseline-assessment | GREEN | src/app/onboarding/baseline-assessment/page.tsx | No interactive handler detected by static scan. |
| /onboarding/checklist | GREEN | src/app/onboarding/checklist/page.tsx | No interactive handler detected by static scan. |
| /onboarding/complete | GREEN | src/app/onboarding/complete/page.tsx | No interactive handler detected by static scan. |
| /onboarding/document-upload | GREEN | src/app/onboarding/document-upload/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/education | GREEN | src/app/onboarding/education/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/experience | GREEN | src/app/onboarding/experience/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/hire-score | GREEN | src/app/onboarding/hire-score/page.tsx | No interactive handler detected by static scan. |
| /onboarding/matching | GREEN | src/app/onboarding/matching/page.tsx | No interactive handler detected by static scan. |
| /onboarding/mock-interview | GREEN | src/app/onboarding/mock-interview/page.tsx | No interactive handler detected by static scan. |
| /onboarding | GREEN | src/app/onboarding/page.tsx | No interactive handler detected by static scan. |
| /onboarding/personal-details | GREEN | src/app/onboarding/personal-details/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/preferences | GREEN | src/app/onboarding/preferences/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/readiness-report | GREEN | src/app/onboarding/readiness-report/page.tsx | No interactive handler detected by static scan. |
| /onboarding/resume-upload | GREEN | src/app/onboarding/resume-upload/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/reward | GREEN | src/app/onboarding/reward/page.tsx | No interactive handler detected by static scan. |
| /onboarding/role-select | GREEN | src/app/onboarding/role-select/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/skills | GREEN | src/app/onboarding/skills/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/video-resume | GREEN | src/app/onboarding/video-resume/page.tsx | Interactive handlers detected; action-level rows follow. |
| /onboarding/welcome | GREEN | src/app/onboarding/welcome/page.tsx | No interactive handler detected by static scan. |
| /otp | GREEN | src/app/otp/page.tsx | Interactive handlers detected; action-level rows follow. |
| /page | GREEN | src/app/page.tsx | No interactive handler detected by static scan. |
| /payment/status | GREEN | src/app/payment/status/page.tsx | Interactive handlers detected; action-level rows follow. |
| /payment/success | GREEN | src/app/payment/success/page.tsx | Interactive handlers detected; action-level rows follow. |
| /post-job-public | GREEN | src/app/post-job-public/page.tsx | No interactive handler detected by static scan. |
| /pricing | GREEN | src/app/pricing/page.tsx | No interactive handler detected by static scan. |
| /pricing/upgrade | RED | src/app/pricing/upgrade/page.tsx | No interactive handler detected by static scan. |
| /privacy | GREEN | src/app/privacy/page.tsx | No interactive handler detected by static scan. |
| /profile/certificates | RED | src/app/profile/certificates/page.tsx | No interactive handler detected by static scan. |
| /profile/completion | RED | src/app/profile/completion/page.tsx | No interactive handler detected by static scan. |
| /profile | GREEN | src/app/profile/page.tsx | Interactive handlers detected; action-level rows follow. |
| /profile/public | GREEN | src/app/profile/public/page.tsx | Interactive handlers detected; action-level rows follow. |
| /profile/resume/optimize | RED | src/app/profile/resume/optimize/page.tsx | No interactive handler detected by static scan. |
| /profile/resume | RED | src/app/profile/resume/page.tsx | Interactive handlers detected; action-level rows follow. |
| /profile/resume/templates | RED | src/app/profile/resume/templates/page.tsx | Interactive handlers detected; action-level rows follow. |
| /profile/skills-management | RED | src/app/profile/skills-management/page.tsx | No interactive handler detected by static scan. |
| /profile/video-resume | GREEN | src/app/profile/video-resume/page.tsx | No interactive handler detected by static scan. |
| /profile/wizard/details | RED | src/app/profile/wizard/details/page.tsx | No interactive handler detected by static scan. |
| /profile/wizard/resume | GREEN | src/app/profile/wizard/resume/page.tsx | No interactive handler detected by static scan. |
| /referrals/dashboard | GREEN | src/app/referrals/dashboard/page.tsx | Interactive handlers detected; action-level rows follow. |
| /referrals | GREEN | src/app/referrals/page.tsx | Interactive handlers detected; action-level rows follow. |
| /register/candidate | GREEN | src/app/register/candidate/page.tsx | No interactive handler detected by static scan. |
| /register/complete | RED | src/app/register/complete/page.tsx | No interactive handler detected by static scan. |
| /register/employer | GREEN | src/app/register/employer/page.tsx | No interactive handler detected by static scan. |
| /register | GREEN | src/app/register/page.tsx | Interactive handlers detected; action-level rows follow. |
| /reset-password | GREEN | src/app/reset-password/page.tsx | Interactive handlers detected; action-level rows follow. |
| /screens | GREEN | src/app/screens/page.tsx | No interactive handler detected by static scan. |
| /services | GREEN | src/app/services/page.tsx | No interactive handler detected by static scan. |
| /settings/ai-agents | GREEN | src/app/settings/ai-agents/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/analytics | GREEN | src/app/settings/analytics/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/audit-log | GREEN | src/app/settings/audit-log/page.tsx | No interactive handler detected by static scan. |
| /settings/domain | GREEN | src/app/settings/domain/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/hub | GREEN | src/app/settings/hub/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/integrations | GREEN | src/app/settings/integrations/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/llm-usage | GREEN | src/app/settings/llm-usage/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/managed-hiring | GREEN | src/app/settings/managed-hiring/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/notifications | RED | src/app/settings/notifications/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings | GREEN | src/app/settings/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/payment-gateway | GREEN | src/app/settings/payment-gateway/page.tsx | No interactive handler detected by static scan. |
| /settings/plan-management | GREEN | src/app/settings/plan-management/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/security | RED | src/app/settings/security/page.tsx | No interactive handler detected by static scan. |
| /settings/smtp | GREEN | src/app/settings/smtp/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/terms-privacy | GREEN | src/app/settings/terms-privacy/page.tsx | Interactive handlers detected; action-level rows follow. |
| /settings/whatsapp | GREEN | src/app/settings/whatsapp/page.tsx | No interactive handler detected by static scan. |
| /signin | GREEN | src/app/signin/page.tsx | No interactive handler detected by static scan. |
| /signup | GREEN | src/app/signup/page.tsx | No interactive handler detected by static scan. |
| /solutions | GREEN | src/app/solutions/page.tsx | No interactive handler detected by static scan. |
| /subscriptions | RED | src/app/subscriptions/page.tsx | No interactive handler detected by static scan. |
| /terms | GREEN | src/app/terms/page.tsx | No interactive handler detected by static scan. |
| /video-assessment/active | GREEN | src/app/video-assessment/active/page.tsx | Interactive handlers detected; action-level rows follow. |
| /video-assessment/complete | GREEN | src/app/video-assessment/complete/page.tsx | No interactive handler detected by static scan. |
| /video-assessment/setup | GREEN | src/app/video-assessment/setup/page.tsx | No interactive handler detected by static scan. |
| /video-resume | GREEN | src/app/video-resume/page.tsx | No interactive handler detected by static scan. |

## 3. COMPLETE USER-ACTION INVENTORY

967 handler records were discovered from `onClick`, `onSubmit`, `onChange`, `onKeyDown`, `onBlur`, and router navigation patterns. The exact file, line, action, nearby API association, persistence signal, and status are in the JSON/CSV inventory. A nearby API association is heuristic and must be confirmed during runtime testing.

## 4. COMPLETE API INVENTORY

| Method | Endpoint | Status | Detected DB | Static callers | Evidence |
| --- | --- | --- | --- | --- | --- |
| GET | /api/admin/analytics | GREEN | prisma.user, prisma.application, prisma.interview, prisma.companySubscription | 1 | src/app/api/admin/analytics/route.ts:6 — GET /api/admin/analytics |
| GET | /api/admin/audit-logs | GREEN |  | 1 | src/app/api/admin/audit-logs/route.ts:6 — GET /api/admin/audit-logs |
| POST | /api/admin/candidate-credits/grants | GREEN |  | 0 | src/app/api/admin/candidate-credits/grants/route.ts:22 — POST /api/admin/candidate-credits/grants |
| GET | /api/admin/candidate-services | GREEN | prisma.candidateServiceCatalog | 0 | src/app/api/admin/candidate-services/route.ts:21 — GET /api/admin/candidate-services |
| POST | /api/admin/candidate-services | GREEN | prisma.candidateServiceCatalog | 0 | src/app/api/admin/candidate-services/route.ts:32 — POST /api/admin/candidate-services |
| PUT | /api/admin/candidate-services/:id | GREEN |  | 0 | src/app/api/admin/candidate-services/[id]/route.ts:21 — PUT /api/admin/candidate-services/:id |
| GET | /api/admin/communications/deliveries | GREEN | prisma.communicationDelivery | 1 | src/app/api/admin/communications/deliveries/route.ts:7 — GET /api/admin/communications/deliveries |
| GET | /api/admin/communications/templates | GREEN | prisma.communicationTemplate | 1 | src/app/api/admin/communications/templates/route.ts:30 — GET /api/admin/communications/templates |
| POST | /api/admin/communications/templates | GREEN | prisma.communicationTemplate | 1 | src/app/api/admin/communications/templates/route.ts:39 — POST /api/admin/communications/templates |
| PATCH | /api/admin/communications/templates/:id | GREEN | prisma.communicationTemplate | 1 | src/app/api/admin/communications/templates/[id]/route.ts:22 — PATCH /api/admin/communications/templates/:id |
| POST | /api/admin/communications/test | GREEN |  | 0 | src/app/api/admin/communications/test/route.ts:19 — POST /api/admin/communications/test |
| GET | /api/admin/config | GREEN | prisma.adminConfiguration | 1 | src/app/api/admin/config/route.ts:63 — GET /api/admin/config |
| POST | /api/admin/config | GREEN | prisma.adminConfiguration | 1 | src/app/api/admin/config/route.ts:74 — POST /api/admin/config |
| GET | /api/admin/document-verification | GREEN | prisma.documentVerification, prisma.employerProfile | 2 | src/app/api/admin/document-verification/route.ts:60 — GET /api/admin/document-verification |
| POST | /api/admin/document-verification | GREEN | prisma.documentVerification, prisma.employerProfile | 2 | src/app/api/admin/document-verification/route.ts:141 — POST /api/admin/document-verification |
| POST | /api/admin/document-verification/:id | GREEN |  | 1 | src/app/api/admin/document-verification/[id]/route.ts:12 — POST /api/admin/document-verification/:id |
| GET | /api/admin/email-delivery/config | GREEN |  | 1 | src/app/api/admin/email-delivery/config/route.ts:41 — GET /api/admin/email-delivery/config |
| POST | /api/admin/email-delivery/config | GREEN |  | 1 | src/app/api/admin/email-delivery/config/route.ts:51 — POST /api/admin/email-delivery/config |
| POST | /api/admin/email-delivery/test | GREEN |  | 1 | src/app/api/admin/email-delivery/test/route.ts:13 — POST /api/admin/email-delivery/test |
| GET | /api/admin/employers | GREEN | prisma.employerProfile | 1 | src/app/api/admin/employers/route.ts:13 — GET /api/admin/employers |
| GET | /api/admin/invoices | GREEN | prisma.commercialAgreement | 2 | src/app/api/admin/invoices/route.ts:13 — GET /api/admin/invoices |
| POST | /api/admin/invoices | GREEN | prisma.commercialAgreement | 2 | src/app/api/admin/invoices/route.ts:32 — POST /api/admin/invoices |
| GET | /api/admin/jobs | GREEN | prisma.jobListing | 1 | src/app/api/admin/jobs/route.ts:13 — GET /api/admin/jobs |
| GET | /api/admin/llm-usage | GREEN |  | 1 | src/app/api/admin/llm-usage/route.ts:6 — GET /api/admin/llm-usage |
| GET | /api/admin/managed-hiring/config | GREEN | prisma.adminConfiguration | 2 | src/app/api/admin/managed-hiring/config/route.ts:297 — GET /api/admin/managed-hiring/config |
| POST | /api/admin/managed-hiring/config | GREEN | prisma.adminConfiguration | 2 | src/app/api/admin/managed-hiring/config/route.ts:351 — POST /api/admin/managed-hiring/config |
| GET | /api/admin/payment-gateway/config | GREEN |  | 1 | src/app/api/admin/payment-gateway/config/route.ts:23 — GET /api/admin/payment-gateway/config |
| POST | /api/admin/payment-gateway/config | GREEN |  | 1 | src/app/api/admin/payment-gateway/config/route.ts:32 — POST /api/admin/payment-gateway/config |
| POST | /api/admin/pricing/calculate | GREEN |  | 0 | src/app/api/admin/pricing/calculate/route.ts:18 — POST /api/admin/pricing/calculate |
| GET | /api/admin/readiness-templates | GREEN | prisma.mcqAssessment | 0 | src/app/api/admin/readiness-templates/route.ts:26 — GET /api/admin/readiness-templates |
| POST | /api/admin/readiness-templates | GREEN | prisma.mcqAssessment | 0 | src/app/api/admin/readiness-templates/route.ts:45 — POST /api/admin/readiness-templates |
| GET | /api/admin/recorded-assessment/questions | GREEN | prisma.recordedAssessmentQuestionBank | 2 | src/app/api/admin/recorded-assessment/questions/route.ts:21 — GET /api/admin/recorded-assessment/questions |
| POST | /api/admin/recorded-assessment/questions | GREEN | prisma.recordedAssessmentQuestionBank | 2 | src/app/api/admin/recorded-assessment/questions/route.ts:36 — POST /api/admin/recorded-assessment/questions |
| DELETE | /api/admin/recorded-assessment/questions/:id | GREEN | prisma.recordedAssessmentQuestionBank | 1 | src/app/api/admin/recorded-assessment/questions/[id]/route.ts:7 — DELETE /api/admin/recorded-assessment/questions/:id |
| GET | /api/admin/recorded-assessment/restrictions | GREEN | prisma.recordedAssessmentRestriction, prisma.recordedAssessmentAttempt | 1 | src/app/api/admin/recorded-assessment/restrictions/route.ts:16 — GET /api/admin/recorded-assessment/restrictions |
| POST | /api/admin/recorded-assessment/restrictions | GREEN | prisma.recordedAssessmentRestriction, prisma.recordedAssessmentAttempt | 1 | src/app/api/admin/recorded-assessment/restrictions/route.ts:33 — POST /api/admin/recorded-assessment/restrictions |
| POST | /api/admin/recorded-assessment/restrictions/:id | GREEN | prisma.recordedAssessmentRestriction | 1 | src/app/api/admin/recorded-assessment/restrictions/[id]/route.ts:22 — POST /api/admin/recorded-assessment/restrictions/:id |
| GET | /api/admin/referrals/analytics | GREEN | prisma.referralAttribution, prisma.referralReward, prisma.referralPayout | 1 | src/app/api/admin/referrals/analytics/route.ts:6 — GET /api/admin/referrals/analytics |
| GET | /api/admin/referrals/config | GREEN |  | 1 | src/app/api/admin/referrals/config/route.ts:23 — GET /api/admin/referrals/config |
| PUT | /api/admin/referrals/config | GREEN |  | 1 | src/app/api/admin/referrals/config/route.ts:47 — PUT /api/admin/referrals/config |
| GET | /api/admin/referrals/fraud | GREEN |  | 0 | src/app/api/admin/referrals/fraud/route.ts:10 — GET /api/admin/referrals/fraud |
| POST | /api/admin/referrals/fraud | GREEN |  | 0 | src/app/api/admin/referrals/fraud/route.ts:42 — POST /api/admin/referrals/fraud |
| GET | /api/admin/referrals/payouts | GREEN |  | 1 | src/app/api/admin/referrals/payouts/route.ts:18 — GET /api/admin/referrals/payouts |
| POST | /api/admin/referrals/payouts | GREEN |  | 1 | src/app/api/admin/referrals/payouts/route.ts:42 — POST /api/admin/referrals/payouts |
| GET | /api/admin/release/status | GREEN |  | 0 | src/app/api/admin/release/status/route.ts:5 — GET /api/admin/release/status |
| GET | /api/admin/revenue/audit-logs | YELLOW |  | 0 | src/app/api/admin/revenue/audit-logs/route.ts:6 — GET /api/admin/revenue/audit-logs |
| GET | /api/admin/revenue/export | GREEN |  | 0 | src/app/api/admin/revenue/export/route.ts:13 — GET /api/admin/revenue/export |
| GET | /api/admin/revenue/job-boost | YELLOW |  | 0 | src/app/api/admin/revenue/job-boost/route.ts:75 — GET /api/admin/revenue/job-boost |
| GET | /api/admin/revenue/managed-hiring | GREEN |  | 0 | src/app/api/admin/revenue/managed-hiring/route.ts:6 — GET /api/admin/revenue/managed-hiring |
| GET | /api/admin/revenue/mock-interviews | YELLOW |  | 0 | src/app/api/admin/revenue/mock-interviews/route.ts:90 — GET /api/admin/revenue/mock-interviews |
| GET | /api/admin/revenue/pph | GREEN |  | 0 | src/app/api/admin/revenue/pph/route.ts:6 — GET /api/admin/revenue/pph |
| GET | /api/admin/revenue/subscriptions | YELLOW |  | 0 | src/app/api/admin/revenue/subscriptions/route.ts:151 — GET /api/admin/revenue/subscriptions |
| GET | /api/admin/revenue/summary | GREEN |  | 0 | src/app/api/admin/revenue/summary/route.ts:6 — GET /api/admin/revenue/summary |
| GET | /api/admin/revenue/transactions | GREEN |  | 0 | src/app/api/admin/revenue/transactions/route.ts:6 — GET /api/admin/revenue/transactions |
| GET | /api/admin/security/status | GREEN |  | 1 | src/app/api/admin/security/status/route.ts:13 — GET /api/admin/security/status |
| POST | /api/admin/security/status | GREEN |  | 1 | src/app/api/admin/security/status/route.ts:57 — POST /api/admin/security/status |
| GET | /api/admin/subscription-plans | GREEN |  | 1 | src/app/api/admin/subscription-plans/route.ts:8 — GET /api/admin/subscription-plans |
| POST | /api/admin/subscription-plans | GREEN |  | 1 | src/app/api/admin/subscription-plans/route.ts:23 — POST /api/admin/subscription-plans |
| PUT | /api/admin/subscription-plans | GREEN |  | 1 | src/app/api/admin/subscription-plans/route.ts:41 — PUT /api/admin/subscription-plans |
| DELETE | /api/admin/subscription-plans | GREEN |  | 1 | src/app/api/admin/subscription-plans/route.ts:62 — DELETE /api/admin/subscription-plans |
| GET | /api/admin/subscriptions/settings | GREEN |  | 1 | src/app/api/admin/subscriptions/settings/route.ts:27 — GET /api/admin/subscriptions/settings |
| POST | /api/admin/subscriptions/settings | GREEN |  | 1 | src/app/api/admin/subscriptions/settings/route.ts:36 — POST /api/admin/subscriptions/settings |
| PUT | /api/admin/subscriptions/settings | GREEN |  | 1 | src/app/api/admin/subscriptions/settings/route.ts:52 — PUT /api/admin/subscriptions/settings |
| DELETE | /api/admin/subscriptions/settings | GREEN |  | 1 | src/app/api/admin/subscriptions/settings/route.ts:63 — DELETE /api/admin/subscriptions/settings |
| GET | /api/admin/system/queues | GREEN | prisma.outboxEntry, prisma.securityAuditOutboxEvent, prisma.whatsAppInboundEvent, prisma.videoAnalysisJob | 1 | src/app/api/admin/system/queues/route.ts:34 — GET /api/admin/system/queues |
| GET | /api/admin/system-health | GREEN |  | 2 | src/app/api/admin/system-health/route.ts:6 — GET /api/admin/system-health |
| POST | /api/admin/tests/run | GREEN |  | 0 | src/app/api/admin/tests/run/route.ts:6 — POST /api/admin/tests/run |
| GET | /api/admin/typing-prompts | GREEN | prisma.typingPracticePrompt | 0 | src/app/api/admin/typing-prompts/route.ts:20 — GET /api/admin/typing-prompts |
| POST | /api/admin/typing-prompts | GREEN | prisma.typingPracticePrompt | 0 | src/app/api/admin/typing-prompts/route.ts:31 — POST /api/admin/typing-prompts |
| PUT | /api/admin/typing-prompts/:id | GREEN |  | 0 | src/app/api/admin/typing-prompts/[id]/route.ts:21 — PUT /api/admin/typing-prompts/:id |
| POST | /api/admin/uploads/purge-infected | GREEN |  | 0 | src/app/api/admin/uploads/purge-infected/route.ts:13 — POST /api/admin/uploads/purge-infected |
| POST | /api/admin/uploads/rescan | GREEN |  | 0 | src/app/api/admin/uploads/rescan/route.ts:10 — POST /api/admin/uploads/rescan |
| GET | /api/admin/users | GREEN | prisma.user | 2 | src/app/api/admin/users/route.ts:13 — GET /api/admin/users |
| POST | /api/agents/dispatch | GREEN | prisma.employerProfile | 1 | src/app/api/agents/dispatch/route.ts:45 — POST /api/agents/dispatch |
| GET | /api/agreements/contracts | GREEN | prisma.company, prisma.hiringRequirement | 6 | src/app/api/agreements/contracts/route.ts:8 — GET /api/agreements/contracts |
| POST | /api/agreements/contracts | GREEN | prisma.company, prisma.hiringRequirement | 6 | src/app/api/agreements/contracts/route.ts:40 — POST /api/agreements/contracts |
| GET | /api/agreements/contracts/:id | GREEN |  | 2 | src/app/api/agreements/contracts/[id]/route.ts:38 — GET /api/agreements/contracts/:id |
| PUT | /api/agreements/contracts/:id | GREEN |  | 2 | src/app/api/agreements/contracts/[id]/route.ts:69 — PUT /api/agreements/contracts/:id |
| POST | /api/agreements/contracts/:id | GREEN |  | 2 | src/app/api/agreements/contracts/[id]/route.ts:101 — POST /api/agreements/contracts/:id |
| GET | /api/agreements/requirements | GREEN | prisma.company | 6 | src/app/api/agreements/requirements/route.ts:8 — GET /api/agreements/requirements |
| POST | /api/agreements/requirements | GREEN | prisma.company | 6 | src/app/api/agreements/requirements/route.ts:29 — POST /api/agreements/requirements |
| GET | /api/agreements/requirements/:id | GREEN |  | 1 | src/app/api/agreements/requirements/[id]/route.ts:6 — GET /api/agreements/requirements/:id |
| PATCH | /api/agreements/requirements/:id | GREEN |  | 1 | src/app/api/agreements/requirements/[id]/route.ts:27 — PATCH /api/agreements/requirements/:id |
| GET | /api/agreements/templates | GREEN |  | 4 | src/app/api/agreements/templates/route.ts:6 — GET /api/agreements/templates |
| POST | /api/agreements/templates | GREEN |  | 4 | src/app/api/agreements/templates/route.ts:18 — POST /api/agreements/templates |
| GET | /api/agreements/templates/:id | GREEN |  | 1 | src/app/api/agreements/templates/[id]/route.ts:6 — GET /api/agreements/templates/:id |
| PUT | /api/agreements/templates/:id | GREEN |  | 1 | src/app/api/agreements/templates/[id]/route.ts:23 — PUT /api/agreements/templates/:id |
| POST | /api/agreements/templates/:id | GREEN |  | 1 | src/app/api/agreements/templates/[id]/route.ts:47 — POST /api/agreements/templates/:id |
| DELETE | /api/agreements/templates/:id | GREEN |  | 1 | src/app/api/agreements/templates/[id]/route.ts:74 — DELETE /api/agreements/templates/:id |
| GET | /api/applications | GREEN | prisma.candidateProfile, prisma.application, prisma.jobListing, prisma.candidateReadiness, prisma.user, prisma.company | 7 | src/app/api/applications/route.ts:16 — GET /api/applications |
| POST | /api/applications | GREEN | prisma.candidateProfile, prisma.application, prisma.jobListing, prisma.candidateReadiness, prisma.user, prisma.company | 7 | src/app/api/applications/route.ts:48 — POST /api/applications |
| PATCH | /api/applications | GREEN | prisma.candidateProfile, prisma.application, prisma.jobListing, prisma.candidateReadiness, prisma.user, prisma.company | 7 | src/app/api/applications/route.ts:133 — PATCH /api/applications |
| GET | /api/assessment/mcq/assigned | GREEN | prisma.candidateProfile, prisma.application, prisma.mcqAttempt | 1 | src/app/api/assessment/mcq/assigned/route.ts:15 — GET /api/assessment/mcq/assigned |
| POST | /api/assessment/mcq/start | GREEN | prisma.candidateProfile, prisma.mcqAssessment, prisma.application, prisma.candidateReadiness, prisma.mcqAttempt | 1 | src/app/api/assessment/mcq/start/route.ts:12 — POST /api/assessment/mcq/start |
| POST | /api/assessment/mcq/submit | GREEN | prisma.candidateProfile, prisma.mcqAttempt, prisma.candidateReadiness | 1 | src/app/api/assessment/mcq/submit/route.ts:18 — POST /api/assessment/mcq/submit |
| POST | /api/assessment/mock-interview/finish | GREEN | prisma.mockInterviewSession, prisma.candidateProfile | 1 | src/app/api/assessment/mock-interview/finish/route.ts:12 — POST /api/assessment/mock-interview/finish |
| GET | /api/assessment/mock-interview/session | GREEN | prisma.candidateProfile, prisma.mockInterviewSession | 3 | src/app/api/assessment/mock-interview/session/route.ts:11 — GET /api/assessment/mock-interview/session |
| POST | /api/assessment/mock-interview/start | GREEN | prisma.candidateProfile, prisma.mockInterviewSession | 1 | src/app/api/assessment/mock-interview/start/route.ts:13 — POST /api/assessment/mock-interview/start |
| POST | /api/assessment/mock-interview/turn | GREEN | prisma.mockInterviewSession, prisma.candidateProfile | 1 | src/app/api/assessment/mock-interview/turn/route.ts:51 — POST /api/assessment/mock-interview/turn |
| GET | /api/assessment/typing/prompt | GREEN | prisma.typingPracticePrompt | 1 | src/app/api/assessment/typing/prompt/route.ts:6 — GET /api/assessment/typing/prompt |
| POST | /api/assessment/typing/submit | GREEN | prisma.typingPracticePrompt, prisma.candidateProfile, prisma.typingAssessment | 1 | src/app/api/assessment/typing/submit/route.ts:16 — POST /api/assessment/typing/submit |
| GET | /api/assessment/typing/:id | GREEN | prisma.typingAssessment | 2 | src/app/api/assessment/typing/[id]/route.ts:6 — GET /api/assessment/typing/:id |
| POST | /api/auth/employer-register | GREEN | prisma.user | 1 | src/app/api/auth/employer-register/route.ts:16 — POST /api/auth/employer-register |
| POST | /api/auth/forgot-password | GREEN | db.findUserByEmail | 2 | src/app/api/auth/forgot-password/route.ts:11 — POST /api/auth/forgot-password |
| POST | /api/auth/login | GREEN | db.findUserByEmail | 3 | src/app/api/auth/login/route.ts:19 — POST /api/auth/login |
| POST | /api/auth/logout | GREEN |  | 1 | src/app/api/auth/logout/route.ts:6 — POST /api/auth/logout |
| GET | /api/auth/me | YELLOW |  | 1 | src/app/api/auth/me/route.ts:4 — GET /api/auth/me |
| POST | /api/auth/register | GREEN | prisma.candidateProfile, db.findUserByEmail, db.createUser | 1 | src/app/api/auth/register/route.ts:17 — POST /api/auth/register |
| POST | /api/auth/reset-password | GREEN | db.findUserByEmail | 1 | src/app/api/auth/reset-password/route.ts:15 — POST /api/auth/reset-password |
| POST | /api/auth/send-verification-otp | GREEN | db.findUserByEmail | 1 | src/app/api/auth/send-verification-otp/route.ts:9 — POST /api/auth/send-verification-otp |
| POST | /api/auth/verify-otp | GREEN | prisma.user, db.findUserByEmail | 3 | src/app/api/auth/verify-otp/route.ts:15 — POST /api/auth/verify-otp |
| GET | /api/candidate/availability | GREEN | prisma.candidateProfile | 1 | src/app/api/candidate/availability/route.ts:21 — GET /api/candidate/availability |
| PUT | /api/candidate/availability | GREEN | prisma.candidateProfile | 1 | src/app/api/candidate/availability/route.ts:29 — PUT /api/candidate/availability |
| GET | /api/candidate/credits | GREEN | prisma.candidateProfile, prisma.candidateCreditWallet, prisma.candidateCreditLedger, prisma.candidateServiceCatalog | 1 | src/app/api/candidate/credits/route.ts:14 — GET /api/candidate/credits |
| GET | /api/candidate/profile | GREEN | prisma.candidateProfile | 11 | src/app/api/candidate/profile/route.ts:36 — GET /api/candidate/profile |
| PUT | /api/candidate/profile | GREEN | prisma.candidateProfile | 11 | src/app/api/candidate/profile/route.ts:51 — PUT /api/candidate/profile |
| GET | /api/candidate/readiness | GREEN | prisma.candidateProfile, prisma.mcqAssessment, prisma.candidateReadiness | 1 | src/app/api/candidate/readiness/route.ts:20 — GET /api/candidate/readiness |
| POST | /api/candidate/readiness | GREEN | prisma.candidateProfile, prisma.mcqAssessment, prisma.candidateReadiness | 1 | src/app/api/candidate/readiness/route.ts:41 — POST /api/candidate/readiness |
| GET | /api/candidate/recommended-jobs | GREEN | prisma.candidateProfile, prisma.jobListing | 0 | src/app/api/candidate/recommended-jobs/route.ts:7 — GET /api/candidate/recommended-jobs |
| POST | /api/candidate/recorded-assessment/attempts | GREEN |  | 1 | src/app/api/candidate/recorded-assessment/attempts/route.ts:9 — POST /api/candidate/recorded-assessment/attempts |
| POST | /api/candidate/recorded-assessment/attempts/:id/complete | GREEN | prisma.recordedAssessmentAttempt | 0 | src/app/api/candidate/recorded-assessment/attempts/[id]/complete/route.ts:6 — POST /api/candidate/recorded-assessment/attempts/:id/complete |
| POST | /api/candidate/recorded-assessment/attempts/:id/proctoring | GREEN |  | 0 | src/app/api/candidate/recorded-assessment/attempts/[id]/proctoring/route.ts:22 — POST /api/candidate/recorded-assessment/attempts/:id/proctoring |
| POST | /api/candidate/recorded-assessment/attempts/:id/responses | GREEN | prisma.recordedAssessmentAttempt, prisma.storedFile, prisma.recordedAssessmentResponse | 0 | src/app/api/candidate/recorded-assessment/attempts/[id]/responses/route.ts:15 — POST /api/candidate/recorded-assessment/attempts/:id/responses |
| GET | /api/candidate/recorded-assessment/attempts/:id | GREEN | prisma.recordedAssessmentAttempt | 1 | src/app/api/candidate/recorded-assessment/attempts/[id]/route.ts:6 — GET /api/candidate/recorded-assessment/attempts/:id |
| POST | /api/candidate/recorded-assessment/attempts/:id/start | GREEN | prisma.recordedAssessmentAttempt | 0 | src/app/api/candidate/recorded-assessment/attempts/[id]/start/route.ts:11 — POST /api/candidate/recorded-assessment/attempts/:id/start |
| GET | /api/candidate/recorded-assessment/restrictions | GREEN | prisma.recordedAssessmentRestriction | 1 | src/app/api/candidate/recorded-assessment/restrictions/route.ts:10 — GET /api/candidate/recorded-assessment/restrictions |
| POST | /api/candidate/recorded-assessment/restrictions | GREEN | prisma.recordedAssessmentRestriction | 1 | src/app/api/candidate/recorded-assessment/restrictions/route.ts:26 — POST /api/candidate/recorded-assessment/restrictions |
| GET | /api/candidate/saved-jobs | GREEN | prisma.savedJob, prisma.jobListing | 3 | src/app/api/candidate/saved-jobs/route.ts:14 — GET /api/candidate/saved-jobs |
| POST | /api/candidate/saved-jobs | GREEN | prisma.savedJob, prisma.jobListing | 3 | src/app/api/candidate/saved-jobs/route.ts:23 — POST /api/candidate/saved-jobs |
| DELETE | /api/candidate/saved-jobs | GREEN | prisma.savedJob, prisma.jobListing | 3 | src/app/api/candidate/saved-jobs/route.ts:35 — DELETE /api/candidate/saved-jobs |
| POST | /api/candidate/services/:serviceKey/request | GREEN | prisma.candidateProfile | 0 | src/app/api/candidate/services/[serviceKey]/request/route.ts:18 — POST /api/candidate/services/:serviceKey/request |
| GET | /api/candidate/sourcing-invitations | GREEN | prisma.candidateProfile, prisma.candidateSourcingRelationship | 1 | src/app/api/candidate/sourcing-invitations/route.ts:6 — GET /api/candidate/sourcing-invitations |
| POST | /api/candidate/sourcing-invitations/:id/decision | GREEN |  | 0 | src/app/api/candidate/sourcing-invitations/[id]/decision/route.ts:10 — POST /api/candidate/sourcing-invitations/:id/decision |
| GET | /api/candidate/video-resume | GREEN | prisma.candidateProfile, prisma.storedFile, prisma.videoResume, prisma.videoAnalysisJob | 1 | src/app/api/candidate/video-resume/route.ts:18 — GET /api/candidate/video-resume |
| POST | /api/candidate/video-resume | GREEN | prisma.candidateProfile, prisma.storedFile, prisma.videoResume, prisma.videoAnalysisJob | 1 | src/app/api/candidate/video-resume/route.ts:46 — POST /api/candidate/video-resume |
| GET | /api/candidate/video-resume/status | GREEN | prisma.videoResume, prisma.employerProfile, prisma.application | 1 | src/app/api/candidate/video-resume/status/route.ts:5 — GET /api/candidate/video-resume/status |
| GET | /api/cron/recorded-assessment-analysis | GREEN | prisma.recordedAssessmentAnalysisJob, prisma.recordedAssessmentResponse | 0 | src/app/api/cron/recorded-assessment-analysis/route.ts:69 — GET /api/cron/recorded-assessment-analysis |
| POST | /api/cron/recorded-assessment-analysis | GREEN | prisma.recordedAssessmentAnalysisJob, prisma.recordedAssessmentResponse | 0 | src/app/api/cron/recorded-assessment-analysis/route.ts:70 — POST /api/cron/recorded-assessment-analysis |
| GET | /api/cron/referrals-reconciliation | GREEN |  | 0 | src/app/api/cron/referrals-reconciliation/route.ts:111 — GET /api/cron/referrals-reconciliation |
| POST | /api/cron/referrals-reconciliation | GREEN |  | 0 | src/app/api/cron/referrals-reconciliation/route.ts:115 — POST /api/cron/referrals-reconciliation |
| POST | /api/employer/assessments | GREEN | prisma.jobListing, prisma.mcqAssessment | 1 | src/app/api/employer/assessments/route.ts:17 — POST /api/employer/assessments |
| GET | /api/employer/assessments | GREEN | prisma.jobListing, prisma.mcqAssessment | 1 | src/app/api/employer/assessments/route.ts:70 — GET /api/employer/assessments |
| POST | /api/employer/assessments/:id/questions/reorder | GREEN | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | 0 | src/app/api/employer/assessments/[id]/questions/reorder/route.ts:15 — POST /api/employer/assessments/:id/questions/reorder |
| POST | /api/employer/assessments/:id/questions | GREEN | prisma.mcqAssessment, prisma.mcqAttempt, prisma.mcqQuestion | 0 | src/app/api/employer/assessments/[id]/questions/route.ts:28 — POST /api/employer/assessments/:id/questions |
| GET | /api/employer/assessments/:id/questions | GREEN | prisma.mcqAssessment, prisma.mcqAttempt, prisma.mcqQuestion | 0 | src/app/api/employer/assessments/[id]/questions/route.ts:109 — GET /api/employer/assessments/:id/questions |
| PUT | /api/employer/assessments/:id/questions/:questionId | GREEN | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | 0 | src/app/api/employer/assessments/[id]/questions/[questionId]/route.ts:28 — PUT /api/employer/assessments/:id/questions/:questionId |
| DELETE | /api/employer/assessments/:id/questions/:questionId | GREEN | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | 0 | src/app/api/employer/assessments/[id]/questions/[questionId]/route.ts:116 — DELETE /api/employer/assessments/:id/questions/:questionId |
| PUT | /api/employer/assessments/:id | GREEN | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | 1 | src/app/api/employer/assessments/[id]/route.ts:17 — PUT /api/employer/assessments/:id |
| DELETE | /api/employer/assessments/:id | GREEN | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | 1 | src/app/api/employer/assessments/[id]/route.ts:78 — DELETE /api/employer/assessments/:id |
| GET | /api/employer/billing/invoices | GREEN | prisma.commercialAgreement, prisma.invoice | 1 | src/app/api/employer/billing/invoices/route.ts:7 — GET /api/employer/billing/invoices |
| POST | /api/employer/billing/invoices/:id/pay | GREEN | prisma.invoice, prisma.commercialAgreement | 0 | src/app/api/employer/billing/invoices/[id]/pay/route.ts:8 — POST /api/employer/billing/invoices/:id/pay |
| POST | /api/employer/billing/invoices/:id/receipt | GREEN | prisma.invoice, prisma.commercialAgreement, prisma.storedFile, prisma.company | 0 | src/app/api/employer/billing/invoices/[id]/receipt/route.ts:19 — POST /api/employer/billing/invoices/:id/receipt |
| GET | /api/employer/candidate-collections | GREEN | prisma.employerCandidateCollection, prisma.application | 0 | src/app/api/employer/candidate-collections/route.ts:10 — GET /api/employer/candidate-collections |
| POST | /api/employer/candidate-collections | GREEN | prisma.employerCandidateCollection, prisma.application | 0 | src/app/api/employer/candidate-collections/route.ts:11 — POST /api/employer/candidate-collections |
| PATCH | /api/employer/candidate-collections | GREEN | prisma.employerCandidateCollection, prisma.application | 0 | src/app/api/employer/candidate-collections/route.ts:12 — PATCH /api/employer/candidate-collections |
| GET | /api/employer/candidates | GREEN | prisma.application | 1 | src/app/api/employer/candidates/route.ts:10 — GET /api/employer/candidates |
| GET | /api/employer/candidates/:id/notes | GREEN | prisma.application, prisma.employerCandidateNote | 0 | src/app/api/employer/candidates/[id]/notes/route.ts:10 — GET /api/employer/candidates/:id/notes |
| POST | /api/employer/candidates/:id/notes | GREEN | prisma.application, prisma.employerCandidateNote | 0 | src/app/api/employer/candidates/[id]/notes/route.ts:11 — POST /api/employer/candidates/:id/notes |
| GET | /api/employer/candidates/:id | GREEN | prisma.candidateProfile | 1 | src/app/api/employer/candidates/[id]/route.ts:7 — GET /api/employer/candidates/:id |
| PATCH | /api/employer/candidates/:id/stage | GREEN | prisma.application, prisma.employerProfile, prisma.jobInterviewProcess, prisma.interviewRound, prisma.interviewRoundProgress | 0 | src/app/api/employer/candidates/[id]/stage/route.ts:7 — PATCH /api/employer/candidates/:id/stage |
| GET | /api/employer/candidates/:id/tags | GREEN | prisma.application, prisma.employerCandidateTag | 0 | src/app/api/employer/candidates/[id]/tags/route.ts:9 — GET /api/employer/candidates/:id/tags |
| POST | /api/employer/candidates/:id/tags | GREEN | prisma.application, prisma.employerCandidateTag | 0 | src/app/api/employer/candidates/[id]/tags/route.ts:10 — POST /api/employer/candidates/:id/tags |
| DELETE | /api/employer/candidates/:id/tags | GREEN | prisma.application, prisma.employerCandidateTag | 0 | src/app/api/employer/candidates/[id]/tags/route.ts:11 — DELETE /api/employer/candidates/:id/tags |
| GET | /api/employer/company | GREEN | prisma.employerProfile, prisma.company | 1 | src/app/api/employer/company/route.ts:19 — GET /api/employer/company |
| PUT | /api/employer/company | GREEN | prisma.employerProfile, prisma.company | 1 | src/app/api/employer/company/route.ts:33 — PUT /api/employer/company |
| GET | /api/employer/dashboard | GREEN | prisma.jobListing, prisma.application, prisma.companyCredits, prisma.interview | 0 | src/app/api/employer/dashboard/route.ts:6 — GET /api/employer/dashboard |
| GET | /api/employer/hiring-pipeline/readiness | GREEN | prisma.employerProfile, prisma.application | 0 | src/app/api/employer/hiring-pipeline/readiness/route.ts:10 — GET /api/employer/hiring-pipeline/readiness |
| GET | /api/employer/interviews/pending-feedback | GREEN | prisma.interviewRoundProgress | 1 | src/app/api/employer/interviews/pending-feedback/route.ts:7 — GET /api/employer/interviews/pending-feedback |
| GET | /api/employer/interviews | GREEN | prisma.employerProfile, prisma.interview | 5 | src/app/api/employer/interviews/route.ts:15 — GET /api/employer/interviews |
| POST | /api/employer/interviews/schedule | GREEN | prisma.interviewRoundProgress, prisma.application, prisma.employerProfile, prisma.interviewRound, prisma.notification | 1 | src/app/api/employer/interviews/schedule/route.ts:21 — POST /api/employer/interviews/schedule |
| GET | /api/employer/interviews/:id/calendar | YELLOW | prisma.interview, prisma.employerProfile | 0 | src/app/api/employer/interviews/[id]/calendar/route.ts:5 — GET /api/employer/interviews/:id/calendar |
| GET | /api/employer/interviews/:id/feedback | GREEN | prisma.interview, prisma.interviewFeedback | 0 | src/app/api/employer/interviews/[id]/feedback/route.ts:33 — GET /api/employer/interviews/:id/feedback |
| POST | /api/employer/interviews/:id/feedback | GREEN | prisma.interview, prisma.interviewFeedback | 0 | src/app/api/employer/interviews/[id]/feedback/route.ts:48 — POST /api/employer/interviews/:id/feedback |
| POST | /api/employer/interviews/:id/round-decision | GREEN | prisma.interview, prisma.interviewRound, prisma.interviewRoundInterviewer, prisma.workflowInstance, prisma.workflowApproval | 0 | src/app/api/employer/interviews/[id]/round-decision/route.ts:15 — POST /api/employer/interviews/:id/round-decision |
| GET | /api/employer/interviews/:id | GREEN | prisma.interview, prisma.employerProfile | 5 | src/app/api/employer/interviews/[id]/route.ts:33 — GET /api/employer/interviews/:id |
| PATCH | /api/employer/interviews/:id | GREEN | prisma.interview, prisma.employerProfile | 5 | src/app/api/employer/interviews/[id]/route.ts:66 — PATCH /api/employer/interviews/:id |
| GET | /api/employer/jobs | GREEN | prisma.jobListing, prisma.employerProfile, prisma.idempotencyRecord | 8 | src/app/api/employer/jobs/route.ts:30 — GET /api/employer/jobs |
| POST | /api/employer/jobs | GREEN | prisma.jobListing, prisma.employerProfile, prisma.idempotencyRecord | 8 | src/app/api/employer/jobs/route.ts:54 — POST /api/employer/jobs |
| GET | /api/employer/jobs/:id/interview-process | GREEN | prisma.jobListing, prisma.jobInterviewProcess, prisma.employerProfile | 0 | src/app/api/employer/jobs/[id]/interview-process/route.ts:35 — GET /api/employer/jobs/:id/interview-process |
| PUT | /api/employer/jobs/:id/interview-process | GREEN | prisma.jobListing, prisma.jobInterviewProcess, prisma.employerProfile | 0 | src/app/api/employer/jobs/[id]/interview-process/route.ts:60 — PUT /api/employer/jobs/:id/interview-process |
| POST | /api/employer/jobs/:id/match | GREEN | prisma.jobListing | 0 | src/app/api/employer/jobs/[id]/match/route.ts:8 — POST /api/employer/jobs/:id/match |
| GET | /api/employer/jobs/:id/recorded-assessment/attempts | GREEN | prisma.recordedAssessmentAttempt | 0 | src/app/api/employer/jobs/[id]/recorded-assessment/attempts/route.ts:7 — GET /api/employer/jobs/:id/recorded-assessment/attempts |
| GET | /api/employer/jobs/:id/recorded-assessment | GREEN | prisma.recordedAssessmentConfig | 0 | src/app/api/employer/jobs/[id]/recorded-assessment/route.ts:16 — GET /api/employer/jobs/:id/recorded-assessment |
| PUT | /api/employer/jobs/:id/recorded-assessment | GREEN | prisma.recordedAssessmentConfig | 0 | src/app/api/employer/jobs/[id]/recorded-assessment/route.ts:27 — PUT /api/employer/jobs/:id/recorded-assessment |
| GET | /api/employer/jobs/:id | GREEN | prisma.jobListing, prisma.employerProfile | 5 | src/app/api/employer/jobs/[id]/route.ts:18 — GET /api/employer/jobs/:id |
| PUT | /api/employer/jobs/:id | GREEN | prisma.jobListing, prisma.employerProfile | 5 | src/app/api/employer/jobs/[id]/route.ts:46 — PUT /api/employer/jobs/:id |
| DELETE | /api/employer/jobs/:id | GREEN | prisma.jobListing, prisma.employerProfile | 5 | src/app/api/employer/jobs/[id]/route.ts:119 — DELETE /api/employer/jobs/:id |
| POST | /api/employer/jobs/:id/source-candidates/action | GREEN | prisma.jobListing, prisma.candidateProfile | 0 | src/app/api/employer/jobs/[id]/source-candidates/action/route.ts:9 — POST /api/employer/jobs/:id/source-candidates/action |
| GET | /api/employer/jobs/:id/source-candidates | GREEN | prisma.jobListing, prisma.candidateProfile | 0 | src/app/api/employer/jobs/[id]/source-candidates/route.ts:8 — GET /api/employer/jobs/:id/source-candidates |
| POST | /api/employer/managed-hiring/join | GREEN | prisma.employerProfile, prisma.application, prisma.pphPlacement | 1 | src/app/api/employer/managed-hiring/join/route.ts:18 — POST /api/employer/managed-hiring/join |
| GET | /api/employer/managed-hiring/join | GREEN | prisma.employerProfile, prisma.application, prisma.pphPlacement | 1 | src/app/api/employer/managed-hiring/join/route.ts:46 — GET /api/employer/managed-hiring/join |
| PATCH | /api/employer/managed-hiring/join | GREEN | prisma.employerProfile, prisma.application, prisma.pphPlacement | 1 | src/app/api/employer/managed-hiring/join/route.ts:62 — PATCH /api/employer/managed-hiring/join |
| GET | /api/employer/promo/validate | GREEN |  | 1 | src/app/api/employer/promo/validate/route.ts:6 — GET /api/employer/promo/validate |
| GET | /api/employer/recorded-assessment/responses/:responseId/media | GREEN | prisma.recordedAssessmentResponse, prisma.employerProfile | 0 | src/app/api/employer/recorded-assessment/responses/[responseId]/media/route.ts:13 — GET /api/employer/recorded-assessment/responses/:responseId/media |
| GET | /api/employer/source-tracking | GREEN | prisma.application, prisma.referralAttribution | 1 | src/app/api/employer/source-tracking/route.ts:6 — GET /api/employer/source-tracking |
| GET | /api/employer/subscribe | GREEN |  | 4 | src/app/api/employer/subscribe/route.ts:11 — GET /api/employer/subscribe |
| POST | /api/employer/subscribe | GREEN |  | 4 | src/app/api/employer/subscribe/route.ts:93 — POST /api/employer/subscribe |
| POST | /api/employer/team/accept | GREEN | prisma.companyInvitation | 1 | src/app/api/employer/team/accept/route.ts:15 — POST /api/employer/team/accept |
| GET | /api/employer/team | GREEN | prisma.employerProfile, prisma.companyInvitation, prisma.company | 2 | src/app/api/employer/team/route.ts:24 — GET /api/employer/team |
| POST | /api/employer/team | GREEN | prisma.employerProfile, prisma.companyInvitation, prisma.company | 2 | src/app/api/employer/team/route.ts:98 — POST /api/employer/team |
| DELETE | /api/employer/team | GREEN | prisma.employerProfile, prisma.companyInvitation, prisma.company | 2 | src/app/api/employer/team/route.ts:241 — DELETE /api/employer/team |
| GET | /api/files/:id | GREEN | prisma.employerProfile, prisma.videoResume, prisma.storedFile | 0 | src/app/api/files/[id]/route.ts:34 — GET /api/files/:id |
| GET | /api/health | GREEN |  | 0 | src/app/api/health/route.ts:20 — GET /api/health |
| POST | /api/internal/recorded-assessment-analysis/callback | GREEN | prisma.recordedAssessmentAnalysisJob | 0 | src/app/api/internal/recorded-assessment-analysis/callback/route.ts:14 — POST /api/internal/recorded-assessment-analysis/callback |
| POST | /api/internal/security-audit/process | GREEN |  | 0 | src/app/api/internal/security-audit/process/route.ts:8 — POST /api/internal/security-audit/process |
| POST | /api/internal/video-analysis/callback | GREEN | prisma.videoAnalysisJob | 0 | src/app/api/internal/video-analysis/callback/route.ts:35 — POST /api/internal/video-analysis/callback |
| POST | /api/internal/whatsapp/process | GREEN |  | 0 | src/app/api/internal/whatsapp/process/route.ts:41 — POST /api/internal/whatsapp/process |
| POST | /api/internal/workflows/recover | GREEN |  | 0 | src/app/api/internal/workflows/recover/route.ts:10 — POST /api/internal/workflows/recover |
| GET | /api/internal/workflows/recover | GREEN |  | 0 | src/app/api/internal/workflows/recover/route.ts:28 — GET /api/internal/workflows/recover |
| GET | /api/interviews/room | GREEN | prisma.interview, prisma.employerProfile, prisma.interviewSignal, prisma.interviewRoundProgress | 1 | src/app/api/interviews/room/route.ts:66 — GET /api/interviews/room |
| POST | /api/interviews/room | GREEN | prisma.interview, prisma.employerProfile, prisma.interviewSignal, prisma.interviewRoundProgress | 1 | src/app/api/interviews/room/route.ts:112 — POST /api/interviews/room |
| GET | /api/jobs/search | GREEN | prisma.jobListing | 1 | src/app/api/jobs/search/route.ts:5 — GET /api/jobs/search |
| GET | /api/jobs/:id | GREEN | prisma.jobListing | 3 | src/app/api/jobs/[id]/route.ts:5 — GET /api/jobs/:id |
| GET | /api/notifications | GREEN | prisma.notification | 1 | src/app/api/notifications/route.ts:10 — GET /api/notifications |
| PUT | /api/notifications | GREEN | prisma.notification | 1 | src/app/api/notifications/route.ts:23 — PUT /api/notifications |
| POST | /api/payments/checkout | GREEN | prisma.employerProfile, prisma.paymentOrder, prisma.subscriptionPlan | 1 | src/app/api/payments/checkout/route.ts:165 — POST /api/payments/checkout |
| GET | /api/payments/status | GREEN | prisma.paymentOrder, prisma.paymentTransaction, prisma.companySubscription, prisma.companyCredits | 1 | src/app/api/payments/status/route.ts:13 — GET /api/payments/status |
| POST | /api/payments/webhook | GREEN | prisma.paymentOrder, prisma.paymentTransaction, prisma.subscriptionPlan | 0 | src/app/api/payments/webhook/route.ts:8 — POST /api/payments/webhook |
| GET | /api/proctoring/telemetry | GREEN | prisma.interview, prisma.employerProfile, prisma.proctoringTelemetry, prisma.auditLog | 0 | src/app/api/proctoring/telemetry/route.ts:95 — GET /api/proctoring/telemetry |
| POST | /api/proctoring/telemetry | GREEN | prisma.interview, prisma.employerProfile, prisma.proctoringTelemetry, prisma.auditLog | 0 | src/app/api/proctoring/telemetry/route.ts:143 — POST /api/proctoring/telemetry |
| POST | /api/referrals/payout | GREEN |  | 2 | src/app/api/referrals/payout/route.ts:15 — POST /api/referrals/payout |
| GET | /api/referrals | GREEN |  | 4 | src/app/api/referrals/route.ts:7 — GET /api/referrals |
| POST | /api/referrals | GREEN |  | 4 | src/app/api/referrals/route.ts:48 — POST /api/referrals |
| GET | /api/referrals/validate | GREEN |  | 1 | src/app/api/referrals/validate/route.ts:5 — GET /api/referrals/validate |
| GET | /api/skill-master | GREEN | prisma.customSkillRequest | 1 | src/app/api/skill-master/route.ts:8 — GET /api/skill-master |
| POST | /api/skill-master | GREEN | prisma.customSkillRequest | 1 | src/app/api/skill-master/route.ts:20 — POST /api/skill-master |
| POST | /api/upload | GREEN | prisma.employerProfile | 5 | src/app/api/upload/route.ts:32 — POST /api/upload |
| GET | /api/whatsapp/auth/handoff | GREEN |  | 0 | src/app/api/whatsapp/auth/handoff/route.ts:28 — GET /api/whatsapp/auth/handoff |
| POST | /api/whatsapp/onboard | YELLOW |  | 0 | src/app/api/whatsapp/onboard/route.ts:13 — POST /api/whatsapp/onboard |
| GET | /api/whatsapp/onboard | YELLOW |  | 0 | src/app/api/whatsapp/onboard/route.ts:24 — GET /api/whatsapp/onboard |
| GET | /api/whatsapp/webhook | GREEN | prisma.communicationDelivery | 0 | src/app/api/whatsapp/webhook/route.ts:48 — GET /api/whatsapp/webhook |
| POST | /api/whatsapp/webhook | GREEN | prisma.communicationDelivery | 0 | src/app/api/whatsapp/webhook/route.ts:70 — POST /api/whatsapp/webhook |

## 5. SCREEN → API MATRIX

| Screen | Method | API | Status | Evidence |
| --- | --- | --- | --- | --- |
| /admin/agreements/builder | GET | /api/agreements/requirements | GREEN | src/app/admin/agreements/builder/page.tsx:31 — frontend call GET /api/agreements/requirements |
| /admin/agreements/builder | GET | /api/agreements/templates | GREEN | src/app/admin/agreements/builder/page.tsx:32 — frontend call GET /api/agreements/templates |
| /admin/agreements/builder | POST | /api/agreements/contracts | GREEN | src/app/admin/agreements/builder/page.tsx:86 — frontend call POST /api/agreements/contracts |
| /admin/agreements/templates | POST | /api/agreements/templates | GREEN | src/app/admin/agreements/templates/page.tsx:15 — frontend call POST /api/agreements/templates |
| /admin/agreements/templates | POST | /api/agreements/templates | GREEN | src/app/admin/agreements/templates/page.tsx:29 — frontend call POST /api/agreements/templates |
| /admin/communications | GET | /api/admin/communications/templates | GREEN | src/app/admin/communications/page.tsx:14 — frontend call GET /api/admin/communications/templates |
| /admin/communications | GET | /api/admin/communications/deliveries?${q} | GREEN | src/app/admin/communications/page.tsx:14 — frontend call GET /api/admin/communications/deliveries?${q} |
| /admin/communications | PATCH | /api/admin/communications/templates/${t.id} | GREEN | src/app/admin/communications/page.tsx:18 — frontend call PATCH /api/admin/communications/templates/${t.id} |
| /admin/communications | POST | /api/admin/communications/templates | GREEN | src/app/admin/communications/page.tsx:19 — frontend call POST /api/admin/communications/templates |
| /admin/document-verification | GET | /api/admin/document-verification?status=${filter} | GREEN | src/app/admin/document-verification/page.tsx:25 — frontend call GET /api/admin/document-verification?status=${filter} |
| /admin/document-verification | POST | /api/admin/document-verification/${id} | GREEN | src/app/admin/document-verification/page.tsx:43 — frontend call POST /api/admin/document-verification/${id} |
| /admin/employers | GET | /api/admin/employers?search=${encodeURIComponent(search)} | GREEN | src/app/admin/employers/page.tsx:16 — frontend call GET /api/admin/employers?search=${encodeURIComponent(search)} |
| /admin/invoices | POST | /api/admin/invoices | GREEN | src/app/admin/invoices/page.tsx:23 — frontend call POST /api/admin/invoices |
| /admin/invoices | GET | /api/admin/invoices | GREEN | src/app/admin/invoices/page.tsx:40 — frontend call GET /api/admin/invoices |
| /admin/invoices | POST | /api/admin/invoices | GREEN | src/app/admin/invoices/page.tsx:58 — frontend call POST /api/admin/invoices |
| /admin/invoices | POST | /api/admin/invoices | GREEN | src/app/admin/invoices/page.tsx:75 — frontend call POST /api/admin/invoices |
| /admin/jobs | GET | /api/admin/jobs?search=${encodeURIComponent(search)} | GREEN | src/app/admin/jobs/page.tsx:16 — frontend call GET /api/admin/jobs?search=${encodeURIComponent(search)} |
| /admin/login | POST | /api/auth/login | GREEN | src/app/admin/login/page.tsx:25 — frontend call POST /api/auth/login |
| /admin/managed-hiring/agreements/builder | GET | /api/agreements/templates | GREEN | src/app/admin/managed-hiring/agreements/builder/page.tsx:34 — frontend call GET /api/agreements/templates |
| /admin/managed-hiring/agreements/builder | GET | /api/agreements/requirements/${reqId} | GREEN | src/app/admin/managed-hiring/agreements/builder/page.tsx:35 — frontend call GET /api/agreements/requirements/${reqId} |
| /admin/managed-hiring/agreements/builder | POST | /api/agreements/contracts | GREEN | src/app/admin/managed-hiring/agreements/builder/page.tsx:100 — frontend call POST /api/agreements/contracts |
| /admin/managed-hiring/agreements/builder | POST | /api/agreements/contracts/${data.agreement.id} | GREEN | src/app/admin/managed-hiring/agreements/builder/page.tsx:110 — frontend call POST /api/agreements/contracts/${data.agreement.id} |
| /admin/managed-hiring/agreements/builder | PATCH | /api/agreements/requirements/${reqId} | GREEN | src/app/admin/managed-hiring/agreements/builder/page.tsx:118 — frontend call PATCH /api/agreements/requirements/${reqId} |
| /admin/managed-hiring/operations | GET | /api/admin/managed-hiring/config | GREEN | src/app/admin/managed-hiring/operations/page.tsx:24 — frontend call GET /api/admin/managed-hiring/config |
| /admin/managed-hiring/operations | GET | /api/admin/invoices | GREEN | src/app/admin/managed-hiring/operations/page.tsx:25 — frontend call GET /api/admin/invoices |
| /admin/managed-hiring/pipeline | GET | /api/agreements/requirements | GREEN | src/app/admin/managed-hiring/pipeline/page.tsx:13 — frontend call GET /api/agreements/requirements |
| /admin/managed-hiring/requests | GET | /api/agreements/requirements | GREEN | src/app/admin/managed-hiring/requests/page.tsx:14 — frontend call GET /api/agreements/requirements |
| /admin/managed-hiring/templates | POST | /api/agreements/templates | GREEN | src/app/admin/managed-hiring/templates/page.tsx:17 — frontend call POST /api/agreements/templates |
| /admin/managed-hiring/templates | POST | /api/agreements/templates/${id} | GREEN | src/app/admin/managed-hiring/templates/page.tsx:31 — frontend call POST /api/agreements/templates/${id} |
| /admin/managed-hiring/templates | DELETE | /api/agreements/templates/${id} | GREEN | src/app/admin/managed-hiring/templates/page.tsx:50 — frontend call DELETE /api/agreements/templates/${id} |
| /admin/payment-gateways | GET | /api/admin/payment-gateway/config | GREEN | src/app/admin/payment-gateways/page.tsx:31 — frontend call GET /api/admin/payment-gateway/config |
| /admin/payment-gateways | POST | /api/admin/payment-gateway/config | GREEN | src/app/admin/payment-gateways/page.tsx:50 — frontend call POST /api/admin/payment-gateway/config |
| /admin/recorded-assessment/questions | GET | /api/admin/recorded-assessment/questions?roleTitle=${encodeURIComponent(roleTitle)} | GREEN | src/app/admin/recorded-assessment/questions/page.tsx:48 — frontend call GET /api/admin/recorded-assessment/questions?roleTitle=${encodeURIComponent(roleTitle)} |
| /admin/recorded-assessment/questions | POST | /api/admin/recorded-assessment/questions | GREEN | src/app/admin/recorded-assessment/questions/page.tsx:64 — frontend call POST /api/admin/recorded-assessment/questions |
| /admin/recorded-assessment/questions | DELETE | /api/admin/recorded-assessment/questions/${id} | GREEN | src/app/admin/recorded-assessment/questions/page.tsx:90 — frontend call DELETE /api/admin/recorded-assessment/questions/${id} |
| /admin/recorded-assessment/restrictions | GET | /api/admin/recorded-assessment/restrictions?status=${status} | GREEN | src/app/admin/recorded-assessment/restrictions/page.tsx:39 — frontend call GET /api/admin/recorded-assessment/restrictions?status=${status} |
| /admin/recorded-assessment/restrictions | POST | /api/admin/recorded-assessment/restrictions/${id} | GREEN | src/app/admin/recorded-assessment/restrictions/page.tsx:58 — frontend call POST /api/admin/recorded-assessment/restrictions/${id} |
| /admin/referrals | GET | /api/admin/referrals/config | GREEN | src/app/admin/referrals/page.tsx:23 — frontend call GET /api/admin/referrals/config |
| /admin/referrals | GET | /api/admin/referrals/payouts | GREEN | src/app/admin/referrals/page.tsx:24 — frontend call GET /api/admin/referrals/payouts |
| /admin/referrals | GET | /api/admin/referrals/analytics | GREEN | src/app/admin/referrals/page.tsx:25 — frontend call GET /api/admin/referrals/analytics |
| /admin/referrals | PUT | /api/admin/referrals/config | GREEN | src/app/admin/referrals/page.tsx:40 — frontend call PUT /api/admin/referrals/config |
| /admin/referrals | POST | /api/admin/referrals/payouts | GREEN | src/app/admin/referrals/page.tsx:58 — frontend call POST /api/admin/referrals/payouts |
| /admin/referrals | POST | /api/admin/referrals/payouts | GREEN | src/app/admin/referrals/page.tsx:87 — frontend call POST /api/admin/referrals/payouts |
| /admin/referrals | POST | /api/admin/referrals/payouts | GREEN | src/app/admin/referrals/page.tsx:112 — frontend call POST /api/admin/referrals/payouts |
| /admin/settings/audit-log | GET | /api/admin/audit-logs | GREEN | src/app/admin/settings/audit-log/page.tsx:14 — frontend call GET /api/admin/audit-logs |
| /admin/settings/llm-usage | GET | /api/admin/llm-usage | GREEN | src/app/admin/settings/llm-usage/page.tsx:17 — frontend call GET /api/admin/llm-usage |
| /admin/settings/llm-usage | POST | /api/agents/dispatch | GREEN | src/app/admin/settings/llm-usage/page.tsx:36 — frontend call POST /api/agents/dispatch |
| /admin/settings/managed-hiring | GET | /api/admin/config | GREEN | src/app/admin/settings/managed-hiring/page.tsx:27 — frontend call GET /api/admin/config |
| /admin/settings/managed-hiring | POST | /api/admin/config | GREEN | src/app/admin/settings/managed-hiring/page.tsx:53 — frontend call POST /api/admin/config |
| /admin/settings/security | GET | /api/admin/security/status | GREEN | src/app/admin/settings/security/page.tsx:27 — frontend call GET /api/admin/security/status |
| /admin/signups | GET | /api/admin/users?search=${encodeURIComponent(search)}&limit=100 | GREEN | src/app/admin/signups/page.tsx:16 — frontend call GET /api/admin/users?search=${encodeURIComponent(search)}&limit=100 |
| /admin/subscriptions | GET | /api/admin/subscription-plans?includeArchived=true | GREEN | src/app/admin/subscriptions/page.tsx:42 — frontend call GET /api/admin/subscription-plans?includeArchived=true |
| /admin/subscriptions | GET | /api/admin/subscriptions/settings | GREEN | src/app/admin/subscriptions/page.tsx:45 — frontend call GET /api/admin/subscriptions/settings |
| /admin/subscriptions | POST | /api/admin/subscriptions/settings | GREEN | src/app/admin/subscriptions/page.tsx:114 — frontend call POST /api/admin/subscriptions/settings |
| /admin/subscriptions | PUT | /api/admin/subscriptions/settings | GREEN | src/app/admin/subscriptions/page.tsx:149 — frontend call PUT /api/admin/subscriptions/settings |
| /admin/subscriptions | DELETE | /api/admin/subscription-plans?id=${id} | GREEN | src/app/admin/subscriptions/page.tsx:176 — frontend call DELETE /api/admin/subscription-plans?id=${id} |
| /admin/subscriptions | DELETE | /api/admin/subscriptions/settings?code=${code} | GREEN | src/app/admin/subscriptions/page.tsx:193 — frontend call DELETE /api/admin/subscriptions/settings?code=${code} |
| /admin/system/infrastructure | GET | /api/admin/system-health | GREEN | src/app/admin/system/infrastructure/page.tsx:12 — frontend call GET /api/admin/system-health |
| /admin/system/queue-broker | GET | /api/admin/system/queues | GREEN | src/app/admin/system/queue-broker/page.tsx:17 — frontend call GET /api/admin/system/queues |
| /admin/system-health | GET | /api/admin/system-health | GREEN | src/app/admin/system-health/page.tsx:16 — frontend call GET /api/admin/system-health |
| /admin/users | GET | /api/admin/users?search=${encodeURIComponent(search)} | GREEN | src/app/admin/users/page.tsx:16 — frontend call GET /api/admin/users?search=${encodeURIComponent(search)} |
| /ai/mock-interview/active | GET | /api/assessment/mock-interview/session?id=${sessionId} | GREEN | src/app/ai/mock-interview/active/page.tsx:39 — frontend call GET /api/assessment/mock-interview/session?id=${sessionId} |
| /ai/mock-interview/active | POST | /api/assessment/mock-interview/turn | GREEN | src/app/ai/mock-interview/active/page.tsx:99 — frontend call POST /api/assessment/mock-interview/turn |
| /ai/mock-interview/active | POST | /api/assessment/mock-interview/finish | GREEN | src/app/ai/mock-interview/active/page.tsx:143 — frontend call POST /api/assessment/mock-interview/finish |
| /ai/mock-interview/setup | GET | /api/assessment/mock-interview/session | GREEN | src/app/ai/mock-interview/setup/page.tsx:22 — frontend call GET /api/assessment/mock-interview/session |
| /ai/mock-interview/setup | POST | /api/assessment/mock-interview/start | GREEN | src/app/ai/mock-interview/setup/page.tsx:50 — frontend call POST /api/assessment/mock-interview/start |
| /ai/mock-interview/summary | GET | /api/assessment/mock-interview/session?id=${sessionId} | GREEN | src/app/ai/mock-interview/summary/page.tsx:26 — frontend call GET /api/assessment/mock-interview/session?id=${sessionId} |
| /applications | GET | /api/applications | GREEN | src/app/applications/page.tsx:15 — frontend call GET /api/applications |
| /applications/timeline | GET | /api/applications | GREEN | src/app/applications/timeline/page.tsx:28 — frontend call GET /api/applications |
| /assessment/mcq/active | POST | /api/assessment/mcq/start | GREEN | src/app/assessment/mcq/active/page.tsx:76 — frontend call POST /api/assessment/mcq/start |
| /assessment/mcq/active | POST | /api/assessment/mcq/submit | GREEN | src/app/assessment/mcq/active/page.tsx:133 — frontend call POST /api/assessment/mcq/submit |
| /assessment/mcq | GET | /api/assessment/mcq/assigned | GREEN | src/app/assessment/mcq/page.tsx:23 — frontend call GET /api/assessment/mcq/assigned |
| /assessment/readiness | GET | /api/candidate/readiness | GREEN | src/app/assessment/readiness/page.tsx:34 — frontend call GET /api/candidate/readiness |
| /assessment/readiness | POST | /api/candidate/readiness | GREEN | src/app/assessment/readiness/page.tsx:52 — frontend call POST /api/candidate/readiness |
| /assessment/typing/active | GET | /api/assessment/typing/prompt | GREEN | src/app/assessment/typing/active/page.tsx:26 — frontend call GET /api/assessment/typing/prompt |
| /assessment/typing/active | POST | /api/assessment/typing/submit | GREEN | src/app/assessment/typing/active/page.tsx:54 — frontend call POST /api/assessment/typing/submit |
| /assessment/typing/results | GET | /api/assessment/typing/${encodeURIComponent(resultId)} | GREEN | src/app/assessment/typing/results/page.tsx:28 — frontend call GET /api/assessment/typing/${encodeURIComponent(resultId)} |
| /candidate/assessment-restrictions | GET | /api/candidate/recorded-assessment/restrictions | GREEN | src/app/candidate/assessment-restrictions/page.tsx:33 — frontend call GET /api/candidate/recorded-assessment/restrictions |
| /candidate/assessment-restrictions | POST | /api/candidate/recorded-assessment/restrictions | GREEN | src/app/candidate/assessment-restrictions/page.tsx:50 — frontend call POST /api/candidate/recorded-assessment/restrictions |
| /credits | GET | /api/candidate/credits | GREEN | src/app/credits/page.tsx:16 — frontend call GET /api/candidate/credits |
| /credits | POST | /api/candidate/services/${encodeURIComponent(service.serviceKey)}/request | GREEN | src/app/credits/page.tsx:32 — frontend call POST /api/candidate/services/${encodeURIComponent(service.serviceKey)}/request |
| /dashboard | POST | /api/auth/logout | GREEN | src/app/dashboard/page.tsx:24 — frontend call POST /api/auth/logout |
| /dashboard | GET | /api/candidate/profile | GREEN | src/app/dashboard/page.tsx:33 — frontend call GET /api/candidate/profile |
| /dashboard | GET | /api/candidate/availability | GREEN | src/app/dashboard/page.tsx:45 — frontend call GET /api/candidate/availability |
| /dashboard | PUT | /api/applications | GREEN | src/app/dashboard/page.tsx:50 — frontend call PUT /api/applications |
| /dashboard | PUT | /api/candidate/availability | GREEN | src/app/dashboard/page.tsx:63 — frontend call PUT /api/candidate/availability |
| /employer/active-video-interview-interviewer-view | GET | /api/interviews/room?roomId=${encodeURIComponent(requestedRoomId)} | GREEN | src/app/employer/active-video-interview-interviewer-view/page.tsx:25 — frontend call GET /api/interviews/room?roomId=${encodeURIComponent(requestedRoomId)} |
| /employer/active-video-interview-interviewer-view | GET | /api/employer/interviews/${encodeURIComponent(id)} | GREEN | src/app/employer/active-video-interview-interviewer-view/page.tsx:32 — frontend call GET /api/employer/interviews/${encodeURIComponent(id)} |
| /employer/active-video-interview-interviewer-view | GET | /api/employer/interviews/${searchParams.get( | GREEN | src/app/employer/active-video-interview-interviewer-view/page.tsx:43 — frontend call GET /api/employer/interviews/${searchParams.get( |
| /employer/assessments/builder | GET | /api/employer/assessments | GREEN | src/app/employer/assessments/builder/page.tsx:75 — frontend call GET /api/employer/assessments |
| /employer/assessments/builder | GET | /api/employer/jobs | GREEN | src/app/employer/assessments/builder/page.tsx:76 — frontend call GET /api/employer/jobs |
| /employer/assessments/builder | GET | /api/employer/assessments/${assessmentId}/questions | GREEN | src/app/employer/assessments/builder/page.tsx:97 — frontend call GET /api/employer/assessments/${assessmentId}/questions |
| /employer/assessments/builder | POST | /api/employer/assessments | GREEN | src/app/employer/assessments/builder/page.tsx:119 — frontend call POST /api/employer/assessments |
| /employer/assessments/builder | PUT | /api/employer/assessments/${selectedAssessment.id} | GREEN | src/app/employer/assessments/builder/page.tsx:142 — frontend call PUT /api/employer/assessments/${selectedAssessment.id} |
| /employer/assessments/builder | DELETE | /api/employer/assessments/${selectedAssessment.id}/questions/${questionId} | GREEN | src/app/employer/assessments/builder/page.tsx:265 — frontend call DELETE /api/employer/assessments/${selectedAssessment.id}/questions/${questionId} |
| /employer/assessments/builder | POST | /api/employer/assessments/${selectedAssessment.id}/questions/reorder | GREEN | src/app/employer/assessments/builder/page.tsx:330 — frontend call POST /api/employer/assessments/${selectedAssessment.id}/questions/reorder |
| /employer/assessments/recorded/configure | GET | /api/employer/jobs/${jobId}/recorded-assessment | GREEN | src/app/employer/assessments/recorded/configure/page.tsx:12 — frontend call GET /api/employer/jobs/${jobId}/recorded-assessment |
| /employer/assessments/recorded/configure | GET | /api/admin/recorded-assessment/questions?roleTitle=${encodeURIComponent(job.title)} | GREEN | src/app/employer/assessments/recorded/configure/page.tsx:13 — frontend call GET /api/admin/recorded-assessment/questions?roleTitle=${encodeURIComponent(job.title)} |
| /employer/assessments/recorded/configure | PUT | /api/employer/jobs/${jobId}/recorded-assessment | GREEN | src/app/employer/assessments/recorded/configure/page.tsx:15 — frontend call PUT /api/employer/jobs/${jobId}/recorded-assessment |
| /employer/assessments/recorded | GET | /api/employer/jobs/${jobId}/recorded-assessment/attempts | GREEN | src/app/employer/assessments/recorded/page.tsx:25 — frontend call GET /api/employer/jobs/${jobId}/recorded-assessment/attempts |
| /employer/company-profile-editor | GET | /api/employer/company | GREEN | src/app/employer/company-profile-editor/page.tsx:22 — frontend call GET /api/employer/company |
| /employer/company-profile-editor | PUT | /api/employer/company | GREEN | src/app/employer/company-profile-editor/page.tsx:40 — frontend call PUT /api/employer/company |
| /employer/create-job-basic-info | GET | /api/employer/subscribe | GREEN | src/app/employer/create-job-basic-info/page.tsx:313 — frontend call GET /api/employer/subscribe |
| /employer/create-job-matching-config | POST | /api/employer/jobs | GREEN | src/app/employer/create-job-matching-config/page.tsx:27 — frontend call POST /api/employer/jobs |
| /employer/create-job-review-and-publish | POST | /api/employer/jobs | GREEN | src/app/employer/create-job-review-and-publish/page.tsx:22 — frontend call POST /api/employer/jobs |
| /employer/employer-registration-company-info | GET | /api/referrals/validate?code=${encodeURIComponent(code)} | GREEN | src/app/employer/employer-registration-company-info/page.tsx:30 — frontend call GET /api/referrals/validate?code=${encodeURIComponent(code)} |
| /employer/employer-registration-company-info | POST | /api/auth/employer-register | GREEN | src/app/employer/employer-registration-company-info/page.tsx:176 — frontend call POST /api/auth/employer-register |
| /employer/employer-registration-document-verification | POST | /api/upload | GREEN | src/app/employer/employer-registration-document-verification/page.tsx:79 — frontend call POST /api/upload |
| /employer/employer-registration-document-verification | POST | /api/admin/document-verification | GREEN | src/app/employer/employer-registration-document-verification/page.tsx:96 — frontend call POST /api/admin/document-verification |
| /employer/employer-registration-otp-verification | POST | /api/auth/verify-otp | GREEN | src/app/employer/employer-registration-otp-verification/page.tsx:155 — frontend call POST /api/auth/verify-otp |
| /employer/employer-registration-plan-selection | GET | /api/employer/subscribe | GREEN | src/app/employer/employer-registration-plan-selection/page.tsx:28 — frontend call GET /api/employer/subscribe |
| /employer/employer-registration-plan-selection | POST | /api/employer/subscribe | GREEN | src/app/employer/employer-registration-plan-selection/page.tsx:45 — frontend call POST /api/employer/subscribe |
| /employer/employer-sign-in | POST | /api/auth/login | GREEN | src/app/employer/employer-sign-in/page.tsx:48 — frontend call POST /api/auth/login |
| /employer/employer-subscription-and-plans | GET | /api/agreements/contracts | GREEN | src/app/employer/employer-subscription-and-plans/page.tsx:14 — frontend call GET /api/agreements/contracts |
| /employer/final-round-feedback | GET | /api/employer/interviews/${encodeURIComponent(interviewId)}/feedback | GREEN | src/app/employer/final-round-feedback/page.tsx:30 — frontend call GET /api/employer/interviews/${encodeURIComponent(interviewId)}/feedback |
| /employer/final-round-feedback | POST | /api/employer/interviews/${encodeURIComponent(interviewId)}/feedback | GREEN | src/app/employer/final-round-feedback/page.tsx:51 — frontend call POST /api/employer/interviews/${encodeURIComponent(interviewId)}/feedback |
| /employer/final-round-feedback | POST | /api/employer/interviews/${encodeURIComponent(interviewId)}/round-decision | GREEN | src/app/employer/final-round-feedback/page.tsx:61 — frontend call POST /api/employer/interviews/${encodeURIComponent(interviewId)}/round-decision |
| /employer/interview-reschedule-employer-view | PATCH | /api/employer/interviews/${encodeURIComponent(interviewId)} | GREEN | src/app/employer/interview-reschedule-employer-view/page.tsx:22 — frontend call PATCH /api/employer/interviews/${encodeURIComponent(interviewId)} |
| /employer/interview-round-builder | GET | /api/employer/jobs/${encodeURIComponent(jobId)}/interview-process | GREEN | src/app/employer/interview-round-builder/page.tsx:31 — frontend call GET /api/employer/jobs/${encodeURIComponent(jobId)}/interview-process |
| /employer/interview-round-builder | PUT | /api/employer/jobs/${encodeURIComponent(jobId)}/interview-process | GREEN | src/app/employer/interview-round-builder/page.tsx:57 — frontend call PUT /api/employer/jobs/${encodeURIComponent(jobId)}/interview-process |
| /employer/interview-scheduler | POST | /api/employer/interviews/schedule | GREEN | src/app/employer/interview-scheduler/page.tsx:39 — frontend call POST /api/employer/interviews/schedule |
| /employer/invitation/accept | POST | /api/employer/team/accept | GREEN | src/app/employer/invitation/accept/page.tsx:51 — frontend call POST /api/employer/team/accept |
| /employer/job-listings-management | GET | /api/employer/jobs | GREEN | src/app/employer/job-listings-management/page.tsx:100 — frontend call GET /api/employer/jobs |
| /employer/job-listings-management | PUT | /api/employer/jobs/${encodeURIComponent(id)} | GREEN | src/app/employer/job-listings-management/page.tsx:305 — frontend call PUT /api/employer/jobs/${encodeURIComponent(id)} |
| /employer/job-listings-management | DELETE | /api/employer/jobs/${encodeURIComponent(id)} | GREEN | src/app/employer/job-listings-management/page.tsx:339 — frontend call DELETE /api/employer/jobs/${encodeURIComponent(id)} |
| /employer/job-listings-management | PUT | /api/employer/jobs/${id} | GREEN | src/app/employer/job-listings-management/page.tsx:366 — frontend call PUT /api/employer/jobs/${id} |
| /employer/job-listings-management | DELETE | /api/employer/jobs/${id} | GREEN | src/app/employer/job-listings-management/page.tsx:387 — frontend call DELETE /api/employer/jobs/${id} |
| /employer/job-listings-management | GET | /api/employer/jobs | GREEN | src/app/employer/job-listings-management/page.tsx:430 — frontend call GET /api/employer/jobs |
| /employer/managed-hiring/agreements/:id | GET | /api/agreements/contracts/${agreementId} | GREEN | src/app/employer/managed-hiring/agreements/[id]/page.tsx:26 — frontend call GET /api/agreements/contracts/${agreementId} |
| /employer/managed-hiring/agreements/:id | POST | /api/agreements/contracts/${agreementId} | GREEN | src/app/employer/managed-hiring/agreements/[id]/page.tsx:48 — frontend call POST /api/agreements/contracts/${agreementId} |
| /employer/managed-hiring/agreements/:id | POST | /api/agreements/contracts/${agreementId} | GREEN | src/app/employer/managed-hiring/agreements/[id]/page.tsx:74 — frontend call POST /api/agreements/contracts/${agreementId} |
| /employer/managed-hiring/candidate-tracking | PATCH | /api/employer/candidates/${encodeURIComponent(applicationId)}/stage | GREEN | src/app/employer/managed-hiring/candidate-tracking/page.tsx:38 — frontend call PATCH /api/employer/candidates/${encodeURIComponent(applicationId)}/stage |
| /employer/managed-hiring/join | GET | /api/employer/managed-hiring/join | GREEN | src/app/employer/managed-hiring/join/page.tsx:17 — frontend call GET /api/employer/managed-hiring/join |
| /employer/managed-hiring/join | GET | /api/agreements/contracts?status=ACTIVE | GREEN | src/app/employer/managed-hiring/join/page.tsx:25 — frontend call GET /api/agreements/contracts?status=ACTIVE |
| /employer/managed-hiring/join | POST | /api/employer/managed-hiring/join | GREEN | src/app/employer/managed-hiring/join/page.tsx:34 — frontend call POST /api/employer/managed-hiring/join |
| /employer/managed-hiring/join | PATCH | /api/employer/managed-hiring/join | GREEN | src/app/employer/managed-hiring/join/page.tsx:48 — frontend call PATCH /api/employer/managed-hiring/join |
| /employer/managed-hiring | GET | /api/agreements/requirements | GREEN | src/app/employer/managed-hiring/page.tsx:69 — frontend call GET /api/agreements/requirements |
| /employer/managed-hiring | GET | /api/agreements/contracts | GREEN | src/app/employer/managed-hiring/page.tsx:70 — frontend call GET /api/agreements/contracts |
| /employer/managed-hiring/request | POST | /api/agreements/requirements | GREEN | src/app/employer/managed-hiring/request/page.tsx:194 — frontend call POST /api/agreements/requirements |
| /employer/proactive-candidate-search | GET | /api/employer/jobs/${jobId}/source-candidates | GREEN | src/app/employer/proactive-candidate-search/page.tsx:26 — frontend call GET /api/employer/jobs/${jobId}/source-candidates |
| /employer/proactive-candidate-search | POST | /api/employer/jobs/${jobId}/source-candidates/action | GREEN | src/app/employer/proactive-candidate-search/page.tsx:31 — frontend call POST /api/employer/jobs/${jobId}/source-candidates/action |
| /employer/referral-and-source-tracking | GET | /api/employer/source-tracking?days=${period} | GREEN | src/app/employer/referral-and-source-tracking/page.tsx:49 — frontend call GET /api/employer/source-tracking?days=${period} |
| /employer/referrals | GET | /api/referrals | GREEN | src/app/employer/referrals/page.tsx:83 — frontend call GET /api/referrals |
| /employer/referrals | POST | /api/referrals/payout | GREEN | src/app/employer/referrals/page.tsx:134 — frontend call POST /api/referrals/payout |
| /employer/referrals | GET | /api/referrals | GREEN | src/app/employer/referrals/page.tsx:152 — frontend call GET /api/referrals |
| /employer/referrals | POST | /api/referrals | GREEN | src/app/employer/referrals/page.tsx:171 — frontend call POST /api/referrals |
| /employer/revenue-and-billing-management | POST | /api/employer/billing/invoices/${invoiceId}/pay | GREEN | src/app/employer/revenue-and-billing-management/page.tsx:41 — frontend call POST /api/employer/billing/invoices/${invoiceId}/pay |
| /employer/revenue-and-billing-management | GET | /api/employer/billing/invoices | GREEN | src/app/employer/revenue-and-billing-management/page.tsx:52 — frontend call GET /api/employer/billing/invoices |
| /employer/revenue-and-billing-management | POST | /api/employer/billing/invoices/${invoiceId}/receipt | GREEN | src/app/employer/revenue-and-billing-management/page.tsx:76 — frontend call POST /api/employer/billing/invoices/${invoiceId}/receipt |
| /employer/revenue-and-billing-management | GET | /api/employer/billing/invoices | GREEN | src/app/employer/revenue-and-billing-management/page.tsx:93 — frontend call GET /api/employer/billing/invoices |
| /employer/revenue-and-billing-management | GET | /api/employer/billing/invoices | GREEN | src/app/employer/revenue-and-billing-management/page.tsx:107 — frontend call GET /api/employer/billing/invoices |
| /employer/subscriptions | GET | /api/employer/subscribe | GREEN | src/app/employer/subscriptions/page.tsx:39 — frontend call GET /api/employer/subscribe |
| /employer/subscriptions | GET | /api/employer/promo/validate?code=${couponCode.toUpperCase()}&planId=${checkoutPlan.id} | GREEN | src/app/employer/subscriptions/page.tsx:74 — frontend call GET /api/employer/promo/validate?code=${couponCode.toUpperCase()}&planId=${checkoutPlan.id} |
| /employer/subscriptions | POST | /api/payments/checkout | GREEN | src/app/employer/subscriptions/page.tsx:96 — frontend call POST /api/payments/checkout |
| /employer/subscriptions | POST | /api/employer/subscribe | GREEN | src/app/employer/subscriptions/page.tsx:155 — frontend call POST /api/employer/subscribe |
| /employer/team-members-management | GET | /api/auth/me | GREEN | src/app/employer/team-members-management/page.tsx:45 — frontend call GET /api/auth/me |
| /employer/team-members-management | GET | /api/employer/team | GREEN | src/app/employer/team-members-management/page.tsx:57 — frontend call GET /api/employer/team |
| /employer/team-members-management | POST | /api/employer/team | GREEN | src/app/employer/team-members-management/page.tsx:108 — frontend call POST /api/employer/team |
| /employer/team-members-management | DELETE | /api/employer/team?id=${encodeURIComponent(id)} | GREEN | src/app/employer/team-members-management/page.tsx:146 — frontend call DELETE /api/employer/team?id=${encodeURIComponent(id)} |
| /employer/team-members-management | DELETE | /api/employer/team?id=${encodeURIComponent(id)} | GREEN | src/app/employer/team-members-management/page.tsx:168 — frontend call DELETE /api/employer/team?id=${encodeURIComponent(id)} |
| /employer/upcoming-interviews-list | GET | /api/employer/interviews/pending-feedback | GREEN | src/app/employer/upcoming-interviews-list/page.tsx:26 — frontend call GET /api/employer/interviews/pending-feedback |
| /employer/upcoming-interviews-list | GET | /api/employer/interviews | GREEN | src/app/employer/upcoming-interviews-list/page.tsx:27 — frontend call GET /api/employer/interviews |
| /forgot-password/otp | POST | /api/auth/verify-otp | GREEN | src/app/forgot-password/otp/page.tsx:57 — frontend call POST /api/auth/verify-otp |
| /forgot-password/otp | POST | /api/auth/forgot-password | GREEN | src/app/forgot-password/otp/page.tsx:89 — frontend call POST /api/auth/forgot-password |
| /forgot-password | POST | /api/auth/forgot-password | GREEN | src/app/forgot-password/page.tsx:22 — frontend call POST /api/auth/forgot-password |
| /interviews | GET | /api/interviews | GREEN | src/app/interviews/page.tsx:14 — frontend call GET /api/interviews |
| /jobs | GET | /api/jobs/search?q=${encodeURIComponent(query)} | GREEN | src/app/jobs/page.tsx:33 — frontend call GET /api/jobs/search?q=${encodeURIComponent(query)} |
| /jobs | GET | /api/candidate/saved-jobs | GREEN | src/app/jobs/page.tsx:50 — frontend call GET /api/candidate/saved-jobs |
| /jobs | POST | /api/applications | GREEN | src/app/jobs/page.tsx:62 — frontend call POST /api/applications |
| /jobs/saved | GET | /api/candidate/saved-jobs | GREEN | src/app/jobs/saved/page.tsx:34 — frontend call GET /api/candidate/saved-jobs |
| /jobs/saved | DELETE | /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} | GREEN | src/app/jobs/saved/page.tsx:54 — frontend call DELETE /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} |
| /jobs/saved | POST | /api/applications | GREEN | src/app/jobs/saved/page.tsx:69 — frontend call POST /api/applications |
| /jobs/:id/apply | GET | /api/candidate/profile | GREEN | src/app/jobs/[id]/apply/page.tsx:21 — frontend call GET /api/candidate/profile |
| /jobs/:id/apply | POST | /api/jobs/${jobId} | GREEN | src/app/jobs/[id]/apply/page.tsx:31 — frontend call POST /api/jobs/${jobId} |
| /jobs/:id/apply | POST | /api/applications | GREEN | src/app/jobs/[id]/apply/page.tsx:44 — frontend call POST /api/applications |
| /jobs/:id | GET | /api/jobs/${jobId} | GREEN | src/app/jobs/[id]/page.tsx:41 — frontend call GET /api/jobs/${jobId} |
| /jobs/:id | POST | /api/candidate/saved-jobs | GREEN | src/app/jobs/[id]/page.tsx:52 — frontend call POST /api/candidate/saved-jobs |
| /jobs/:id | POST | /api/applications | GREEN | src/app/jobs/[id]/page.tsx:66 — frontend call POST /api/applications |
| /jobs/:id | POST | /api/candidate/saved-jobs | GREEN | src/app/jobs/[id]/page.tsx:85 — frontend call POST /api/candidate/saved-jobs |
| /jobs/:id | DELETE | /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} | GREEN | src/app/jobs/[id]/page.tsx:90 — frontend call DELETE /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} |
| /login | POST | /api/auth/login | GREEN | src/app/login/page.tsx:39 — frontend call POST /api/auth/login |
| /notifications | GET | /api/notifications | GREEN | src/app/notifications/page.tsx:24 — frontend call GET /api/notifications |
| /notifications | GET | /api/candidate/sourcing-invitations | GREEN | src/app/notifications/page.tsx:38 — frontend call GET /api/candidate/sourcing-invitations |
| /notifications | POST | /api/candidate/sourcing-invitations/${id}/decision | GREEN | src/app/notifications/page.tsx:46 — frontend call POST /api/candidate/sourcing-invitations/${id}/decision |
| /notifications | PUT | /api/notifications | GREEN | src/app/notifications/page.tsx:56 — frontend call PUT /api/notifications |
| /notifications | PUT | /api/notifications | GREEN | src/app/notifications/page.tsx:71 — frontend call PUT /api/notifications |
| /onboarding/document-upload | POST | /api/upload | GREEN | src/app/onboarding/document-upload/page.tsx:43 — frontend call POST /api/upload |
| /onboarding/education | PUT | /api/candidate/profile | GREEN | src/app/onboarding/education/page.tsx:38 — frontend call PUT /api/candidate/profile |
| /onboarding/experience | PUT | /api/candidate/profile | GREEN | src/app/onboarding/experience/page.tsx:45 — frontend call PUT /api/candidate/profile |
| /onboarding/personal-details | GET | /api/candidate/profile | GREEN | src/app/onboarding/personal-details/page.tsx:23 — frontend call GET /api/candidate/profile |
| /onboarding/personal-details | PUT | /api/candidate/profile | GREEN | src/app/onboarding/personal-details/page.tsx:44 — frontend call PUT /api/candidate/profile |
| /onboarding/preferences | GET | /api/candidate/profile | GREEN | src/app/onboarding/preferences/page.tsx:27 — frontend call GET /api/candidate/profile |
| /onboarding/preferences | PUT | /api/candidate/profile | GREEN | src/app/onboarding/preferences/page.tsx:76 — frontend call PUT /api/candidate/profile |
| /onboarding/resume-upload | POST | /api/upload | GREEN | src/app/onboarding/resume-upload/page.tsx:40 — frontend call POST /api/upload |
| /onboarding/resume-upload | PUT | /api/candidate/profile | GREEN | src/app/onboarding/resume-upload/page.tsx:51 — frontend call PUT /api/candidate/profile |
| /onboarding/role-select | GET | /api/skill-master?type=roles&q=${encodeURIComponent(targetRole)} | GREEN | src/app/onboarding/role-select/page.tsx:37 — frontend call GET /api/skill-master?type=roles&q=${encodeURIComponent(targetRole)} |
| /onboarding/role-select | PUT | /api/candidate/profile | GREEN | src/app/onboarding/role-select/page.tsx:52 — frontend call PUT /api/candidate/profile |
| /onboarding/skills | PUT | /api/candidate/profile | GREEN | src/app/onboarding/skills/page.tsx:34 — frontend call PUT /api/candidate/profile |
| /onboarding/video-resume | GET | /api/candidate/video-resume/status?videoId=${videoId} | GREEN | src/app/onboarding/video-resume/page.tsx:125 — frontend call GET /api/candidate/video-resume/status?videoId=${videoId} |
| /onboarding/video-resume | POST | /api/upload | GREEN | src/app/onboarding/video-resume/page.tsx:174 — frontend call POST /api/upload |
| /onboarding/video-resume | POST | /api/candidate/video-resume | GREEN | src/app/onboarding/video-resume/page.tsx:180 — frontend call POST /api/candidate/video-resume |
| /otp | POST | /api/auth/verify-otp | GREEN | src/app/otp/page.tsx:56 — frontend call POST /api/auth/verify-otp |
| /otp | POST | /api/auth/send-verification-otp | GREEN | src/app/otp/page.tsx:84 — frontend call POST /api/auth/send-verification-otp |
| /payment/status | GET | /api/payments/status?${queryParams.toString()} | GREEN | src/app/payment/status/page.tsx:43 — frontend call GET /api/payments/status?${queryParams.toString()} |
| /payment/success | GET | /api/employer/subscribe | GREEN | src/app/payment/success/page.tsx:13 — frontend call GET /api/employer/subscribe |
| /profile | GET | /api/candidate/profile | GREEN | src/app/profile/page.tsx:43 — frontend call GET /api/candidate/profile |
| /profile | PUT | /api/candidate/profile | GREEN | src/app/profile/page.tsx:71 — frontend call PUT /api/candidate/profile |
| /referrals/dashboard | GET | /api/referrals | GREEN | src/app/referrals/dashboard/page.tsx:20 — frontend call GET /api/referrals |
| /referrals/dashboard | POST | /api/referrals/payout | GREEN | src/app/referrals/dashboard/page.tsx:57 — frontend call POST /api/referrals/payout |
| /referrals | GET | /api/referrals | GREEN | src/app/referrals/page.tsx:29 — frontend call GET /api/referrals |
| /register | POST | /api/auth/register | GREEN | src/app/register/page.tsx:54 — frontend call POST /api/auth/register |
| /reset-password | POST | /api/auth/reset-password | GREEN | src/app/reset-password/page.tsx:50 — frontend call POST /api/auth/reset-password |
| /settings/analytics | GET | /api/admin/analytics | GREEN | src/app/settings/analytics/page.tsx:9 — frontend call GET /api/admin/analytics |
| /settings/managed-hiring | GET | /api/admin/managed-hiring/config | GREEN | src/app/settings/managed-hiring/page.tsx:143 — frontend call GET /api/admin/managed-hiring/config |
| /settings/managed-hiring | POST | /api/admin/managed-hiring/config | GREEN | src/app/settings/managed-hiring/page.tsx:192 — frontend call POST /api/admin/managed-hiring/config |
| /settings | GET | /api/candidate/profile | GREEN | src/app/settings/page.tsx:17 — frontend call GET /api/candidate/profile |
| /settings | PUT | /api/candidate/profile | GREEN | src/app/settings/page.tsx:36 — frontend call PUT /api/candidate/profile |
| /settings/smtp | GET | /api/admin/email-delivery/config | GREEN | src/app/settings/smtp/page.tsx:58 — frontend call GET /api/admin/email-delivery/config |
| /settings/smtp | POST | /api/admin/email-delivery/config | GREEN | src/app/settings/smtp/page.tsx:94 — frontend call POST /api/admin/email-delivery/config |
| /settings/smtp | POST | /api/admin/email-delivery/test | GREEN | src/app/settings/smtp/page.tsx:136 — frontend call POST /api/admin/email-delivery/test |

## 6. API → DATABASE MATRIX

| Method | API | Detected DB model | Persistence signal | Evidence |
| --- | --- | --- | --- | --- |
| GET | /api/admin/analytics | prisma.user, prisma.application, prisma.interview, prisma.companySubscription | referenced | src/app/api/admin/analytics/route.ts:6 — GET /api/admin/analytics |
| GET | /api/admin/audit-logs |  | referenced | src/app/api/admin/audit-logs/route.ts:6 — GET /api/admin/audit-logs |
| POST | /api/admin/candidate-credits/grants |  | referenced | src/app/api/admin/candidate-credits/grants/route.ts:22 — POST /api/admin/candidate-credits/grants |
| GET | /api/admin/candidate-services | prisma.candidateServiceCatalog | referenced | src/app/api/admin/candidate-services/route.ts:21 — GET /api/admin/candidate-services |
| POST | /api/admin/candidate-services | prisma.candidateServiceCatalog | referenced | src/app/api/admin/candidate-services/route.ts:32 — POST /api/admin/candidate-services |
| PUT | /api/admin/candidate-services/:id |  | referenced | src/app/api/admin/candidate-services/[id]/route.ts:21 — PUT /api/admin/candidate-services/:id |
| GET | /api/admin/communications/deliveries | prisma.communicationDelivery | referenced | src/app/api/admin/communications/deliveries/route.ts:7 — GET /api/admin/communications/deliveries |
| GET | /api/admin/communications/templates | prisma.communicationTemplate | referenced | src/app/api/admin/communications/templates/route.ts:30 — GET /api/admin/communications/templates |
| POST | /api/admin/communications/templates | prisma.communicationTemplate | referenced | src/app/api/admin/communications/templates/route.ts:39 — POST /api/admin/communications/templates |
| PATCH | /api/admin/communications/templates/:id | prisma.communicationTemplate | referenced | src/app/api/admin/communications/templates/[id]/route.ts:22 — PATCH /api/admin/communications/templates/:id |
| POST | /api/admin/communications/test |  | referenced | src/app/api/admin/communications/test/route.ts:19 — POST /api/admin/communications/test |
| GET | /api/admin/config | prisma.adminConfiguration | referenced | src/app/api/admin/config/route.ts:63 — GET /api/admin/config |
| POST | /api/admin/config | prisma.adminConfiguration | referenced | src/app/api/admin/config/route.ts:74 — POST /api/admin/config |
| GET | /api/admin/document-verification | prisma.documentVerification, prisma.employerProfile | referenced | src/app/api/admin/document-verification/route.ts:60 — GET /api/admin/document-verification |
| POST | /api/admin/document-verification | prisma.documentVerification, prisma.employerProfile | referenced | src/app/api/admin/document-verification/route.ts:141 — POST /api/admin/document-verification |
| POST | /api/admin/document-verification/:id |  | referenced | src/app/api/admin/document-verification/[id]/route.ts:12 — POST /api/admin/document-verification/:id |
| GET | /api/admin/email-delivery/config |  | referenced | src/app/api/admin/email-delivery/config/route.ts:41 — GET /api/admin/email-delivery/config |
| POST | /api/admin/email-delivery/config |  | referenced | src/app/api/admin/email-delivery/config/route.ts:51 — POST /api/admin/email-delivery/config |
| POST | /api/admin/email-delivery/test |  | referenced | src/app/api/admin/email-delivery/test/route.ts:13 — POST /api/admin/email-delivery/test |
| GET | /api/admin/employers | prisma.employerProfile | referenced | src/app/api/admin/employers/route.ts:13 — GET /api/admin/employers |
| GET | /api/admin/invoices | prisma.commercialAgreement | referenced | src/app/api/admin/invoices/route.ts:13 — GET /api/admin/invoices |
| POST | /api/admin/invoices | prisma.commercialAgreement | referenced | src/app/api/admin/invoices/route.ts:32 — POST /api/admin/invoices |
| GET | /api/admin/jobs | prisma.jobListing | referenced | src/app/api/admin/jobs/route.ts:13 — GET /api/admin/jobs |
| GET | /api/admin/llm-usage |  | referenced | src/app/api/admin/llm-usage/route.ts:6 — GET /api/admin/llm-usage |
| GET | /api/admin/managed-hiring/config | prisma.adminConfiguration | referenced | src/app/api/admin/managed-hiring/config/route.ts:297 — GET /api/admin/managed-hiring/config |
| POST | /api/admin/managed-hiring/config | prisma.adminConfiguration | referenced | src/app/api/admin/managed-hiring/config/route.ts:351 — POST /api/admin/managed-hiring/config |
| GET | /api/admin/payment-gateway/config |  | referenced | src/app/api/admin/payment-gateway/config/route.ts:23 — GET /api/admin/payment-gateway/config |
| POST | /api/admin/payment-gateway/config |  | referenced | src/app/api/admin/payment-gateway/config/route.ts:32 — POST /api/admin/payment-gateway/config |
| POST | /api/admin/pricing/calculate |  | referenced | src/app/api/admin/pricing/calculate/route.ts:18 — POST /api/admin/pricing/calculate |
| GET | /api/admin/readiness-templates | prisma.mcqAssessment | referenced | src/app/api/admin/readiness-templates/route.ts:26 — GET /api/admin/readiness-templates |
| POST | /api/admin/readiness-templates | prisma.mcqAssessment | referenced | src/app/api/admin/readiness-templates/route.ts:45 — POST /api/admin/readiness-templates |
| GET | /api/admin/recorded-assessment/questions | prisma.recordedAssessmentQuestionBank | referenced | src/app/api/admin/recorded-assessment/questions/route.ts:21 — GET /api/admin/recorded-assessment/questions |
| POST | /api/admin/recorded-assessment/questions | prisma.recordedAssessmentQuestionBank | referenced | src/app/api/admin/recorded-assessment/questions/route.ts:36 — POST /api/admin/recorded-assessment/questions |
| DELETE | /api/admin/recorded-assessment/questions/:id | prisma.recordedAssessmentQuestionBank | referenced | src/app/api/admin/recorded-assessment/questions/[id]/route.ts:7 — DELETE /api/admin/recorded-assessment/questions/:id |
| GET | /api/admin/recorded-assessment/restrictions | prisma.recordedAssessmentRestriction, prisma.recordedAssessmentAttempt | referenced | src/app/api/admin/recorded-assessment/restrictions/route.ts:16 — GET /api/admin/recorded-assessment/restrictions |
| POST | /api/admin/recorded-assessment/restrictions | prisma.recordedAssessmentRestriction, prisma.recordedAssessmentAttempt | referenced | src/app/api/admin/recorded-assessment/restrictions/route.ts:33 — POST /api/admin/recorded-assessment/restrictions |
| POST | /api/admin/recorded-assessment/restrictions/:id | prisma.recordedAssessmentRestriction | referenced | src/app/api/admin/recorded-assessment/restrictions/[id]/route.ts:22 — POST /api/admin/recorded-assessment/restrictions/:id |
| GET | /api/admin/referrals/analytics | prisma.referralAttribution, prisma.referralReward, prisma.referralPayout | referenced | src/app/api/admin/referrals/analytics/route.ts:6 — GET /api/admin/referrals/analytics |
| GET | /api/admin/referrals/config |  | referenced | src/app/api/admin/referrals/config/route.ts:23 — GET /api/admin/referrals/config |
| PUT | /api/admin/referrals/config |  | referenced | src/app/api/admin/referrals/config/route.ts:47 — PUT /api/admin/referrals/config |
| GET | /api/admin/referrals/fraud |  | referenced | src/app/api/admin/referrals/fraud/route.ts:10 — GET /api/admin/referrals/fraud |
| POST | /api/admin/referrals/fraud |  | referenced | src/app/api/admin/referrals/fraud/route.ts:42 — POST /api/admin/referrals/fraud |
| GET | /api/admin/referrals/payouts |  | referenced | src/app/api/admin/referrals/payouts/route.ts:18 — GET /api/admin/referrals/payouts |
| POST | /api/admin/referrals/payouts |  | referenced | src/app/api/admin/referrals/payouts/route.ts:42 — POST /api/admin/referrals/payouts |
| GET | /api/admin/release/status |  | referenced | src/app/api/admin/release/status/route.ts:5 — GET /api/admin/release/status |
| GET | /api/admin/revenue/audit-logs |  | referenced | src/app/api/admin/revenue/audit-logs/route.ts:6 — GET /api/admin/revenue/audit-logs |
| GET | /api/admin/revenue/export |  | referenced | src/app/api/admin/revenue/export/route.ts:13 — GET /api/admin/revenue/export |
| GET | /api/admin/revenue/job-boost |  | referenced | src/app/api/admin/revenue/job-boost/route.ts:75 — GET /api/admin/revenue/job-boost |
| GET | /api/admin/revenue/managed-hiring |  | referenced | src/app/api/admin/revenue/managed-hiring/route.ts:6 — GET /api/admin/revenue/managed-hiring |
| GET | /api/admin/revenue/mock-interviews |  | referenced | src/app/api/admin/revenue/mock-interviews/route.ts:90 — GET /api/admin/revenue/mock-interviews |
| GET | /api/admin/revenue/pph |  | referenced | src/app/api/admin/revenue/pph/route.ts:6 — GET /api/admin/revenue/pph |
| GET | /api/admin/revenue/subscriptions |  | referenced | src/app/api/admin/revenue/subscriptions/route.ts:151 — GET /api/admin/revenue/subscriptions |
| GET | /api/admin/revenue/summary |  | referenced | src/app/api/admin/revenue/summary/route.ts:6 — GET /api/admin/revenue/summary |
| GET | /api/admin/revenue/transactions |  | referenced | src/app/api/admin/revenue/transactions/route.ts:6 — GET /api/admin/revenue/transactions |
| GET | /api/admin/security/status |  | referenced | src/app/api/admin/security/status/route.ts:13 — GET /api/admin/security/status |
| POST | /api/admin/security/status |  | referenced | src/app/api/admin/security/status/route.ts:57 — POST /api/admin/security/status |
| GET | /api/admin/subscription-plans |  | referenced | src/app/api/admin/subscription-plans/route.ts:8 — GET /api/admin/subscription-plans |
| POST | /api/admin/subscription-plans |  | referenced | src/app/api/admin/subscription-plans/route.ts:23 — POST /api/admin/subscription-plans |
| PUT | /api/admin/subscription-plans |  | referenced | src/app/api/admin/subscription-plans/route.ts:41 — PUT /api/admin/subscription-plans |
| DELETE | /api/admin/subscription-plans |  | referenced | src/app/api/admin/subscription-plans/route.ts:62 — DELETE /api/admin/subscription-plans |
| GET | /api/admin/subscriptions/settings |  | referenced | src/app/api/admin/subscriptions/settings/route.ts:27 — GET /api/admin/subscriptions/settings |
| POST | /api/admin/subscriptions/settings |  | referenced | src/app/api/admin/subscriptions/settings/route.ts:36 — POST /api/admin/subscriptions/settings |
| PUT | /api/admin/subscriptions/settings |  | referenced | src/app/api/admin/subscriptions/settings/route.ts:52 — PUT /api/admin/subscriptions/settings |
| DELETE | /api/admin/subscriptions/settings |  | referenced | src/app/api/admin/subscriptions/settings/route.ts:63 — DELETE /api/admin/subscriptions/settings |
| GET | /api/admin/system/queues | prisma.outboxEntry, prisma.securityAuditOutboxEvent, prisma.whatsAppInboundEvent, prisma.videoAnalysisJob | referenced | src/app/api/admin/system/queues/route.ts:34 — GET /api/admin/system/queues |
| GET | /api/admin/system-health |  | referenced | src/app/api/admin/system-health/route.ts:6 — GET /api/admin/system-health |
| POST | /api/admin/tests/run |  | referenced | src/app/api/admin/tests/run/route.ts:6 — POST /api/admin/tests/run |
| GET | /api/admin/typing-prompts | prisma.typingPracticePrompt | referenced | src/app/api/admin/typing-prompts/route.ts:20 — GET /api/admin/typing-prompts |
| POST | /api/admin/typing-prompts | prisma.typingPracticePrompt | referenced | src/app/api/admin/typing-prompts/route.ts:31 — POST /api/admin/typing-prompts |
| PUT | /api/admin/typing-prompts/:id |  | referenced | src/app/api/admin/typing-prompts/[id]/route.ts:21 — PUT /api/admin/typing-prompts/:id |
| POST | /api/admin/uploads/purge-infected |  | referenced | src/app/api/admin/uploads/purge-infected/route.ts:13 — POST /api/admin/uploads/purge-infected |
| POST | /api/admin/uploads/rescan |  | referenced | src/app/api/admin/uploads/rescan/route.ts:10 — POST /api/admin/uploads/rescan |
| GET | /api/admin/users | prisma.user | referenced | src/app/api/admin/users/route.ts:13 — GET /api/admin/users |
| POST | /api/agents/dispatch | prisma.employerProfile | referenced | src/app/api/agents/dispatch/route.ts:45 — POST /api/agents/dispatch |
| GET | /api/agreements/contracts | prisma.company, prisma.hiringRequirement | referenced | src/app/api/agreements/contracts/route.ts:8 — GET /api/agreements/contracts |
| POST | /api/agreements/contracts | prisma.company, prisma.hiringRequirement | referenced | src/app/api/agreements/contracts/route.ts:40 — POST /api/agreements/contracts |
| GET | /api/agreements/contracts/:id |  | referenced | src/app/api/agreements/contracts/[id]/route.ts:38 — GET /api/agreements/contracts/:id |
| PUT | /api/agreements/contracts/:id |  | referenced | src/app/api/agreements/contracts/[id]/route.ts:69 — PUT /api/agreements/contracts/:id |
| POST | /api/agreements/contracts/:id |  | referenced | src/app/api/agreements/contracts/[id]/route.ts:101 — POST /api/agreements/contracts/:id |
| GET | /api/agreements/requirements | prisma.company | referenced | src/app/api/agreements/requirements/route.ts:8 — GET /api/agreements/requirements |
| POST | /api/agreements/requirements | prisma.company | referenced | src/app/api/agreements/requirements/route.ts:29 — POST /api/agreements/requirements |
| GET | /api/agreements/requirements/:id |  | referenced | src/app/api/agreements/requirements/[id]/route.ts:6 — GET /api/agreements/requirements/:id |
| PATCH | /api/agreements/requirements/:id |  | referenced | src/app/api/agreements/requirements/[id]/route.ts:27 — PATCH /api/agreements/requirements/:id |
| GET | /api/agreements/templates |  | referenced | src/app/api/agreements/templates/route.ts:6 — GET /api/agreements/templates |
| POST | /api/agreements/templates |  | referenced | src/app/api/agreements/templates/route.ts:18 — POST /api/agreements/templates |
| GET | /api/agreements/templates/:id |  | referenced | src/app/api/agreements/templates/[id]/route.ts:6 — GET /api/agreements/templates/:id |
| PUT | /api/agreements/templates/:id |  | referenced | src/app/api/agreements/templates/[id]/route.ts:23 — PUT /api/agreements/templates/:id |
| POST | /api/agreements/templates/:id |  | referenced | src/app/api/agreements/templates/[id]/route.ts:47 — POST /api/agreements/templates/:id |
| DELETE | /api/agreements/templates/:id |  | referenced | src/app/api/agreements/templates/[id]/route.ts:74 — DELETE /api/agreements/templates/:id |
| GET | /api/applications | prisma.candidateProfile, prisma.application, prisma.jobListing, prisma.candidateReadiness, prisma.user, prisma.company | referenced | src/app/api/applications/route.ts:16 — GET /api/applications |
| POST | /api/applications | prisma.candidateProfile, prisma.application, prisma.jobListing, prisma.candidateReadiness, prisma.user, prisma.company | referenced | src/app/api/applications/route.ts:48 — POST /api/applications |
| PATCH | /api/applications | prisma.candidateProfile, prisma.application, prisma.jobListing, prisma.candidateReadiness, prisma.user, prisma.company | referenced | src/app/api/applications/route.ts:133 — PATCH /api/applications |
| GET | /api/assessment/mcq/assigned | prisma.candidateProfile, prisma.application, prisma.mcqAttempt | referenced | src/app/api/assessment/mcq/assigned/route.ts:15 — GET /api/assessment/mcq/assigned |
| POST | /api/assessment/mcq/start | prisma.candidateProfile, prisma.mcqAssessment, prisma.application, prisma.candidateReadiness, prisma.mcqAttempt | referenced | src/app/api/assessment/mcq/start/route.ts:12 — POST /api/assessment/mcq/start |
| POST | /api/assessment/mcq/submit | prisma.candidateProfile, prisma.mcqAttempt, prisma.candidateReadiness | referenced | src/app/api/assessment/mcq/submit/route.ts:18 — POST /api/assessment/mcq/submit |
| POST | /api/assessment/mock-interview/finish | prisma.mockInterviewSession, prisma.candidateProfile | referenced | src/app/api/assessment/mock-interview/finish/route.ts:12 — POST /api/assessment/mock-interview/finish |
| GET | /api/assessment/mock-interview/session | prisma.candidateProfile, prisma.mockInterviewSession | referenced | src/app/api/assessment/mock-interview/session/route.ts:11 — GET /api/assessment/mock-interview/session |
| POST | /api/assessment/mock-interview/start | prisma.candidateProfile, prisma.mockInterviewSession | referenced | src/app/api/assessment/mock-interview/start/route.ts:13 — POST /api/assessment/mock-interview/start |
| POST | /api/assessment/mock-interview/turn | prisma.mockInterviewSession, prisma.candidateProfile | referenced | src/app/api/assessment/mock-interview/turn/route.ts:51 — POST /api/assessment/mock-interview/turn |
| GET | /api/assessment/typing/prompt | prisma.typingPracticePrompt | referenced | src/app/api/assessment/typing/prompt/route.ts:6 — GET /api/assessment/typing/prompt |
| POST | /api/assessment/typing/submit | prisma.typingPracticePrompt, prisma.candidateProfile, prisma.typingAssessment | referenced | src/app/api/assessment/typing/submit/route.ts:16 — POST /api/assessment/typing/submit |
| GET | /api/assessment/typing/:id | prisma.typingAssessment | referenced | src/app/api/assessment/typing/[id]/route.ts:6 — GET /api/assessment/typing/:id |
| POST | /api/auth/employer-register | prisma.user | referenced | src/app/api/auth/employer-register/route.ts:16 — POST /api/auth/employer-register |
| POST | /api/auth/forgot-password | db.findUserByEmail | referenced | src/app/api/auth/forgot-password/route.ts:11 — POST /api/auth/forgot-password |
| POST | /api/auth/login | db.findUserByEmail | referenced | src/app/api/auth/login/route.ts:19 — POST /api/auth/login |
| POST | /api/auth/logout |  | referenced | src/app/api/auth/logout/route.ts:6 — POST /api/auth/logout |
| GET | /api/auth/me |  | referenced | src/app/api/auth/me/route.ts:4 — GET /api/auth/me |
| POST | /api/auth/register | prisma.candidateProfile, db.findUserByEmail, db.createUser | referenced | src/app/api/auth/register/route.ts:17 — POST /api/auth/register |
| POST | /api/auth/reset-password | db.findUserByEmail | referenced | src/app/api/auth/reset-password/route.ts:15 — POST /api/auth/reset-password |
| POST | /api/auth/send-verification-otp | db.findUserByEmail | referenced | src/app/api/auth/send-verification-otp/route.ts:9 — POST /api/auth/send-verification-otp |
| POST | /api/auth/verify-otp | prisma.user, db.findUserByEmail | referenced | src/app/api/auth/verify-otp/route.ts:15 — POST /api/auth/verify-otp |
| GET | /api/candidate/availability | prisma.candidateProfile | referenced | src/app/api/candidate/availability/route.ts:21 — GET /api/candidate/availability |
| PUT | /api/candidate/availability | prisma.candidateProfile | referenced | src/app/api/candidate/availability/route.ts:29 — PUT /api/candidate/availability |
| GET | /api/candidate/credits | prisma.candidateProfile, prisma.candidateCreditWallet, prisma.candidateCreditLedger, prisma.candidateServiceCatalog | referenced | src/app/api/candidate/credits/route.ts:14 — GET /api/candidate/credits |
| GET | /api/candidate/profile | prisma.candidateProfile | referenced | src/app/api/candidate/profile/route.ts:36 — GET /api/candidate/profile |
| PUT | /api/candidate/profile | prisma.candidateProfile | referenced | src/app/api/candidate/profile/route.ts:51 — PUT /api/candidate/profile |
| GET | /api/candidate/readiness | prisma.candidateProfile, prisma.mcqAssessment, prisma.candidateReadiness | referenced | src/app/api/candidate/readiness/route.ts:20 — GET /api/candidate/readiness |
| POST | /api/candidate/readiness | prisma.candidateProfile, prisma.mcqAssessment, prisma.candidateReadiness | referenced | src/app/api/candidate/readiness/route.ts:41 — POST /api/candidate/readiness |
| GET | /api/candidate/recommended-jobs | prisma.candidateProfile, prisma.jobListing | referenced | src/app/api/candidate/recommended-jobs/route.ts:7 — GET /api/candidate/recommended-jobs |
| POST | /api/candidate/recorded-assessment/attempts |  | referenced | src/app/api/candidate/recorded-assessment/attempts/route.ts:9 — POST /api/candidate/recorded-assessment/attempts |
| POST | /api/candidate/recorded-assessment/attempts/:id/complete | prisma.recordedAssessmentAttempt | referenced | src/app/api/candidate/recorded-assessment/attempts/[id]/complete/route.ts:6 — POST /api/candidate/recorded-assessment/attempts/:id/complete |
| POST | /api/candidate/recorded-assessment/attempts/:id/proctoring |  | referenced | src/app/api/candidate/recorded-assessment/attempts/[id]/proctoring/route.ts:22 — POST /api/candidate/recorded-assessment/attempts/:id/proctoring |
| POST | /api/candidate/recorded-assessment/attempts/:id/responses | prisma.recordedAssessmentAttempt, prisma.storedFile, prisma.recordedAssessmentResponse | referenced | src/app/api/candidate/recorded-assessment/attempts/[id]/responses/route.ts:15 — POST /api/candidate/recorded-assessment/attempts/:id/responses |
| GET | /api/candidate/recorded-assessment/attempts/:id | prisma.recordedAssessmentAttempt | referenced | src/app/api/candidate/recorded-assessment/attempts/[id]/route.ts:6 — GET /api/candidate/recorded-assessment/attempts/:id |
| POST | /api/candidate/recorded-assessment/attempts/:id/start | prisma.recordedAssessmentAttempt | referenced | src/app/api/candidate/recorded-assessment/attempts/[id]/start/route.ts:11 — POST /api/candidate/recorded-assessment/attempts/:id/start |
| GET | /api/candidate/recorded-assessment/restrictions | prisma.recordedAssessmentRestriction | referenced | src/app/api/candidate/recorded-assessment/restrictions/route.ts:10 — GET /api/candidate/recorded-assessment/restrictions |
| POST | /api/candidate/recorded-assessment/restrictions | prisma.recordedAssessmentRestriction | referenced | src/app/api/candidate/recorded-assessment/restrictions/route.ts:26 — POST /api/candidate/recorded-assessment/restrictions |
| GET | /api/candidate/saved-jobs | prisma.savedJob, prisma.jobListing | referenced | src/app/api/candidate/saved-jobs/route.ts:14 — GET /api/candidate/saved-jobs |
| POST | /api/candidate/saved-jobs | prisma.savedJob, prisma.jobListing | referenced | src/app/api/candidate/saved-jobs/route.ts:23 — POST /api/candidate/saved-jobs |
| DELETE | /api/candidate/saved-jobs | prisma.savedJob, prisma.jobListing | referenced | src/app/api/candidate/saved-jobs/route.ts:35 — DELETE /api/candidate/saved-jobs |
| POST | /api/candidate/services/:serviceKey/request | prisma.candidateProfile | referenced | src/app/api/candidate/services/[serviceKey]/request/route.ts:18 — POST /api/candidate/services/:serviceKey/request |
| GET | /api/candidate/sourcing-invitations | prisma.candidateProfile, prisma.candidateSourcingRelationship | referenced | src/app/api/candidate/sourcing-invitations/route.ts:6 — GET /api/candidate/sourcing-invitations |
| POST | /api/candidate/sourcing-invitations/:id/decision |  | referenced | src/app/api/candidate/sourcing-invitations/[id]/decision/route.ts:10 — POST /api/candidate/sourcing-invitations/:id/decision |
| GET | /api/candidate/video-resume | prisma.candidateProfile, prisma.storedFile, prisma.videoResume, prisma.videoAnalysisJob | referenced | src/app/api/candidate/video-resume/route.ts:18 — GET /api/candidate/video-resume |
| POST | /api/candidate/video-resume | prisma.candidateProfile, prisma.storedFile, prisma.videoResume, prisma.videoAnalysisJob | referenced | src/app/api/candidate/video-resume/route.ts:46 — POST /api/candidate/video-resume |
| GET | /api/candidate/video-resume/status | prisma.videoResume, prisma.employerProfile, prisma.application | referenced | src/app/api/candidate/video-resume/status/route.ts:5 — GET /api/candidate/video-resume/status |
| GET | /api/cron/recorded-assessment-analysis | prisma.recordedAssessmentAnalysisJob, prisma.recordedAssessmentResponse | referenced | src/app/api/cron/recorded-assessment-analysis/route.ts:69 — GET /api/cron/recorded-assessment-analysis |
| POST | /api/cron/recorded-assessment-analysis | prisma.recordedAssessmentAnalysisJob, prisma.recordedAssessmentResponse | referenced | src/app/api/cron/recorded-assessment-analysis/route.ts:70 — POST /api/cron/recorded-assessment-analysis |
| GET | /api/cron/referrals-reconciliation |  | referenced | src/app/api/cron/referrals-reconciliation/route.ts:111 — GET /api/cron/referrals-reconciliation |
| POST | /api/cron/referrals-reconciliation |  | referenced | src/app/api/cron/referrals-reconciliation/route.ts:115 — POST /api/cron/referrals-reconciliation |
| POST | /api/employer/assessments | prisma.jobListing, prisma.mcqAssessment | referenced | src/app/api/employer/assessments/route.ts:17 — POST /api/employer/assessments |
| GET | /api/employer/assessments | prisma.jobListing, prisma.mcqAssessment | referenced | src/app/api/employer/assessments/route.ts:70 — GET /api/employer/assessments |
| POST | /api/employer/assessments/:id/questions/reorder | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | referenced | src/app/api/employer/assessments/[id]/questions/reorder/route.ts:15 — POST /api/employer/assessments/:id/questions/reorder |
| POST | /api/employer/assessments/:id/questions | prisma.mcqAssessment, prisma.mcqAttempt, prisma.mcqQuestion | referenced | src/app/api/employer/assessments/[id]/questions/route.ts:28 — POST /api/employer/assessments/:id/questions |
| GET | /api/employer/assessments/:id/questions | prisma.mcqAssessment, prisma.mcqAttempt, prisma.mcqQuestion | referenced | src/app/api/employer/assessments/[id]/questions/route.ts:109 — GET /api/employer/assessments/:id/questions |
| PUT | /api/employer/assessments/:id/questions/:questionId | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | referenced | src/app/api/employer/assessments/[id]/questions/[questionId]/route.ts:28 — PUT /api/employer/assessments/:id/questions/:questionId |
| DELETE | /api/employer/assessments/:id/questions/:questionId | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | referenced | src/app/api/employer/assessments/[id]/questions/[questionId]/route.ts:116 — DELETE /api/employer/assessments/:id/questions/:questionId |
| PUT | /api/employer/assessments/:id | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | referenced | src/app/api/employer/assessments/[id]/route.ts:17 — PUT /api/employer/assessments/:id |
| DELETE | /api/employer/assessments/:id | prisma.mcqAssessment, prisma.mcqQuestion, prisma.mcqAttempt | referenced | src/app/api/employer/assessments/[id]/route.ts:78 — DELETE /api/employer/assessments/:id |
| GET | /api/employer/billing/invoices | prisma.commercialAgreement, prisma.invoice | referenced | src/app/api/employer/billing/invoices/route.ts:7 — GET /api/employer/billing/invoices |
| POST | /api/employer/billing/invoices/:id/pay | prisma.invoice, prisma.commercialAgreement | referenced | src/app/api/employer/billing/invoices/[id]/pay/route.ts:8 — POST /api/employer/billing/invoices/:id/pay |
| POST | /api/employer/billing/invoices/:id/receipt | prisma.invoice, prisma.commercialAgreement, prisma.storedFile, prisma.company | referenced | src/app/api/employer/billing/invoices/[id]/receipt/route.ts:19 — POST /api/employer/billing/invoices/:id/receipt |
| GET | /api/employer/candidate-collections | prisma.employerCandidateCollection, prisma.application | referenced | src/app/api/employer/candidate-collections/route.ts:10 — GET /api/employer/candidate-collections |
| POST | /api/employer/candidate-collections | prisma.employerCandidateCollection, prisma.application | referenced | src/app/api/employer/candidate-collections/route.ts:11 — POST /api/employer/candidate-collections |
| PATCH | /api/employer/candidate-collections | prisma.employerCandidateCollection, prisma.application | referenced | src/app/api/employer/candidate-collections/route.ts:12 — PATCH /api/employer/candidate-collections |
| GET | /api/employer/candidates | prisma.application | referenced | src/app/api/employer/candidates/route.ts:10 — GET /api/employer/candidates |
| GET | /api/employer/candidates/:id/notes | prisma.application, prisma.employerCandidateNote | referenced | src/app/api/employer/candidates/[id]/notes/route.ts:10 — GET /api/employer/candidates/:id/notes |
| POST | /api/employer/candidates/:id/notes | prisma.application, prisma.employerCandidateNote | referenced | src/app/api/employer/candidates/[id]/notes/route.ts:11 — POST /api/employer/candidates/:id/notes |
| GET | /api/employer/candidates/:id | prisma.candidateProfile | referenced | src/app/api/employer/candidates/[id]/route.ts:7 — GET /api/employer/candidates/:id |
| PATCH | /api/employer/candidates/:id/stage | prisma.application, prisma.employerProfile, prisma.jobInterviewProcess, prisma.interviewRound, prisma.interviewRoundProgress | referenced | src/app/api/employer/candidates/[id]/stage/route.ts:7 — PATCH /api/employer/candidates/:id/stage |
| GET | /api/employer/candidates/:id/tags | prisma.application, prisma.employerCandidateTag | referenced | src/app/api/employer/candidates/[id]/tags/route.ts:9 — GET /api/employer/candidates/:id/tags |
| POST | /api/employer/candidates/:id/tags | prisma.application, prisma.employerCandidateTag | referenced | src/app/api/employer/candidates/[id]/tags/route.ts:10 — POST /api/employer/candidates/:id/tags |
| DELETE | /api/employer/candidates/:id/tags | prisma.application, prisma.employerCandidateTag | referenced | src/app/api/employer/candidates/[id]/tags/route.ts:11 — DELETE /api/employer/candidates/:id/tags |
| GET | /api/employer/company | prisma.employerProfile, prisma.company | referenced | src/app/api/employer/company/route.ts:19 — GET /api/employer/company |
| PUT | /api/employer/company | prisma.employerProfile, prisma.company | referenced | src/app/api/employer/company/route.ts:33 — PUT /api/employer/company |
| GET | /api/employer/dashboard | prisma.jobListing, prisma.application, prisma.companyCredits, prisma.interview | referenced | src/app/api/employer/dashboard/route.ts:6 — GET /api/employer/dashboard |
| GET | /api/employer/hiring-pipeline/readiness | prisma.employerProfile, prisma.application | referenced | src/app/api/employer/hiring-pipeline/readiness/route.ts:10 — GET /api/employer/hiring-pipeline/readiness |
| GET | /api/employer/interviews/pending-feedback | prisma.interviewRoundProgress | referenced | src/app/api/employer/interviews/pending-feedback/route.ts:7 — GET /api/employer/interviews/pending-feedback |
| GET | /api/employer/interviews | prisma.employerProfile, prisma.interview | referenced | src/app/api/employer/interviews/route.ts:15 — GET /api/employer/interviews |
| POST | /api/employer/interviews/schedule | prisma.interviewRoundProgress, prisma.application, prisma.employerProfile, prisma.interviewRound, prisma.notification | referenced | src/app/api/employer/interviews/schedule/route.ts:21 — POST /api/employer/interviews/schedule |
| GET | /api/employer/interviews/:id/calendar | prisma.interview, prisma.employerProfile | referenced | src/app/api/employer/interviews/[id]/calendar/route.ts:5 — GET /api/employer/interviews/:id/calendar |
| GET | /api/employer/interviews/:id/feedback | prisma.interview, prisma.interviewFeedback | referenced | src/app/api/employer/interviews/[id]/feedback/route.ts:33 — GET /api/employer/interviews/:id/feedback |
| POST | /api/employer/interviews/:id/feedback | prisma.interview, prisma.interviewFeedback | referenced | src/app/api/employer/interviews/[id]/feedback/route.ts:48 — POST /api/employer/interviews/:id/feedback |
| POST | /api/employer/interviews/:id/round-decision | prisma.interview, prisma.interviewRound, prisma.interviewRoundInterviewer, prisma.workflowInstance, prisma.workflowApproval | referenced | src/app/api/employer/interviews/[id]/round-decision/route.ts:15 — POST /api/employer/interviews/:id/round-decision |
| GET | /api/employer/interviews/:id | prisma.interview, prisma.employerProfile | referenced | src/app/api/employer/interviews/[id]/route.ts:33 — GET /api/employer/interviews/:id |
| PATCH | /api/employer/interviews/:id | prisma.interview, prisma.employerProfile | referenced | src/app/api/employer/interviews/[id]/route.ts:66 — PATCH /api/employer/interviews/:id |
| GET | /api/employer/jobs | prisma.jobListing, prisma.employerProfile, prisma.idempotencyRecord | referenced | src/app/api/employer/jobs/route.ts:30 — GET /api/employer/jobs |
| POST | /api/employer/jobs | prisma.jobListing, prisma.employerProfile, prisma.idempotencyRecord | referenced | src/app/api/employer/jobs/route.ts:54 — POST /api/employer/jobs |
| GET | /api/employer/jobs/:id/interview-process | prisma.jobListing, prisma.jobInterviewProcess, prisma.employerProfile | referenced | src/app/api/employer/jobs/[id]/interview-process/route.ts:35 — GET /api/employer/jobs/:id/interview-process |
| PUT | /api/employer/jobs/:id/interview-process | prisma.jobListing, prisma.jobInterviewProcess, prisma.employerProfile | referenced | src/app/api/employer/jobs/[id]/interview-process/route.ts:60 — PUT /api/employer/jobs/:id/interview-process |
| POST | /api/employer/jobs/:id/match | prisma.jobListing | referenced | src/app/api/employer/jobs/[id]/match/route.ts:8 — POST /api/employer/jobs/:id/match |
| GET | /api/employer/jobs/:id/recorded-assessment/attempts | prisma.recordedAssessmentAttempt | referenced | src/app/api/employer/jobs/[id]/recorded-assessment/attempts/route.ts:7 — GET /api/employer/jobs/:id/recorded-assessment/attempts |
| GET | /api/employer/jobs/:id/recorded-assessment | prisma.recordedAssessmentConfig | referenced | src/app/api/employer/jobs/[id]/recorded-assessment/route.ts:16 — GET /api/employer/jobs/:id/recorded-assessment |
| PUT | /api/employer/jobs/:id/recorded-assessment | prisma.recordedAssessmentConfig | referenced | src/app/api/employer/jobs/[id]/recorded-assessment/route.ts:27 — PUT /api/employer/jobs/:id/recorded-assessment |
| GET | /api/employer/jobs/:id | prisma.jobListing, prisma.employerProfile | referenced | src/app/api/employer/jobs/[id]/route.ts:18 — GET /api/employer/jobs/:id |
| PUT | /api/employer/jobs/:id | prisma.jobListing, prisma.employerProfile | referenced | src/app/api/employer/jobs/[id]/route.ts:46 — PUT /api/employer/jobs/:id |
| DELETE | /api/employer/jobs/:id | prisma.jobListing, prisma.employerProfile | referenced | src/app/api/employer/jobs/[id]/route.ts:119 — DELETE /api/employer/jobs/:id |
| POST | /api/employer/jobs/:id/source-candidates/action | prisma.jobListing, prisma.candidateProfile | referenced | src/app/api/employer/jobs/[id]/source-candidates/action/route.ts:9 — POST /api/employer/jobs/:id/source-candidates/action |
| GET | /api/employer/jobs/:id/source-candidates | prisma.jobListing, prisma.candidateProfile | referenced | src/app/api/employer/jobs/[id]/source-candidates/route.ts:8 — GET /api/employer/jobs/:id/source-candidates |
| POST | /api/employer/managed-hiring/join | prisma.employerProfile, prisma.application, prisma.pphPlacement | referenced | src/app/api/employer/managed-hiring/join/route.ts:18 — POST /api/employer/managed-hiring/join |
| GET | /api/employer/managed-hiring/join | prisma.employerProfile, prisma.application, prisma.pphPlacement | referenced | src/app/api/employer/managed-hiring/join/route.ts:46 — GET /api/employer/managed-hiring/join |
| PATCH | /api/employer/managed-hiring/join | prisma.employerProfile, prisma.application, prisma.pphPlacement | referenced | src/app/api/employer/managed-hiring/join/route.ts:62 — PATCH /api/employer/managed-hiring/join |
| GET | /api/employer/promo/validate |  | referenced | src/app/api/employer/promo/validate/route.ts:6 — GET /api/employer/promo/validate |
| GET | /api/employer/recorded-assessment/responses/:responseId/media | prisma.recordedAssessmentResponse, prisma.employerProfile | referenced | src/app/api/employer/recorded-assessment/responses/[responseId]/media/route.ts:13 — GET /api/employer/recorded-assessment/responses/:responseId/media |
| GET | /api/employer/source-tracking | prisma.application, prisma.referralAttribution | referenced | src/app/api/employer/source-tracking/route.ts:6 — GET /api/employer/source-tracking |
| GET | /api/employer/subscribe |  | referenced | src/app/api/employer/subscribe/route.ts:11 — GET /api/employer/subscribe |
| POST | /api/employer/subscribe |  | referenced | src/app/api/employer/subscribe/route.ts:93 — POST /api/employer/subscribe |
| POST | /api/employer/team/accept | prisma.companyInvitation | referenced | src/app/api/employer/team/accept/route.ts:15 — POST /api/employer/team/accept |
| GET | /api/employer/team | prisma.employerProfile, prisma.companyInvitation, prisma.company | referenced | src/app/api/employer/team/route.ts:24 — GET /api/employer/team |
| POST | /api/employer/team | prisma.employerProfile, prisma.companyInvitation, prisma.company | referenced | src/app/api/employer/team/route.ts:98 — POST /api/employer/team |
| DELETE | /api/employer/team | prisma.employerProfile, prisma.companyInvitation, prisma.company | referenced | src/app/api/employer/team/route.ts:241 — DELETE /api/employer/team |
| GET | /api/files/:id | prisma.employerProfile, prisma.videoResume, prisma.storedFile | referenced | src/app/api/files/[id]/route.ts:34 — GET /api/files/:id |
| GET | /api/health |  | referenced | src/app/api/health/route.ts:20 — GET /api/health |
| POST | /api/internal/recorded-assessment-analysis/callback | prisma.recordedAssessmentAnalysisJob | referenced | src/app/api/internal/recorded-assessment-analysis/callback/route.ts:14 — POST /api/internal/recorded-assessment-analysis/callback |
| POST | /api/internal/security-audit/process |  | referenced | src/app/api/internal/security-audit/process/route.ts:8 — POST /api/internal/security-audit/process |
| POST | /api/internal/video-analysis/callback | prisma.videoAnalysisJob | referenced | src/app/api/internal/video-analysis/callback/route.ts:35 — POST /api/internal/video-analysis/callback |
| POST | /api/internal/whatsapp/process |  | referenced | src/app/api/internal/whatsapp/process/route.ts:41 — POST /api/internal/whatsapp/process |
| POST | /api/internal/workflows/recover |  | referenced | src/app/api/internal/workflows/recover/route.ts:10 — POST /api/internal/workflows/recover |
| GET | /api/internal/workflows/recover |  | referenced | src/app/api/internal/workflows/recover/route.ts:28 — GET /api/internal/workflows/recover |
| GET | /api/interviews/room | prisma.interview, prisma.employerProfile, prisma.interviewSignal, prisma.interviewRoundProgress | referenced | src/app/api/interviews/room/route.ts:66 — GET /api/interviews/room |
| POST | /api/interviews/room | prisma.interview, prisma.employerProfile, prisma.interviewSignal, prisma.interviewRoundProgress | referenced | src/app/api/interviews/room/route.ts:112 — POST /api/interviews/room |
| GET | /api/jobs/search | prisma.jobListing | referenced | src/app/api/jobs/search/route.ts:5 — GET /api/jobs/search |
| GET | /api/jobs/:id | prisma.jobListing | referenced | src/app/api/jobs/[id]/route.ts:5 — GET /api/jobs/:id |
| GET | /api/notifications | prisma.notification | referenced | src/app/api/notifications/route.ts:10 — GET /api/notifications |
| PUT | /api/notifications | prisma.notification | referenced | src/app/api/notifications/route.ts:23 — PUT /api/notifications |
| POST | /api/payments/checkout | prisma.employerProfile, prisma.paymentOrder, prisma.subscriptionPlan | referenced | src/app/api/payments/checkout/route.ts:165 — POST /api/payments/checkout |
| GET | /api/payments/status | prisma.paymentOrder, prisma.paymentTransaction, prisma.companySubscription, prisma.companyCredits | referenced | src/app/api/payments/status/route.ts:13 — GET /api/payments/status |
| POST | /api/payments/webhook | prisma.paymentOrder, prisma.paymentTransaction, prisma.subscriptionPlan | referenced | src/app/api/payments/webhook/route.ts:8 — POST /api/payments/webhook |
| GET | /api/proctoring/telemetry | prisma.interview, prisma.employerProfile, prisma.proctoringTelemetry, prisma.auditLog | referenced | src/app/api/proctoring/telemetry/route.ts:95 — GET /api/proctoring/telemetry |
| POST | /api/proctoring/telemetry | prisma.interview, prisma.employerProfile, prisma.proctoringTelemetry, prisma.auditLog | referenced | src/app/api/proctoring/telemetry/route.ts:143 — POST /api/proctoring/telemetry |
| POST | /api/referrals/payout |  | referenced | src/app/api/referrals/payout/route.ts:15 — POST /api/referrals/payout |
| GET | /api/referrals |  | referenced | src/app/api/referrals/route.ts:7 — GET /api/referrals |
| POST | /api/referrals |  | referenced | src/app/api/referrals/route.ts:48 — POST /api/referrals |
| GET | /api/referrals/validate |  | referenced | src/app/api/referrals/validate/route.ts:5 — GET /api/referrals/validate |
| GET | /api/skill-master | prisma.customSkillRequest | referenced | src/app/api/skill-master/route.ts:8 — GET /api/skill-master |
| POST | /api/skill-master | prisma.customSkillRequest | referenced | src/app/api/skill-master/route.ts:20 — POST /api/skill-master |
| POST | /api/upload | prisma.employerProfile | referenced | src/app/api/upload/route.ts:32 — POST /api/upload |
| GET | /api/whatsapp/auth/handoff |  | referenced | src/app/api/whatsapp/auth/handoff/route.ts:28 — GET /api/whatsapp/auth/handoff |
| POST | /api/whatsapp/onboard |  | none/unknown | src/app/api/whatsapp/onboard/route.ts:13 — POST /api/whatsapp/onboard |
| GET | /api/whatsapp/onboard |  | none/unknown | src/app/api/whatsapp/onboard/route.ts:24 — GET /api/whatsapp/onboard |
| GET | /api/whatsapp/webhook | prisma.communicationDelivery | referenced | src/app/api/whatsapp/webhook/route.ts:48 — GET /api/whatsapp/webhook |
| POST | /api/whatsapp/webhook | prisma.communicationDelivery | referenced | src/app/api/whatsapp/webhook/route.ts:70 — POST /api/whatsapp/webhook |

## 7. API → EXTERNAL PROVIDER MATRIX

| Provider | Evidence files | Assessment | Status |
| --- | --- | --- | --- |
| OpenAI / Gemini / Anthropic / DeepSeek / Kimi | src/utils/aiRouter.ts; src/lib/ai/ModelRouter.ts | Provider routing and fallback code exists; real-key, cost, persistence, and UI proof are not universal. | YELLOW/RED |
| WhatsApp Cloud API | src/lib/whatsapp.ts; src/app/api/whatsapp/* | Transport, webhook, identity, onboarding, and auth handoff code exists; production credentials and live delivery require verification. | YELLOW |
| Stripe / PayU | src/lib/payments/*; src/app/api/payments/* | Approved production payment gateways (Stripe + PayU); runtime verification enforced. | GREEN |
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
| INFO | src/proxy.ts:1 | The `?bypass=true` query parameter is now limited to non-production environments. | Development convenience only; production auth bypass is no longer exposed by this branch. |
| INFO | src/lib/prisma.ts:107 | Seeded mock users remain available only for development or explicit mock-db mode. | Development fallback only; production now fails closed instead of authenticating against seeded users. |
| HIGH | src/utils/aiRouter.ts:1 | AI router returns simulated resume/JD/interview-style output when a real provider is unavailable. | Users may see fabricated AI results while the UI appears successful. |
| HIGH | src/services/candidateProfileService.ts:1 | Candidate profile service imports mock profile data as a source dependency. | Candidate profile can be presented as persisted while actually using fixtures. |
| HIGH | src/app/video-assessment/setup/page.tsx:1 | Assessment setup is rendered from a large embedded static HTML string. | Screen can look complete while actions and data are not connected. |
| MEDIUM | src/lib/otp.ts:120 | Master OTP is accepted outside production only; this is safe only if environment classification is correct. | Environment misconfiguration weakens identity verification. |

Static scanner summary: 24 records contain mock/fallback/static indicators. This is intentionally conservative; each RED record must be reviewed using its exact evidence row in the inventory.

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
- Records: 1682
- Screens: 263
- User actions: 967
- Frontend API calls: 220
- API method records: 232
- Server actions: 0
- Records missing evidence: 0

## 24. INVENTORY RECONCILIATION

| Check | Result |
| --- | --- |
| Every discovered page has a screen record | PASS |
| Every API route method has an endpoint record | PASS |
| Every handler has evidence | PASS |
| Frontend calls with no exact static endpoint match | See inventory notes; dynamic paths require contract verification |
| RED records | 24 |
| BLACK records | 0 |

The scanner is intentionally conservative. GREEN is not assigned by static source presence alone; runtime verification is required before any feature can be called production-ready.
