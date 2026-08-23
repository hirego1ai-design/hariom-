# Production Hardening Delta Checklist

## Baseline

- [x] Baseline fetched from `origin/main`: `7cb99ba46807c330cde1f1f88079a39236c23d4a`.

## A. Verified Existing — No Code Change

- [x] Public registration roles: candidate forced to `CANDIDATE`; employer forced to `EMPLOYER`.
- [x] Production authentication safety: JWT secret, MOCK_DB, development bypass, plaintext-password fallback, explicit session fields, and distributed session-revocation enforcement.
- [x] OTP: cryptographic generation, PostgreSQL authority, resend cooldown, attempt limit, and lockout.
- [x] Tenant controls: application ownership, agent dispatch authorization, proctoring persistence/interview requirement/candidate ownership/company scoping.
- [x] Payment controls: mandatory provider signature verification, payment-order provider binding, authoritative amount, idempotency, transaction handling, and company-scoped status.
- [x] Upload validation: MIME/signature/size protections plus private metadata, authorization, and signed production delivery.
- [x] AI router truthfulness: OpenAI-only production routing.
- [x] AuditLog PostgreSQL authority.
- [x] WhatsApp preservation: Meta Cloud API, timing-safe HMAC, provider-ID dedupe, OTP account linking, candidate-only account creation, unverified new email, minimized raw payload, single-use five-minute handoff, normal test-suite inclusion, and configurable Graph version.

## B. Patch Required

- [x] Remove unbounded `inMemoryAuditLogs` regression while preserving PostgreSQL as source of truth.
- [x] Add one shared Upstash Redis abstraction with explicit production failure behavior.
- [x] Replace API rate-limit Map with atomic Redis counters, TTL, safe Vercel client identity handling, and 429 retry hints. Cross-instance production verification remains external.
- [x] Replace WhatsApp waId/OTP rate-limit Map storage with the shared Redis layer and wire OTP limiting into the real linking flow.
- [x] Replace WhatsApp in-memory queue/timer worker with durable PostgreSQL state plus QStash dispatch and protected worker route.
- [x] Make webhook HTTP 200 contingent on durable inbound acceptance; do not acknowledge persistence failure.
- [x] Correct WhatsApp outbound failure/retry state, Retry-After/timeout/backoff handling, and PII-safe persisted failure reasons.
- [x] Validate `META_GRAPH_VERSION` in production; stream-limit webhook bodies before materialization.
- [x] Patch handoff persistence failure, logging hygiene, replay safety, and URL leakage controls.
- [x] Add centralized email-verification requirements for sign-in and OTP-issued sessions.
- [x] Private object storage: production adapter, metadata, authorization, signed download URLs, deletion support, and non-public development storage.
- [x] Replace process-local interview signaling with shared database state, TTL cleanup, reconnect polling, and configured authenticated TURN.
- [x] Implement durable JWT session revocation and password-reset invalidation.
- [x] Add Redis-assisted OTP/login-abuse controls and bounded development behavior.
- [x] Audit agent relationship validation and retain server-derived tenant context.
- [x] Harden payment checkout/webhook controls: provider enablement, provider/order binding, signature requirement, bounded body, amount and idempotency enforcement.
- [x] Build sensitive-route security matrix through common authz, rate-limit, bounded-JSON, audit, and tenant-control helpers.
- [x] Add actual streamed body-consumption limits for JSON and webhook routes; upload size/type validation is enforced at the upload boundary.
- [x] Create centralized production environment helpers and exact production configuration documentation.
- [x] Review PostgreSQL schema/migrations and add indexes for new private-file, signalling, and durable-job access paths.
- [x] Restore required CI checks: pinned Node 20, install, Prisma, TypeScript, lint, tests, and production build. Docker validation is intentionally excluded because the project is not using Docker for its deployment workflow.
- [x] Extend targeted security/service regression tests and keep them in the normal test suite.
- [x] Add load-test execution plan without capacity claims until staging is available.
- [x] Add redacted operational failure logging for audit, handoff, Redis, storage, worker, and provider failure paths.

## C. Blocked External

- [!] Upstash Redis credentials and production URL are required to exercise distributed limits/locks outside development. Files: `.env`, `src/lib/redis.ts`. Service required: Upstash Redis.
- [!] Private upload deployment needs an R2/S3 bucket, endpoint, credentials, and chosen signing strategy. Files: `.env`, `src/lib/storage.ts`. Service required: Cloudflare R2 or S3-compatible storage.
- [!] Durable asynchronous WhatsApp execution needs QStash/Workflow credentials plus a deployed worker callback. Files: `.env`, WhatsApp worker route. Service required: Upstash QStash/Workflow or equivalent.
- [!] Multi-instance interview signaling and authenticated TURN require a managed realtime provider and TURN credential issuer. Files: `.env`, interview signaling routes. Service required: Supabase Realtime/equivalent and TURN provider.
- [!] Full load benchmarks need a deployed staging target and representative managed-service configuration. Files: load-test scripts/environment. Service required: staging infrastructure.

## D. Final Validation

- [!] `npm test` and `npm run build` require CI/Node 20 verification: this laptop is on Node 26.4.0, whose `tsx` startup fails with `uv_os_get_passwd ENOMEM` and whose Turbopack workers do not complete. `npx tsc --noEmit`, `npx prisma generate`, `npx prisma validate`, `npm run lint`, and `git diff --check` pass locally.
- [!] Security/provider integration, migration deployment, dependency/secret scan, and load evidence require CI, staging, and the external services above. Record actual results only.
- [x] Produce exact deployment/setup documentation in `EXTERNAL_SERVICES_SETUP.md`; final report remains pending only until CI and external verification yield evidence.
