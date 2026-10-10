# HireGo AI

HireGo AI is an end-to-end hiring operating system built with Next.js, Prisma/PostgreSQL, private Cloudflare R2 storage, Redis-backed distributed controls, Vercel, and Railway workers.

## Production architecture

- **Web/API:** Vercel
- **Database:** PostgreSQL / Supabase
- **Object storage:** private Cloudflare R2
- **Background recovery worker:** Railway
- **Recorded-assessment scheduler:** Railway cron every 5 minutes
- **Payments:** Stripe + PayU only
- **Email:** SendGrid + Zoho/ZeptoMail
- **WhatsApp:** Meta WhatsApp Business API
- **AI providers:** configured server-side/admin-side; no provider secret belongs in the repository

- **Candidate Jarvis:** hybrid GPT/Gemini AI with gated self-hosted voice; do not enable production voice until authenticated end-to-end verification

## Local development

```bash
npm ci
cp .env.example .env.local
npx prisma generate
npm run dev
```

Never commit credentials. Production secrets belong in the deployment secret manager.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm test
npm run verify:phase5
npm audit --omit=dev --audit-level=high
npm run build
```

`npm run test:audit` generates temporary production-wiring audit artifacts. Those outputs are intentionally gitignored and should not be committed.

## Deployment

Production changes must pass validation/security gates before merge.

- App deployment: Vercel from `main`
- Recovery worker: `Dockerfile.scheduler` on Railway
- Recorded-assessment scheduler: `Dockerfile.recorded-assessment-scheduler` on Railway
- Vercel cron: daily referral reconciliation only

Operational guidance lives in:

- `DEPLOYMENT.md`
- `DEPLOYMENT_CHECKLIST.md`
- `EXTERNAL_SERVICES_SETUP.md`
- `MIGRATION_RECONCILIATION_RUNBOOK.md`
- `docs/runbooks/`
- `docs/RECORDED_ASSESSMENT_SCHEDULER.md`
- `docs/WORKFLOW_RECOVERY_WORKER.md`
- `VIDEO_ANALYSIS_RUNBOOK.md`

## Production rules

- No mock/demo/localStorage data may act as production authority.
- Consequential hiring actions require the configured human-approval gates.
- Uploaded candidate files stay private and must pass upload validation/security scanning before downstream processing.
- Payment success must be server-verified and idempotent.
- Do not move Railway background workers or the recorded-assessment scheduler to Vercel.
