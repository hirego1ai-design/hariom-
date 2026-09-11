# HireGo — CTO architecture and business-workflow blueprint
Audit date: 11 September 2026. Repository: Hirego3.0. Source baseline observed at handoff: cda419d.

## 1. Executive conclusion

HireGo has substantial implementation for a multi-role hiring platform: web onboarding, employer jobs/applications, assessments, practice interviews, managed-hiring agreements, subscription/payment infrastructure, AI execution controls, and operational recovery components.

It is **not yet evidenced as a fully connected autonomous end-to-end hiring service**. Several commercially important transitions are disconnected or inconsistent. The most urgent examples are PPH joining-to-invoice inputs, invoice receipt status, subscription plan identifiers, job draft publication, and candidate paid-service fulfilment.

The intended business is enterprise/MNC managed hiring first, alongside employer self-service subscriptions and candidate services. These are three distinct commercial journeys; they should not be treated as one subscription funnel.

This is an architecture and source audit, not a production security certification or a claim that every feature has passed testing. No application fixes, deployments, catalog seeding or database changes were performed during this blueprint task.

## 2. Coverage and evidence standard

The generated inventory covers 559 source files, 253 pages, 125 API route files, 180 named HTTP handlers, 40 test files and 79 Prisma models. Counts are source inventory, not working-feature counts.

Critical candidate, employer, PPH, subscription, payment, AI and recovery paths were inspected in depth. Every listed page was inventoried; every button was **not** exercised with authenticated users. Native applications and external infrastructure outside this repository are not covered.

Evidence labels:

- **Implemented:** relevant executable source exists; this does not imply a live successful transaction.
- **Connected:** a caller and downstream persistence/execution path were identified.
- **Gap:** inspected code contains a mismatch or a required connection was not identified.
- **Unverified:** requires an authenticated scenario, deployment check or external provider evidence.
- **Proposed:** target architecture, not existing functionality.

Companion files:

- [Complete human-readable source inventory](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/docs/BLUEPRINT_SOURCE_INVENTORY.md)
- [Machine-readable inventory](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/docs/BLUEPRINT_SOURCE_INVENTORY.json)

Earlier work recorded 97 offline regression checks and 13 anonymous local HTTP checks passing, plus a production build before the newest event-consumer changes. These are historical, limited-scope results, not fresh whole-portal certification. CodeRabbit was unavailable and no CodeRabbit review result is claimed.

## 3. Business blueprint: three separate models

| Model | Customer and owner | Intended journey | Revenue event |
|---|---|---|---|
| Managed PPH | Corporate/MNC employer; HireGo advisor operates recruitment | Requirement → agreed commercial terms → screening → shortlist → scheduling → employer final interview/feedback → placement | Successful placement under the signed contract; exact trigger must be defined |
| Employer subscription | Employer/recruiter operates own hiring | Select plan → verified payment → quotas/access → jobs → talent search/applications → shortlist → interviews → hire | Subscription purchase/renewal; optional AI consumption |
| Candidate services | Candidate | Onboard → profile/evidence → readiness/practice/services → applications/interviews | Optional paid service/credits; fulfilment and refunds must be explicit |

A PPH contract is not automatically a subscription. Corporate managed-hiring customers need their own clear entitlement policy for screening and agents.

Candidate practice results should remain distinct from employer hiring assessments. An AI video delivery score is not a validated measure of job competence.

## 4. Current architecture

| Layer | Existing implementation | Responsibility / limitation |
|---|---|---|
| Interfaces | Next.js App Router pages for candidate, employer, admin and marketing | Browser application; native Android/iOS source not identified |
| Server | Next.js API route handlers | Authentication, ownership, validation and business operations; orchestration is distributed across routes |
| Domain/data access | Helpers under src/lib plus Prisma calls within routes | Jobs, applications, agreements, billing, services, AI and operations |
| Primary data | Prisma/PostgreSQL, hosted Hariom Supabase database | Relational state, transactions and workflow records |
| Session/coordination | Custom JWT cookie/bearer sessions and Redis | Revocation/version checks, limits and worker coordination |
| AI | OpenAI routing, registered agents, execution/budget controls | Bounded task execution, not a universal autonomous planner |
| Media | Private S3-compatible storage; Python FastAPI video analysis service | Separate deployment and callback boundary |
| Async operations | Database outboxes, recovery route, WhatsApp queue, video job records | Multiple mechanisms with different retry/durability guarantees |
| Delivery | Next standalone Docker build and CI checks | CI workflow name says deployment, but inspected workflow has no deployment job |

