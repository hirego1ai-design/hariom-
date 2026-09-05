# HireGo external services setup

This document reflects the environment variables currently read by the application. Add secrets only in Vercel's encrypted environment-variable settings; never commit them to `.env`, Git, or a browser bundle.

## 1. PostgreSQL (Supabase or another managed PostgreSQL provider)

Create one production PostgreSQL database and a separate staging database. The application uses Prisma and connects through `DATABASE_URL`.

| Variable | Secret? | Vercel environment | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Production, Preview/Staging | Pooled PostgreSQL connection string used by the app. |
| `DIRECT_URL` | Yes | Production, Preview/Staging | Direct PostgreSQL connection string used by Prisma migrations. |

After adding the values, run `npx prisma migrate deploy` against the intended database. This makes the tenant-ownership, application uniqueness, AI usage, queue schema changes, candidate Job-Ready, candidate-credit, and typing-prompt schema changes live. The CI database is disposable and does not update production.

Verify: sign in, create a test candidate and application, then check that the single application is persisted. The real database concurrency test becomes runnable in CI when `HIREGO_TEST_DATABASE=1` points at its disposable database.

### Candidate feature setup after migration

No candidate assessment, typing prompt, career service, score, or credit is seeded by a migration. An authenticated administrator must deliberately configure and publish them through the supported admin APIs/UI before a candidate can use them:

- Create a Job-Ready template at `POST /api/admin/readiness-templates`, add MCQ questions, then publish it using the existing assessment controls.
- Create a typing prompt at `POST /api/admin/typing-prompts`, then activate one prompt with `PUT /api/admin/typing-prompts/:id` and `{ "isActive": true }`.
- Create a candidate career service at `POST /api/admin/candidate-services`, then activate it with `PUT /api/admin/candidate-services/:id` and `{ "isActive": true }`.
- Credits require a real payment webhook before self-service purchasing is enabled. Until then, an administrator may issue an auditable, idempotent `BONUS` or `ADJUSTMENT` through `POST /api/admin/candidate-credits/grants`; the candidate UI does not simulate purchases.

## 2. Upstash Redis

Create an Upstash Redis database in the region nearest the application. It is required in production for rate limits, session revocation, and distributed state.

| Variable | Secret? | Vercel environment | Purpose |
| --- | --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Yes | Production, Preview/Staging | Upstash REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Production, Preview/Staging | Upstash REST token. |
| `RATE_LIMIT_HMAC_SECRET` | Yes | Production, Preview/Staging | Independent high-entropy HMAC secret for privacy-preserving rate-limit keys. |

Verify: call a protected endpoint with a valid session, sign out, then confirm the same token is rejected. The app fails closed if Redis is unavailable in production.

## 3. Cloudflare R2 or S3-compatible private object storage

The application uses Cloudflare R2 (or any S3-compatible object store) for private file storage (such as commercial payment receipts and verified documents). Cloudflare R2 is accessed through its standard S3-compatible API from the Node.js/Next.js backend.

### Cloudflare R2 Bucket Creation & Configuration Steps:
1. Log in to the Cloudflare Dashboard and navigate to **Storage & Databases** → **R2**.
2. Click **Create bucket**, name it (e.g. `hirego-receipts-prod` or `hirego-receipts-staging`), and select region preference (default is **Automatic**).
3. **Bucket Privacy**: Ensure the bucket is **strictly private**. Do NOT connect a custom public domain or enable public `r2.dev` bucket access.
4. **Generate API Token**:
   - Go to **R2** → **Manage R2 API Tokens** → **Create API Token**.
   - Set Permissions to **Object Read & Write**.
   - Specify bucket scope (All buckets or specific bucket).
   - Set TTL to Forever (or per organizational policy).
   - Click **Create API Token** and copy the resulting `Access Key ID` and `Secret Access Key`.
5. **Account ID / Endpoint**:
   - Locate your 32-character **Account ID** in the Cloudflare R2 overview.
   - Endpoint URL format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

### Environment Variables:

