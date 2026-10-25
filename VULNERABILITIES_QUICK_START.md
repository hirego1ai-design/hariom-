# Critical Vulnerabilities - Quick Start Implementation

## At-a-Glance Comparison

| Vulnerability | Root Cause | Fix Pattern | Risk | Timeline |
|---|---|---|---|---|
| **Notification IDOR** | No ownership validation | Add fetch + verify check | Low (read-only fix) | 2-4 hrs |
| **Interview Admin Bypass** | Auth method not differentiated | Distinguish API key vs session | Medium (behavioral) | 4-6 hrs |
| **Application Duplicate Race** | Check-then-create gap | Atomic upsert + Serializable | High (data integrity) | 6-8 hrs |
| **Redis Session Dependency** | Single point of failure | Local cache + revocation sync | High (availability) | 8-12 hrs |

---

# Implementation Checklist by Priority

## PRIORITY 1: Notification IDOR (Hours 1-4)

### Files to Modify
```
src/app/api/notifications/route.ts
```

### Changes Summary
```diff
export async function PUT(request: NextRequest){
  const session = await requireSession(request);
  const body = await readValidatedJson(request, updateSchema);
  
+ // ADD: Ownership validation for single notification
+ if (body.notificationId) {
+   const notification = await prisma.notification.findUnique({
+     where: { id: body.notificationId },
+     select: { userId: true }
+   });
+   
+   if (!notification) throw new ApiError("Notification not found.", 404);
+   if (notification.userId !== session.id) 
+     throw new ApiError("Forbidden: This notification does not belong to you.", 403);
+ }
  
  const result = await prisma.notification.updateMany({
    where: body.markAll 
      ? {userId:session.id,isRead:false}
      : {id:body.notificationId,userId:session.id},
    data: {isRead:true}
  });
  // ... rest unchanged
}
```

### Test File
```typescript
// tests/api/notifications.test.ts
it('should reject IDOR attempt with 403', async () => {
  const attacker = await createTestUser('attacker');
  const victim = await createTestUser('victim');
  
  const victimNotif = await createNotification(victim.id);
  
  const response = await PUT(attackerRequest(attacker, { 
    notificationId: victimNotif.id 
  }));
  
  expect(response.status).toBe(403);
});
```

### Deployment
```bash
# 1. Feature flag check
git checkout -b fix/notification-idor

# 2. Make changes
# 3. Test locally and in staging
npm test tests/api/notifications.test.ts

# 4. Create PR with tests
gh pr create --title "fix: Add IDOR protection to notifications API"

# 5. Monitor after deploy
# Alert: 403 responses from notifications endpoint > 10/min
```

---

## PRIORITY 2: Interview Admin Bypass (Hours 5-10)

### Files to Modify
```
src/app/api/interviews/room/route.ts
src/lib/auth.ts (or equivalent)
```

### Changes Summary

**Step 1: Extract auth method**
```typescript
// src/lib/auth.ts
function extractAuthMethod(headers: Headers): "SESSION_COOKIE" | "API_KEY" | null {
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return "API_KEY";
  
  const cookies = headers.get("cookie") || "";
  if (cookies.includes("session=") || cookies.includes("auth=")) 
    return "SESSION_COOKIE";
  
  return null;
}

async function getCurrentSessionEnhanced(headers: Headers) {
  const session = await getCurrentSession(headers);
  if (!session) return null;
  
  const authMethod = extractAuthMethod(headers);
  return { ...session, authMethod };
}
```

**Step 2: Fix findAuthorizedInterview**
```typescript
// src/app/api/interviews/room/route.ts
async function findAuthorizedInterview(
  session: { id: string; role: string; authMethod: "SESSION_COOKIE" | "API_KEY" },
  roomId: string
) {
  const interview = await prisma.interview.findFirst({
    where: { /* existing */ },
    include: { /* existing */ }
  });
  
  if (!interview) return null;
  
  const isAssignedInterviewer = interview.roundProgress?.round.interviewers.some(
    (item) => item.userId === session.id
  );
  
  // CANDIDATE: unchanged
  if (session.role === "CANDIDATE") 
    return session.id === interview.application.candidateProfile?.userId ? interview : null;
  
  // ADMIN: differentiate by auth method
  if (session.role === "ADMIN") {
    if (session.authMethod === "API_KEY") return interview; // Trust API key
    if (!isAssignedInterviewer) return null; // Require assignment for session
    return interview;
  }
  
  // EMPLOYER/RECRUITER: unchanged
  if (!isAssignedInterviewer) return null;
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.id },
    select: { companyId: true }
  });
  return profile?.companyId === interview.application.job.companyId ? interview : null;
}
```

