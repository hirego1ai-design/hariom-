# Phase 3 - Application Duplicate Race Fix Deployment Guide

## Overview

Phase 3 implements an atomic upsert fix to prevent duplicate applications when multiple concurrent requests attempt to create the same application for a candidate-job pair. The fix uses PostgreSQL's unique constraint combined with a gradual rollout strategy to minimize risk.

## Architecture

### Database Layer
- **Constraint**: Unique index on `Application(candidateProfileId, jobId)`
- **Migration**: `20260823050000_harden_application_submission`
- **Status**: Already applied in production

### Application Layer
- **Service**: `src/lib/services/ApplicationAtomicUpsert.ts`
- **Methods**:
  - `handleApplicationValidationIntentAtomic()` - Atomic creation of validation intent
  - `handleApplicationSubmissionAtomic()` - Atomic creation of final application
  - `shouldUseAtomicUpsert(userId)` - Gradual rollout control

### Feature Flags
- `ENABLE_APPLICATION_UPSERT_FIX` - Enable/disable the atomic fix globally
- `APPLICATION_UPSERT_ROLLOUT_PERCENTAGE` - Control rollout percentage (0-100)

## Deployment Timeline

### Prerequisites (Before Deployment)
- [ ] Verify migration applied: `npx prisma migrate status`
- [ ] Verify unique constraint exists: Check database for `Application_candidateProfileId_jobId_key`
- [ ] Run test suite: `npm run test` - Verify "Constraint violation is detected reliably" passes
- [ ] Stage on low-traffic environment first
- [ ] Database backups configured
- [ ] Monitoring dashboards setup
- [ ] Rollback procedures documented

### Phase 1: 5% Traffic (1 hour window)

**Timing**: 2-3 AM UTC (lowest traffic period)

**Setup**:
```bash
export ENABLE_APPLICATION_UPSERT_FIX=true
export APPLICATION_UPSERT_ROLLOUT_PERCENTAGE=5
```

**Monitoring** (check every 2 minutes):
```bash
# Check for duplicate applications
SELECT COUNT(*) as duplicate_count, "candidateProfileId", "jobId"
FROM "Application"
GROUP BY "candidateProfileId", "jobId"
HAVING COUNT(*) > 1;

# Expected: 0 results

# Monitor application submission success rate
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status IN ('APPLIED', 'ASSESSMENT', 'SCREENING', 'SHORTLISTED') THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected
FROM "Application"
WHERE "createdAt" > NOW() - INTERVAL '10 minutes';

# Expected: Rejection rate unchanged
```

**Metrics to Track**:
- Duplicate application count: **MUST BE ZERO**
- API error rate for `/api/applications` POST
- Application submission latency
- Database constraint violation errors

**Success Criteria**:
- ✓ No duplicate applications detected
- ✓ Error rate stable (within 0.1% baseline)
- ✓ Latency stable (P95 < 500ms)
- ✓ Complete 1 hour without incidents

**If Issues Detected** (Rollback):
```bash
export ENABLE_APPLICATION_UPSERT_FIX=false
# Or reduce to:
export APPLICATION_UPSERT_ROLLOUT_PERCENTAGE=0
```

Then investigate root cause before proceeding.

---

### Phase 2: 10% Traffic (1 hour window)

**Trigger**: Only if Phase 1 succeeded with zero duplicates

**Setup**:
```bash
export ENABLE_APPLICATION_UPSERT_FIX=true
export APPLICATION_UPSERT_ROLLOUT_PERCENTAGE=10
```

**Monitoring**: Same queries as Phase 1, check every 2 minutes

**Success Criteria**:
- ✓ No duplicate applications detected
- ✓ Error rate stable
- ✓ Latency stable
- ✓ Complete 1 hour without incidents

---

### Phase 3: 25% Traffic (2 hour window)

**Trigger**: Only if Phase 2 succeeded

**Setup**:
```bash
export ENABLE_APPLICATION_UPSERT_FIX=true
export APPLICATION_UPSERT_ROLLOUT_PERCENTAGE=25
```

**Monitoring**: Same queries, check every 5 minutes

**Success Criteria**:
- ✓ No duplicate applications detected
- ✓ Error rate stable
- ✓ Latency stable (P95 acceptable for 25% of traffic on new path)
- ✓ Complete 2 hours without incidents

---

### Phase 4: 50% Traffic (2 hour window)

**Trigger**: Only if Phase 3 succeeded

**Setup**:
```bash
export ENABLE_APPLICATION_UPSERT_FIX=true
export APPLICATION_UPSERT_ROLLOUT_PERCENTAGE=50
```

**Monitoring**: Same queries, check every 5 minutes

**Success Criteria**:
- ✓ No duplicate applications detected
- ✓ Error rate stable
- ✓ Latency stable
- ✓ Complete 2 hours without incidents

---

### Phase 5: 100% Traffic (1 hour + Verification)

**Trigger**: Only if Phase 4 succeeded

**Setup**:
```bash
export ENABLE_APPLICATION_UPSERT_FIX=true
export APPLICATION_UPSERT_ROLLOUT_PERCENTAGE=100
```

