# Recorded assessment recovery scheduler

The recorded-assessment recovery endpoint is intentionally no longer scheduled by Vercel. Vercel remains responsible for the daily referral reconciliation cron only.

## Railway service

Deploy a dedicated Railway service from this repository using:

- Dockerfile: `Dockerfile.recorded-assessment-scheduler`
- Cron schedule: `*/5 * * * *`
- Environment:
  - `APP_URL=https://<your-production-app-origin>`
  - `CRON_SECRET=<same secret configured on the Next.js app>`
  - `VERCEL_AUTOMATION_BYPASS_SECRET=<Vercel Protection Bypass for Automation secret>` when Deployment Protection is enabled
- No database, storage, AI-provider, or payment credentials are required by this scheduler.
- Do not put `CRON_SECRET` in the URL. The scheduler sends it in the `Authorization: Bearer ...` header.
- When `VERCEL_AUTOMATION_BYPASS_SECRET` is configured, the scheduler sends it only in the `x-vercel-protection-bypass` header so Vercel Deployment Protection can admit the automation request without disabling protection for users.

Railway starts the container every five minutes. Each run performs one authenticated request to:

`POST /api/cron/recorded-assessment-analysis`

and then exits. The endpoint itself performs bounded recovery, retry/backoff, stale-processing recovery, and worker dispatch.

## Verification

After deploying the Railway scheduler:

1. Confirm the Next.js app has the same `CRON_SECRET`.
2. If Vercel Deployment Protection is enabled, confirm Railway has `VERCEL_AUTOMATION_BYPASS_SECRET` configured from Vercel's Protection Bypass for Automation setting.
3. Confirm Railway cron is exactly `*/5 * * * *`.
4. Confirm Railway logs show two consecutive successful records with:
   - `worker: recorded-assessment-analysis-recovery`
   - `status: completed`
5. Confirm unauthorized requests to the endpoint return HTTP 401.
6. Confirm Vercel deploys successfully with only the daily referral cron in `vercel.json`.

Repository wiring prepares the scheduler, but does not create or configure the Railway service automatically.
