# HireGo AI — Production Incident Response Playbook

## 1. Overview & Severity Classification

This runbook establishes mandatory incident response procedures, operational boundaries, and recovery pathways for the HireGo AI production ecosystem.

### Incident Severity Matrix

| Severity | Definition | Target Response (MTTD) | Target Resolution (MTTR) | Communication Cadence |
| :--- | :--- | :--- | :--- | :--- |
| **P0 — Critical** | Platform outage, data corruption, auth bypass, payment processing blocked, or core hiring funnel down. | < 5 minutes | < 30 minutes | Every 15 minutes to executive & status page |
| **P1 — High** | Major feature impaired (e.g. AI Mock Interview turn generation failing, video uploads stalled, bulk invite failures) with no workaround. | < 15 minutes | < 2 hours | Every 30 minutes |
| **P2 — Medium** | Partial degradation (e.g. analytics reporting delayed, non-critical webhooks queued, dashboard latency spike) with viable workarounds. | < 1 hour | < 8 hours | Every 2 hours |
| **P3 — Low** | Minor defects, cosmetic UI anomalies, non-blocking administrative discrepancies. | Next business day | Next sprint release | Standard ticketing |

---

## 2. On-Call Escalation Matrix

```
[Level 1: Automated Alerts / Sentry / Datadog / BetterStack]
                     │
                     ▼
[Level 2: Primary On-Call SRE / DevOps Lead]
  - Triages alert within 5 minutes
  - Establishes War Room (#incident-war-room)
  - Evaluates rollback vs hotfix
                     │
                     ├─── Database / Data Layer Issue ───► Lead Database / Data Engineer
                     ├─── Security Breach / RBAC Alert ──► Lead Security Architect
                     ├─── AI Engine Gateway Timeout ────► AI Platform Engineer
                     └─── Billing / Gateway Dispute ─────► FinOps / Backend Lead
                     │
                     ▼
[Level 3: VP of Engineering / CTO]
  - Notified if P0 unresolved after 20 minutes
  - Authorizes DR site failover or maintenance mode
```

---

## 3. Incident Playbooks by Subsystem

