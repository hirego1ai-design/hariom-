# Supabase schema audit

Checked through Supabase MCP on 2026-08-30.

## Connected project

- Active project: `Hariom`
- Project ref: `eqsxuwlnidexlgseuogu`
- Region: `ap-southeast-2`
- PostgreSQL: 17.6
- A second project, `hirego1ai-design's Project`, was inactive and timed out; it was not treated as the application database.

## What must be created

The active database does not contain these repository models:

- `CandidateReadiness`
- `CandidateCreditWallet`
- `CandidateCreditLedger`
- `CandidateServiceCatalog`
- `CandidateServiceUsage`
- `TypingPracticePrompt`

The active database is also missing these repository columns:

- `JobListing.requiresJobReady`
- `JobListing.jobReadyRoleTitle`
- `JobListing.jobReadySeniority`
- `McqAssessment.scope`
- `McqAssessment.roleTitle`
- `McqAssessment.seniority`
- `McqAssessment.validityDays`
- `McqAssessment.retakeCooldownHours`

The additive reconciliation applied to the active project through Supabase MCP is:

- `production_schema_reconcile_candidate_foundations` (repository file:
  `prisma/migrations/20260830120000_production_schema_reconcile/migration.sql`)

It creates the six missing tables, adds the eight missing columns, sets the
future `McqAssessment.isActive` default to `false`, and adds the active-attempt
concurrency index. It does not seed content, change existing balances, or
delete data.

The original repository migrations that describe these structures are:

- `20260830100000_candidate_readiness_and_credits`
- `20260830110000_typing_practice_prompts`

The live database migration history does not contain all repository migration
files and one historical checksum differs from the current checkout. Do not
run `prisma migrate deploy` against this database until that drift is reconciled
in a controlled release process. The live `McqAssessment.isActive` default is
now `false` for future rows; existing assessment rows were not changed.

The live `McqAttempt` table now has the reviewed partial unique active-attempt
index. Submitted attempts remain available as history.

## What must not be removed

No table is proven safe to remove. All 70 live application tables have corresponding repository models or are Prisma metadata. Do not drop `User`, `CandidateProfile`, `JobListing`, `Application`, `Mcq*`, `TypingAssessment`, `MockInterview*`, `StoredFile`, `Notification`, referral, payment, queue, or audit tables. Existing rows include 25 users, 4 candidate profiles, 2 jobs, 2 applications, 2 MCQ assessments, and 1 MCQ attempt.

## Critical security finding

Supabase security advisors report RLS disabled on all 70 public tables. Direct SQL verification also returned:

- `anon` has `public` schema usage: `true`
- `authenticated` has `public` schema usage: `true`
- `anon` can `SELECT` `public."User"`: `true`
- `anon` can `SELECT` `public."CandidateProfile"`: `true`
- `authenticated` can `SELECT` `public."CandidateProfile"`: `true`

This is a P0 exposure if the Supabase Data API is reachable. It can expose or mutate personal data independently of the Next.js API. Do not run the advisor's blanket `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` script yet: without policies, it can block legitimate access, and the application uses custom JWT sessions rather than Supabase Auth claims.

## Remediation status

The application uses server-side Prisma and has no Supabase client. The approved
mitigation was executed on 2026-08-31 through Supabase MCP:

- revoked `anon` and `authenticated` privileges on public tables, sequences,
  functions, and future objects;
- verified both roles cannot `SELECT` `public."User"` or
  `public."CandidateProfile"`;
- verified there are zero executable public functions for `anon`.

After the lockdown, the Supabase security advisor returns zero lints. The
performance advisor reports informational `unused_index` and
`unindexed_foreign_keys` notices; no indexes were removed because the database
has live traffic history and those notices are not proof of a safe deletion.

The Supabase advisor may still report `rls_disabled_in_public` because the
tables remain in the `public` schema. This is a defense-in-depth follow-up, not
an active Data API exposure now that the roles have no table privileges. Do not
add generic `auth.uid()` policies: this application uses custom JWT sessions,
not Supabase Auth claims. If the Data API is needed in the future, design and
test table-specific policies on a branch first.

Migration-history reconciliation is complete for all active repository
migrations. `prisma migrate status` now connects successfully and reports only
the intentionally retired `20260823070000_assessment_engine` migration as
pending. It must not be executed because the coding/IDE feature was removed.
All active schema migrations, including company invitations, are recorded in
the live `_prisma_migrations` ledger.

The additive schema reconciliation and public Data API privilege lockdown were
applied through Supabase MCP. No table was deleted and no existing application
row was rewritten. The reviewed lockdown SQL is committed locally at
`prisma/migrations/20260830130000_lock_down_public_data_api_roles/migration.sql`.

The production integrity reconciliation was also applied:
`prisma/migrations/20260831100000_production_integrity_reconcile/migration.sql`.
It added the application uniqueness index, nullable provider-usage telemetry,
promo reservation fields, and nullable video-score fields after verifying no
duplicate application pairs existed. At that time, the security advisor had no
findings; performance notices were informational only.

## RLS defense in depth update

On 2026-09-08, RLS was enabled on every application-owned table in the
`Hariom` staging project through the reviewed migration
`20260908093000_enable_public_table_rls`. Prisma's
`_prisma_migrations` ledger was intentionally excluded.

This application has no Supabase browser client and does not use Supabase Auth:
all data access goes through server-side Prisma with custom JWT authorization.
Accordingly, no `auth.uid()` policies were added and no privileges were granted
to `anon` or `authenticated`. Post-deployment verification confirmed that all
79 application tables have RLS enabled and those roles cannot select from the
`User` table. Supabase may report informational `rls_enabled_no_policy` notices;
these are expected because Data API access is deliberately denied.

## Prisma migration-ledger follow-up

The following schema changes were applied directly to the `Hariom` staging
project through Supabase MCP on 2026-09-08:

- `20260905090000_add_ai_agent_credits`
- `20260905100000_add_security_audit_outbox`
- `20260908093000_enable_public_table_rls`

They are not yet recorded in Prisma's `_prisma_migrations` ledger. Before any
future `prisma migrate deploy` against this database, use the staging
`DATABASE_URL` to mark each existing migration as applied with
`npx prisma migrate resolve --applied <migration_name>`. Do not rerun their SQL
or manually insert migration-ledger rows.