**Verification**:
```bash
# Run stress test
npm run test -- application-duplicate-race.test.ts

# Expected: Both "Constraint violation is detected reliably" 
# and "Multiple jobs per candidate work correctly" should pass

# Query application uniqueness
SELECT 
  COUNT(DISTINCT "candidateProfileId" || ':' || "jobId") as unique_applications,
  COUNT(*) as total_applications,
  CASE WHEN COUNT(*) = COUNT(DISTINCT "candidateProfileId" || ':' || "jobId") 
    THEN 'PASS - No duplicates' 
    ELSE 'FAIL - Duplicates detected' 
  END as status
FROM "Application"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

# Expected: status = 'PASS - No duplicates'
```

**Success Criteria**:
- ✓ No duplicate applications detected
- ✓ Stress test passes
- ✓ Error rate stable
- ✓ Latency stable across full traffic
- ✓ Complete 1 hour without incidents

---

## Rollback Procedure

**Immediate Rollback** (if duplicates detected at any stage):
```bash
export ENABLE_APPLICATION_UPSERT_FIX=false
```

**Full Revert** (if cascading failures occur):
1. Disable feature flag immediately
2. Restore from database backup (if constraint integrity compromised)
3. Investigate root cause
4. Wait for fix before re-deploying

**Cannot Rollback** (database constraint already enforced):
- Existing applications with duplicate (candidateProfileId, jobId) pairs will block submissions
- Must manually reconcile duplicates or restore from backup
- This is why earlier phases are critical for testing

---

## Monitoring Dashboard

Key metrics to display continuously during rollout:

```
┌─ Application Submissions (Last Hour) ────────────────┐
│ Total Attempts: 1,247                                │
│ Successful: 1,245 (99.8%)                            │
│ Constraint Violations: 2 (expected - race condition) │
│ Duplicates Found: 0 ✓                                │
│                                                      │
│ Atomic Upsert Usage:                                 │
│ Current Phase: 5% (52 requests)                      │
│ Success Rate: 100%                                   │
│ P95 Latency: 245ms                                   │
│                                                      │
│ Database Health:                                     │
│ Connections: 12/20                                   │
│ Slow Queries: 0                                      │
│ Locks: 0                                             │
└─────────────────────────────────────────────────────┘
```

---

## Testing Commands

### Run Complete Test Suite
```bash
npm run test
```

### Run Only Duplicate Race Tests
```bash
npx tsx --test src/tests/application-duplicate-race.test.ts
```

### Query Database for Duplicates
```bash
psql $DATABASE_URL << EOF
SELECT COUNT(*) as duplicate_count
FROM "Application"
GROUP BY "candidateProfileId", "jobId"
HAVING COUNT(*) > 1;
EOF
```

### Check Application Gate States
```bash
psql $DATABASE_URL << EOF
SELECT 
  ag."type",
  ag."status",
  COUNT(*) as count
FROM "ApplicationGate" ag
GROUP BY ag."type", ag."status"
ORDER BY ag."type", ag."status";
EOF
```

---

## Failure Scenarios & Recovery

### Scenario 1: Duplicates Detected

**Symptoms**:
```sql
SELECT COUNT(*) as duplicates FROM "Application"
GROUP BY "candidateProfileId", "jobId"
HAVING COUNT(*) > 1;
-- Returns: > 0
```

**Recovery**:
1. STOP rollout immediately
2. `export ENABLE_APPLICATION_UPSERT_FIX=false`
3. Investigate root cause
4. Determine if duplicates pre-existed or were created by new code
5. If created by new code, restore from backup
6. Fix code and re-test on staging

### Scenario 2: High Error Rate

**Symptoms**:
- Error rate > 2% (0.2% above baseline)
- Constraint violations during non-race-condition scenarios

**Recovery**:
1. Check logs for specific error messages
2. Verify database is not running out of disk/memory
3. Check if slow queries are blocking submissions
4. If issue is in atomic upsert logic, rollback immediately
5. Otherwise continue monitoring

### Scenario 3: Performance Degradation

**Symptoms**:
- P95 latency > 1000ms
- Application POST times increased by > 50%

**Recovery**:
1. Check database load and connections
2. Verify indexes are being used efficiently
3. If queries are slow, consider table statistics issue: `ANALYZE "Application";`
4. If persistent, consider rolling back to cached approach

---

## Success Metrics

After reaching 100%, Phase 3 is considered successful when:

1. **Zero Duplicates**: No duplicate (candidateProfileId, jobId) pairs for 24 hours
2. **No Regressions**: Error rate and latency match pre-deployment baseline
3. **Constraint Integrity**: Database reports constraint status as VALID
4. **Test Coverage**: All race condition tests pass
5. **User Impact**: No increase in "duplicate application" support tickets

---

## Maintenance Going Forward

Once Phase 3 is complete:

1. Keep `ENABLE_APPLICATION_UPSERT_FIX=true` permanently
2. Set `APPLICATION_UPSERT_ROLLOUT_PERCENTAGE=100`
3. Monitor for constraint violations (should be zero in production)
4. Keep tests in suite for regression prevention
5. Document fix in runbooks for incident response

---

## Related Documentation

- Database Migration: `prisma/migrations/20260823050000_harden_application_submission/migration.sql`
- Implementation: `src/lib/services/ApplicationAtomicUpsert.ts`
- Tests: `src/tests/application-duplicate-race.test.ts`
- Original Issue: Application race condition causing duplicate submissions
- Affected Endpoints: `POST /api/applications`
