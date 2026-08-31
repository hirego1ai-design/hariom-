# Production migration reconciliation runbook

The live `Hariom` schema has been reconciled through reviewed SQL, but its
Prisma `_prisma_migrations` history is behind the repository. Do not run
`prisma migrate deploy` against this database until this runbook is completed.

## Why this is required

`prisma migrate status` sees these repository migrations as pending even though
their resulting schema is present:

- `20260823050000_harden_application_submission`
- `20260823060000_make_ai_usage_unknown_explicit`
- `20260823070000_fix_promo_audit_video_integrity`
- `20260830070000_convert_mcq_system`
- `20260830100000_candidate_readiness_and_credits`
- `20260830110000_typing_practice_prompts`
- `20260830120000_production_schema_reconcile`
- `20260830130000_lock_down_public_data_api_roles`
- `20260831100000_production_integrity_reconcile`

The retired `20260823070000_assessment_engine` migration is intentionally not
executed because the coding IDE was removed. Its legacy tables are not used by
the current Prisma schema.

## Safe procedure

1. Take and verify a Supabase backup.
2. Use a direct, non-pgbouncer administrative connection.
3. Confirm the schema checks in `SUPABASE_SCHEMA_AUDIT.md`.
4. Use `prisma migrate resolve --applied <migration_name>` only for migrations
   whose resulting schema has been verified.
5. Resolve the retired coding migration only as an explicitly approved
   historical baseline decision; do not execute its table-creation SQL.
6. Run `prisma migrate status` and confirm no unexpected pending migrations or
   checksum errors.
7. Run the application smoke suite before enabling production deploys.

Active migration reconciliation is now complete. `prisma migrate status`
connects successfully and reports only the intentionally retired
`20260823070000_assessment_engine` migration as pending. It must not be
executed because the coding/IDE feature was removed. The live ledger contains
all other repository migrations, including the company-invitation migration.
