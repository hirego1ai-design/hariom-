# 🔴 Candidate Section — Vulnerability Summary & Quick Reference

**Generated:** August 14, 2026  
**Status:** ⚠️ DO NOT DEPLOY

---

## 🔴 CRITICAL BLOCKERS (4)

### 1️⃣ Notification IDOR — Cross-User Access
- **File:** `src/app/api/notifications/route.ts:40-46`
- **Risk:** Mark other users' notifications as read
- **Fix Time:** 1 hour
- **Code Fix:**
  ```typescript
  // Validate ownership before update
  const notif = await prisma.notification.findUnique({where:{id}});
  if (!notif || notif.userId !== session.id) throw new ApiError("Not found", 404);
  ```

---

### 2️⃣ Interview Admin Bypass — Eavesdrop on Interviews
- **File:** `src/app/api/interviews/room/route.ts:45-75`
- **Risk:** ADMIN users can access any interview room, eavesdrop on candidates
- **Fix Time:** 2 hours
- **Code Fix:**
  ```typescript
  if (session.role === "ADMIN") {
    throw new ApiError("Use API key auth, not session", 403);
  }
  ```

---

### 3️⃣ Application Duplicate Race — Double Charging
- **File:** `src/app/api/applications/route.ts:97-180`
- **Risk:** Concurrent requests create duplicate applications, double-count billing
- **Fix Time:** 3 hours
- **Code Fix:**
  ```typescript
  const app = await prisma.application.upsert({
    where: {candidateProfileId_jobId: {...}},
    update: {...},
    create: {...}
  }, {isolationLevel: "Serializable"});
  ```

---

### 4️⃣ Redis Dependency — Complete Outage if Down
- **File:** `src/lib/auth.ts:105-145`
- **Risk:** All authenticated requests fail (503) if Redis is down
- **Fix Time:** 6 hours
- **Code Fix:**
  ```typescript
  // Add local cache fallback for 5min when Redis unavailable
  const cached = sessionCache.get(jti);
  if (cached && cached.expiresAt > Date.now()) return !cached.isRevoked;
  ```

---

## 🔶 HIGH-SEVERITY (6)

| # | Issue | File | Impact | Time |
|---|-------|------|--------|------|
| 5 | Status Races | `applications/route.ts:200-320` | Withdrawn apps revived, double billing | 4h |
| 6 | SDP Plaintext | `interviews/room/route.ts:180-220` | IP/fingerprint leakage, MITM attacks | 3h |
| 7 | Offer IDOR | `offers/[id]/route.ts` | Accept other user's offers | 1h |
| 8 | Rate Limit Order | `apiSecurity.ts` | 10K requests bypass rate limit | 1h |
| 9 | Mock Data | Multiple | Database down = fake data returned | 2h |
| (unlisted) | Proctoring Gap | `interviews/room/route.ts:290-310` | Consent not checked on poll | 1h |

---

## 📊 RISK MATRIX

```
IMPACT ↑
     │                    ┌─ #2 (Interview Eavesdrop)
     │                    │
 HIGH├── #1 ──┬─ #3 ──────┤
     │      │              │ #4 (Service Down)
     │      └─ #9 ─────────┤
     │                    │
 MED ├── #5 ──────────────┤
     │      #7 #8         │
     │        #6         │
     │              
 LOW ├──────────────────────────
     │
     └────────────────────────────→ LIKELIHOOD
         Likely    Possible   Rare
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] ❌ #1: Notification IDOR fixed & tested
- [ ] ❌ #2: Interview Admin bypass fixed & tested
- [ ] ❌ #3: Application race condition fixed & tested
- [ ] ❌ #4: Redis fallback cache implemented & tested
- [ ] ❌ #5-9: HIGH severity issues fixed & tested
- [ ] ❌ All changes code-reviewed
- [ ] ❌ All changes tested in staging
- [ ] ❌ Load testing passed (concurrent requests)
- [ ] ❌ Regression tests passed
- [ ] ❌ Security audit sign-off

---

## 📞 Escalation

**IF YOU FIND ANY OF THESE IN PRODUCTION:**

1. **Notification IDOR:** Immediately block user accounts involved, audit notification access logs
2. **Interview Eavesdrop:** Check interview logs for unexpected ADMIN access, verify recordings integrity
3. **Duplicate Applications:** Audit billing, refund double-charges, consolidate duplicate applications
4. **Redis Down:** Check session cache logs, verify no revoked sessions still active
5. **Status Races:** Audit application workflow, verify no withdrawn apps were hired

---

## 📋 TEST CASES TO ADD

### Test: Notification IDOR
```bash
POST /api/notifications/mark-read
{ "notificationId": "<victim-notif-id>" }
→ Expected: 404 Not Found
→ Actual: 200 OK (BUG)
```

### Test: Interview Admin Bypass
```bash
# Create ADMIN session
GET /api/interviews/room?roomId=<valid-interview>
→ Expected: 403 Forbidden
→ Actual: 200 OK (BUG)
```

### Test: Application Duplicate
```bash
# 100 concurrent POSTs same job
→ Expected: 1 application
→ Actual: 2-3 duplicate applications (BUG)
```

---

## 🔧 Implementation Priority

### DAY 1: Fix CRITICAL (#1-4)
- [ ] 09:00 - #1 Notification fix (1h)
- [ ] 10:00 - #2 Interview fix (2h)
- [ ] 12:00 - #3 Application fix (3h)
- [ ] 15:00 - #4 Redis cache (2h)
- [ ] 17:00 - Code review + merge

### DAY 2: Fix HIGH + Test
- [ ] 09:00 - #5, #7, #8 fixes (2h)
- [ ] 11:00 - #9 Mock data removal (1h)
- [ ] 12:00 - #6 SDP encryption (2h)
- [ ] 14:00 - Full test suite (3h)
- [ ] 17:00 - Regression tests

### DAY 3: Deploy
- [ ] 09:00 - Staging validation (1h)
- [ ] 10:00 - Load testing (2h)
- [ ] 12:00 - Pre-prod mirror test (1h)
- [ ] 14:00 - Production deployment (1h)
- [ ] 15:00 - Verification + monitoring

---

## Recommended: Get Help

These are production security issues. Consider:
1. **Consulting external security firm** for code review
2. **Running penetration test** on staging environment
3. **Engaging DevSecOps team** for deployment validation
4. **Setting up incident response** for any issues found in production

**Expected Cost:** $15K-30K but worth it for a hiring platform with financial/privacy implications.