| Variable | Secret? | Server / Client | Staging & Production Location | Purpose |
| --- | --- | --- | --- | --- |
| `S3_BUCKET_NAME` | No | Server-Only | Vercel / Secret Manager | Private bucket name (e.g. `hirego-receipts-prod`). |
| `S3_REGION` | No | Server-Only | Vercel / Secret Manager | Storage region; use `auto` for Cloudflare R2. |
| `S3_ACCESS_KEY_ID` | **Yes (Secret)** | Server-Only | Vercel (Encrypted) / Secret Manager | R2 API Token Access Key ID. |
| `S3_SECRET_ACCESS_KEY` | **Yes (Secret)** | Server-Only | Vercel (Encrypted) / Secret Manager | R2 API Token Secret Access Key. |
| `S3_ENDPOINT` | No | Server-Only | Vercel / Secret Manager | S3-compatible endpoint (e.g. `https://<account-id>.r2.cloudflarestorage.com`). |
| `S3_FORCE_PATH_STYLE` | No | Server-Only | Vercel / Secret Manager | `false` for Cloudflare R2 and AWS S3 virtual-hosted style. |
| `S3_SIGNED_URL_TTL_SECONDS` | No | Server-Only | Vercel / Secret Manager | Short-lived signed download URL lifetime; default is `300` (5 minutes). |

> **Security Rule**: None of the `S3_*` variables may be exposed to browser code or client-side bundles (never prefix with `NEXT_PUBLIC_`).

### CORS Guidance:
- Under the current architecture, payment receipts and candidate files are uploaded to the Next.js API server (`POST /api/employer/billing/invoices/[id]/receipt`), which streams them directly to R2 using server credentials.
- Signed URLs for downloads are generated server-side with `attachment` Content-Disposition.
- Therefore, custom bucket CORS rules are **not required** for the current architecture.

### Verification & Cleanup Steps:
1. **Missing / Invalid Credentials (Fail-Closed Test)**:
   - Call `POST /api/employer/billing/invoices/[id]/receipt` without valid R2 credentials.
   - Confirm the API returns **503 Service Unavailable** and the invoice remains **`UNPAID`** (never sets `PENDING_VERIFICATION`).
2. **Authorized Upload Test**:
   - Provide valid R2 credentials in the server environment.
   - Upload a test receipt PNG through `POST /api/employer/billing/invoices/[id]/receipt`.
   - Confirm:
     - The object is created in the private R2 bucket under `PAYMENT_RECEIPT/<uuid>.png`.
     - A `StoredFile` database record is created with the `objectKey`.
     - The invoice status transitions to `PENDING_VERIFICATION`.
     - The stored database value is a private object key, NOT a public URL.
3. **Signed Download & Access Control Test**:
   - Request the file via `GET /api/files/[id]`.
   - Confirm unauthorized / cross-company users receive **403 Forbidden**.
   - Confirm authorized users receive a **307 Redirect** to a presigned R2 download URL that expires after `S3_SIGNED_URL_TTL_SECONDS`.
   - Confirm trying to access the direct bucket URL without signature returns **401/403**.
4. **Cleanup**:
   - Delete the isolated test object from the R2 bucket and remove the test `StoredFile` database record.

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

## 7. Code runner — retired for this release

Coding IDE and code-execution routes have been removed from the application. Do not create `CODE_RUNNER_URL` or `CODE_RUNNER_API_KEY` for the current release. If coding assessments are reintroduced, first add a separately sandboxed runner, a new security review, and explicit configuration documentation before enabling any candidate-facing route.

## Common application secrets

Add these separately for every production-like environment: `NEXTAUTH_SECRET`, `JWT_SECRET`, `INTERNAL_API_KEY`, `EMAIL_CONFIG_ENCRYPTION_KEY`, payment-provider credentials, email-provider credentials, `WHATSAPP_API_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and `OPENAI_API_KEY` if AI features are enabled. All are secrets except provider identifiers such as a phone-number ID.

Set `NEXT_PUBLIC_APP_URL` to the public application URL. It is intentionally public and must contain no credential.
