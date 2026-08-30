# HireGo external services setup

This document reflects the environment variables currently read by the application. Add secrets only in Vercel's encrypted environment-variable settings; never commit them to `.env`, Git, or a browser bundle.

## 1. PostgreSQL (Supabase or another managed PostgreSQL provider)

Create one production PostgreSQL database and a separate staging database. The application uses Prisma and connects through `DATABASE_URL`.

| Variable | Secret? | Vercel environment | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Production, Preview/Staging | Pooled PostgreSQL connection string used by the app. |
| `DIRECT_URL` | Yes | Production, Preview/Staging | Direct PostgreSQL connection string used by Prisma migrations. |

After adding the values, run `npx prisma migrate deploy` against the intended database. This makes the tenant-ownership, application uniqueness, AI usage, and queue schema changes live. The CI database is disposable and does not update production.

Verify: sign in, create a test candidate and application, then check that the single application is persisted. The real database concurrency test becomes runnable in CI when `HIREGO_TEST_DATABASE=1` points at its disposable database.

## 2. Upstash Redis

Create an Upstash Redis database in the region nearest the application. It is required in production for rate limits, session revocation, and distributed state.

| Variable | Secret? | Vercel environment | Purpose |
| --- | --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Yes | Production, Preview/Staging | Upstash REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Production, Preview/Staging | Upstash REST token. |
| `RATE_LIMIT_HMAC_SECRET` | Yes | Production, Preview/Staging | Independent high-entropy HMAC secret for privacy-preserving rate-limit keys. |

Verify: call a protected endpoint with a valid session, sign out, then confirm the same token is rejected. The app fails closed if Redis is unavailable in production.

## 3. Cloudflare R2 or S3-compatible private object storage

Create a private bucket for uploads and media. The app uses the S3-compatible API; do not make the bucket public.

| Variable | Secret? | Vercel environment | Purpose |
| --- | --- | --- | --- |
| `S3_BUCKET_NAME` | No | Production, Preview/Staging | Private bucket name. |
| `S3_REGION` | No | Production, Preview/Staging | Provider region; use `auto` for R2 when applicable. |
| `S3_ACCESS_KEY_ID` | Yes | Production, Preview/Staging | Access key limited to this bucket. |
| `S3_SECRET_ACCESS_KEY` | Yes | Production, Preview/Staging | Matching secret key. |
| `S3_ENDPOINT` | No | Production, Preview/Staging | S3-compatible endpoint; required for R2. |
| `S3_FORCE_PATH_STYLE` | No | Production, Preview/Staging | Set only if the provider requires path-style addressing. |
| `S3_SIGNED_URL_TTL_SECONDS` | No | Production, Preview/Staging | Private-download URL lifetime; default is 300 seconds. |

Verify: upload a non-sensitive test file through the app, open its signed URL while authenticated, and confirm the direct public bucket URL is denied.

## 4. QStash

Create an Upstash QStash project for durable WhatsApp background dispatch and retry triggering.

| Variable | Secret? | Vercel environment | Purpose |
| --- | --- | --- | --- |
| `QSTASH_TOKEN` | Yes | Production, Preview/Staging | QStash API token. |
| `APP_URL` | No | Production, Preview/Staging | Public server origin used to construct dispatch callbacks. |

Verify: send a test WhatsApp event, confirm a QStash message is created, and confirm the signed callback reaches the application once. The WhatsApp queue lifecycle test becomes externally verifiable after these values and WhatsApp credentials are present.

## 5. TURN for WebRTC interviews

Provision a managed TURN service or a secured coturn deployment with TLS and time-limited credentials where supported. TURN credentials must not be published as browser environment variables; the authorized interview-room endpoint returns them only to permitted participants.

| Variable | Secret? | Vercel environment | Purpose |
| --- | --- | --- | --- |
| `TURN_URL` | No | Production, Preview/Staging | `turn:` or `turns:` server URL. |
| `TURN_USERNAME` | Yes | Production, Preview/Staging | TURN user name. |
| `TURN_CREDENTIAL` | Yes | Production, Preview/Staging | TURN credential. |

Verify: run a two-party interview while one participant is on a restrictive mobile or office network. In production, the room endpoint refuses to start if TURN is not configured.

## 6. Supabase Realtime

The present interview signaling implementation persists signals in PostgreSQL and does not yet use a Supabase Realtime client. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` remain listed for planned Realtime work but are not consumed by application code, so do not create or add them merely for this version.

When Realtime is implemented, use a server-only service-role key and a separate public anonymous key only if the browser client genuinely requires it, protected by Row Level Security. A code change will define the exact variables and verification test first.

## 7. Isolated code-assessment runner

Create a private, separately sandboxed code-execution service before enabling coding assessments. It must run outside the HireGo Next.js process, enforce CPU, memory, filesystem, and network isolation, and expose an HTTPS `POST /execute` endpoint. Do not use Node's `vm` or the Vercel application process to execute applicant code.

| Variable | Secret? | Vercel environment | Purpose |
| --- | --- | --- | --- |
| `CODE_RUNNER_URL` | No | Production, Preview/Staging | Base HTTPS URL of the private runner; HireGo calls `<URL>/execute`. |
| `CODE_RUNNER_API_KEY` | Yes | Production, Preview/Staging | Bearer credential accepted only by that runner. |

The runner endpoint must accept `{ code, language, testCases, timeLimitMs, memoryLimitMb }` and return `{ status, passedTests, totalTests, runtimeMs, results, stdout, stderr }`. Supported languages are `python3`, `javascript`, `typescript`, `java`, `cpp`, and `go`.

Verify: configure a staging runner, submit a harmless solution, and confirm the execution occurs in the runner logs—not in the HireGo server. The blocked test that becomes a real integration test is the coding run/submit flow; the existing local test only verifies fail-closed behavior and response validation.

## Common application secrets

Add these separately for every production-like environment: `NEXTAUTH_SECRET`, `JWT_SECRET`, `INTERNAL_API_KEY`, `EMAIL_CONFIG_ENCRYPTION_KEY`, payment-provider credentials, email-provider credentials, `WHATSAPP_API_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and `OPENAI_API_KEY` if AI features are enabled. All are secrets except provider identifiers such as a phone-number ID.

Set `NEXT_PUBLIC_APP_URL` to the public application URL. It is intentionally public and must contain no credential.