Core request flow:

Browser or WhatsApp → authenticated server entrypoint → role/company/resource checks → domain operation → PostgreSQL.

AI-enabled operations may additionally call the execution loop or call the model router directly. That distinction matters: not every AI route receives the same budget, entitlement and lifecycle controls.

### Identity and tenancy

User roles include CANDIDATE, EMPLOYER, RECRUITER and ADMIN. Employer tenancy resolves through EmployerProfile.companyId. No dedicated managed-hiring advisor role was identified.

The application uses custom JWT authentication, not Supabase Auth as its primary session system. Production session verification includes authoritative user role/session-version checks and Redis-backed revocation controls.

Existing application tables were previously verified with RLS enabled and no browser anon/authenticated read grants. This is consistent with a server-mediated Prisma design, not proof of tenant isolation: server routes still must validate ownership because privileged database access bypasses browser RLS.

Do not add broad public RLS policies simply to make browser requests work. Conversely, do not treat RLS alone as protection against a server-side authorization bug.

## 5. Candidate journey: designed versus connected

| Step | Current source behaviour | Remaining connection or proof |
|---|---|---|
| Web registration/profile | Registration, sessions, profile and onboarding surfaces exist | Complete authenticated onboarding scenario |
| WhatsApp registration | State machine collects name, email, role, experience and location; supports verification and web handoff | Not a WhatsApp video-to-assessment-to-job journey |
| Android/iOS | No native project identified in this repository | Provide separate repositories/builds if they exist |
| Video upload | Ownership/type checks, private file reference, VideoResume and VideoAnalysisJob records | Dispatch durability and operational worker deployment |
| Video analysis | Transcription and heuristic communication/delivery metrics; callback persists results | No identified automatic profile-skill/readiness/question/matching continuation |
| Questions/readiness | Job-linked MCQ assignments and platform readiness templates; server-side grading | Not adaptive questions derived from uploaded video |
| Practice interview | Role/profile-based model questions, answer feedback, practice session completion | Separate from paid-service fulfilment; no mandatory pre-interview dependency |
| Job matching | Rules-based skills/experience comparison and recommendation endpoint | Not comprehensive video-aware ranking of all jobs |
| Apply | Application creation with job-readiness gate where configured | Full multi-tenant E2E and duplicate/race checks |
| Candidate paid services | Catalog, wallet ledger and atomic service request/debit | Purchase is NOT_CONFIGURED; no fulfilment consumer identified |

### Video and scoring boundaries

The Python worker uses transcription and formula-based metrics such as words per minute, fillers, pauses and face presence. These are engineering heuristics, not demonstrated predictive hiring assessments.

The completion callback updates video/job records. A connected sequence of “video → evidence extraction → adaptive assessment → validated skills profile → refreshed matching” was not identified.

Recommended jobs are scored after selecting a limited set of 20 active jobs, so this is not a global ranking across the complete active catalog. Missing job requirements can produce overly strong rules scores.

Application.matchScore and aiSummary can be written by different scoring paths. A single mutable field does not preserve whether a score came from deterministic matching or AI resume evaluation.

### Candidate services commercial gap

Service requests can debit a wallet and create REQUESTED usage records. The inspected source did not identify the downstream executor that completes those requests or links them to practice sessions, nor a failed-fulfilment refund lifecycle.

Mock interview routes call the AI router directly and do not appear to charge the candidate service wallet. Therefore the paid catalog and the usable practice feature are not yet one proven commercial workflow.

