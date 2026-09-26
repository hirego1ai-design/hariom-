# Supabase migration history reconciliation — 2026-09-26

Production `supabase_migrations.schema_migrations` contains 28 applied versions. The repository's `supabase/migrations` directory contained the first 20 versions and was missing eight later versions that had already been applied to production.

This reconciliation restores only the missing repository mirror files for these already-applied versions:

- 20260925145021 — universal_skill_validation
- 20260925145102 — universal_skill_validation_rls_hardening
- 20260926041126 — application_assessment_gates
- 20260926041132 — assessment_notice_acknowledgement
- 20260926041148 — private_assessment_feedback
- 20260926041155 — mock_interview_skill_focus
- 20260926041201 — job_specific_assessment_requirement
- 20260926041206 — assessment_authoring_provenance

The SQL was reconstructed from the production Supabase migration ledger. No production migration rows, schema objects, or data are modified by this repository-only reconciliation.

Prisma Migrate remains the authoritative application-schema migration system. The `supabase/migrations` directory mirrors the versions recorded by the Supabase integration so GitHub preview/status checks can compare migration history correctly.
