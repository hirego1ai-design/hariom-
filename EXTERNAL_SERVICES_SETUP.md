# External Services Setup

This document is intentionally based on the environment variables used by the current code. Do not add credentials to Git, local screenshots, or chat. Add secrets in Vercel **Production** first; use separate resources and values for Preview and Development when those environments are used.

## 1. Upstash Redis

| Item | Value |
| --- | --- |
| Create | An Upstash Redis database in the region nearest to the Vercel production region. |
| Variables | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Secret/public | Both are **secret**. |
| Vercel environment | Production, Preview, and Development with different databases/tokens. |
| Verify | Deploy, sign in, then make more than the configured number of requests to a rate-limited endpoint. A `429` must include `Retry-After`. Logout must invalidate the old cookie; password reset must invalidate all old cookies. |
| Blocked verification enabled | Distributed rate-limit, session-revocation, OTP/WhatsApp limiter, concurrency, and multi-instance tests. |

## 2. Cloudflare R2 or S3-compatible private storage

| Item | Value |
| --- | --- |
| Create | A private bucket, for example `hirego-production-private`. Keep public access disabled. Create a least-privilege object read/write/delete API token for that bucket only. |
| Variables | `S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, optional `S3_FORCE_PATH_STYLE`, `S3_SIGNED_URL_TTL_SECONDS` |
| Secret/public | Bucket, region, endpoint, force-path-style and TTL are configuration values; access key ID and secret access key are **secret**. |
| Vercel environment | Production, Preview, and Development with separate buckets/credentials. |
| Verify | Upload a valid document while signed in. Its returned URL must be `/api/files/<id>`, must reject another tenant with `403`, and in production must redirect only an authorized user to a short-lived signed object URL. Confirm the bucket has no public listing. |
| Blocked verification enabled | R2/S3 upload, signed-download, delete, retention, and cross-tenant storage tests. |

## 3. Upstash QStash

| Item | Value |
| --- | --- |
| Create | An Upstash QStash account/project. Use the QStash token for the same deployment environment. |
| Variables | `QSTASH_TOKEN`, `APP_URL`, `INTERNAL_API_KEY` |
| Secret/public | `QSTASH_TOKEN` and `INTERNAL_API_KEY` are **secret**. `APP_URL` is configuration, not secret. |
| Vercel environment | Production, Preview, and Development. `APP_URL` must be that environment's HTTPS base URL with no trailing slash. |
| Verify | Configure the Meta webhook, send a test WhatsApp message, and confirm an inbound event becomes `PROCESSED`; temporarily cause a transient send failure and confirm `RETRY` then bounded retry/`FAILED`. The worker endpoint must reject a request without the internal key. |
| Blocked verification enabled | Durable WhatsApp dispatch, retry, duplicate delivery, and dead-letter operational tests. |

## 4. Supabase Realtime (optional current signalling upgrade)

The current secure fallback uses shared PostgreSQL signaling with short-lived records. A Supabase Realtime implementation is not yet selected, so no code path consumes these variables today.

| Item | Value |
| --- | --- |
| Create | If lower-latency realtime signaling is required, create/use the existing Supabase project and enable Realtime for a deliberately designed, RLS-protected signaling channel. |
| Reserved variables | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Secret/public | `SUPABASE_SERVICE_ROLE_KEY` is **secret**; `SUPABASE_URL` is configuration. |
| Vercel environment | Production and separate Preview/Development projects. |
| Verify | After a dedicated Realtime adapter is implemented, verify both authorized participants receive signals and an unrelated user receives none. |
| Blocked verification enabled | Future managed-Realtime end-to-end test. |

## 5. TURN for WebRTC interviews

| Item | Value |
| --- | --- |
| Create | A TURN provider account or a managed coturn deployment with TLS and time-limited credentials. |
| Variables | `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` |
| Secret/public | All are **secret** except the non-sensitive hostname portion of the URL; keep the full URL in protected configuration. |
| Vercel environment | Production, Preview, and Development with environment-appropriate credentials. |
| Verify | Deploy production, join the same authorized interview from two different networks/NATs, and confirm media connects via relay when direct P2P is blocked. Missing TURN settings intentionally make a production interview room unavailable. |
| Blocked verification enabled | Cross-NAT WebRTC/TURN connectivity test. |

## 6. Staging and load testing

| Item | Value |
| --- | --- |
| Create | A staging Vercel project connected to a staging Postgres database, separate Redis, storage bucket, QStash token, and non-production WhatsApp/AI/payment credentials. |
| Variables | The same variables above, plus `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`, WhatsApp variables, and payment secrets when each provider is deliberately enabled. |
| Secret/public | Database URLs, all secrets, and provider tokens are **secret**. `NEXT_PUBLIC_APP_URL` and `APP_URL` are configuration. |
| Vercel environment | Preview or a dedicated Staging project; never reuse production secrets. |
| Verify | Run the staged 100 → 250 → 500 → 1000-user scenarios only after smoke tests and provider health checks pass. Record actual latency/error/DB-pool data; do not claim a capacity number without this evidence. |
| Blocked verification enabled | Full provider integration and load-test evidence. |

## Required application secrets not tied to a new provider

Set `JWT_SECRET` or `NEXTAUTH_SECRET` to a distinct high-entropy secret, and set a separate high-entropy `INTERNAL_API_KEY`. Configure actual provider variables only for providers intentionally enabled. Production checks fail closed for missing Redis, private storage, QStash, and TURN at the relevant protected operation rather than silently using local memory.