### 3.1 Database Connection Pool Exhaustion & PgBouncer Failover
* **Symptoms**: HTTP 503 responses, Prisma `P1001` (Can't reach database), `P2028` (Transaction expired), pool timeouts in `/api/health`.
* **Immediate Actions**:
  1. Inspect active connections:
     ```sql
     SELECT count(*), state FROM pg_stat_activity GROUP BY state;
     ```
  2. Terminate long-running idle transactions (> 30s):
     ```sql
     SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE state = 'idle in transaction' AND state_change < now() - interval '30 seconds';
     ```
  3. Verify PgBouncer pooler status in Supabase dashboard.
  4. Ensure application deployment utilizes `?pgbouncer=true&connection_limit=10`.
  5. If primary node is degraded, trigger managed database failover to secondary replica.

### 3.2 Redis Cache & Distributed Lock Outage
* **Symptoms**: Rate limiting returns 429 prematurely or fails open, session cache misses spike, BullMQ job stalls.
* **Immediate Actions**:
  1. Check Redis connectivity: `redis-cli -u $REDIS_URL ping`.
  2. If Redis cluster is partitioned, application circuit breaker engages automatically:
     - Auth falls back to verified stateless JWT tokens.
     - Rate limiter enters degraded mode (`resetDevelopmentRedisStore()`).
  3. Flush corrupted lease keys if deadlocks occur:
     ```bash
     redis-cli --scan --pattern "lock:*" | xargs -r redis-cli del
     ```
  4. Restart Redis replica or switch `REDIS_URL` to failover cluster.

### 3.3 AI Gateway Provider Degradation & Outage
* **Symptoms**: AI Mock Interview turns timing out (> 15s), candidate assessment generation failing with 502/504, provider 429 quota exhaustion.
* **Immediate Actions**:
  1. Check `/api/health` provider telemetry.
  2. Trigger automatic provider failover:
     - Primary: OpenAI `gpt-4o-mini`
     - Failover 1: Google Gemini `gemini-1.5-flash`
     - Failover 2: DeepSeek `deepseek-chat`
  3. If rate-limited on primary tier, toggle `AI_ACTIVE_PROVIDER=GEMINI` in environment variables and trigger zero-downtime redeploy.
  4. Enable mock fallback in non-production or degraded grace response to user with automatic turn retry.

### 3.4 Payment Gateways (Razorpay & Cashfree) Webhook & Settlement Failures
* **Symptoms**: Subscriptions pending after payment, invoices missing receipts, webhook 500 errors.
* **Immediate Actions**:
  1. Review pending payments in `/api/payments/status`.
  2. Idempotent webhook verification:
     - Never replay webhooks without validating `x-razorpay-signature` or `x-cashfree-signature`.
     - Invoices and subscriptions use row-level locks to prevent double-crediting.
  3. Reconcile stuck checkouts:
     ```bash
     npx tsx scripts/reconcile-pending-payments.ts
     ```
  4. If payment provider is down, switch default gateway in `NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER` from `RAZORPAY` to `CASHFREE`.

### 3.5 Communications Delivery Failure (SendGrid, ZeptoMail, WhatsApp)
* **Symptoms**: OTP delivery delays (> 30s), interview invitations not sent.
* **Immediate Actions**:
  1. Check `EmailDeliveryConfig` table in database.
  2. Toggle active email provider from SendGrid to ZeptoMail:
     - Auto-failover is built into `sendEmail()` on 4xx rejections.
  3. Check Meta WhatsApp Cloud API access token validity in `.env` (`WHATSAPP_TOKEN`).
  4. Ensure audit log outbox captures all delivery intents in `SecurityAuditOutboxEvent`.

### 3.6 Cloudflare R2 / AWS S3 Media & Resume Outage
* **Symptoms**: Candidate resume downloads fail with 404/403, video resume recording uploads fail.
* **Immediate Actions**:
  1. Verify S3 credentials (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`) and bucket accessibility.
  2. Verify presigned URL TTL (configured at 900 seconds).
  3. If R2 endpoint is unreachable, fallback to secondary S3 bucket via DNS/CNAME switch.

### 3.7 Compromised Credentials & Global Session Revocation
* **Symptoms**: Unauthorized admin actions detected, token leaked in repository or client logs.
* **Immediate Actions**:
  1. Immediately bump `sessionVersion` in database for compromised user or globally:
     ```sql
     -- Invalidate single user:
     UPDATE "User" SET "sessionVersion" = "sessionVersion" + 1 WHERE id = '<compromised_user_id>';
     -- Invalidate all sessions across entire tenant/platform:
     UPDATE "User" SET "sessionVersion" = "sessionVersion" + 1;
     ```
  2. Rotate `JWT_SECRET` and `SESSION_SECRET` in environment variables.
  3. Trigger zero-downtime rollout. All active tokens become instantly invalid (401).

### 3.8 Async Video Worker Processing Stalls
* **Symptoms**: `VideoResume` records remain in `PROCESSING` status > 10 minutes.
* **Immediate Actions**:
  1. Query stalled records:
     ```sql
     SELECT id, "candidateProfileId", status, "createdAt"
     FROM "VideoResume"
     WHERE status = 'PROCESSING' AND "createdAt" < now() - interval '15 minutes';
     ```
  2. Restart worker consumer:
     ```bash
     npm run worker:video-recovery
     ```
  3. Dead-letter queue messages are persisted with retry count limit (max 3). Stalled tasks transition to `FAILED` with retry option presented to candidate.

### 3.9 Zero-Downtime Rollback Procedure
* **When to Rollback**:
  - Error rate on `/api/**` > 1% over 5-minute rolling window.
  - P99 latency > 2500ms.
  - Database schema lock detected.
* **Execution**:
  1. Vercel / Cloud Run: Promote previous deployment commit hash instantly:
     ```bash
     vercel rollback <previous-deployment-url>
     ```
  2. Verify database backward compatibility (all migrations must follow Expand-and-Contract design).
  3. Run `/api/health` validation suite.