## 6. Employer self-service hiring

Intended sequence:

Employer registration/company → verified plan payment → quota allocation → draft/publish job → applications or licensed talent search → shortlist → schedule interview → feedback → hiring decision.

Current implementation includes job creation, application lists/stage updates, interview scheduling, room signalling and feedback.

Important differences:

- A draft request can reach the job-generation path that creates an ACTIVE job; job-credit debit depends on the request being ACTIVE. Draft and publication semantics are inconsistent.
- The API permits RECRUITER in a path whose downstream gateway permits EMPLOYER/ADMIN, creating a role mismatch.
- Employer candidate views largely derive from applications already linked to that company. This is not evidence of a separate, plan-controlled global talent database product.
- Subscription flags and quotas exist, but there is no demonstrated universal permission/usage gate across every employer action.
- Interview scheduling persists the interview and attempts communications; requested email delivery is not the same as confirmed delivery.
- Interview room signalling is database-backed in current code. Earlier reports describing memory-only signalling are outdated.
- Real WebRTC calls across corporate networks, TURN configuration and final interview feedback flow still require live verification.

## 7. Managed PPH hiring

Existing building blocks include requirements, agreement templates/contracts, managed-hiring pages, candidate tracking, interviews, joining, invoices and receipt submission.

The current operational flow is closer to several connected features than a fully enforced placement state machine.

### Confirmed PPH inconsistencies

1. The joining screen sends annualCtc, but the joining API schema does not accept it and reads Application.annualCtc instead. No application CTC-setting path was identified in the source search. Normal joining can fail with missing commercial terms.
2. Joining marks the application HIRED and creates an invoice, but there is no distinct OFFERED/JOINED/PLACEMENT_VERIFIED business lifecycle.
3. Generic stage updates can set HIRED separately, without automatically producing the same PPH commercial outcome.
4. Invoice receipt handling writes PENDING_VERIFICATION, while the PaymentStatus enum contains PAID, UNPAID and OVERDUE. The cast hides a runtime database incompatibility.
5. Rich managed-hiring policy settings are persisted through the admin configuration route, but the joining path uses immediate invoicing and a fixed 30-day due date instead of consuming those settings.
6. Request idempotency is not the same as unique placement billing. Different keys can invoice the same application again; a stable placement-level uniqueness constraint is needed.
7. Requirement-scoped candidate tracking and a dedicated advisor ownership boundary were not clearly identified.

### Proposed PPH target — not implemented by this document

Requirement → approved commercial agreement → candidate submission → employer shortlist → scheduled interview → employer feedback → approved offer/CTC → confirmed joining/contractual milestone → one placement invoice → payment reconciliation → warranty/replacement tracking.

Create explicit, auditable records for:

- Requirement, advisor assignment and candidate submission to that requirement.
- Agreed fee policy/version and immutable accepted offer compensation.
- Placement milestone evidence, approving actor and effective date.
- Invoice linked to the placement with database uniqueness.
- Payment verification, rejection, reconciliation and credit note/refund.
- Warranty/replacement period governed by the signed agreement.

AI may assist screening and summarisation. Employer decisions and commercial approvals require identifiable human ownership.

## 8. Subscription plans and credits

### Live configuration finding

Read-only inspection of Hariom during this audit returned empty tables for SubscriptionPlan, AiServiceCost and CandidateServiceCatalog. This is a snapshot of that project, not proof about any other deployment.

Code defaults are therefore **not live purchasable product configuration**. No catalog rows were inserted.

### Code-defined fallback plans

All amounts below are INR and are source defaults, not approved live pricing.

| Plan | Price | Validity | Jobs | Resume unlocks | AI interviews | Applications | Downloads | Background checks |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Pay-As-You-Go / Day Pass | 4,999 | 1 month | 1 | 5 | 2 | 25 | 10 | 1 |
| Monthly Growth Pro | 24,999 | 1 month | 5 | 50 | 20 | 200 | 50 | 5 |
| Enterprise Annual SLA | 199,999 | 12 months | 50 | 500 | 200 | 2,000 | 500 | 50 |