### Test File
```typescript
// tests/api/interviews/admin-bypass.test.ts
it('should allow ADMIN with API key', async () => {
  const admin = await createTestAdmin();
  const interview = await createTestInterview({ interviewerIds: [] });
  
  const result = await findAuthorizedInterview(
    { ...admin, authMethod: "API_KEY" },
    interview.id
  );
  
  expect(result).not.toBeNull();
});

it('should deny ADMIN with session cookie if not assigned', async () => {
  const admin = await createTestAdmin();
  const interview = await createTestInterview({ interviewerIds: [] });
  
  const result = await findAuthorizedInterview(
    { ...admin, authMethod: "SESSION_COOKIE" },
    interview.id
  );
  
  expect(result).toBeNull();
});
```

### Deployment
```bash
git checkout -b fix/interview-admin-bypass

# Add extractAuthMethod utility
# Update findAuthorizedInterview logic
# Add comprehensive tests

npm test tests/api/interviews/admin-bypass.test.ts

gh pr create --title "fix: Require admin assignment for session-based interview access"
```

---

## PRIORITY 3: Application Duplicate Race (Hours 11-19)

### Files to Modify
```
prisma/schema.prisma (migration)
src/app/api/applications/route.ts
```

### Database Changes

**Step 1: Create migration**
```bash
npx prisma migrate dev --name add_application_unique_constraint
```

**Step 2: Migration file**
```sql
-- Remove duplicates (keep most recent)
DELETE FROM "Application" a WHERE EXISTS (
  SELECT 1 FROM "Application" b 
  WHERE a."candidateProfileId" = b."candidateProfileId"
    AND a."jobId" = b."jobId"
    AND a."createdAt" < b."createdAt"
);

-- Add unique constraint
ALTER TABLE "Application" 
ADD CONSTRAINT "candidateProfileId_jobId" 
UNIQUE("candidateProfileId", "jobId");
```

**Step 3: Schema update**
```prisma
model Application {
  id                  String    @id @default(uuid())
  candidateProfileId  String
  jobId              String
  // ... fields ...
  
  @@unique([candidateProfileId, jobId], name: "candidateProfileId_jobId")
}
```

### Code Changes

```typescript
// src/app/api/applications/route.ts
export async function POST(req: NextRequest) {
  const session = await getCurrentSession(req.headers);
  if (!session || session.role !== "CANDIDATE") 
    return jsonError("Candidate access required", 403);

  const { jobId, answers } = await readValidatedJson(req, applicationSchema);
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: session.id }
  });

  if (!candidate) return jsonError("Complete your profile", 409);

  // FIXED: Use atomic upsert instead of check-then-create
  try {
    const result = await prisma.$transaction(async (tx) => {
      const app = await tx.application.upsert({
        where: {
          candidateProfileId_jobId: {
            candidateProfileId: candidate.id,
            jobId
          }
        },
        create: {
          candidateProfileId: candidate.id,
          jobId,
          status: ApplicationStatus.APPLIED,
          screeningAnswers: answers as Prisma.InputJsonValue
        },
        update: {
          screeningAnswers: answers as Prisma.InputJsonValue,
          updatedAt: new Date()
        },
        include: { gates: true }
      });
      
      return app;
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ success: true, application: result });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        return jsonError("Submission conflict, please retry", 409);
      }
    }
    throw error;
  }
}
```

### Test File
```typescript
// tests/api/applications/race-condition.test.ts
it('should handle concurrent applications atomically', async () => {
  const candidate = await createTestCandidate();
  const job = await createTestJob();
  
  const results = await Promise.all([
    POST(candidateRequest(candidate, { jobId: job.id, answers: {} })),
    POST(candidateRequest(candidate, { jobId: job.id, answers: {} })),
    POST(candidateRequest(candidate, { jobId: job.id, answers: {} }))
  ]);
  
  // All succeed
  expect(results.every(r => r.status === 200)).toBe(true);
  
  // Only one application exists
  const apps = await prisma.application.findMany({
    where: { candidateProfileId: candidate.id, jobId: job.id }
  });
  expect(apps.length).toBe(1);
  
  // All reference same application
  const appIds = results.map(r => r.body.application.id);
  expect(new Set(appIds).size).toBe(1);
});
```

