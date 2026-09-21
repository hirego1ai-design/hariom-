# Recorded assessment recovery scheduler

The recorded-assessment recovery endpoint is intentionally no longer scheduled by Vercel. Vercel remains responsible for the daily referral reconciliation cron only.

## Railway service

Deploy a dedicated Railway service from this repository using:

- Dockerfile: `Dockerfile.recorded-assessment-scheduler`
- Environment:
  - `APP_URL=https://<your-production-app-origin>`
  - `CRON_SECRET=<same secret configured on the Next.js app>`
- No database, storage, AI-provider, or payment credentials are required by this scheduler.
- Do not put `CRON_SECRET` in the URL. The scheduler sends it in the `Authorization: Bearer ...` header.

The scheduler calls:

`POST /api/cron/recorded-assessment-analysis`

approximately every five minutes. It never overlaps its own requests and uses a 90-second request timeout. The endpoint itself performs bounded recovery, retry/backoff, stale-processing recovery, and worker dispatch.

## Verification

After deploying the Railway scheduler:

1. Confirm the Next.js app has the same `CRON_SECRET`.
2. Confirm Railway logs show two consecutive successful records with:
   - `worker: recorded-assessment-analysis-recovery`
   - `status: completed`
3. Confirm unauthorized requests to the endpoint return HTTP 401.
4. Confirm Vercel deploys successfully with only the daily referral cron in `vercel.json`.

Repository wiring prepares the scheduler, but does not create or configure the Railway service automatically.
