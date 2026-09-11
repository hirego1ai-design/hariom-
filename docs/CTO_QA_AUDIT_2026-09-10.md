# HireGo CTO / security / QA audit — 10 September 2026

> Historical checkpoint. See [11 September follow-up](CTO_QA_FOLLOWUP_2026-09-11.md) for completed candidate-data/worker fixes and final build/test results. The pending list below describes the earlier checkpoint, not current completion status.

## Release verdict

Not yet verified for production release. This is a source-level audit plus isolated regression checks, not a claim that every feature works. Changes are local and have not been deployed in this audit session. Existing user changes were preserved; intentionally removed MFA was not restored.

## Implemented in this pass

| Area | Change | Evidence |
| --- | --- | --- |
| AI execution | Atomic credit/reservation accounting; kill switches and audit persistence fail closed; uncertain paid calls are not blindly retried; rejected output withheld | 12 isolated worker subtests |
| Payments | Atomic order fulfillment prevents duplicate credits; purchased quotas provisioned; same-plan renewal retains time; checkout uses server-issued amount/key; provider CSP fixed | Feature, webhook replay and CSP regressions |
| Hiring UI | Retrieves all application pages; stage changes use application IDs and await persistence | Feature regression tests |
| Workflow engine | Durable creation/unique step claims required before side effects; completed results replayed; checkpoint failures cannot report success | 9 isolated workflow tests |
| Hiring pipeline | Requires job/application ownership and input evidence before execution; passes required stage inputs; completion and outbox event committed together | Source review; full pipeline integration remains untested |
| Queue delivery | Owned leases, bounded retries, atomic terminal failure/DLQ; audit lease renewal before delivery | 6 outbox tests plus worker lease test |
| Admin queue screen | Removed fabricated counts and fake purge action; authenticated database counts and explicit unknown worker liveness | Compilation/source review; authenticated UI still needs staging test |
| Test safety | Destructive suite entry points require explicitly opted-in disposable localhost database; provider transport blocked in isolated tests | Safety regressions |
| Logout | Invalid/expired tokens still clear the session cookie | 2 regressions |
| Agent reporting | Missing security evidence rejected; candidate matching no longer fabricates compatibility scores and requires company scope | Source review; candidate ranking algorithm is not implemented |

The new local audit runner deliberately replaces deployment credentials with unusable local values. It builds into `.next-audit`; successful builds do not establish database/provider health.

## Database read-only verification

Target inspected: Supabase `Hariom`, project `eqsxuwlnidexlgseuogu`.

- No public application tables were found without RLS (migration metadata table excluded).
- `anon` and `authenticated` cannot SELECT the public User table through table privileges. These privileges were already revoked; do not describe this as a newly closed proven public-data leak.
- The three migration names below remain absent from Prisma's ledger, although their schema changes were previously applied through Supabase:
  - `20260905090000_add_ai_agent_credits`
  - `20260905100000_add_security_audit_outbox`
  - `20260908093000_enable_public_table_rls`
- The configured session-pooler endpoint was identified without printing credentials. A read-only connection failed with `SELF_SIGNED_CERT_IN_CHAIN`. Fix trusted CA configuration or use a trusted deployment runner; do not disable certificate verification. The earlier blanket statement that poolers cannot support this operation was too broad.
- Reconcile with supported Prisma `migrate resolve --applied` only after verifying the intended deployment target. Do not blindly run every pending migration; a retired assessment migration also requires review.

## Still pending / release gates

1. **Data truthfulness:** employer candidates API copies match score into assessment/interview scores and derives video availability from resume URL. Proactive search also includes invented experience/salary/acceptance estimates. Replace with measured data or an explicit unavailable state, including consumers. Do not pitch these as measured AI outcomes.
2. **Worker operations:** establish scheduler/consumer deployment and heartbeat evidence. FailureRecoveryRunner has no identified production caller. Queue counts alone cannot prove workers are running. Consumers must deduplicate at-least-once delivery.
3. **Pipeline integration:** the six-stage pipeline is referenced by test harnesses, not an identified production caller. Updated evidence requirements need real orchestration wiring. Old validation harnesses must supply valid fixtures before their pipeline assertions can run.
4. **Migration bookkeeping / TLS:** reconcile the three ledger entries using a properly trusted connection. No ledger write was made in this pass.
5. **Real staging tests:** candidate/employer/admin authentication and tenant separation; register/reset/logout; job application and stage persistence; successful/failed/refunded payment and real webhook retries; AI budgets/provider failure; resume/video upload and processing; assessment/interview lifecycle; notifications; worker crash/recovery. Use disposable accounts/data and sandbox providers, not live customer records.
6. **Operations:** verify deployment secrets, SIEM endpoint and scheduler, backups/restore, monitoring, rate limits under concurrency, and provider request timeouts. Approval identity alone in WorkflowEngine is not authorization; production callers must enforce role/ownership.
7. **Complete UI coverage:** route compilation is not manual/browser feature coverage. No blanket assertion is made for all pages, accessibility, mobile behavior, performance or load capacity.

CodeRabbit CLI was unavailable; no CodeRabbit review result is claimed. No live payment, email, WhatsApp, AI purchase or destructive database test was performed.

## Verification log

- Combined offline security/payment/worker/safety regressions: **47 passed, 0 failed**.
- Additional workflow regression tests: **9 passed, 0 failed**.
- Repository lint: **0 errors, 4 warnings** (load-test export, typing page disable directive, two proactive-search expression warnings).
- Git whitespace check: passed; Windows line-ending notices only.
- Initial isolated production build passed. Final post-workflow build and type verification are being checked; see the final handoff for their actual outcome.

Regression tests use mocks and do not establish real PostgreSQL concurrency or provider interoperability. Investment/demo readiness and production security sign-off are separate decisions.
