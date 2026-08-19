# HireGo staging deployment checklist

Use this procedure only with a new, empty staging database. Do not run the initial migration against an existing database with HireGo data.

## 1. Prepare secrets

1. Copy `docs/staging.env.example` to an ignored file such as `.env.staging`, or add the same keys to the staging secret manager.
2. Generate distinct high-entropy values for `NEXTAUTH_SECRET`, `JWT_SECRET`, `SESSION_SECRET`, and `INTERNAL_API_KEY`.
3. Use staging/sandbox credentials only for payments, WhatsApp, AI, and object storage.
4. Rotate any values that were previously committed in Compose before deploying.

## 2. Provision infrastructure

1. Create a new empty PostgreSQL database named for staging.
2. Provision Redis, or retain the Compose Redis service for isolated staging.
3. Configure the staging hostname and TLS certificate.
4. Restrict PostgreSQL and Redis network access to the application environment; do not expose them publicly.

## 3. Validate before release

Run from the repository root with the staging environment loaded:

```bash
npx prisma validate --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
npm run build
```

The migration command applies `20260819000000_init` and must be used only on the new empty staging database.

## 4. Start the application

For a Compose-based host:

```bash
docker compose --env-file .env.staging up --build -d
```

Check application logs and verify the service is reachable over HTTPS.

## 5. Smoke-test launch flows

- Candidate registration, OTP verification, sign-in, profile update, saved job, and application submission.
- Employer registration, company setup, job creation, team invitation, and candidate pipeline updates.
- Admin sign-in and confirmation that non-admin users receive `403` from `/api/admin/*`.
- Payment sandbox checkout, a valid webhook, duplicate webhook rejection, and entitlement persistence.
- AI request with a configured sandbox provider and a clear error when its provider is unavailable.
- WhatsApp sandbox webhook verification, duplicate event handling, opt-in status, and onboarding handoff.
- Upload an allowed file and confirm that unauthorized access is denied.

## 6. Release gate

Proceed only when all smoke tests pass, monitoring/logging is available, and backup/restore has been tested. Record the migration name, deployment version, and test results in the release log.

## 7. Rollback

1. Stop or roll back the application image first.
2. Restore the staging database from its pre-deploy snapshot if required.
3. Do not manually delete migration records or production data to force a retry.

The initial migration has no safe automatic down migration; recreate only an empty staging database when a full reset is required.