### Deployment
```bash
git checkout -b fix/application-duplicate-race

# Test migration on staging DB
npm run prisma:migrate:staging

# Verify no data loss
# Verify constraint added correctly

npm test tests/api/applications/race-condition.test.ts

# Stress test: concurrent requests
npm test -- --testNamePattern="concurrent"

gh pr create --title "fix: Prevent duplicate applications with atomic upsert"
```

---

## PRIORITY 4: Redis Session Dependency (Hours 20-32)

### Files to Create/Modify
```
src/lib/cache/SessionCache.ts (NEW)
src/lib/auth.ts (modify)
src/middleware.ts (modify)
prisma/schema.prisma (add SecurityAuditEvent)
```

### Step-by-Step Implementation

**Step 1: Create LocalSessionCache class**
```typescript
// src/lib/cache/SessionCache.ts
export class LocalSessionCache {
  private cache: Map<string, any> = new Map();
  private revocationList: Set<string> = new Set();
  
  constructor(private ttlSeconds: number = 300) {
    this.startCleanup();
  }
  
  get(token: string) {
    const entry = this.cache.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      this.cache.delete(token);
      return null;
    }
    if (this.revocationList.has(token)) return null;
    return entry.data;
  }
  
  set(token: string, session: any) {
    this.cache.set(token, {
      data: session,
      expiresAt: Date.now() + this.ttlSeconds * 1000
    });
  }
  
  revoke(token: string) {
    this.revocationList.add(token);
    this.cache.delete(token);
  }
  
  private startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [token, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) this.cache.delete(token);
      }
    }, 60_000);
  }
}

const cache = new LocalSessionCache(300); // 5 minutes
export default cache;
```

**Step 2: Update getCurrentSession with fallback**
```typescript
// src/lib/auth.ts
import cache from './cache/SessionCache';
import { Redis } from '@upstash/redis';

const redis = new Redis({ url: process.env.REDIS_URL });

async function isRedisHealthy(): Promise<boolean> {
  try {
    const result = await Promise.race([
      redis.ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 2000)
      )
    ]);
    return result === 'PONG';
  } catch {
    return false;
  }
}

export async function getCurrentSession(headers: Headers) {
  const token = extractToken(headers); // Existing function
  if (!token) return null;
  
  try {
    // Try Redis first
    const healthy = await isRedisHealthy();
    if (healthy) {
      const session = await redis.get(`session:${token}`);
      if (session) {
        cache.set(token, session);
        return session;
      }
    }
  } catch (error) {
    console.warn('Redis error, using cache:', error);
  }
  
  // Fall back to local cache
  const cached = cache.get(token);
  if (cached) {
    console.log('Using cached session');
    return cached;
  }
  
  return null;
}

export async function revokeSession(token: string) {
  try {
    await redis.del(`session:${token}`);
    await redis.sadd('revoked:sessions', token);
  } catch (error) {
    console.warn('Redis revoke failed:', error);
  }
  
  cache.revoke(token);
}
```

**Step 3: Update logout endpoint**
```typescript
// src/app/api/auth/logout/route.ts
export async function POST(req: NextRequest) {
  const session = await getCurrentSession(req.headers);
  if (!session) return jsonError('Unauthorized', 401);
  
  const token = extractToken(req.headers);
  if (token) {
    await revokeSession(token);
  }
  
  return NextResponse.json({ success: true });
}
```

**Step 4: Add health endpoint**
```typescript
// src/app/api/health/route.ts
export async function GET(req: NextRequest) {
  const redisHealthy = await isRedisHealthy();
  
  return NextResponse.json({
    status: 'ok',
    redis: redisHealthy ? 'operational' : 'degraded',
    cache: 'operational'
  });
}
```

### Database Migration
```prisma
model SecurityAuditEvent {
  id          String   @id @default(uuid())
  userId      String
  type        String   // "SESSION_VALIDATED", "SESSION_REVOKED"
  authMethod  String?  // "REDIS", "CACHE", "FAILED"
  timestamp   DateTime @default(now())
  
  @@index([userId])
  @@index([timestamp])
}
```

