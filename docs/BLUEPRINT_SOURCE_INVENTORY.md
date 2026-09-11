# HireGo complete source inventory

Generated from the current checkout. Every row is inventoried, NOT automatically functionally verified. See CTO_BLUEPRINT.md for reviewed business traces and gaps.

```json
{
  "generatedAt": "2026-09-11T05:30:33.239Z",
  "sourceFiles": 559,
  "pages": 253,
  "apiRoutes": 125,
  "apiMethods": 180,
  "testFiles": 40,
  "models": 79,
  "caveat": "Regex source inventory, not exhaustive data-flow analysis, security certification or a working-feature count."
}
```

## Every page

| Route | Source | Direct API references (may use additional shared modules) |
| --- | --- | --- |
| /about | [src/app/about/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/about/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/agreements/builder | [src/app/admin/agreements/builder/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/agreements/builder/page.tsx:1>) | /api/agreements/requirements, /api/agreements/templates, /api/agreements/contracts |
| /admin/agreements/templates | [src/app/admin/agreements/templates/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/agreements/templates/page.tsx:1>) | /api/agreements/templates |
| /admin/ai-command-centre-dashboard | [src/app/admin/ai-command-centre-dashboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/ai-command-centre-dashboard/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/dashboard | [src/app/admin/dashboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/dashboard/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/document-verification | [src/app/admin/document-verification/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/document-verification/page.tsx:1>) | /api/admin/document-verification?status=${filter}, /api/admin/document-verification/${id} |
| /admin/employers | [src/app/admin/employers/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/employers/page.tsx:1>) | /api/admin/employers?search=${encodeURIComponent(search)} |
| /admin/invoices | [src/app/admin/invoices/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/invoices/page.tsx:1>) | /api/admin/invoices |
| /admin/jobs | [src/app/admin/jobs/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/jobs/page.tsx:1>) | /api/admin/jobs?search=${encodeURIComponent(search)} |
| /admin/licenses/allocator | [src/app/admin/licenses/allocator/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/licenses/allocator/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/login | [src/app/admin/login/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/login/page.tsx:1>) | /api/auth/login |
| /admin/logs/stream | [src/app/admin/logs/stream/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/logs/stream/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/managed-hiring/agreements/builder | [src/app/admin/managed-hiring/agreements/builder/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/managed-hiring/agreements/builder/page.tsx:1>) | /api/agreements/templates, /api/agreements/requirements/${reqId}, /api/agreements/contracts, /api/agreements/contracts/${data.agreement.id} |
| /admin/managed-hiring/operations | [src/app/admin/managed-hiring/operations/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/managed-hiring/operations/page.tsx:1>) | /api/admin/managed-hiring/config, /api/admin/invoices |
| /admin/managed-hiring/pipeline | [src/app/admin/managed-hiring/pipeline/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/managed-hiring/pipeline/page.tsx:1>) | /api/agreements/requirements |
| /admin/managed-hiring/requests | [src/app/admin/managed-hiring/requests/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/managed-hiring/requests/page.tsx:1>) | /api/agreements/requirements |
| /admin/managed-hiring/templates | [src/app/admin/managed-hiring/templates/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/managed-hiring/templates/page.tsx:1>) | /api/agreements/templates, /api/agreements/templates/${id} |
| /admin/models/playground | [src/app/admin/models/playground/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/models/playground/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/models/registry | [src/app/admin/models/registry/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/models/registry/page.tsx:1>) | None detected in this file; inspect imports |
| /admin | [src/app/admin/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/payment-gateways | [src/app/admin/payment-gateways/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/payment-gateways/page.tsx:1>) | /api/admin/payment-gateway/config |
| /admin/pricing-engine | [src/app/admin/pricing-engine/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/pricing-engine/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/proctoring-control-panel | [src/app/admin/proctoring-control-panel/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/proctoring-control-panel/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/referrals | [src/app/admin/referrals/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/referrals/page.tsx:1>) | /api/admin/referrals/config, /api/admin/referrals/payouts, /api/admin/referrals/analytics |
| /admin/revenue | [src/app/admin/revenue/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/revenue/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/roles | [src/app/admin/roles/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/roles/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/security/vulnerability-inspector | [src/app/admin/security/vulnerability-inspector/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/security/vulnerability-inspector/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/ai-agents | [src/app/admin/settings/ai-agents/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/ai-agents/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/analytics | [src/app/admin/settings/analytics/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/analytics/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/audit-log | [src/app/admin/settings/audit-log/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/audit-log/page.tsx:1>) | /api/admin/audit-logs |
| /admin/settings/domain | [src/app/admin/settings/domain/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/domain/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/hub | [src/app/admin/settings/hub/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/hub/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/integrations | [src/app/admin/settings/integrations/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/integrations/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/llm-usage | [src/app/admin/settings/llm-usage/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/llm-usage/page.tsx:1>) | /api/admin/llm-usage, /api/agents/dispatch |
| /admin/settings/managed-hiring | [src/app/admin/settings/managed-hiring/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/managed-hiring/page.tsx:1>) | /api/admin/config |
| /admin/settings/payment-gateway | [src/app/admin/settings/payment-gateway/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/payment-gateway/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/plan-management | [src/app/admin/settings/plan-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/plan-management/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/security | [src/app/admin/settings/security/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/security/page.tsx:1>) | /api/admin/security/status |
| /admin/settings/smtp | [src/app/admin/settings/smtp/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/smtp/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/terms-privacy | [src/app/admin/settings/terms-privacy/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/terms-privacy/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/settings/whatsapp | [src/app/admin/settings/whatsapp/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/settings/whatsapp/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/signups | [src/app/admin/signups/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/signups/page.tsx:1>) | /api/admin/users?search=${encodeURIComponent(search)}&limit=100 |
| /admin/sla/monitor | [src/app/admin/sla/monitor/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/sla/monitor/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/subscriptions | [src/app/admin/subscriptions/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/subscriptions/page.tsx:1>) | /api/admin/subscription-plans?includeArchived=true, /api/admin/subscriptions/settings, /api/admin/subscription-plans, /api/admin/subscription-plans?id=${id}, /api/admin/subscriptions/settings?code=${code} |
| /admin/system-health | [src/app/admin/system-health/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/system-health/page.tsx:1>) | /api/admin/system-health |
| /admin/system/backup-recovery | [src/app/admin/system/backup-recovery/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/system/backup-recovery/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/system/db-pool | [src/app/admin/system/db-pool/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/system/db-pool/page.tsx:1>) | None detected in this file; inspect imports |
| /admin/system/infrastructure | [src/app/admin/system/infrastructure/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/system/infrastructure/page.tsx:1>) | /api/admin/system-health |
| /admin/system/queue-broker | [src/app/admin/system/queue-broker/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/system/queue-broker/page.tsx:1>) | /api/admin/system/queues |
| /admin/users | [src/app/admin/users/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/users/page.tsx:1>) | /api/admin/users?search=${encodeURIComponent(search)} |
| /ai-features | [src/app/ai-features/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai-features/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/career-insights | [src/app/ai/career-insights/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/career-insights/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/career-prediction | [src/app/ai/career-prediction/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/career-prediction/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/coach/active | [src/app/ai/coach/active/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/coach/active/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/coach/results | [src/app/ai/coach/results/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/coach/results/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/mock-interview/active | [src/app/ai/mock-interview/active/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/mock-interview/active/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/mock-interview/setup | [src/app/ai/mock-interview/setup/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/mock-interview/setup/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/mock-interview/summary | [src/app/ai/mock-interview/summary/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/mock-interview/summary/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/practice-hub | [src/app/ai/practice-hub/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/practice-hub/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/resume-score | [src/app/ai/resume-score/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/resume-score/page.tsx:1>) | None detected in this file; inspect imports |
| /ai/skill-gap | [src/app/ai/skill-gap/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/ai/skill-gap/page.tsx:1>) | None detected in this file; inspect imports |
| /applications/history | [src/app/applications/history/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/applications/history/page.tsx:1>) | None detected in this file; inspect imports |
| /applications | [src/app/applications/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/applications/page.tsx:1>) | /api/applications |
| /applications/pipeline | [src/app/applications/pipeline/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/applications/pipeline/page.tsx:1>) | None detected in this file; inspect imports |
| /applications/timeline | [src/app/applications/timeline/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/applications/timeline/page.tsx:1>) | /api/applications |
| /applications/withdraw | [src/app/applications/withdraw/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/applications/withdraw/page.tsx:1>) | None detected in this file; inspect imports |
| /assessment/mcq/active | [src/app/assessment/mcq/active/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/assessment/mcq/active/page.tsx:1>) | /api/assessment/mcq/start, /api/assessment/mcq/submit |
| /assessment/mcq | [src/app/assessment/mcq/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/assessment/mcq/page.tsx:1>) | /api/assessment/mcq/assigned |
| /assessment/mock-interview/dna | [src/app/assessment/mock-interview/dna/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/assessment/mock-interview/dna/page.tsx:1>) | None detected in this file; inspect imports |
| /assessment/readiness | [src/app/assessment/readiness/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/assessment/readiness/page.tsx:1>) | /api/candidate/readiness |
| /assessment/typing/active | [src/app/assessment/typing/active/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/assessment/typing/active/page.tsx:1>) | /api/assessment/typing/prompt, /api/assessment/typing/submit |
| /assessment/typing/results | [src/app/assessment/typing/results/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/assessment/typing/results/page.tsx:1>) | /api/assessment/typing/${encodeURIComponent(resultId)} |
| /assessment/typing/setup | [src/app/assessment/typing/setup/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/assessment/typing/setup/page.tsx:1>) | None detected in this file; inspect imports |
| /billing | [src/app/billing/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/billing/page.tsx:1>) | None detected in this file; inspect imports |
| /blog | [src/app/blog/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/blog/page.tsx:1>) | None detected in this file; inspect imports |
| /candidate/dashboard | [src/app/candidate/dashboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/candidate/dashboard/page.tsx:1>) | None detected in this file; inspect imports |
| /candidate/job-search | [src/app/candidate/job-search/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/candidate/job-search/page.tsx:1>) | None detected in this file; inspect imports |
| /candidate/profile | [src/app/candidate/profile/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/candidate/profile/page.tsx:1>) | None detected in this file; inspect imports |
| /candidate/universal-profile | [src/app/candidate/universal-profile/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/candidate/universal-profile/page.tsx:1>) | None detected in this file; inspect imports |
| /career-resources | [src/app/career-resources/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/career-resources/page.tsx:1>) | None detected in this file; inspect imports |
| /careers | [src/app/careers/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/careers/page.tsx:1>) | None detected in this file; inspect imports |
| /certifications | [src/app/certifications/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/certifications/page.tsx:1>) | None detected in this file; inspect imports |
| /checkout | [src/app/checkout/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/checkout/page.tsx:1>) | None detected in this file; inspect imports |
| /company | [src/app/company/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/company/page.tsx:1>) | None detected in this file; inspect imports |
| /contact | [src/app/contact/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/contact/page.tsx:1>) | None detected in this file; inspect imports |
| /credits | [src/app/credits/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/credits/page.tsx:1>) | /api/candidate/credits, /api/candidate/services/${encodeURIComponent(service.serviceKey)}/request |
| /dashboard | [src/app/dashboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/dashboard/page.tsx:1>) | /api/candidate/profile, /api/applications |
| /employer/active-proctoring-monitor | [src/app/employer/active-proctoring-monitor/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/active-proctoring-monitor/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/active-video-interview-interviewer-view | [src/app/employer/active-video-interview-interviewer-view/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/active-video-interview-interviewer-view/page.tsx:1>) | /api/employer/interviews/${searchParams.get( |
| /employer/ai-candidate-ranking-explanation | [src/app/employer/ai-candidate-ranking-explanation/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/ai-candidate-ranking-explanation/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/ai-evaluation-scores | [src/app/employer/ai-evaluation-scores/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/ai-evaluation-scores/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/ai-hiring-copilot-hub | [src/app/employer/ai-hiring-copilot-hub/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/ai-hiring-copilot-hub/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/ai-hiring-insights | [src/app/employer/ai-hiring-insights/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/ai-hiring-insights/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/ai-interview-question-generator | [src/app/employer/ai-interview-question-generator/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/ai-interview-question-generator/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/assessments/builder | [src/app/employer/assessments/builder/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/assessments/builder/page.tsx:1>) | /api/employer/assessments, /api/employer/jobs, /api/employer/assessments/${assessmentId}/questions, /api/employer/assessments/${selectedAssessment.id}, /api/employer/assessments/${selectedAssessment.id}/questions, /api/employer/assessments/${selectedAssessment.id}/questions/${questionForm.id}, /api/employer/assessments/${selectedAssessment.id}/questions/${questionId}, /api/employer/assessments/${selectedAssessment.id}/questions/reorder |
| /employer/candidate-comparison | [src/app/employer/candidate-comparison/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/candidate-comparison/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/candidate-user-management | [src/app/employer/candidate-user-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/candidate-user-management/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/career-command-center | [src/app/employer/career-command-center/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/career-command-center/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/company-profile-editor | [src/app/employer/company-profile-editor/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/company-profile-editor/page.tsx:1>) | /api/employer/company |
| /employer/company-reviews-management | [src/app/employer/company-reviews-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/company-reviews-management/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/create-job-ai-jd-writing | [src/app/employer/create-job-ai-jd-writing/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/create-job-ai-jd-writing/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/create-job-ai-screening | [src/app/employer/create-job-ai-screening/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/create-job-ai-screening/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/create-job-basic-info | [src/app/employer/create-job-basic-info/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/create-job-basic-info/page.tsx:1>) | /api/employer/subscribe |
| /employer/create-job-matching-config | [src/app/employer/create-job-matching-config/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/create-job-matching-config/page.tsx:1>) | /api/employer/jobs |
| /employer/create-job-requirements | [src/app/employer/create-job-requirements/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/create-job-requirements/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/create-job-review-and-publish | [src/app/employer/create-job-review-and-publish/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/create-job-review-and-publish/page.tsx:1>) | /api/employer/jobs |
| /employer/dashboard | [src/app/employer/dashboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/dashboard/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/department-hiring-management | [src/app/employer/department-hiring-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/department-hiring-management/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/edit-job-post | [src/app/employer/edit-job-post/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/edit-job-post/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-analytics-dashboard | [src/app/employer/employer-analytics-dashboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-analytics-dashboard/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-company-management | [src/app/employer/employer-company-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-company-management/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-company-settings-hub | [src/app/employer/employer-company-settings-hub/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-company-settings-hub/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-forgot-password | [src/app/employer/employer-forgot-password/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-forgot-password/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-notifications-center | [src/app/employer/employer-notifications-center/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-notifications-center/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-onboarding-first-job-prompt | [src/app/employer/employer-onboarding-first-job-prompt/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-onboarding-first-job-prompt/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-onboarding-welcome | [src/app/employer/employer-onboarding-welcome/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-onboarding-welcome/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-registration-business-model | [src/app/employer/employer-registration-business-model/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-registration-business-model/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-registration-company-info | [src/app/employer/employer-registration-company-info/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-registration-company-info/page.tsx:1>) | /api/referrals/validate?code=${encodeURIComponent(code)}, /api/auth/employer-register |
| /employer/employer-registration-complete | [src/app/employer/employer-registration-complete/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-registration-complete/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/employer-registration-document-verification | [src/app/employer/employer-registration-document-verification/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-registration-document-verification/page.tsx:1>) | /api/upload, /api/admin/document-verification |
| /employer/employer-registration-otp-verification | [src/app/employer/employer-registration-otp-verification/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-registration-otp-verification/page.tsx:1>) | /api/auth/verify-otp |
| /employer/employer-registration-plan-selection | [src/app/employer/employer-registration-plan-selection/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-registration-plan-selection/page.tsx:1>) | /api/employer/subscribe |
| /employer/employer-sign-in | [src/app/employer/employer-sign-in/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-sign-in/page.tsx:1>) | /api/auth/login |
| /employer/employer-subscription-and-plans | [src/app/employer/employer-subscription-and-plans/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/employer-subscription-and-plans/page.tsx:1>) | /api/agreements/contracts |
| /employer/enterprise-talent-pool-database | [src/app/employer/enterprise-talent-pool-database/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/enterprise-talent-pool-database/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/final-round-feedback | [src/app/employer/final-round-feedback/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/final-round-feedback/page.tsx:1>) | /api/employer/interviews/${encodeURIComponent(interviewId)}/feedback |
| /employer/full-candidate-profile-employer-view | [src/app/employer/full-candidate-profile-employer-view/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/full-candidate-profile-employer-view/page.tsx:1>) | /api/employer/candidates/${candidateId} |
| /employer/hiring-funnel-detail | [src/app/employer/hiring-funnel-detail/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/hiring-funnel-detail/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/hiring-pipeline | [src/app/employer/hiring-pipeline/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/hiring-pipeline/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/import-jobs | [src/app/employer/import-jobs/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/import-jobs/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/interview-feedback-form | [src/app/employer/interview-feedback-form/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/interview-feedback-form/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/interview-panel-collaboration | [src/app/employer/interview-panel-collaboration/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/interview-panel-collaboration/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/interview-reschedule-employer-view | [src/app/employer/interview-reschedule-employer-view/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/interview-reschedule-employer-view/page.tsx:1>) | /api/employer/interviews/${encodeURIComponent(interviewId)}, /api/employer/interviews/${encodeURIComponent(interviewId)}/calendar |
| /employer/interview-round-builder | [src/app/employer/interview-round-builder/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/interview-round-builder/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/interview-scheduler | [src/app/employer/interview-scheduler/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/interview-scheduler/page.tsx:1>) | /api/employer/interviews/schedule |
| /employer/invitation/accept | [src/app/employer/invitation/accept/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/invitation/accept/page.tsx:1>) | /api/employer/team/accept |
| /employer/job-boost-promote | [src/app/employer/job-boost-promote/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/job-boost-promote/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/job-listings-management | [src/app/employer/job-listings-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/job-listings-management/page.tsx:1>) | /api/employer/jobs, /api/employer/jobs/${encodeURIComponent(id)}, /api/employer/jobs/${id} |
| /employer/job-performance-analytics | [src/app/employer/job-performance-analytics/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/job-performance-analytics/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/managed-hiring/agreements/[id] | [src/app/employer/managed-hiring/agreements/[id]/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/managed-hiring/agreements/[id]/page.tsx:1>) | /api/agreements/contracts/${agreementId} |
| /employer/managed-hiring/candidate-tracking | [src/app/employer/managed-hiring/candidate-tracking/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/managed-hiring/candidate-tracking/page.tsx:1>) | /api/employer/candidates/${encodeURIComponent(applicationId)}/stage |
| /employer/managed-hiring/join | [src/app/employer/managed-hiring/join/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/managed-hiring/join/page.tsx:1>) | /api/employer/managed-hiring/join |
| /employer/managed-hiring | [src/app/employer/managed-hiring/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/managed-hiring/page.tsx:1>) | /api/agreements/requirements, /api/agreements/contracts |
| /employer/managed-hiring/request | [src/app/employer/managed-hiring/request/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/managed-hiring/request/page.tsx:1>) | /api/agreements/requirements |
| /employer/managed-hiring/service-plan | [src/app/employer/managed-hiring/service-plan/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/managed-hiring/service-plan/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/offer-letter-create-and-send | [src/app/employer/offer-letter-create-and-send/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/offer-letter-create-and-send/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/offer-management-dashboard | [src/app/employer/offer-management-dashboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/offer-management-dashboard/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/panel-interview-view | [src/app/employer/panel-interview-view/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/panel-interview-view/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/proactive-candidate-search | [src/app/employer/proactive-candidate-search/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/proactive-candidate-search/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/proctoring-security-report | [src/app/employer/proctoring-security-report/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/proctoring-security-report/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/recruiter-interaction-hub | [src/app/employer/recruiter-interaction-hub/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/recruiter-interaction-hub/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/referral-and-source-tracking | [src/app/employer/referral-and-source-tracking/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/referral-and-source-tracking/page.tsx:1>) | /api/employer/source-tracking?days=${period} |
| /employer/referrals | [src/app/employer/referrals/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/referrals/page.tsx:1>) | /api/referrals, /api/referrals/payout |
| /employer/revenue-and-billing-management | [src/app/employer/revenue-and-billing-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/revenue-and-billing-management/page.tsx:1>) | /api/employer/billing/invoices/${invoiceId}/pay, /api/employer/billing/invoices, /api/employer/billing/invoices/${invoiceId}/receipt |
| /employer/roles-and-permissions | [src/app/employer/roles-and-permissions/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/roles-and-permissions/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/salary-benchmark-insights | [src/app/employer/salary-benchmark-insights/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/salary-benchmark-insights/page.tsx:1>) | None detected in this file; inspect imports |
| /employer/subscriptions | [src/app/employer/subscriptions/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/subscriptions/page.tsx:1>) | /api/employer/subscribe, /api/employer/promo/validate?code=${couponCode.toUpperCase()}&planId=${checkoutPlan.id}, /api/payments/checkout |
| /employer/team-members-management | [src/app/employer/team-members-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/team-members-management/page.tsx:1>) | /api/auth/me, /api/employer/team, /api/employer/team?id=${encodeURIComponent(id)} |
| /employer/upcoming-interviews-list | [src/app/employer/upcoming-interviews-list/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/upcoming-interviews-list/page.tsx:1>) | /api/employer/interviews |
| /enterprise | [src/app/enterprise/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/enterprise/page.tsx:1>) | None detected in this file; inspect imports |
| /features | [src/app/features/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/features/page.tsx:1>) | None detected in this file; inspect imports |
| /find-jobs | [src/app/find-jobs/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/find-jobs/page.tsx:1>) | None detected in this file; inspect imports |
| /forgot-password/otp | [src/app/forgot-password/otp/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/forgot-password/otp/page.tsx:1>) | /api/auth/verify-otp, /api/auth/forgot-password |
| /forgot-password | [src/app/forgot-password/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/forgot-password/page.tsx:1>) | /api/auth/forgot-password |
| /interviews | [src/app/interviews/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/interviews/page.tsx:1>) | None detected in this file; inspect imports |
| /interviews/room/[roomId] | [src/app/interviews/room/[roomId]/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/interviews/room/[roomId]/page.tsx:1>) | None detected in this file; inspect imports |
| /jobs/[id]/ai-insights | [src/app/jobs/[id]/ai-insights/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/[id]/ai-insights/page.tsx:1>) | None detected in this file; inspect imports |
| /jobs/[id]/apply | [src/app/jobs/[id]/apply/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/[id]/apply/page.tsx:1>) | /api/candidate/profile, /api/jobs/${jobId}, /api/applications |
| /jobs/[id] | [src/app/jobs/[id]/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/[id]/page.tsx:1>) | /api/jobs/${jobId}, /api/candidate/saved-jobs, /api/applications, /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} |
| /jobs/alerts | [src/app/jobs/alerts/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/alerts/page.tsx:1>) | None detected in this file; inspect imports |
| /jobs/apply/success | [src/app/jobs/apply/success/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/apply/success/page.tsx:1>) | None detected in this file; inspect imports |
| /jobs/compare | [src/app/jobs/compare/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/compare/page.tsx:1>) | None detected in this file; inspect imports |
| /jobs/filters | [src/app/jobs/filters/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/filters/page.tsx:1>) | None detected in this file; inspect imports |
| /jobs | [src/app/jobs/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/page.tsx:1>) | /api/jobs/search?q=${encodeURIComponent(query)}, /api/candidate/saved-jobs, /api/applications, /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)} |
| /jobs/recommended | [src/app/jobs/recommended/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/recommended/page.tsx:1>) | None detected in this file; inspect imports |
| /jobs/report | [src/app/jobs/report/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/report/page.tsx:1>) | None detected in this file; inspect imports |
| /jobs/saved | [src/app/jobs/saved/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/saved/page.tsx:1>) | /api/candidate/saved-jobs, /api/candidate/saved-jobs?jobId=${encodeURIComponent(jobId)}, /api/applications |
| /jobs/suggestions | [src/app/jobs/suggestions/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/jobs/suggestions/page.tsx:1>) | None detected in this file; inspect imports |
| /landing-old | [src/app/landing-old/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/landing-old/page.tsx:1>) | None detected in this file; inspect imports |
| /leaderboard | [src/app/leaderboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/leaderboard/page.tsx:1>) | None detected in this file; inspect imports |
| /login | [src/app/login/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/login/page.tsx:1>) | /api/auth/login |
| /messages/chat | [src/app/messages/chat/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/messages/chat/page.tsx:1>) | None detected in this file; inspect imports |
| /messages | [src/app/messages/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/messages/page.tsx:1>) | None detected in this file; inspect imports |
| /notifications | [src/app/notifications/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/notifications/page.tsx:1>) | /api/notifications |
| /onboarding/baseline-assessment | [src/app/onboarding/baseline-assessment/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/baseline-assessment/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding/checklist | [src/app/onboarding/checklist/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/checklist/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding/complete | [src/app/onboarding/complete/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/complete/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding/document-upload | [src/app/onboarding/document-upload/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/document-upload/page.tsx:1>) | /api/upload |
| /onboarding/education | [src/app/onboarding/education/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/education/page.tsx:1>) | /api/candidate/profile |
| /onboarding/experience | [src/app/onboarding/experience/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/experience/page.tsx:1>) | /api/candidate/profile |
| /onboarding/hire-score | [src/app/onboarding/hire-score/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/hire-score/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding/matching | [src/app/onboarding/matching/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/matching/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding/mock-interview | [src/app/onboarding/mock-interview/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/mock-interview/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding | [src/app/onboarding/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding/personal-details | [src/app/onboarding/personal-details/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/personal-details/page.tsx:1>) | /api/candidate/profile |
| /onboarding/preferences | [src/app/onboarding/preferences/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/preferences/page.tsx:1>) | /api/candidate/profile |
| /onboarding/readiness-report | [src/app/onboarding/readiness-report/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/readiness-report/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding/resume-upload | [src/app/onboarding/resume-upload/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/resume-upload/page.tsx:1>) | /api/upload, /api/candidate/profile |
| /onboarding/reward | [src/app/onboarding/reward/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/reward/page.tsx:1>) | None detected in this file; inspect imports |
| /onboarding/role-select | [src/app/onboarding/role-select/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/role-select/page.tsx:1>) | /api/skill-master?type=roles&q=${encodeURIComponent(targetRole)}, /api/candidate/profile |
| /onboarding/skills | [src/app/onboarding/skills/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/skills/page.tsx:1>) | /api/candidate/profile |
| /onboarding/video-resume | [src/app/onboarding/video-resume/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/video-resume/page.tsx:1>) | /api/candidate/video-resume/status?videoId=${videoId}, /api/upload, /api/candidate/video-resume |
| /onboarding/welcome | [src/app/onboarding/welcome/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/onboarding/welcome/page.tsx:1>) | None detected in this file; inspect imports |
| /otp | [src/app/otp/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/otp/page.tsx:1>) | /api/auth/verify-otp, /api/auth/send-verification-otp |
| / | [src/app/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/page.tsx:1>) | None detected in this file; inspect imports |
| /payment/status | [src/app/payment/status/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/payment/status/page.tsx:1>) | /api/payments/status?${queryParams.toString()} |
| /payment/success | [src/app/payment/success/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/payment/success/page.tsx:1>) | /api/employer/subscribe |
| /post-job-public | [src/app/post-job-public/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/post-job-public/page.tsx:1>) | None detected in this file; inspect imports |
| /pricing | [src/app/pricing/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/pricing/page.tsx:1>) | None detected in this file; inspect imports |
| /pricing/upgrade | [src/app/pricing/upgrade/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/pricing/upgrade/page.tsx:1>) | None detected in this file; inspect imports |
| /privacy | [src/app/privacy/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/privacy/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/certificates | [src/app/profile/certificates/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/certificates/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/completion | [src/app/profile/completion/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/completion/page.tsx:1>) | None detected in this file; inspect imports |
| /profile | [src/app/profile/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/page.tsx:1>) | /api/candidate/profile |
| /profile/public | [src/app/profile/public/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/public/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/resume/optimize | [src/app/profile/resume/optimize/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/resume/optimize/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/resume | [src/app/profile/resume/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/resume/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/resume/templates | [src/app/profile/resume/templates/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/resume/templates/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/skills-management | [src/app/profile/skills-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/skills-management/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/video-resume | [src/app/profile/video-resume/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/video-resume/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/wizard/details | [src/app/profile/wizard/details/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/wizard/details/page.tsx:1>) | None detected in this file; inspect imports |
| /profile/wizard/resume | [src/app/profile/wizard/resume/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/profile/wizard/resume/page.tsx:1>) | None detected in this file; inspect imports |
| /referrals/dashboard | [src/app/referrals/dashboard/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/referrals/dashboard/page.tsx:1>) | /api/referrals, /api/referrals/payout |
| /referrals | [src/app/referrals/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/referrals/page.tsx:1>) | /api/referrals |
| /register/candidate | [src/app/register/candidate/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/register/candidate/page.tsx:1>) | None detected in this file; inspect imports |
| /register/complete | [src/app/register/complete/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/register/complete/page.tsx:1>) | None detected in this file; inspect imports |
| /register/employer | [src/app/register/employer/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/register/employer/page.tsx:1>) | None detected in this file; inspect imports |
| /register | [src/app/register/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/register/page.tsx:1>) | /api/auth/register |
| /reset-password | [src/app/reset-password/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/reset-password/page.tsx:1>) | /api/auth/reset-password |
| /screens | [src/app/screens/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/screens/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/ai-agents | [src/app/settings/ai-agents/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/ai-agents/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/analytics | [src/app/settings/analytics/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/analytics/page.tsx:1>) | /api/admin/analytics |
| /settings/audit-log | [src/app/settings/audit-log/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/audit-log/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/domain | [src/app/settings/domain/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/domain/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/hub | [src/app/settings/hub/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/hub/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/integrations | [src/app/settings/integrations/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/integrations/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/llm-usage | [src/app/settings/llm-usage/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/llm-usage/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/managed-hiring | [src/app/settings/managed-hiring/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/managed-hiring/page.tsx:1>) | /api/admin/managed-hiring/config |
| /settings/notifications | [src/app/settings/notifications/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/notifications/page.tsx:1>) | None detected in this file; inspect imports |
| /settings | [src/app/settings/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/page.tsx:1>) | /api/candidate/profile |
| /settings/payment-gateway | [src/app/settings/payment-gateway/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/payment-gateway/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/plan-management | [src/app/settings/plan-management/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/plan-management/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/security | [src/app/settings/security/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/security/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/smtp | [src/app/settings/smtp/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/smtp/page.tsx:1>) | /api/admin/email-delivery/config, /api/admin/email-delivery/test |
| /settings/terms-privacy | [src/app/settings/terms-privacy/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/terms-privacy/page.tsx:1>) | None detected in this file; inspect imports |
| /settings/whatsapp | [src/app/settings/whatsapp/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/settings/whatsapp/page.tsx:1>) | None detected in this file; inspect imports |
| /signin | [src/app/signin/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/signin/page.tsx:1>) | None detected in this file; inspect imports |
| /signup | [src/app/signup/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/signup/page.tsx:1>) | None detected in this file; inspect imports |
| /subscriptions | [src/app/subscriptions/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/subscriptions/page.tsx:1>) | None detected in this file; inspect imports |
| /terms | [src/app/terms/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/terms/page.tsx:1>) | None detected in this file; inspect imports |
| /video-assessment/active | [src/app/video-assessment/active/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/video-assessment/active/page.tsx:1>) | /api/agents/dispatch |
| /video-assessment/complete | [src/app/video-assessment/complete/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/video-assessment/complete/page.tsx:1>) | None detected in this file; inspect imports |
| /video-assessment/setup | [src/app/video-assessment/setup/page.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/video-assessment/setup/page.tsx:1>) | None detected in this file; inspect imports |

## Every API route

| Route | Methods | Source | Direct Prisma delegates |
| --- | --- | --- | --- |
| /api/admin/analytics | GET | [src/app/api/admin/analytics/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/analytics/route.ts:1>) | user, application, interview, companySubscription |
| /api/admin/audit-logs | GET | [src/app/api/admin/audit-logs/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/audit-logs/route.ts:1>) |  |
| /api/admin/candidate-credits/grants | POST | [src/app/api/admin/candidate-credits/grants/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/candidate-credits/grants/route.ts:1>) | candidateCreditLedger, candidateProfile, candidateCreditWallet |
| /api/admin/candidate-services/[id] | PUT | [src/app/api/admin/candidate-services/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/candidate-services/[id]/route.ts:1>) | candidateServiceCatalog |
| /api/admin/candidate-services | GET, POST | [src/app/api/admin/candidate-services/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/candidate-services/route.ts:1>) | candidateServiceCatalog |
| /api/admin/config | GET, POST | [src/app/api/admin/config/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/config/route.ts:1>) | adminConfiguration |
| /api/admin/document-verification/[id] | POST | [src/app/api/admin/document-verification/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/document-verification/[id]/route.ts:1>) | documentVerification, documentVerificationLog |
| /api/admin/document-verification | GET, POST | [src/app/api/admin/document-verification/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/document-verification/route.ts:1>) | documentVerification, employerProfile |
| /api/admin/email-delivery/config | GET, POST | [src/app/api/admin/email-delivery/config/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/email-delivery/config/route.ts:1>) |  |
| /api/admin/email-delivery/test | POST | [src/app/api/admin/email-delivery/test/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/email-delivery/test/route.ts:1>) |  |
| /api/admin/employers | GET | [src/app/api/admin/employers/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/employers/route.ts:1>) | employerProfile |
| /api/admin/invoices | GET, POST | [src/app/api/admin/invoices/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/invoices/route.ts:1>) |  |
| /api/admin/jobs | GET | [src/app/api/admin/jobs/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/jobs/route.ts:1>) | jobListing |
| /api/admin/llm-usage | GET | [src/app/api/admin/llm-usage/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/llm-usage/route.ts:1>) |  |
| /api/admin/managed-hiring/config | GET, POST | [src/app/api/admin/managed-hiring/config/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/managed-hiring/config/route.ts:1>) | adminConfiguration |
| /api/admin/payment-gateway/config | GET, POST | [src/app/api/admin/payment-gateway/config/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/payment-gateway/config/route.ts:1>) |  |
| /api/admin/pricing/calculate | POST | [src/app/api/admin/pricing/calculate/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/pricing/calculate/route.ts:1>) |  |
| /api/admin/readiness-templates | GET, POST | [src/app/api/admin/readiness-templates/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/readiness-templates/route.ts:1>) | mcqAssessment |
| /api/admin/referrals/analytics | GET | [src/app/api/admin/referrals/analytics/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/referrals/analytics/route.ts:1>) |  |
| /api/admin/referrals/config | GET, PUT | [src/app/api/admin/referrals/config/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/referrals/config/route.ts:1>) |  |
| /api/admin/referrals/fraud | GET, POST | [src/app/api/admin/referrals/fraud/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/referrals/fraud/route.ts:1>) |  |
| /api/admin/referrals/payouts | GET, POST | [src/app/api/admin/referrals/payouts/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/referrals/payouts/route.ts:1>) |  |
| /api/admin/release/status | GET | [src/app/api/admin/release/status/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/release/status/route.ts:1>) |  |
| /api/admin/revenue/audit-logs | GET | [src/app/api/admin/revenue/audit-logs/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/audit-logs/route.ts:1>) |  |
| /api/admin/revenue/export | GET | [src/app/api/admin/revenue/export/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/export/route.ts:1>) |  |
| /api/admin/revenue/job-boost | GET | [src/app/api/admin/revenue/job-boost/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/job-boost/route.ts:1>) |  |
| /api/admin/revenue/managed-hiring | GET | [src/app/api/admin/revenue/managed-hiring/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/managed-hiring/route.ts:1>) |  |
| /api/admin/revenue/mock-interviews | GET | [src/app/api/admin/revenue/mock-interviews/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/mock-interviews/route.ts:1>) |  |
| /api/admin/revenue/pph | GET | [src/app/api/admin/revenue/pph/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/pph/route.ts:1>) |  |
| /api/admin/revenue/subscriptions | GET | [src/app/api/admin/revenue/subscriptions/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/subscriptions/route.ts:1>) |  |
| /api/admin/revenue/summary | GET | [src/app/api/admin/revenue/summary/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/summary/route.ts:1>) |  |
| /api/admin/revenue/transactions | GET | [src/app/api/admin/revenue/transactions/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/transactions/route.ts:1>) |  |
| /api/admin/security/status | GET, POST | [src/app/api/admin/security/status/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/security/status/route.ts:1>) |  |
| /api/admin/subscription-plans | GET, POST, PUT, DELETE | [src/app/api/admin/subscription-plans/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/subscription-plans/route.ts:1>) |  |
| /api/admin/subscriptions/settings | GET, POST, PUT, DELETE | [src/app/api/admin/subscriptions/settings/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/subscriptions/settings/route.ts:1>) |  |
| /api/admin/system-health | GET | [src/app/api/admin/system-health/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/system-health/route.ts:1>) |  |
| /api/admin/system/queues | GET | [src/app/api/admin/system/queues/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/system/queues/route.ts:1>) | outboxEntry, securityAuditOutboxEvent, whatsAppInboundEvent, videoAnalysisJob |
| /api/admin/tests/run | POST | [src/app/api/admin/tests/run/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/tests/run/route.ts:1>) |  |
| /api/admin/typing-prompts/[id] | PUT | [src/app/api/admin/typing-prompts/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/typing-prompts/[id]/route.ts:1>) | typingPracticePrompt |
| /api/admin/typing-prompts | GET, POST | [src/app/api/admin/typing-prompts/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/typing-prompts/route.ts:1>) | typingPracticePrompt |
| /api/admin/users | GET | [src/app/api/admin/users/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/users/route.ts:1>) | user |
| /api/agents/dispatch | POST | [src/app/api/agents/dispatch/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/agents/dispatch/route.ts:1>) | employerProfile |
| /api/agreements/contracts/[id] | GET, PUT, POST | [src/app/api/agreements/contracts/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/agreements/contracts/[id]/route.ts:1>) |  |
| /api/agreements/contracts | GET, POST | [src/app/api/agreements/contracts/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/agreements/contracts/route.ts:1>) | company, hiringRequirement |
| /api/agreements/requirements/[id] | GET, PATCH | [src/app/api/agreements/requirements/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/agreements/requirements/[id]/route.ts:1>) |  |
| /api/agreements/requirements | GET, POST | [src/app/api/agreements/requirements/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/agreements/requirements/route.ts:1>) | company |
| /api/agreements/templates/[id] | GET, PUT, POST, DELETE | [src/app/api/agreements/templates/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/agreements/templates/[id]/route.ts:1>) |  |
| /api/agreements/templates | GET, POST | [src/app/api/agreements/templates/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/agreements/templates/route.ts:1>) |  |
| /api/applications | GET, POST | [src/app/api/applications/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/applications/route.ts:1>) | candidateProfile, application, jobListing, candidateReadiness |
| /api/assessment/mcq/assigned | GET | [src/app/api/assessment/mcq/assigned/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/mcq/assigned/route.ts:1>) | candidateProfile, application, mcqAttempt |
| /api/assessment/mcq/start | POST | [src/app/api/assessment/mcq/start/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/mcq/start/route.ts:1>) | candidateProfile, mcqAssessment, application, candidateReadiness, mcqAttempt |
| /api/assessment/mcq/submit | POST | [src/app/api/assessment/mcq/submit/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/mcq/submit/route.ts:1>) | candidateProfile, mcqAttempt, mcqCandidateAnswer, candidateReadiness |
| /api/assessment/mock-interview/finish | POST | [src/app/api/assessment/mock-interview/finish/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/mock-interview/finish/route.ts:1>) | mockInterviewSession, candidateProfile |
| /api/assessment/mock-interview/start | POST | [src/app/api/assessment/mock-interview/start/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/mock-interview/start/route.ts:1>) | candidateProfile, mockInterviewSession |
| /api/assessment/mock-interview/turn | POST | [src/app/api/assessment/mock-interview/turn/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/mock-interview/turn/route.ts:1>) | mockInterviewSession, candidateProfile, mockInterviewTurn |
| /api/assessment/typing/[id] | GET | [src/app/api/assessment/typing/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/typing/[id]/route.ts:1>) | typingAssessment |
| /api/assessment/typing/prompt | GET | [src/app/api/assessment/typing/prompt/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/typing/prompt/route.ts:1>) | typingPracticePrompt |
| /api/assessment/typing/submit | POST | [src/app/api/assessment/typing/submit/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/assessment/typing/submit/route.ts:1>) | typingPracticePrompt, candidateProfile, typingAssessment |
| /api/auth/employer-register | POST | [src/app/api/auth/employer-register/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/employer-register/route.ts:1>) | user, company, employerProfile, companyCredits, aiCompanyBudget |
| /api/auth/forgot-password | POST | [src/app/api/auth/forgot-password/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/forgot-password/route.ts:1>) |  |
| /api/auth/login | POST | [src/app/api/auth/login/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/login/route.ts:1>) |  |
| /api/auth/logout | POST | [src/app/api/auth/logout/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/logout/route.ts:1>) |  |
| /api/auth/me | GET | [src/app/api/auth/me/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/me/route.ts:1>) |  |
| /api/auth/register | POST | [src/app/api/auth/register/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/register/route.ts:1>) |  |
| /api/auth/reset-password | POST | [src/app/api/auth/reset-password/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/reset-password/route.ts:1>) | user |
| /api/auth/send-verification-otp | POST | [src/app/api/auth/send-verification-otp/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/send-verification-otp/route.ts:1>) |  |
| /api/auth/verify-otp | POST | [src/app/api/auth/verify-otp/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/auth/verify-otp/route.ts:1>) | user |
| /api/candidate/credits | GET | [src/app/api/candidate/credits/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/credits/route.ts:1>) | candidateProfile, candidateCreditWallet, candidateCreditLedger, candidateServiceCatalog |
| /api/candidate/profile | GET, PUT | [src/app/api/candidate/profile/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/profile/route.ts:1>) | candidateProfile, user |
| /api/candidate/readiness | GET, POST | [src/app/api/candidate/readiness/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/readiness/route.ts:1>) | candidateProfile, mcqAssessment, candidateReadiness |
| /api/candidate/recommended-jobs | GET | [src/app/api/candidate/recommended-jobs/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/recommended-jobs/route.ts:1>) | candidateProfile, jobListing |
| /api/candidate/saved-jobs | GET, POST, DELETE | [src/app/api/candidate/saved-jobs/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/saved-jobs/route.ts:1>) | savedJob, jobListing |
| /api/candidate/services/[serviceKey]/request | POST | [src/app/api/candidate/services/[serviceKey]/request/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/services/[serviceKey]/request/route.ts:1>) | candidateProfile, candidateCreditLedger, candidateServiceCatalog, candidateCreditWallet, candidateServiceUsage |
| /api/candidate/video-resume | GET, POST | [src/app/api/candidate/video-resume/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/video-resume/route.ts:1>) | candidateProfile, storedFile, videoResume, videoAnalysisJob |
| /api/candidate/video-resume/status | GET | [src/app/api/candidate/video-resume/status/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/video-resume/status/route.ts:1>) | videoResume, employerProfile, application |
| /api/cron/referrals-reconciliation | GET, POST | [src/app/api/cron/referrals-reconciliation/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/cron/referrals-reconciliation/route.ts:1>) |  |
| /api/employer/assessments/[id]/questions/[questionId] | PUT, DELETE | [src/app/api/employer/assessments/[id]/questions/[questionId]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/assessments/[id]/questions/[questionId]/route.ts:1>) | mcqAssessment, mcqQuestion, mcqAttempt, mcqOption |
| /api/employer/assessments/[id]/questions/reorder | POST | [src/app/api/employer/assessments/[id]/questions/reorder/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/assessments/[id]/questions/reorder/route.ts:1>) | mcqAssessment, mcqQuestion, mcqAttempt |
| /api/employer/assessments/[id]/questions | POST, GET | [src/app/api/employer/assessments/[id]/questions/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/assessments/[id]/questions/route.ts:1>) | mcqAssessment, mcqAttempt, mcqQuestion |
| /api/employer/assessments/[id] | PUT, DELETE | [src/app/api/employer/assessments/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/assessments/[id]/route.ts:1>) | mcqAssessment, mcqQuestion, mcqAttempt |
| /api/employer/assessments | POST, GET | [src/app/api/employer/assessments/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/assessments/route.ts:1>) | jobListing, mcqAssessment |
| /api/employer/billing/invoices/[id]/pay | POST | [src/app/api/employer/billing/invoices/[id]/pay/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/billing/invoices/[id]/pay/route.ts:1>) | invoice, commercialAgreement |
| /api/employer/billing/invoices/[id]/receipt | POST | [src/app/api/employer/billing/invoices/[id]/receipt/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/billing/invoices/[id]/receipt/route.ts:1>) | invoice, commercialAgreement |
| /api/employer/billing/invoices | GET | [src/app/api/employer/billing/invoices/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/billing/invoices/route.ts:1>) | commercialAgreement, invoice |
| /api/employer/candidates/[id] | GET | [src/app/api/employer/candidates/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/candidates/[id]/route.ts:1>) | candidateProfile |
| /api/employer/candidates/[id]/stage | PATCH | [src/app/api/employer/candidates/[id]/stage/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/candidates/[id]/stage/route.ts:1>) | application, employerProfile |
| /api/employer/candidates | GET | [src/app/api/employer/candidates/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/candidates/route.ts:1>) | employerProfile, application |
| /api/employer/company | GET, PUT | [src/app/api/employer/company/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/company/route.ts:1>) | employerProfile, company |
| /api/employer/dashboard | GET | [src/app/api/employer/dashboard/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/dashboard/route.ts:1>) | employerProfile, jobListing, application, companyCredits, interview |
| /api/employer/hiring-pipeline/readiness | GET | [src/app/api/employer/hiring-pipeline/readiness/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/hiring-pipeline/readiness/route.ts:1>) | employerProfile, application |
| /api/employer/interviews/[id]/calendar | GET | [src/app/api/employer/interviews/[id]/calendar/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/interviews/[id]/calendar/route.ts:1>) | interview, employerProfile |
| /api/employer/interviews/[id]/feedback | POST | [src/app/api/employer/interviews/[id]/feedback/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/interviews/[id]/feedback/route.ts:1>) | interview, employerProfile, application |
| /api/employer/interviews/[id] | GET, PATCH | [src/app/api/employer/interviews/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/interviews/[id]/route.ts:1>) | interview, employerProfile |
| /api/employer/interviews | GET | [src/app/api/employer/interviews/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/interviews/route.ts:1>) | employerProfile, interview |
| /api/employer/interviews/schedule | POST | [src/app/api/employer/interviews/schedule/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/interviews/schedule/route.ts:1>) | application, employerProfile, interview, notification |
| /api/employer/jobs/[id]/match | POST | [src/app/api/employer/jobs/[id]/match/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/jobs/[id]/match/route.ts:1>) | jobListing |
| /api/employer/jobs/[id] | GET, PUT, DELETE | [src/app/api/employer/jobs/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/jobs/[id]/route.ts:1>) | jobListing, employerProfile, companyCredits |
| /api/employer/jobs | GET, POST | [src/app/api/employer/jobs/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/jobs/route.ts:1>) | jobListing, employerProfile, idempotencyRecord, companySubscription, companyCredits |
| /api/employer/managed-hiring/join | POST | [src/app/api/employer/managed-hiring/join/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/managed-hiring/join/route.ts:1>) | application, employerProfile, idempotencyRecord, commercialAgreement, invoice |
| /api/employer/promo/validate | GET | [src/app/api/employer/promo/validate/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/promo/validate/route.ts:1>) |  |
| /api/employer/source-tracking | GET | [src/app/api/employer/source-tracking/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/source-tracking/route.ts:1>) |  |
| /api/employer/subscribe | GET, POST | [src/app/api/employer/subscribe/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/subscribe/route.ts:1>) | employerProfile |
| /api/employer/team/accept | POST | [src/app/api/employer/team/accept/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/team/accept/route.ts:1>) | companyInvitation, user, employerProfile |
| /api/employer/team | GET, POST, DELETE | [src/app/api/employer/team/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/team/route.ts:1>) | employerProfile, companyInvitation, company |
| /api/files/[id] | GET | [src/app/api/files/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/files/[id]/route.ts:1>) | employerProfile, storedFile |
| /api/internal/security-audit/process | POST | [src/app/api/internal/security-audit/process/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/internal/security-audit/process/route.ts:1>) |  |
| /api/internal/video-analysis/callback | POST | [src/app/api/internal/video-analysis/callback/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/internal/video-analysis/callback/route.ts:1>) | videoAnalysisJob, videoResume |
| /api/internal/whatsapp/process | POST | [src/app/api/internal/whatsapp/process/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/internal/whatsapp/process/route.ts:1>) |  |
| /api/internal/workflows/recover | POST, GET | [src/app/api/internal/workflows/recover/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/internal/workflows/recover/route.ts:1>) |  |
| /api/interviews/room | GET, POST | [src/app/api/interviews/room/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/interviews/room/route.ts:1>) | interview, employerProfile, interviewSignal |
| /api/jobs/[id] | GET | [src/app/api/jobs/[id]/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/jobs/[id]/route.ts:1>) | jobListing |
| /api/jobs/search | GET | [src/app/api/jobs/search/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/jobs/search/route.ts:1>) | jobListing |
| /api/notifications | GET, PUT | [src/app/api/notifications/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/notifications/route.ts:1>) | notification |
| /api/payments/checkout | POST | [src/app/api/payments/checkout/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/payments/checkout/route.ts:1>) | promoCode, paymentOrder, employerProfile, subscriptionPlan |
| /api/payments/status | GET | [src/app/api/payments/status/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/payments/status/route.ts:1>) | employerProfile, paymentOrder, paymentTransaction, companySubscription, companyCredits |
| /api/payments/webhook | POST | [src/app/api/payments/webhook/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/payments/webhook/route.ts:1>) | paymentTransaction, paymentOrder, promoCode, auditLog, subscriptionPlan, companySubscription, companyCredits, systemEvent |
| /api/proctoring/telemetry | GET, POST | [src/app/api/proctoring/telemetry/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/proctoring/telemetry/route.ts:1>) | interview, employerProfile, proctoringTelemetry, auditLog |
| /api/referrals/payout | POST | [src/app/api/referrals/payout/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/referrals/payout/route.ts:1>) |  |
| /api/referrals | GET, POST | [src/app/api/referrals/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/referrals/route.ts:1>) |  |
| /api/referrals/validate | GET | [src/app/api/referrals/validate/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/referrals/validate/route.ts:1>) |  |
| /api/skill-master | GET, POST | [src/app/api/skill-master/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/skill-master/route.ts:1>) | customSkillRequest |
| /api/upload | POST | [src/app/api/upload/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/upload/route.ts:1>) | employerProfile |
| /api/whatsapp/auth/handoff | GET | [src/app/api/whatsapp/auth/handoff/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/whatsapp/auth/handoff/route.ts:1>) |  |
| /api/whatsapp/onboard | POST, GET | [src/app/api/whatsapp/onboard/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/whatsapp/onboard/route.ts:1>) |  |
| /api/whatsapp/webhook | GET, POST | [src/app/api/whatsapp/webhook/route.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/whatsapp/webhook/route.ts:1>) |  |

## Every model / enum

| Kind | Name | Source |
| --- | --- | --- |
| enum | Role | [prisma/schema.prisma:11](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:11>) |
| enum | ApplicationStatus | [prisma/schema.prisma:18](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:18>) |
| enum | JobStatus | [prisma/schema.prisma:28](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:28>) |
| enum | CustomSkillStatus | [prisma/schema.prisma:35](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:35>) |
| enum | MockInterviewStatus | [prisma/schema.prisma:41](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:41>) |
| enum | AssessmentScope | [prisma/schema.prisma:47](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:47>) |
| enum | CandidateReadinessStatus | [prisma/schema.prisma:52](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:52>) |
| enum | CandidateCreditLedgerType | [prisma/schema.prisma:59](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:59>) |
| enum | CandidateServiceUsageStatus | [prisma/schema.prisma:68](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:68>) |
| model | User | [prisma/schema.prisma:76](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:76>) |
| model | CandidateProfile | [prisma/schema.prisma:109](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:109>) |
| model | Company | [prisma/schema.prisma:138](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:138>) |
| enum | InvitationStatus | [prisma/schema.prisma:162](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:162>) |
| model | CompanyInvitation | [prisma/schema.prisma:169](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:169>) |
| model | EmployerProfile | [prisma/schema.prisma:191](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:191>) |
| model | JobListing | [prisma/schema.prisma:203](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:203>) |
| model | SkillMaster | [prisma/schema.prisma:232](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:232>) |
| model | RoleSkillMapping | [prisma/schema.prisma:243](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:243>) |
| model | CustomSkillRequest | [prisma/schema.prisma:261](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:261>) |
| model | SavedJob | [prisma/schema.prisma:277](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:277>) |
| model | OtpVerification | [prisma/schema.prisma:288](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:288>) |
| model | Application | [prisma/schema.prisma:302](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:302>) |
| model | VideoResume | [prisma/schema.prisma:320](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:320>) |
| model | VideoAnalysisJob | [prisma/schema.prisma:362](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:362>) |
| model | Interview | [prisma/schema.prisma:382](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:382>) |
| model | InterviewSignal | [prisma/schema.prisma:400](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:400>) |
| model | ProctoringTelemetry | [prisma/schema.prisma:414](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:414>) |
| model | Notification | [prisma/schema.prisma:428](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:428>) |
| model | AuditLog | [prisma/schema.prisma:439](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:439>) |
| model | SecurityAuditOutboxEvent | [prisma/schema.prisma:458](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:458>) |
| model | AdminConfiguration | [prisma/schema.prisma:481](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:481>) |
| model | StoredFile | [prisma/schema.prisma:489](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:489>) |
| model | AiUsage | [prisma/schema.prisma:507](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:507>) |
| enum | RequirementStatus | [prisma/schema.prisma:517](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:517>) |
| enum | AgreementStatus | [prisma/schema.prisma:526](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:526>) |
| model | HiringRequirement | [prisma/schema.prisma:536](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:536>) |
| model | AgreementTemplate | [prisma/schema.prisma:573](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:573>) |
| model | CommercialAgreement | [prisma/schema.prisma:595](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:595>) |
| model | AgreementEvent | [prisma/schema.prisma:642](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:642>) |
| enum | PaymentStatus | [prisma/schema.prisma:652](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:652>) |
| model | Invoice | [prisma/schema.prisma:658](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:658>) |
| model | PaymentTransaction | [prisma/schema.prisma:677](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:677>) |
| model | IdempotencyRecord | [prisma/schema.prisma:694](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:694>) |
| model | PaymentGatewayConfig | [prisma/schema.prisma:709](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:709>) |
| model | EmailDeliveryConfig | [prisma/schema.prisma:722](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:722>) |
| model | AiExecutionLog | [prisma/schema.prisma:736](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:736>) |
| model | SubscriptionPlan | [prisma/schema.prisma:750](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:750>) |
| model | CompanySubscription | [prisma/schema.prisma:771](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:771>) |
| model | CompanyCredits | [prisma/schema.prisma:785](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:785>) |
| model | PromoCode | [prisma/schema.prisma:799](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:799>) |
| model | AiServiceCost | [prisma/schema.prisma:813](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:813>) |
| enum | EventScope | [prisma/schema.prisma:837](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:837>) |
| model | SystemEvent | [prisma/schema.prisma:842](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:842>) |
| model | OutboxEntry | [prisma/schema.prisma:867](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:867>) |
| model | EventConsumerCheckpoint | [prisma/schema.prisma:894](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:894>) |
| enum | WorkflowStatus | [prisma/schema.prisma:908](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:908>) |
| model | WorkflowInstance | [prisma/schema.prisma:917](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:917>) |
| model | WorkflowStepLog | [prisma/schema.prisma:947](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:947>) |
| enum | MemoryType | [prisma/schema.prisma:972](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:972>) |
| enum | MemoryScopeLevel | [prisma/schema.prisma:978](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:978>) |
| model | AgentMemoryRecord | [prisma/schema.prisma:987](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:987>) |
| model | AiCompanyBudget | [prisma/schema.prisma:1010](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1010>) |
| model | BudgetReservation | [prisma/schema.prisma:1031](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1031>) |
| model | AgentEvaluationLog | [prisma/schema.prisma:1051](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1051>) |
| enum | KillSwitchType | [prisma/schema.prisma:1078](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1078>) |
| model | KillSwitchConfig | [prisma/schema.prisma:1086](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1086>) |
| model | ShadowExecutionLog | [prisma/schema.prisma:1102](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1102>) |
| model | HiringOutcomeFeedback | [prisma/schema.prisma:1120](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1120>) |
| model | DataRetentionConfig | [prisma/schema.prisma:1143](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1143>) |
| enum | AgentLifecycleState | [prisma/schema.prisma:1158](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1158>) |
| model | AgentLifecycleLog | [prisma/schema.prisma:1171](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1171>) |
| model | DeadLetterJob | [prisma/schema.prisma:1190](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1190>) |
| model | TraceRecord | [prisma/schema.prisma:1213](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1213>) |
| model | DocumentVerification | [prisma/schema.prisma:1244](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1244>) |
| model | DocumentVerificationLog | [prisma/schema.prisma:1267](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1267>) |
| enum | ReferralStatus | [prisma/schema.prisma:1284](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1284>) |
| enum | ReferralProductType | [prisma/schema.prisma:1297](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1297>) |
| model | ReferralAttribution | [prisma/schema.prisma:1306](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1306>) |
| model | ReferralReward | [prisma/schema.prisma:1329](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1329>) |
| model | ReferralPayout | [prisma/schema.prisma:1362](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1362>) |
| enum | ReferralLedgerEntryType | [prisma/schema.prisma:1384](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1384>) |
| model | ReferralLedgerEntry | [prisma/schema.prisma:1394](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1394>) |
| model | ReferralProgramConfig | [prisma/schema.prisma:1416](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1416>) |
| model | WhatsAppContact | [prisma/schema.prisma:1445](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1445>) |
| model | WhatsAppOnboardingSession | [prisma/schema.prisma:1481](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1481>) |
| model | WhatsAppInboundEvent | [prisma/schema.prisma:1518](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1518>) |
| model | PaymentOrder | [prisma/schema.prisma:1540](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1540>) |
| model | McqAssessment | [prisma/schema.prisma:1563](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1563>) |
| model | McqQuestion | [prisma/schema.prisma:1589](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1589>) |
| model | McqOption | [prisma/schema.prisma:1606](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1606>) |
| model | McqAttempt | [prisma/schema.prisma:1618](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1618>) |
| model | McqCandidateAnswer | [prisma/schema.prisma:1638](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1638>) |
| model | CandidateReadiness | [prisma/schema.prisma:1650](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1650>) |
| model | CandidateCreditWallet | [prisma/schema.prisma:1670](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1670>) |
| model | CandidateCreditLedger | [prisma/schema.prisma:1679](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1679>) |
| model | CandidateServiceCatalog | [prisma/schema.prisma:1696](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1696>) |
| model | CandidateServiceUsage | [prisma/schema.prisma:1709](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1709>) |
| model | TypingAssessment | [prisma/schema.prisma:1725](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1725>) |
| model | TypingPracticePrompt | [prisma/schema.prisma:1743](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1743>) |
| model | MockInterviewSession | [prisma/schema.prisma:1756](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1756>) |
| model | MockInterviewTurn | [prisma/schema.prisma:1778](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma:1778>) |

## Remaining source and test files

| Classification | File | Lines |
| --- | --- | --- |
| module | [src/app/api/admin/revenue/_shared.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/admin/revenue/_shared.ts:1>) | 191 |
| module | [src/app/employer/layout.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/layout.tsx:1>) | 24 |
| module | [src/app/error.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/error.tsx:1>) | 60 |
| module | [src/app/layout.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/layout.tsx:1>) | 69 |
| module | [src/app/loading.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/loading.tsx:1>) | 16 |
| module | [src/app/not-found.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/not-found.tsx:1>) | 39 |
| module | [src/components/StitchPageEngine.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/StitchPageEngine.tsx:1>) | 334 |
| module | [src/components/admin/AdminHeader.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/admin/AdminHeader.tsx:1>) | 303 |
| module | [src/components/admin/AdminSidebar.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/admin/AdminSidebar.tsx:1>) | 176 |
| module | [src/components/assessment/QuestionBankManager.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/assessment/QuestionBankManager.tsx:1>) | 112 |
| module | [src/components/candidate/CandidateSidebar.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/candidate/CandidateSidebar.tsx:1>) | 169 |
| module | [src/components/candidate/VideoResumeModule.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/candidate/VideoResumeModule.tsx:1>) | 721 |
| module | [src/components/employer/EmployerHeader.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/employer/EmployerHeader.tsx:1>) | 200 |
| module | [src/components/employer/EmployerSidebar.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/employer/EmployerSidebar.tsx:1>) | 117 |
| module | [src/components/employer/HiringWorkflowBuilder.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/employer/HiringWorkflowBuilder.tsx:1>) | 157 |
| module | [src/components/employer/LayoutSystem.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/employer/LayoutSystem.tsx:1>) | 504 |
| module | [src/components/interview/WebRTCInterviewRoom.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/interview/WebRTCInterviewRoom.tsx:1>) | 126 |
| module | [src/components/marketing/MarketingFooter.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/marketing/MarketingFooter.tsx:1>) | 41 |
| module | [src/components/marketing/MarketingNav.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/marketing/MarketingNav.tsx:1>) | 70 |
| module | [src/components/marketing/MarketingPage.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/marketing/MarketingPage.tsx:1>) | 92 |
| module | [src/components/marketing/MarketingShell.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/marketing/MarketingShell.tsx:1>) | 13 |
| module | [src/components/proctoring/ProctoringEngine.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/proctoring/ProctoringEngine.tsx:1>) | 118 |
| module | [src/components/skills/RoleSkillSelector.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/components/skills/RoleSkillSelector.tsx:1>) | 210 |
| module | [src/config/index.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/config/index.ts:1>) | 7 |
| module | [src/constants/index.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/constants/index.ts:1>) | 5 |
| module | [src/context/AppContext.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/context/AppContext.tsx:1>) | 65 |
| module | [src/context/EmployerContext.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/context/EmployerContext.tsx:1>) | 165 |
| module | [src/context/OnboardingContext.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/context/OnboardingContext.tsx:1>) | 268 |
| module | [src/context/ThemeContext.tsx:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/context/ThemeContext.tsx:1>) | 67 |
| module | [src/hooks/index.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/hooks/index.ts:1>) | 7 |
| module | [src/hooks/useDebounce.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/hooks/useDebounce.ts:1>) | 15 |
| module | [src/hooks/useLocalStorage.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/hooks/useLocalStorage.ts:1>) | 29 |
| module | [src/hooks/useModal.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/hooks/useModal.ts:1>) | 19 |
| module | [src/hooks/usePagination.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/hooks/usePagination.ts:1>) | 29 |
| module | [src/hooks/useSearch.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/hooks/useSearch.ts:1>) | 29 |
| module | [src/hooks/useTable.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/hooks/useTable.ts:1>) | 36 |
| module | [src/lib/agents/AgentLifecycle.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/agents/AgentLifecycle.ts:1>) | 115 |
| module | [src/lib/agents/AgentRegistry.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/agents/AgentRegistry.ts:1>) | 55 |
| module | [src/lib/agents/BaseAgent.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/agents/BaseAgent.ts:1>) | 17 |
| module | [src/lib/agents/CeoDelegationGuard.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/agents/CeoDelegationGuard.ts:1>) | 60 |
| module | [src/lib/agents/ExecutionLoop.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/agents/ExecutionLoop.ts:1>) | 190 |
| module | [src/lib/agents/OperationalAgents.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/agents/OperationalAgents.ts:1>) | 357 |
| module | [src/lib/agreements-db.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/agreements-db.ts:1>) | 933 |
| module | [src/lib/ai/CircuitBreaker.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/ai/CircuitBreaker.ts:1>) | 66 |
| module | [src/lib/ai/ModelRouter.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/ai/ModelRouter.ts:1>) | 48 |
| module | [src/lib/apiSecurity.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/apiSecurity.ts:1>) | 161 |
| module | [src/lib/auditLogger.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/auditLogger.ts:1>) | 128 |
| module | [src/lib/auth.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/auth.ts:1>) | 182 |
| module | [src/lib/candidateEvidence.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/candidateEvidence.ts:1>) | 70 |
| module | [src/lib/dev-employer-store.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/dev-employer-store.ts:1>) | 37 |
| module | [src/lib/document-verification-store.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/document-verification-store.ts:1>) | 37 |
| module | [src/lib/email-delivery-config.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/email-delivery-config.ts:1>) | 165 |
| module | [src/lib/email.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/email.ts:1>) | 134 |
| module | [src/lib/employerCandidates.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/employerCandidates.ts:1>) | 34 |
| module | [src/lib/env.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/env.ts:1>) | 46 |
| module | [src/lib/events/ConsumerRegistry.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/events/ConsumerRegistry.ts:1>) | 28 |
| module | [src/lib/events/EventDispatcher.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/events/EventDispatcher.ts:1>) | 49 |
| module | [src/lib/events/Outbox.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/events/Outbox.ts:1>) | 106 |
| module | [src/lib/events/ProductionConsumers.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/events/ProductionConsumers.ts:1>) | 85 |
| module | [src/lib/governance/AgentEvaluator.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/governance/AgentEvaluator.ts:1>) | 107 |
| module | [src/lib/governance/AiEntitlements.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/governance/AiEntitlements.ts:1>) | 83 |
| module | [src/lib/governance/BudgetManager.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/governance/BudgetManager.ts:1>) | 228 |
| module | [src/lib/governance/FairnessAuditor.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/governance/FairnessAuditor.ts:1>) | 50 |
| module | [src/lib/governance/ShadowExecutor.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/governance/ShadowExecutor.ts:1>) | 64 |
| module | [src/lib/index.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/index.ts:1>) | 10 |
| module | [src/lib/industry-master.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/industry-master.ts:1>) | 27 |
| module | [src/lib/invoices-db.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/invoices-db.ts:1>) | 283 |
| module | [src/lib/location-master.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/location-master.ts:1>) | 57 |
| module | [src/lib/loginProtection.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/loginProtection.ts:1>) | 104 |
| module | [src/lib/managed-hiring-referral.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/managed-hiring-referral.ts:1>) | 529 |
| module | [src/lib/marketingMetadata.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/marketingMetadata.ts:1>) | 22 |
| module | [src/lib/matching/JobMatchingEngine.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/matching/JobMatchingEngine.ts:1>) | 140 |
| module | [src/lib/memory/MemoryManager.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/memory/MemoryManager.ts:1>) | 138 |
| module | [src/lib/otp.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/otp.ts:1>) | 175 |
| module | [src/lib/payment-referral.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/payment-referral.ts:1>) | 129 |
| module | [src/lib/payments/PayUGateway.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/payments/PayUGateway.ts:1>) | 119 |
| module | [src/lib/payments/PaymentGatewayController.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/payments/PaymentGatewayController.ts:1>) | 234 |
| module | [src/lib/payments/PaymentGatewayInterface.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/payments/PaymentGatewayInterface.ts:1>) | 50 |
| module | [src/lib/payments/PhonePeGateway.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/payments/PhonePeGateway.ts:1>) | 148 |
| module | [src/lib/payments/RazorpayGateway.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/payments/RazorpayGateway.ts:1>) | 172 |
| module | [src/lib/payments/StripeGateway.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/payments/StripeGateway.ts:1>) | 157 |
| module | [src/lib/payments/subscriptionCredits.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/payments/subscriptionCredits.ts:1>) | 33 |
| module | [src/lib/pph-referral.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/pph-referral.ts:1>) | 5 |
| module | [src/lib/prisma.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/prisma.ts:1>) | 175 |
| module | [src/lib/redis.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/redis.ts:1>) | 244 |
| module | [src/lib/referral-db.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/referral-db.ts:1>) | 1951 |
| module | [src/lib/referral-rules.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/referral-rules.ts:1>) | 270 |
| module | [src/lib/referrals.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/referrals.ts:1>) | 50 |
| module | [src/lib/reliability/DlqManager.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/reliability/DlqManager.ts:1>) | 57 |
| module | [src/lib/reliability/IdempotencyGuard.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/reliability/IdempotencyGuard.ts:1>) | 50 |
| module | [src/lib/ros/RosGateway.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/ros/RosGateway.ts:1>) | 208 |
| module | [src/lib/routeAuthorization.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/routeAuthorization.ts:1>) | 47 |
| module | [src/lib/securityAuditOutbox.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/securityAuditOutbox.ts:1>) | 190 |
| module | [src/lib/securityHeaders.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/securityHeaders.ts:1>) | 50 |
| module | [src/lib/security/KillSwitchManager.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/security/KillSwitchManager.ts:1>) | 172 |
| module | [src/lib/security/RbacGuard.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/security/RbacGuard.ts:1>) | 200 |
| module | [src/lib/security/TenantContext.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/security/TenantContext.ts:1>) | 70 |
| module | [src/lib/skill-master.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/skill-master.ts:1>) | 340 |
| module | [src/lib/storage.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/storage.ts:1>) | 146 |
| module | [src/lib/subscriptions-db.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/subscriptions-db.ts:1>) | 779 |
| module | [src/lib/telemetry/TraceRecorder.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/telemetry/TraceRecorder.ts:1>) | 123 |
| test | [src/lib/tests/AcceptanceTestSuite.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/AcceptanceTestSuite.ts:1>) | 281 |
| test | [src/lib/tests/offlineHiringPipelineValidation.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/offlineHiringPipelineValidation.ts:1>) | 12 |
| test | [src/lib/tests/runAcceptanceTests.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runAcceptanceTests.ts:1>) | 37 |
| test | [src/lib/tests/runE2eDbConcurrencyTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runE2eDbConcurrencyTest.ts:1>) | 653 |
| test | [src/lib/tests/runE2eHiringJourneyTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runE2eHiringJourneyTest.ts:1>) | 4 |
| test | [src/lib/tests/runE2eKillSwitchBudgetLiveTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runE2eKillSwitchBudgetLiveTest.ts:1>) | 331 |
| test | [src/lib/tests/runE2eLlmOutageTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runE2eLlmOutageTest.ts:1>) | 493 |
| test | [src/lib/tests/runE2eLoadTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runE2eLoadTest.ts:1>) | 342 |
| test | [src/lib/tests/runE2eSecurityTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runE2eSecurityTest.ts:1>) | 643 |
| test | [src/lib/tests/runE2eWorkerCrashTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runE2eWorkerCrashTest.ts:1>) | 446 |
| test | [src/lib/tests/runManagedHiringReferralAuditorTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runManagedHiringReferralAuditorTest.ts:1>) | 438 |
| test | [src/lib/tests/runPhase10GoLiveValidationTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runPhase10GoLiveValidationTest.ts:1>) | 4 |
| test | [src/lib/tests/runStagingValidationTest.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tests/runStagingValidationTest.ts:1>) | 4 |
| module | [src/lib/tools/SideEffectTools.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tools/SideEffectTools.ts:1>) | 190 |
| module | [src/lib/tools/ToolRegistry.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/tools/ToolRegistry.ts:1>) | 182 |
| module | [src/lib/whatsapp-auth.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/whatsapp-auth.ts:1>) | 161 |
| module | [src/lib/whatsapp-identity.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/whatsapp-identity.ts:1>) | 319 |
| module | [src/lib/whatsapp-onboarding.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/whatsapp-onboarding.ts:1>) | 736 |
| module | [src/lib/whatsapp-queue.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/whatsapp-queue.ts:1>) | 207 |
| module | [src/lib/whatsapp-rate-limiter.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/whatsapp-rate-limiter.ts:1>) | 61 |
| module | [src/lib/whatsapp.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/whatsapp.ts:1>) | 321 |
| module | [src/lib/workflows/FailureRecoveryRunner.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/workflows/FailureRecoveryRunner.ts:1>) | 70 |
| module | [src/lib/workflows/HiringPipeline.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/workflows/HiringPipeline.ts:1>) | 237 |
| module | [src/lib/workflows/RecoveryWorkerState.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/workflows/RecoveryWorkerState.ts:1>) | 74 |
| module | [src/lib/workflows/WorkflowEngine.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/workflows/WorkflowEngine.ts:1>) | 89 |
| module | [src/mocks/candidateProfileData.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/mocks/candidateProfileData.ts:1>) | 313 |
| module | [src/providers/index.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/providers/index.ts:1>) | 14 |
| module | [src/proxy.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/proxy.ts:1>) | 210 |
| module | [src/services/candidateProfileService.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/services/candidateProfileService.ts:1>) | 137 |
| module | [src/store/useAuthStore.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/store/useAuthStore.ts:1>) | 41 |
| module | [src/store/useCandidateStore.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/store/useCandidateStore.ts:1>) | 36 |
| module | [src/store/useJobCreationStore.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/store/useJobCreationStore.ts:1>) | 110 |
| module | [src/styles/index.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/styles/index.ts:1>) | 8 |
| test | [src/tests/agent-evidence-regression.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/agent-evidence-regression.test.ts:1>) | 50 |
| test | [src/tests/ai-worker-safety.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/ai-worker-safety.test.ts:1>) | 128 |
| test | [src/tests/audit-fixes.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/audit-fixes.test.ts:1>) | 525 |
| test | [src/tests/billing-invoices.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/billing-invoices.test.ts:1>) | 399 |
| test | [src/tests/candidate-evidence.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/candidate-evidence.test.ts:1>) | 52 |
| test | [src/tests/checkout-csp.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/checkout-csp.test.ts:1>) | 24 |
| test | [src/tests/email-provider.contract.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/email-provider.contract.test.ts:1>) | 73 |
| test | [src/tests/feature-workflow-regressions.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/feature-workflow-regressions.test.ts:1>) | 70 |
| test | [src/tests/hiring-pipeline-contract.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/hiring-pipeline-contract.test.ts:1>) | 117 |
| test | [src/tests/hiring-workflow.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/hiring-workflow.test.ts:1>) | 314 |
| test | [src/tests/logout-regression.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/logout-regression.test.ts:1>) | 24 |
| test | [src/tests/managed-hiring-join.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/managed-hiring-join.test.ts:1>) | 345 |
| test | [src/tests/mcq-assessment.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/mcq-assessment.test.ts:1>) | 617 |
| test | [src/tests/outbox-regression.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/outbox-regression.test.ts:1>) | 133 |
| test | [src/tests/payment-webhook-replay.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/payment-webhook-replay.test.ts:1>) | 51 |
| test | [src/tests/production-consumers.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/production-consumers.test.ts:1>) | 94 |
| test | [src/tests/production-hardening.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/production-hardening.test.ts:1>) | 224 |
| test | [src/tests/promo-code.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/promo-code.test.ts:1>) | 166 |
| test | [src/tests/recovery-worker-regression.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/recovery-worker-regression.test.ts:1>) | 112 |
| test | [src/tests/referrals.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/referrals.test.ts:1>) | 489 |
| test | [src/tests/suite.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/suite.test.ts:1>) | 261 |
| test | [src/tests/team-invitations.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/team-invitations.test.ts:1>) | 323 |
| test | [src/tests/test-safety-regression.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/test-safety-regression.test.ts:1>) | 54 |
| test | [src/tests/test-safety.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/test-safety.ts:1>) | 40 |
| test | [src/tests/video-resume-analysis.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/video-resume-analysis.test.ts:1>) | 76 |
| test | [src/tests/whatsapp.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/whatsapp.test.ts:1>) | 503 |
| test | [src/tests/workflow-engine-regression.test.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/tests/workflow-engine-regression.test.ts:1>) | 132 |
| module | [src/types/agreement.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/types/agreement.ts:1>) | 159 |
| module | [src/types/index.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/types/index.ts:1>) | 7 |
| module | [src/types/interview.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/types/interview.ts:1>) | 31 |
| module | [src/types/invoice.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/types/invoice.ts:1>) | 18 |
| module | [src/types/job.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/types/job.ts:1>) | 37 |
| module | [src/types/notification.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/types/notification.ts:1>) | 23 |
| module | [src/types/referral.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/types/referral.ts:1>) | 329 |
| module | [src/types/user.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/types/user.ts:1>) | 52 |
| module | [src/utils/aiRouter.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/aiRouter.ts:1>) | 256 |
| module | [src/utils/classNames.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/classNames.ts:1>) | 7 |
| module | [src/utils/currency.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/currency.ts:1>) | 9 |
| module | [src/utils/date.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/date.ts:1>) | 28 |
| module | [src/utils/index.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/index.ts:1>) | 10 |
| module | [src/utils/number.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/number.ts:1>) | 10 |
| module | [src/utils/performance.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/performance.ts:1>) | 17 |
| module | [src/utils/pricing.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/pricing.ts:1>) | 83 |
| module | [src/utils/string.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/string.ts:1>) | 11 |
| module | [src/utils/validation.ts:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/utils/validation.ts:1>) | 10 |
| module | [video-analysis-worker/download_models.py:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/video-analysis-worker/download_models.py:1>) | 36 |
| module | [video-analysis-worker/main.py:1](<C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/video-analysis-worker/main.py:1>) | 357 |

Full import/API reference metadata and line evidence are in BLUEPRINT_SOURCE_INVENTORY.json. Dynamic URLs, re-exports, runtime registration and computed dependencies require human tracing. Environment files and secrets were not inventoried.