Default feature labels:

- Day Pass: JOB_POSTING, AI_SCREENING.
- Growth: JOB_POSTING, AI_SCREENING, MANAGED_HIRING, VIDEO_INTERVIEWS.
- Enterprise: ALL_FEATURES, DEDICATED_ACCOUNT_MANAGER, CUSTOM_SLA.

“Day Pass” versus one-month validity and “unlimited” enterprise description versus finite quotas need product decisions.

Default AI-service entries specify resume parsing 1 credit, video service 3 credits and JD generation included. However, the agent entitlement layer charges one AI-agent credit for its billable agent calls rather than deriving every price from that table. A distinct AI-agent allowance is also derived from the AI interview quota rather than an independent plan field.

### Payment and activation architecture

Server checkout creates payment orders and verifies commercial inputs. Verified webhook processing is designed to claim an order once and grant subscription credits transactionally. Direct activation via employer subscription POST is blocked.

Critical incompatibility: admin plan creation generates IDs such as plan-<timestamp>, while checkout requires a UUID planId. Admin-created plans cannot pass that checkout validation.

Provider adapters/configuration exist for multiple gateways. That is not proof that each gateway has passed real checkout, signed webhook, refund and renewal tests.

Quota counters and feature labels need an explicit action-by-action enforcement matrix. Zero-valued quotas must not be replaced by fallback defaults.

## 9. AI autonomy: what actually executes

| Component | Current role | Boundary |
|---|---|---|
| AgentRegistry | Six named agents | Registry is not an autonomous business planner |
| ExecutionLoop | Context validation, lifecycle, kill switch, budget/entitlement reservation, evaluation and settlement | Not every AI endpoint enters this loop |
| Resume evaluator | Model-assisted evaluation against candidate/job context | Requires score provenance and quality validation |
| JD generator | Generates job text | Publication must remain a separate validated transition |
| Mock interview copilot | Registered question-assistance agent | Actual candidate practice routes use a separate direct-model flow |
| Candidate matchmaker | Returns a small tenant-scoped candidate set | Not autonomous global ranking |
| Communication coach | Text/delivery heuristics | Not a validated employability assessment |
| Security judge | Evaluates supplied indicators | Not an independent comprehensive security audit |
| HiringPipeline | Fixed six-stage implementation with guarded context | No production caller identified; readiness reports not implemented |
| Event consumers | Persist deterministic in-app notifications for three event types | Not full recruitment automation |

The PLANNING lifecycle label does not imply a model dynamically plans and executes the entire hiring business. The existing core is bounded task orchestration.

Evaluation is also limited: base confidence/schema checks and keyword fairness screening are not factual verification, bias certification or hiring validity evidence.

Some tool/delegation/shadow-execution infrastructure is primarily test-referenced. Legacy side-effect tool registration includes simulated-success behaviour and unsupported application statuses. Do not activate it wholesale as a shortcut to autonomy.

### Proposed autonomy boundary

Use typed business commands with explicit tenant, actor, permission, cost, idempotency and audit context. Agents propose or execute narrowly permitted actions. Require approval for employer rejection/selection, placement billing and other consequential transitions.

Persist evidence and model/version provenance for each score. Preserve rules scores, interview assessment scores and video delivery observations separately. Provide human review and a correction/appeal path.

## 10. Workers and workload design

| Workload | Existing mechanism | Main operational gap / test |
|---|---|---|
| General recovery | Dedicated authenticated endpoint, Redis lease/heartbeat, bounded scans | Deployment/scheduling and crash-recovery drills |
| Application/job/pipeline events | Database outbox and idempotent in-app notification consumers | Unsupported event handling and queue starvation policy |
| Security audit delivery | Separate SIEM delivery/retry worker | Configure receiver and verify delivery/failure evidence |
| WhatsApp | Separate webhook/onboarding/queue machinery | Real inbound signature, delivery and identity handoff tests |
| Video | Database job plus Python background task and callback | Durable dispatch/retry; worker restart and callback failure recovery |
| Candidate purchased services | REQUESTED usage records | No identified fulfilling worker |
| Full hiring pipeline | Guarded library workflow | Production trigger/approval/orchestration is not connected |

