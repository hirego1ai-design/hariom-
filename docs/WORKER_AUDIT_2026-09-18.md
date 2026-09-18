# HireGo worker and production-wiring audit

Audit date: 2026-09-18  
Target topology: Vercel web/API, Supabase Hariom (`eqsxuwlnidexlgseuogu`), Railway recovery scheduler and video worker, Upstash Redis/QStash.

## Truth labels

- **Offline verified**: source, type checks, and deterministic tests passed locally. This is not a live-provider test.
- **Database verified**: Supabase project metadata/migrations were read from Hariom.
- **Deployment pending**: source is ready, but the target Vercel/Railway service or its environment was not inspected or deployed in this audit.
- **Provider E2E pending**: a real sandbox callback/delivery was deliberately not triggered, so no customer, payment, message, or invoice side effect occurred.

## Worker matrix

| Worker / event path | Trigger and owner | Durable state and replay boundary | Audit result |
| --- | --- | --- | --- |
| Recovery coordinator | Railway `run-recovery-scheduler.mjs` calls authenticated Vercel `/api/internal/workflows/recover`; Upstash lease prevents overlapping passes | Redis owner-token lease and heartbeat; bounded 40-second pass | Offline verified; Railway deployment and heartbeat proof pending |
| PPH day-25 invoicing | Recovery coordinator runs `PphBillingWorker` | Due placement claim, immutable commercial snapshot, unique placement/invoice, atomic invoice transition | Offline verified and Hariom migration present; staging day-25 E2E pending |
| System-event outbox | Recovery coordinator registers production consumers and polls oldest eligible rows | Database claim timestamp, retry count, consumer checkpoint, deterministic notification IDs, DLQ | Offline verified; live backlog and deployed heartbeat pending |
| Budget/workflow recovery | Recovery coordinator expires stale reservations and fails stale workflows | Conditional database updates; stale workflows create a transactional dead-letter record | Offline verified; production execution pending |
| WhatsApp inbound | Meta webhook persists an event, QStash invokes internal processor, recovery pass republishes stranded rows | Provider event ID, database claim timestamp, attempt/backoff fields, terminal DLQ; settlement is owner-fenced | Offline verified; Meta/QStash credentials and sandbox message E2E pending |
| Security-audit SIEM delivery | Audit write and outbox insert share a transaction; recovery pass drains the audit outbox when SIEM is configured | Lease ID, lease expiry, payload hash/event ID, exponential retry, terminal failure | Offline verified; SIEM endpoint and receiver-side dedup E2E pending |
| Video analysis | Candidate API persists job and waits for worker acceptance; Railway CPU worker calls an authenticated Vercel callback | Unique job key and terminal callback compare-and-set protect stored results | Callback/dispatch safety improved; durable compute queue and deployed worker E2E pending |
| Referral warranty reconciliation | Vercel Cron invokes authenticated GET daily at 02:00 UTC | Conditional `LOCKED` to `ELIGIBLE` transition; batch capped at 100 | Source wired in `vercel.json`; deployment/cron-run proof pending |
| Subscription checkout and webhook | Employer checkout creates an order; signed provider webhook performs entitlement transition | Persisted purchase snapshot, exact provider/order/company/amount/currency checks, atomic order claim and credit grant | Offline verified; Razorpay sandbox checkout/webhook E2E pending |
| Invoice receipt review | Employer submits private receipt; administrator reviews | Tenant/admin scope, content-signature checks, compare-and-set review, atomic audit event | Offline verified; storage malware/quarantine workflow remains pending |

## Fresh Hariom database evidence

- Migration history contains the AI credits, security-audit outbox, public-table RLS, PPH joining/day-25, invoice pending-verification, and subscription purchase-snapshot migrations.
- Supabase reports RLS enabled on all 80 application tables in `public`.
- Those application tables intentionally have no client RLS policies: this blocks direct anon/authenticated Supabase access while the server-side database role performs tenant checks in the API. Do not add permissive client policies without changing the architecture.
- Supabase separately flags `public._prisma_migrations` because RLS is disabled on that migration-history table. No automatic change was made; enabling RLS is a release-owner decision because migration tooling must be verified afterward.
- Supabase performance advisor reports informational missing-index findings. The database currently has no production traffic evidence in this audit, so indexes should be selected from measured query plans rather than added blindly.
- Direct aggregate/backlog SQL could not be completed because the connector's PostgreSQL credential failed authentication. Project metadata, migrations, tables, and advisors remained accessible.

## Confirmed architectural gaps

1. The six-stage `HiringPipeline` is a tested internal library, not a live automatic hiring workflow. The product readiness endpoint correctly reports `NOT_IMPLEMENTED`. Direct agent dispatch currently exposes only bounded employer advisory operations; it must not be described as autonomous end-to-end hiring.
2. The Python video worker uses process-local background tasks rather than a durable compute queue. Callback replay can be safe, but a worker/container crash can still lose in-flight compute. Production needs a durable job consumer, concurrency control, stale-job reconciliation, and a retry/requeue policy.
3. Payment provider reconciliation is incomplete for ambiguous timeouts after provider order creation. A real provider status-by-order implementation is required before automatically releasing a stale promo reservation. Refunds, cancellations, and chargebacks are not yet modeled.
4. Receipt uploads still need malware scanning, quarantine/retention policy, and durable cleanup of orphaned files.
5. Production environments and deployed services remain unverified until the exact Vercel and Railway projects are authenticated, linked, configured, deployed, and observed.

## Release gates

1. Link the exact Vercel and Railway projects; configure secrets from the tracked `.env.example` inventory without copying local files.
2. Deploy Vercel and the Railway scheduler using `Dockerfile.scheduler`; verify authenticated recovery health and at least two successful heartbeats.
3. Deploy the video worker only after its durable-processing limitations are accepted or replaced.
4. Run non-customer staging E2E for PPH day-25, subscription checkout/webhook, receipt review, WhatsApp duplicate delivery, video callback replay, SIEM retry, and referral cron concurrency.
5. Inspect queue ages, retry counts, failed/DLQ rows, invoice/payment invariants, and audit hashes; roll back if any invariant fails.
6. Obtain explicit approval before enabling RLS on `_prisma_migrations` and verify Prisma migration operations afterward.

No real payment, invoice, WhatsApp message, SIEM event, provider charge, or customer-data mutation was performed by this audit.