### Test File
```typescript
// tests/lib/session-cache.test.ts
import { LocalSessionCache } from '@/lib/cache/SessionCache';

describe('LocalSessionCache', () => {
  it('should cache and retrieve sessions', () => {
    const cache = new LocalSessionCache(300);
    const session = { userId: '123', role: 'CANDIDATE' };
    
    cache.set('token-1', session);
    expect(cache.get('token-1')).toEqual(session);
  });
  
  it('should expire old entries', async () => {
    const cache = new LocalSessionCache(0.1); // 100ms TTL
    cache.set('token-1', { userId: '123' });
    
    await new Promise(r => setTimeout(r, 150));
    
    expect(cache.get('token-1')).toBeNull();
  });
  
  it('should reject revoked sessions', () => {
    const cache = new LocalSessionCache(300);
    const session = { userId: '123' };
    
    cache.set('token-1', session);
    cache.revoke('token-1');
    
    expect(cache.get('token-1')).toBeNull();
  });
});

// tests/integration/redis-fallback.test.ts
describe('Redis Fallback', () => {
  it('should use cache when Redis down', async () => {
    // Mock Redis failure
    jest.spyOn(redis, 'get').mockRejectedValue(new Error('down'));
    
    // Pre-populate cache
    cache.set('token-1', { userId: '123', role: 'CANDIDATE' });
    
    const session = await getCurrentSession(fakeHeaders('token-1'));
    
    expect(session).not.toBeNull();
    expect(session.userId).toBe('123');
  });
  
  it('should fail-closed when Redis down and cache miss', async () => {
    jest.spyOn(redis, 'get').mockRejectedValue(new Error('down'));
    cache.cache.clear(); // Clear cache
    
    const session = await getCurrentSession(fakeHeaders('unknown-token'));
    
    expect(session).toBeNull();
  });
});
```

### Deployment
```bash
git checkout -b fix/redis-session-dependency

# Create LocalSessionCache class
# Update auth.ts with fallback logic
# Add tests

npm test tests/lib/session-cache.test.ts
npm test tests/integration/redis-fallback.test.ts

# Test in staging with Redis down scenario
# Verify metrics and monitoring

gh pr create --title "fix: Add local cache fallback for Redis session dependency"
```

---

# Testing Strategy Summary

## Local Development
```bash
# Run all security tests
npm test -- --testNamePattern="CRITICAL|security|vulnerability"

# Run specific vulnerability test suite
npm test tests/api/notifications.test.ts
npm test tests/api/interviews/admin-bypass.test.ts
npm test tests/api/applications/race-condition.test.ts
npm test tests/lib/session-cache.test.ts
```

## Staging Deployment
```bash
# Before deploy: run full test suite
npm test

# After deploy: verify fixes
curl -X PUT https://staging/api/notifications \
  -H "Authorization: Bearer attacker-token" \
  -d '{"notificationId": "victim-notification-id"}'
# Should return 403, not 200

# Test Redis fallback
# Bring down Redis, verify system still operational
docker-compose stop redis
# System should continue working with degraded caching

# Test concurrent application submissions
npm run test:stress -- applications --concurrent 100
```

## Production Monitoring

### Metrics to Track
```
- notifications_put_403_responses (should increase post-fix)
- interview_access_denied_admin (should appear post-fix)
- application_creation_latency (should decrease post-fix)
- session_validation_cache_hit_rate (should be >80% post-fix)
- redis_health_check_failures (should be <0.1% post-fix)
```

### Alerts to Create
```
- Notification IDOR: 403 responses > 10/min
- Interview admin: Unauthorized admin attempts > 5/min
- Application race: P2034 errors > 1/min
- Redis fallback: Redis unavailable > 1 minute
- Session cache: Cache hit rate < 70%
```

---

# Rollback Plan

## For Each Vulnerability

### Notification IDOR (2 minutes)
```bash
# Remove the ownership check, revert to old behavior
git revert <commit-hash>
npm run deploy:production
```

### Interview Admin Bypass (2 minutes)
```bash
# Feature flag: disable auth method check
ENABLE_ADMIN_AUTH_METHOD_CHECK=false npm run deploy:production
```

### Application Duplicate Race (15 minutes)
```bash
# Reverse to old check-then-create pattern
# Remove unique constraint in migration
git revert <migration-hash> <code-changes-hash>
npm run prisma:migrate:production
npm run deploy:production
```

### Redis Session Dependency (5 minutes)
```bash
# Feature flag: disable local cache fallback
USE_LOCAL_CACHE_FALLBACK=false npm run deploy:production
```

---

# Success Criteria

| Vulnerability | Success Criteria | Verification |
|---|---|---|
| IDOR | 403 on unauthorized access | `curl -X PUT -H "wrong-user" notification-id` |
| Admin Bypass | Deny session-based admin without assignment | Check audit logs for denials |
| Race Condition | Exactly 1 app created under concurrent load | `for i in {1..10}; do parallel_submit & done` |
| Redis Fallback | System operational during Redis downtime | `docker stop redis; verify functionality` |

---

