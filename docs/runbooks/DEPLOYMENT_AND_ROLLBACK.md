# HireGo AI — Production Deployment & Rollback Runbook

## 1. Release Gating & Pre-Flight Checks

Before promoting code to production, all changes must clear the automated gating pipeline without exemptions:

1. **Clean Dependencies**: `npm ci` without peer-dependency warnings or untracked package changes.
2. **Schema & Migration Verification**:
   - `npx prisma validate` passes.
   - `npx prisma generate` builds fresh `@prisma/client`.
   - `npx prisma migrate status` confirms zero pending migrations.
3. **Static Typing & Linter**:
   - `npx tsc --noEmit` exits with 0 errors.
   - `npm run lint` passes with 0 blocking errors.
4. **Audit & Regression Testing**:
   - `npm run test:audit` passes 100% of tests.
   - Specific regression suites (mock-interview, communication-template, payments, team-invitations) all pass.
5. **Next.js Production Build**:
   - `npm run build` generates all static, dynamic, and streaming routes cleanly.

---

## 2. Zero-Downtime Migration Policy (Expand and Contract)

Database schema updates MUST always follow the **Expand and Contract** pattern:

- **Phase 1 (Expand)**: Add new nullable columns, tables, or indexes. Existing production application code continues running untouched.
- **Phase 2 (Migrate)**: Deploy updated application code that reads and writes both old and new columns. Run backfill worker if needed.
- **Phase 3 (Contract)**: Mark obsolete columns deprecated. In a subsequent release, remove old columns/tables.

> **CRITICAL RULE**: Never execute destructive DDL (`DROP COLUMN`, `ALTER TABLE ... RENAME`, `DROP TABLE`) in the same deployment as application code relying on the new state.

---

## 3. Production Deployment Workflow

### Step 1: Migration Deployment
Deploy migrations from CI using direct pooler session mode:
```bash
npx prisma migrate deploy
```
*Note: Staging migration must have baked for a minimum of 24 hours prior to production deployment.*

### Step 2: Edge / Application Rollout
Promote build to production target (Vercel / Cloud Run):
```bash
# Automated via GitHub Actions CI/CD on main branch tag release
git tag -a v1.0.0-prod -m "Production Release v1.0.0"
git push origin v1.0.0-prod
```

### Step 3: Canary Health Verification
Within 60 seconds of traffic shift, execute automated health validation:
```bash
curl -f https://hirego.ai/api/health
```
Assert that:
- `status` is `"healthy"` (HTTP 200)
- `database.connected` is `true`
- `latencyMs` is within acceptable thresholds (< 350ms)

---

## 4. Emergency Instant Rollback Procedure

If any of the following triggers occur within 15 minutes post-deployment:
- 5xx error rate spikes above 0.5%
- P95 latency increases by > 100%
- Transaction timeout errors (`P2028`) appear in logs

### Rollback Execution:
1. **Instant Application Rollback**:
   In Vercel / Cloud Run console or CLI:
   ```bash
   vercel rollback <previous-known-good-deployment-url>
   ```
2. **Traffic Re-routing**: Immediate edge DNS flip to previous immutable container image.
3. **Verify Health**: Confirm `/api/health` returns 200 OK on previous version.
4. **Incident Post-Mortem**: Convene retrospective to diagnose root cause before re-queueing release.
