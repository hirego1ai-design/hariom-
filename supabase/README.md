# Supabase migration ledger

HireGo AI uses **Prisma Migrate** as the authoritative application-schema migration system.

The SQL files in `supabase/migrations/` mirror migration versions already recorded in the production Supabase `supabase_migrations.schema_migrations` table. They exist so the Supabase GitHub integration can reconcile its historical migration ledger without reporting false `MIGRATIONS_FAILED` drift.

Rules:

- Do not create new application schema migrations here. Create them under `prisma/migrations/`.
- Do not rename, delete, or edit historical files after their version is recorded by Supabase.
- Do not erase production migration history merely to match the repository.
- Prisma CI remains responsible for validating and applying application migrations.

This ledger was synchronized from the production Supabase migration history on 2026-09-23.
