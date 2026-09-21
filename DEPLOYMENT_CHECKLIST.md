# HireGo AI Deployment Checklist

## 1. Pre-deployment Checklist
- [ ] **Environment Variables**: Verify all required environment variables are set in your provider matching `.env.example` (or `docs/staging.env.example` for staging).
- [x] **Database Migrations**: Verified 49/49 migrations applied on production Supabase project `Hariom` (`eqsxuwlnidexlgseuogu`). RLS verified and enforced on all 90+ public application tables.
- [ ] **Secrets Manager**: Ensure `NEXTAUTH_SECRET`, `JWT_SECRET`, and `INTERNAL_API_KEY` are cryptographically secure random strings.
- [ ] **Third-Party Services**:
  - Payment Gateways: Verified Stripe + PayU architecture in production database and codebase. PhonePe and Razorpay permanently purged.
  - WhatsApp: Verify webhook tokens and keys are correctly configured.
  - LLM: Confirm OpenAI and Gemini keys are active.
  - S3 / R2: Ensure buckets exist and credentials have proper write/read permissions.

## 2. Deployment Steps (Vercel / Railway)

### Vercel (Frontend / Next.js API)
1. **Connect Repository**: Link the GitHub repository to your Vercel project.
2. **Environment Variables**: Bulk import the production variables.
3. **Build Command**: Leave as default (`next build`).
4. **Install Command**: Leave as default (`npm install`).
5. **Deploy**: Trigger a production deployment. Ensure build passes all TypeScript and ESLint checks.

### Railway (Background Workers & Database)
1. **Provision PostgreSQL**: Ensure the database is running and reachable.
2. **Deploy Redis (Upstash/Railway)**: Required for rate limiting.
3. **Run Migrations**: Use a one-off task or CI pipeline to execute `npx prisma migrate deploy`.
4. **Deploy Background Services**: Deploy any QStash worker endpoints or local Python video analysis models as required.

## 3. Post-deployment Verification Steps
- [ ] **Authentication**: Log in as an Admin and an Employer. Verify session creation.
- [ ] **Payments**: Process a test transaction (if possible in the environment) or verify the checkout page loads correctly with Stripe/PayU.
- [ ] **Webhooks**: Check Stripe and PayU dashboards for successful signed delivery to `/api/payments/webhook` and verify replay/idempotency behavior.
- [ ] **Emails**: Trigger a password reset to verify SendGrid/ZeptoMail integration.
- [ ] **File Upload**: Upload a test document/resume to verify S3 integration.
- [ ] **Malware Scanning**: Confirm a clean staging file leaves quarantine and scanner outage/infected content stays unavailable.
- [ ] **Workers**: Verify recovery/video worker heartbeats, retries, queue age, and DLQ state.

## 4. Rollback Procedures
- **Application Code Reversion**: In Vercel, navigate to the **Deployments** tab, select the last known good deployment, and click **Promote to Production** / **Rollback**.
- **Database Reversion**: Database schema rollbacks are risky. If a backward-incompatible migration was deployed, restore from the latest point-in-time recovery (PITR) backup on your database provider.
- **Immediate Mitigation**: If the system is unstable, use Vercel's Instant Rollback feature.

## 5. Monitoring Setup Recommendations
- **Application Performance Monitoring (APM)**: Integrate Sentry or Datadog for tracing Next.js route performance and unhandled exceptions.
- **Log Aggregation**: Pipe Vercel edge/serverless logs to a centralized platform like Axiom, Better Stack, or Datadog.
- **Uptime Monitoring**: Set up UptimeRobot or Better Stack to ping health endpoints every minute.
- **Security Audit Logs**: Ensure `SIEM_WEBHOOK_URL` is set to securely forward critical auth and access events.

## 6. Health Check Endpoints
Use the following endpoints to monitor system vitals:
- **Application Health**: `GET /api/admin/system-health` (requires auth or internal token)
- **Database Status**: Monitors connections and query latency.
- **Release Status**: `GET /api/admin/release/status`

## 7. Release Sign-off

- Keep `RELEASE_SIGNED_OFF=false` until CI, migrations, authenticated staging
  journeys, provider callbacks, backup restore, monitoring, and rollback checks
  have evidence attached to the release.
- Set the flag only as a reflection of that immutable evidence. The flag does
  not validate or deploy the application.