Video upload dispatch is fire-and-forget after persistence. Python background tasks are process-local; a stored job record alone does not guarantee redelivery. Callback retries, late callback ordering and failure recovery need explicit ownership.

Recommended workload architecture: durable jobs per workload, bounded concurrency, leases, retry/backoff, dead-letter state, idempotent side effects, correlation IDs, timeouts and observable completion. Keep billing and placement transitions transactionally authoritative.

## 11. Prioritised gaps

Priority describes risk/importance, not a claim that exploitation or a failed live transaction was observed.

| ID | Priority | Finding | Completion criterion |
|---|---|---|---|
| G01 | P0 commercial | Live plan and service catalogs empty | Approved catalogs configured and purchasable/usable in the intended environment |
| G02 | P0 commercial | Plan ID format conflicts with checkout UUID schema | Admin-created plan completes verified test purchase |
| G03 | P0 commercial | PPH annual CTC input/persistence mismatch | Approved terms persist and joining invoices correctly |
| G04 | P0 commercial | Receipt status incompatible with Prisma enum | Receipt → review → verified/rejected payment lifecycle passes |
| G05 | P1 | Draft request can publish ACTIVE without consistent quota debit | Draft stays unpublished; publish atomically checks/debits entitlement |
| G06 | P1 | Duplicate placement invoicing possible across request keys | One invoice business invariant survives concurrent requests |
| G07 | P1 | PPH configuration not wired to joining invoice policy | Contractual trigger, fee and due date applied from approved snapshot |
| G08 | P1 | Candidate paid services have no identified fulfilment/refund path | Purchase/debit → execution → result or refund tested end to end |
| G09 | P1 | Practice bypasses paid-service/budget orchestration | Explicit free/paid policy enforced in one authoritative path |
| G10 | P1 | Video→assessment→profile→matching continuation absent | Evidence pipeline runs with provenance and failure states |
| G11 | P1 | Full hiring pipeline not production-connected | Authorised trigger, approvals, safe retries and status UI proven |
| G12 | P1 | Video dispatch/background execution not durably recovered | Restart/timeout/callback failure drills pass |
| G13 | P1 | Quota/role/feature enforcement inconsistent | Action-by-action permission and credit tests, including recruiter |
| G14 | P1 operational | Backup screen simulates success using a timer | Actual backup job/status and documented successful restore drill |
| G15 | P1 operational | CI workflow has no deployment stage | Identified deployed revision and release/rollback process |
| G16 | P2 | Mixed score provenance and limited recommendation candidate set | Separate score types; deliberate searchable/ranked corpus |
| G17 | P2 | Native channels and global talent database not evidenced | Repository/product boundaries documented; real implementations verified |
| G18 | P2 | Notification response can imply delivery not confirmed | Queued/sent/delivered/failed states accurately exposed |

P0 here means blocks confidence in the stated commercial launch journey. It is not a vulnerability severity rating.

## 12. Source evidence map

Paths below point to current source; the inventory contains per-file and many per-handler line references.

| Area | Primary source |
|---|---|
| Database entities and enum contract | [schema.prisma](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/prisma/schema.prisma) |
| Auth / tenancy | [auth.ts](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/auth.ts), [routeAuthorization.ts](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/routeAuthorization.ts) |
| PPH UI and server contract | [Joining page](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/employer/managed-hiring/join/page.tsx), [Joining API](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/managed-hiring/join/route.ts) |
| Invoice status | [Receipt API](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/employer/billing/invoices/[id]/receipt/route.ts), [Invoice persistence](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/invoices-db.ts) |
| Plan defaults / creation | [subscriptions-db.ts](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/subscriptions-db.ts) |
| Checkout contract | [Checkout API](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/payments/checkout/route.ts) |
| Agent charging | [AiEntitlements.ts](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/governance/AiEntitlements.ts) |
| WhatsApp journey | [whatsapp-onboarding.ts](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/whatsapp-onboarding.ts) |
| Video start | [Video API](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/video-resume/route.ts) |
| Video processing | [Python worker](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/video-analysis-worker/main.py) |
| Candidate purchasing status | [Credits API](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/credits/route.ts) |
| Service request | [Service request API](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/services/[serviceKey]/request/route.ts) |
| Readiness | [Readiness API](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/api/candidate/readiness/route.ts) |
| Agent execution | [ExecutionLoop.ts](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/agents/ExecutionLoop.ts) |
| Hiring orchestration | [HiringPipeline.ts](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/workflows/HiringPipeline.ts) |
| Event execution | [ProductionConsumers.ts](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/lib/events/ProductionConsumers.ts) |
| Simulated backup | [Backup/recovery page](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/src/app/admin/system/backup-recovery/page.tsx) |
| Build/release workflow | [deploy.yml](C:/Users/RaAz/OneDrive/Desktop/h#/Hirego3.0/.github/workflows/deploy.yml) |

## 13. Verification required before promising corporate readiness

| Scenario | Required proof | Status in this blueprint |
|---|---|---|
| Candidate onboarding | Real web and WhatsApp identity handoff, consent and profile persistence | Source traced; full scenario unverified |
| Video journey | Upload, restart recovery, callback, visible truthful analysis | Partial implementation; continuation gaps |
| Assessment | Assignment, grading, attempt limits and application readiness gate | Source exists; authenticated E2E unverified |
| Practice service | Payment/credit policy, session, result, failure/refund | Disconnected commercial flow |
| Subscription | Admin plan → checkout → signed webhook → exact quota grant | Blocked by identified config/ID gaps |
| Employer job | Draft, publish, quota race, recruiter permissions | Identified mismatch |
| PPH placement | Requirement → interview → feedback → approved terms → joining → unique invoice | Identified commercial lifecycle gaps |
| Invoice payment | Upload receipt → review → verified payment | Enum mismatch |
| Tenant security | Cross-company IDs, files, interviews, exports, admin boundaries | Needs complete adversarial authenticated matrix |
| Recovery | Worker kill/restart, duplicate events, timeout, dead letter | Components present; deployment drills unverified |
| Operations | Restore backup, rollback, monitoring and provider outage | Not proven by UI or CI naming |

Use dedicated test tenants and provider test modes. Do not test with real candidate private data, send real recruitment messages or create real charges without explicit scope.

The three previously reconciled Supabase migration records are **not pending again**. Historical migration-chain drift and local certificate verification are separate concerns; do not blindly rerun migrations or disable SSL verification.

## 14. Recommended delivery sequence

1. Lock business rules: PPH charge trigger, approved CTC owner, replacement/warranty terms, candidate free/paid services and final plan catalog.
2. Fix commercial invariants: catalog/plan IDs, PPH terms and unique invoice, receipt states, draft/publish quota transition.
3. Connect candidate service fulfilment and separate assessment/score provenance.
4. Add the missing orchestration links with durable jobs and human approvals; do not expose test-only side-effect tools as production automation.
5. Run complete authenticated journeys and tenant-isolation tests on staging; verify the deployed revision and external providers.
6. Prove recovery, backup restore, billing reconciliation and support operations before enterprise production signoff.

## 15. Decisions needed from the founder

- What precisely earns the PPH fee: accepted offer, first joining day, or completed retention period?
- Who approves annual CTC and joining evidence, and can the employer dispute them?
- What replacement/warranty/refund terms must the platform enforce?
- Which candidate services are optional paid products, and which readiness tasks are required but free?
- Do PPH contracts include agent usage independently of employer subscriptions?
- Are the code-default prices and quotas approved, or placeholders?
- Do separate Android/iOS repositories exist?
- Should an advisor be a dedicated role with assigned corporate accounts and approval limits?

These decisions change the correct implementation. They should be settled before polishing screens is mistaken for completing the hiring operating model.

