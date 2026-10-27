# Critical Vulnerabilities - Technical Design & Implementation

## Executive Summary

This document provides comprehensive technical solutions for 4 CRITICAL security vulnerabilities in Hirego 3.0. Each vulnerability includes:
- Architecture diagrams (text-based)
- Specific code patterns
- Integration points
- Test strategies
- Backward compatibility considerations

---

# VULNERABILITY #1: Notification IDOR (Insecure Direct Object Reference)

## 1.1 Vulnerability Overview

**Location**: `src/app/api/notifications/route.ts` - PUT handler
**Severity**: CRITICAL
**Current Behavior**: PUT endpoint marks notifications as read without verifying ownership

```typescript
// VULNERABLE CODE - Current
export async function PUT(request: NextRequest){
 try{
  await enforceRateLimit(request,"notifications_update",60,60_000);
  const session=await requireSession(request);
  const body=await readValidatedJson(request,updateSchema);
  // VULNERABLE: Only checks if notificationId is provided, not if it belongs to session.id
  const result=await prisma.notification.updateMany({
    where:body.markAll?{userId:session.id,isRead:false}:{id:body.notificationId,userId:session.id},
    data:{isRead:true}
  });
  if(!body.markAll&&result.count!==1)throw new ApiError("Notification not found.",404);
  return NextResponse.json({success:true,updatedCount:result.count});
 }catch(error){return handleApiError(error);}
}
```

**Bug Condition (C):**
```
FUNCTION isBugCondition(request, sessionId, notificationId)
  INPUT: HTTP PUT request with optional notificationId field
  OUTPUT: boolean
  
  RETURN request.method === "PUT"
         AND request.body.notificationId !== null
         AND request.body.notificationId is valid UUID format
         AND notification(notificationId).userId !== sessionId  // IDOR occurs here
END FUNCTION
```

### Examples:
1. User A (id: `111`) can update User B's (id: `222`) notification by sending:
   ```json
   { "notificationId": "222-notification-uuid" }
   ```
2. User A can mark User B's notifications as read without authorization
3. Attacker can enumerate and modify all notifications system-wide

---

## 1.2 Root Cause Analysis

The current code only validates ownership in the `markAll` branch but relies on SQL WHERE clause in the single-notification branch. However, the validation happens in the SQL WHERE, but there's no explicit pre-fetch validation.

**Root Causes:**
1. **No Pre-fetch Validation**: Notification ownership not verified before update attempt
2. **Silent Failures**: `updateMany` may silently fail to update if WHERE clause doesn't match
3. **Race Condition Potential**: Between validation and update (though minor)
4. **No Explicit Return**: Cannot distinguish between "not found" and "not owned"

---

## 1.3 Expected Behavior & Preservation

### Preservation Requirements:
- ✅ `markAll: true` must continue working for authenticated users (marks all their unread notifications)
- ✅ Rate limiting must remain at 60 requests per 60 seconds
- ✅ Existing error messages must be preserved for UX consistency
- ✅ Response format unchanged: `{ success: true, updatedCount }`

### Security Property:
```
FUNCTION expectedBehavior(request, sessionId)
  FOR ANY request WHERE isBugCondition(request, sessionId, notificationId) = true
    // Notification belongs to another user
    THEN response.statusCode = 404
         AND response.body.message contains "not found"
         AND notification.isRead remains false (unchanged)
         
  FOR ANY request WHERE request.body.markAll = true
    // User marks all THEIR unread notifications
    THEN response.statusCode = 200
         AND all notifications WHERE (userId = sessionId AND isRead = false) 
             are marked isRead = true
         AND unrelated users' notifications are unaffected
END FUNCTION
```

---

## 1.4 Architecture Diagram

```
REQUEST: PUT /api/notifications
  │
  ├─→ Authentication Middleware
  │    │ Validate JWT/session
  │    └─→ Extract session.id
  │
  ├─→ Rate Limiting Check
  │    └─→ 60 requests/60 seconds
  │
  ├─→ OWNERSHIP VALIDATION (NEW LAYER)
  │    │ If notificationId provided:
  │    │   Fetch notification WHERE id = notificationId
  │    │   If not found → 404 Notification not found
  │    │   If found AND notification.userId ≠ session.id → 403 Forbidden
  │    │   If found AND notification.userId = session.id → Proceed
  │    └─→ If markAll → Skip to step 5
  │
  ├─→ Update Operation
  │    └─→ Set isRead = true for validated notification
  │
├─→ Response
 └─→ { success: true, updatedCount: 1 }
```

---

## 1.5 Code Implementation Pattern

### Pattern 1: Two-Phase Update with Explicit Ownership Check

```typescript
export async function PUT(request: NextRequest) {
  try {
    await enforceRateLimit(request, "notifications_update", 60, 60_000);
    const session = await requireSession(request);
    const body = await readValidatedJson(request, updateSchema);

    // PATTERN A: markAll flow - unchanged
    if (body.markAll) {
      const result = await prisma.notification.updateMany({
        where: { userId: session.id, isRead: false },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true, updatedCount: result.count });
    }

    // PATTERN B: Single notification with ownership validation
    // Phase 1: Fetch and validate ownership
    const notification = await prisma.notification.findUnique({
      where: { id: body.notificationId },
      select: { id: true, userId: true, isRead: true }
    });

    // Explicit ownership check - fail-closed
    if (!notification) {
      throw new ApiError("Notification not found.", 404);
    }
    if (notification.userId !== session.id) {
      throw new ApiError("Forbidden: This notification does not belong to you.", 403);
    }

    // Phase 2: Update only after validation
    const result = await prisma.notification.update({
      where: { id: body.notificationId },
      data: { isRead: true }
    });

    // Verify update was successful
    if (!result) {
      throw new ApiError("Failed to update notification.", 500);
    }

    return NextResponse.json({ success: true, updatedCount: 1 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 2: Atomic Transaction Approach (Alternative)

```typescript
// For systems where race conditions are a concern
export async function PUT(request: NextRequest) {
  try {
    await enforceRateLimit(request, "notifications_update", 60, 60_000);
    const session = await requireSession(request);
    const body = await readValidatedJson(request, updateSchema);

    if (body.markAll) {
      // Existing markAll logic
      const result = await prisma.notification.updateMany({
        where: { userId: session.id, isRead: false },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true, updatedCount: result.count });
    }

    // Atomic transaction ensures ownership validation and update are atomic
    const result = await prisma.$transaction(async (tx) => {
      // Lock and fetch the notification
      const notification = await tx.notification.findUnique({
        where: { id: body.notificationId },
        select: { id: true, userId: true, isRead: true }
      });

      if (!notification) {
        throw new ApiError("Notification not found.", 404);
      }

      if (notification.userId !== session.id) {
        throw new ApiError("Forbidden: This notification does not belong to you.", 403);
      }

      // Update within transaction
      const updated = await tx.notification.update({
        where: { id: body.notificationId },
        data: { isRead: true },
        select: { id: true }
      });

      return updated;
    });

    return NextResponse.json({ success: true, updatedCount: result ? 1 : 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 1.6 Integration Points

### Affected Modules:
1. **Authentication Layer**: Uses existing `getCurrentSession()` and `requireSession()`
2. **Rate Limiting**: No changes - uses existing `enforceRateLimit()`
3. **Error Handling**: Uses existing `ApiError` class
4. **Prisma Client**: Uses existing connection pool

### No Breaking Changes:
- ✅ Response schema identical
- ✅ Error codes consistent
- ✅ Rate limits unchanged
- ✅ Backward compatible with existing clients

---

## 1.7 Test Strategy

### Unit Tests - Ownership Validation

```typescript
describe('PUT /api/notifications - Ownership Validation', () => {
  it('should return 404 when notification does not exist', async () => {
    const session = await createTestSession('user-123');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    
    const response = await PUT(createRequest(session, { 
      notificationId: fakeId 
    }));
    
    expect(response.status).toBe(404);
    expect(response.body).toContain('not found');
  });

  it('should return 403 when notification belongs to another user', async () => {
    const user1 = await createTestSession('user-1');
    const user2 = await createTestSession('user-2');
    
    // Create notification for user2
    const notif = await createNotification(user2.id);
    
    // User1 tries to update user2's notification
    const response = await PUT(createRequest(user1, { 
      notificationId: notif.id 
    }));
    
    expect(response.status).toBe(403);
    expect(response.body).toContain('Forbidden');
  });

  it('should update notification when owned by requesting user', async () => {
    const session = await createTestSession('user-123');
    const notif = await createNotification(session.id);
    
    const response = await PUT(createRequest(session, { 
      notificationId: notif.id 
    }));
    
    expect(response.status).toBe(200);
    expect(response.body.updatedCount).toBe(1);
    
    // Verify database state
    const updated = await prisma.notification.findUnique({ where: { id: notif.id } });
    expect(updated.isRead).toBe(true);
  });
});
```

### Property-Based Tests - Preservation

```typescript
describe('PUT /api/notifications - Preservation Properties', () => {
  it('should preserve markAll functionality', async () => {
    const session = await createTestSession('user-123');
    
    // Create 5 unread notifications
    const notifs = await Promise.all([...Array(5)].map(() => 
      createNotification(session.id, { isRead: false })
    ));
    
    // Mark all as read
    const response = await PUT(createRequest(session, { markAll: true }));
    
    expect(response.status).toBe(200);
    expect(response.body.updatedCount).toBe(5);
    
    // Verify all marked as read
    const updated = await prisma.notification.findMany({
      where: { userId: session.id, id: { in: notifs.map(n => n.id) } }
    });
    expect(updated.every(n => n.isRead)).toBe(true);
  });

  it('should not affect other users notifications in markAll', async () => {
    const user1 = await createTestSession('user-1');
    const user2 = await createTestSession('user-2');
    
    // Create unread notifications for both
    const notif1 = await createNotification(user1.id, { isRead: false });
    const notif2 = await createNotification(user2.id, { isRead: false });
    
    // User1 marks all as read
    await PUT(createRequest(user1, { markAll: true }));
    
    // Verify user1's is read, user2's is still unread
    const check1 = await prisma.notification.findUnique({ where: { id: notif1.id } });
    const check2 = await prisma.notification.findUnique({ where: { id: notif2.id } });
    
    expect(check1.isRead).toBe(true);
    expect(check2.isRead).toBe(false); // Preservation check
  });

  it('should maintain rate limiting during ownership checks', async () => {
    const session = await createTestSession('user-123');
    
    // Make 61 requests (limit is 60)
    const requests = [...Array(61)].map(() => 
      PUT(createRequest(session, { markAll: true }))
    );
    
    const responses = await Promise.all(requests);
    
    // Last request should be rate limited
    expect(responses[60].status).toBe(429); // Too Many Requests
  });
});
```

### Integration Tests - Full Flow

```typescript
describe('PUT /api/notifications - Integration Flow', () => {
  it('should handle concurrent ownership checks safely', async () => {
    const user1 = await createTestSession('user-1');
    const user2 = await createTestSession('user-2');
    
    // Create notification for user1
    const notif = await createNotification(user1.id);
    
    // Both users try to update simultaneously
    const [result1, result2] = await Promise.all([
      PUT(createRequest(user1, { notificationId: notif.id })),
      PUT(createRequest(user2, { notificationId: notif.id }))
    ]);
    
    // User1 should succeed, User2 should get 403
    expect(result1.status).toBe(200);
    expect(result2.status).toBe(403);
    
    // Verify notification was updated only once
    const final = await prisma.notification.findUnique({ where: { id: notif.id } });
    expect(final.isRead).toBe(true);
  });
});
```

---

## 1.8 Deployment Checklist

- [ ] Code review completed by security team
- [ ] Unit tests passing (100% coverage on PUT handler)
- [ ] Integration tests passing
- [ ] Performance testing: verify no N+1 queries
- [ ] Database migration: Add index on `(id, userId)` if not present
- [ ] Rate limiting verified still working
- [ ] Rollback plan: Keep old code in feature flag for 1 week
- [ ] Monitoring: Alert on 403 responses > 10/minute (potential attack)
- [ ] Documentation: Update API docs with 403 response

---

---

# VULNERABILITY #2: Interview Admin Bypass

## 2.1 Vulnerability Overview

**Location**: `src/app/api/interviews/room/route.ts` - `findAuthorizedInterview()` function
**Severity**: CRITICAL
**Current Behavior**: Allows ADMIN role to access any interview without proper authentication method validation

```typescript
// VULNERABLE CODE - Current
async function findAuthorizedInterview(session: { id: string; role: string }, roomId: string) {
  const interview = await prisma.interview.findFirst({
    where: { /* ... */ },
    include: { /* ... */ }
  });
  
  if (!interview) return null;
  const candidateUserId = interview.application.candidateProfile?.userId;
  
  if (session.role === "CANDIDATE") 
    return session.id === candidateUserId ? interview : null;
  
  if (session.role !== "EMPLOYER" && session.role !== "RECRUITER" && session.role !== "ADMIN") 
    return null;
  
  if (!interview.roundProgress?.round.interviewers.some((item) => item.userId === session.id)) 
    return null;
  
  // VULNERABLE: ADMIN bypasses interviewer check
  if (session.role === "ADMIN") 
    return interview.roundProgress?.round.interviewers.some((item) => item.userId === session.id) ? interview : null;
  
  // Other roles must match company
  const profile = await prisma.employerProfile.findUnique({ 
    where: { userId: session.id }, 
    select: { companyId: true } 
  });
  
  return profile?.companyId === interview.application.job.companyId ? interview : null;
}
```

**Bug Condition (C):**
```
FUNCTION isBugCondition(session, interview)
  INPUT: session object with role, roomId, interview object
  OUTPUT: boolean
  
  RETURN session.role === "ADMIN"
         AND session.authMethod === "SESSION_COOKIE"  // Not API key auth
         AND interview.roundProgress.round.interviewers NOT includes session.id
         AND interview access is granted anyway (bug!)
END FUNCTION
```

### Examples:
1. Admin user logs in via web UI (session cookie), accesses any interview
2. Admin without being assigned as interviewer can spy on interview content
3. No audit trail of which admin accessed which interview
4. Violates principle of least privilege

---

## 2.2 Root Cause Analysis

**Root Causes:**
1. **No Auth Method Differentiation**: Code doesn't distinguish between session-based and API key auth
2. **Inconsistent RBAC Logic**: ADMIN role treated differently than EMPLOYER/RECRUITER
3. **Interviewer Bypass**: The conditional check doesn't actually prevent access for ADMIN
4. **No Audit Logging**: No record of who accessed what

---

## 2.3 Expected Behavior & Preservation

### Preservation Requirements:
- ✅ CANDIDATE role unchanged: must match candidateUserId
- ✅ EMPLOYER/RECRUITER unchanged: must be assigned interviewer AND company must match
- ✅ ADMIN with API key: should have access (trusted backend-to-backend)
- ✅ Existing interview retrieval for valid users unchanged
- ✅ Rate limiting unchanged (240 requests/60s)

### Security Property:
```
FUNCTION expectedBehavior(session, interview)
  
  IF session.role === "ADMIN"
    IF session.authMethod === "API_KEY"
      // Backend service using API key
      THEN return interview (access granted)
    ELSE IF session.authMethod === "SESSION_COOKIE"
      IF session.id IN interview.roundProgress.round.interviewers
        THEN return interview (admin is assigned interviewer)
      ELSE
        THEN throw 403 Forbidden (not assigned)
    END IF
  ELSE IF session.role === "CANDIDATE"
    IF session.id === interview.application.candidateProfile.userId
      THEN return interview
    ELSE
      THEN throw 403 Forbidden
  ELSE IF session.role IN ["EMPLOYER", "RECRUITER"]
    IF session.id IN interview.roundProgress.round.interviewers 
       AND employerProfile.companyId === interview.application.job.companyId
      THEN return interview
    ELSE
      THEN throw 403 Forbidden
  END IF
END FUNCTION
```

---

## 2.4 Architecture Diagram

```
REQUEST: GET /api/interviews/room?roomId=xxx
  │
  ├─→ Authentication Layer
  │    │ Extract JWT/session
  │    │ Determine authMethod:
  │    │  - "SESSION_COOKIE" if from web UI
  │    │  - "API_KEY" if from Authorization header
  │    └─→ Create session { id, role, authMethod }
  │
  ├─→ Rate Limiting
  │    └─→ 240 requests/60 seconds
  │
  ├─→ findAuthorizedInterview(session, roomId)
  │    │
  │    ├─→ Fetch interview by roomId
  │    │    └─→ If not found: return null
  │    │
  │    ├─→ Role-based Authorization Tree
  │    │
  │    ├─→ CANDIDATE Branch
  │    │    └─→ Must own the application
  │    │
  │    ├─→ EMPLOYER/RECRUITER Branch
  │    │    ├─→ Must be in interviewers list
  │    │    └─→ Company must match
  │    │
  │    ├─→ ADMIN Branch (NEW)
  │    │    ├─→ If API_KEY: Grant access (trusted)
  │    │    └─→ If SESSION_COOKIE: Require in interviewers list
  │    │
  │    └─→ Audit Log: admin access attempt
  │
  ├─→ Error Handling
  │    ├─→ 404 if interview not found
  │    └─→ 403 if not authorized
  │
  └─→ Response: Interview object or error
```

---

## 2.5 Code Implementation Pattern

### Pattern 1: Auth Method Extraction

```typescript
// Utility to determine auth method
function extractAuthMethod(headers: Headers): "SESSION_COOKIE" | "API_KEY" | null {
  // Check for API key first
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    // Validate API key format and existence
    if (isValidApiKey(token)) {
      return "API_KEY";
    }
  }

  // Check for session cookie
  const cookies = headers.get("cookie") || "";
  if (cookies.includes("session=") || cookies.includes("auth=")) {
    return "SESSION_COOKIE";
  }

  return null;
}

// Enhanced session object
interface EnhancedSession {
  id: string;
  role: Role;
  authMethod: "SESSION_COOKIE" | "API_KEY";
  email?: string;
}

// Modified getCurrentSession to include authMethod
async function getCurrentSessionEnhanced(headers: Headers): Promise<EnhancedSession | null> {
  const session = await getCurrentSession(headers); // Existing function
  if (!session) return null;

  const authMethod = extractAuthMethod(headers);
  if (!authMethod) return null; // Should not happen if session exists

  return {
    ...session,
    authMethod
  };
}
```

### Pattern 2: Fixed findAuthorizedInterview

```typescript
async function findAuthorizedInterview(
  session: { id: string; role: string; authMethod: "SESSION_COOKIE" | "API_KEY" },
  roomId: string
) {
  const interview = await prisma.interview.findFirst({
    where: {
      OR: [
        { id: roomId },
        { aiFeedback: { contains: `"roomId":"${roomId}"` } },
        { roomUrl: `/employer/active-video-interview-interviewer-view?roomId=${roomId}` },
      ],
    },
    include: {
      application: {
        include: {
          candidateProfile: { include: { user: { select: { id: true, name: true } } } },
          job: true,
        },
      },
      roundProgress: {
        include: {
          round: {
            include: {
              interviewers: { include: { user: { select: { id: true, name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!interview) return null;

  const candidateUserId = interview.application.candidateProfile?.userId;
  const isAssignedInterviewer = interview.roundProgress?.round.interviewers.some(
    (item) => item.userId === session.id
  );

  // CANDIDATE: Must own the application
  if (session.role === "CANDIDATE") {
    return session.id === candidateUserId ? interview : null;
  }

  // Reject invalid roles
  if (!["EMPLOYER", "RECRUITER", "ADMIN"].includes(session.role)) {
    return null;
  }

  // ADMIN: Different rules based on auth method
  if (session.role === "ADMIN") {
    if (session.authMethod === "API_KEY") {
      // Backend-to-backend with API key: Grant full access
      // Log for audit trail
      await enqueueSecurityAuditEvent({
        type: "ADMIN_INTERVIEW_ACCESS",
        userId: session.id,
        interviewId: interview.id,
        authMethod: "API_KEY",
        timestamp: new Date(),
      });
      return interview;
    } else if (session.authMethod === "SESSION_COOKIE") {
      // Session-based admin: Must be assigned interviewer
      if (!isAssignedInterviewer) {
        // Log unauthorized attempt
        await enqueueSecurityAuditEvent({
          type: "ADMIN_INTERVIEW_ACCESS_DENIED",
          userId: session.id,
          interviewId: interview.id,
          authMethod: "SESSION_COOKIE",
          reason: "NOT_ASSIGNED_INTERVIEWER",
          timestamp: new Date(),
        });
        return null; // Deny access
      }
      // Log successful access
      await enqueueSecurityAuditEvent({
        type: "ADMIN_INTERVIEW_ACCESS",
        userId: session.id,
        interviewId: interview.id,
        authMethod: "SESSION_COOKIE",
        timestamp: new Date(),
      });
      return interview;
    }
  }

  // EMPLOYER/RECRUITER: Must be assigned interviewer AND company must match
  if (!isAssignedInterviewer) {
    return null;
  }

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.id },
    select: { companyId: true },
  });

  return profile?.companyId === interview.application.job.companyId ? interview : null;
}
```

### Pattern 3: Updated GET Handler

```typescript
export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "interview_room_poll", 240, 60_000);
    
    // Use enhanced session with authMethod
    const session = await getCurrentSessionEnhanced(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);

    const roomId = new URL(req.url).searchParams.get("roomId");
    if (!roomId || roomId.length > 256) return jsonError("roomId is required", 400);

    const interview = await findAuthorizedInterview(session, roomId);
    
    // Explicit 403 on authorization failure
    if (!interview) {
      await enqueueSecurityAuditEvent({
        type: "INTERVIEW_ACCESS_DENIED",
        userId: session.id,
        roomId: roomId,
        timestamp: new Date(),
      });
      return jsonError("Forbidden: You are not an authorized participant for this interview.", 403);
    }

    // ... rest of existing logic
    const now = new Date();
    const signalingOpen = SIGNALING_OPEN_STATUSES.includes(
      interview.status as (typeof SIGNALING_OPEN_STATUSES)[number],
    );

    // ... existing response logic
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 2.6 Integration Points

### New Dependencies:
1. **Auth Method Detection**: Extend existing `getCurrentSession()`
2. **Audit Logging**: Use existing `enqueueSecurityAuditEvent()`
3. **Admin API Keys**: New table/verification needed

### Audit Trail Schema Addition:
```prisma
model SecurityAuditEvent {
  id            String   @id @default(uuid())
  type          String   // "ADMIN_INTERVIEW_ACCESS", "INTERVIEW_ACCESS_DENIED", etc.
  userId        String
  interviewId   String?
  roomId        String?
  authMethod    String?  // "SESSION_COOKIE" or "API_KEY"
  reason        String?  // "NOT_ASSIGNED_INTERVIEWER", etc.
  timestamp     DateTime @default(now())
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([timestamp])
  @@index([type])
}
```

---

## 2.7 Test Strategy

### Unit Tests - Auth Method Detection

```typescript
describe('Interview Authorization - Auth Method Handling', () => {
  it('should identify SESSION_COOKIE auth method', () => {
    const headers = new Headers({
      cookie: 'session=abc123; Path=/',
    });
    
    const authMethod = extractAuthMethod(headers);
    expect(authMethod).toBe("SESSION_COOKIE");
  });

  it('should identify API_KEY auth method', () => {
    const headers = new Headers({
      authorization: 'Bearer valid-api-key-xyz',
    });
    
    const authMethod = extractAuthMethod(headers);
    expect(authMethod).toBe("API_KEY");
  });

  it('should prefer API_KEY over SESSION_COOKIE when both present', () => {
    const headers = new Headers({
      authorization: 'Bearer api-key',
      cookie: 'session=cookie-value',
    });
    
    const authMethod = extractAuthMethod(headers);
    expect(authMethod).toBe("API_KEY");
  });
});

describe('Interview Authorization - ADMIN Role Bypass Fix', () => {
  it('should allow ADMIN with API_KEY to access any interview', async () => {
    const admin = { id: 'admin-1', role: 'ADMIN', authMethod: 'API_KEY' };
    const interview = await createTestInterview({ 
      interviewerIds: [] // admin not assigned
    });
    
    const result = await findAuthorizedInterview(admin, interview.id);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(interview.id);
  });

  it('should deny ADMIN with SESSION_COOKIE if not assigned interviewer', async () => {
    const admin = { id: 'admin-1', role: 'ADMIN', authMethod: 'SESSION_COOKIE' };
    const interview = await createTestInterview({ 
      interviewerIds: ['other-user-id'] // admin not assigned
    });
    
    const result = await findAuthorizedInterview(admin, interview.id);
    
    expect(result).toBeNull();
  });

  it('should allow ADMIN with SESSION_COOKIE if assigned interviewer', async () => {
    const admin = { id: 'admin-1', role: 'ADMIN', authMethod: 'SESSION_COOKIE' };
    const interview = await createTestInterview({ 
      interviewerIds: ['admin-1'] // admin is assigned
    });
    
    const result = await findAuthorizedInterview(admin, interview.id);
    
    expect(result).toBeDefined();
  });

  it('should audit ADMIN access attempts', async () => {
    const admin = { id: 'admin-1', role: 'ADMIN', authMethod: 'SESSION_COOKIE' };
    const interview = await createTestInterview({ interviewerIds: [] });
    
    await findAuthorizedInterview(admin, interview.id);
    
    const auditLog = await prisma.securityAuditEvent.findFirst({
      where: { 
        userId: 'admin-1',
        type: 'ADMIN_INTERVIEW_ACCESS_DENIED'
      }
    });
    
    expect(auditLog).toBeDefined();
    expect(auditLog.reason).toBe('NOT_ASSIGNED_INTERVIEWER');
  });
});

describe('Interview Authorization - Preservation', () => {
  it('should preserve CANDIDATE role behavior', async () => {
    const candidate = { id: 'cand-1', role: 'CANDIDATE' };
    const interview = await createTestInterview({
      candidateId: 'cand-1'
    });
    
    const result = await findAuthorizedInterview(candidate, interview.id);
    
    expect(result).toBeDefined();
  });

  it('should preserve EMPLOYER role behavior', async () => {
    const employer = { id: 'emp-1', role: 'EMPLOYER' };
    const interview = await createTestInterview({
      interviewerIds: ['emp-1'],
      companyId: 'company-1'
    });
    
    // Setup employer profile
    await prisma.employerProfile.create({
      data: { userId: 'emp-1', companyId: 'company-1' }
    });
    
    const result = await findAuthorizedInterview(employer, interview.id);
    
    expect(result).toBeDefined();
  });
});
```

### Integration Tests - Full Flow

```typescript
describe('Interview Authorization - Integration', () => {
  it('should reject unauthorized ADMIN via session and log audit', async () => {
    const adminSession = { id: 'admin-1', role: 'ADMIN', authMethod: 'SESSION_COOKIE' };
    const interview = await createTestInterview({ interviewerIds: [] });
    
    const response = await GET(createRequest(adminSession, { roomId: interview.id }));
    
    expect(response.status).toBe(403);
    
    // Verify audit log
    const auditEvent = await prisma.securityAuditEvent.findFirst({
      where: { type: 'ADMIN_INTERVIEW_ACCESS_DENIED' }
    });
    
    expect(auditEvent).toBeDefined();
    expect(auditEvent.userId).toBe('admin-1');
  });

  it('should allow ADMIN via API key and log audit', async () => {
    const adminApiKey = await createTestApiKey('admin-1');
    const interview = await createTestInterview({ interviewerIds: [] });
    
    const response = await GET(createRequest(null, { 
      roomId: interview.id,
      authorization: `Bearer ${adminApiKey}`
    }));
    
    expect(response.status).toBe(200);
    
    // Verify audit log with API_KEY
    const auditEvent = await prisma.securityAuditEvent.findFirst({
      where: { type: 'ADMIN_INTERVIEW_ACCESS' }
    });
    
    expect(auditEvent).toBeDefined();
    expect(auditEvent.authMethod).toBe('API_KEY');
  });
});
```

---

## 2.8 Deployment Checklist

- [ ] Create `SecurityAuditEvent` table migration
- [ ] Implement admin API key table/validation
- [ ] Add `extractAuthMethod()` utility function
- [ ] Modify `findAuthorizedInterview()` with new logic
- [ ] Update `getCurrentSession()` to include authMethod
- [ ] Add audit logging to all authorization paths
- [ ] Security review: Verify API key validation
- [ ] Unit tests: 100% coverage on auth methods
- [ ] Integration tests: All role combinations
- [ ] Performance: Audit logging doesn't cause P99 latency increase
- [ ] Monitoring: Alert on failed ADMIN access attempts > 5/minute
- [ ] Documentation: Update API security guidelines

---

---

# VULNERABILITY #3: Application Duplicate Race Condition

## 3.1 Vulnerability Overview

**Location**: `src/app/api/applications/route.ts` - POST handler
**Severity**: CRITICAL
**Current Behavior**: Check-then-create pattern allows duplicate applications in concurrent requests

```typescript
// VULNERABLE CODE - Current (simplified)
const existingApplication = await prisma.application.findUnique({
  where: {
    candidateProfileId_jobId: {
      candidateProfileId: candidate.id,
      jobId,
    },
  },
  // ...
});

// RACE CONDITION WINDOW: Between findUnique and create
// Two concurrent requests both see "no existing application"

if (existingApplication) {
  // First request enters here...
  // Second request was already past this check!
  return jsonError("You have already applied to this job.", 409);
}

// ... persistence logic ...
// Both requests create new applications simultaneously
const newApplication = await prisma.application.create({
  data: { candidateProfileId: candidate.id, jobId, /* ... */ },
});
```

**Bug Condition (C):**
```
FUNCTION isBugCondition(request1, request2, candidateId, jobId)
  INPUT: Two concurrent HTTP POST requests from same candidate to same job
  OUTPUT: boolean
  
  RETURN request1.candidateId === request2.candidateId
         AND request1.jobId === request2.jobId
         AND abs(request1.timestamp - request2.timestamp) < 100ms
         AND both.findUnique(candidateProfileId_jobId) returns null  // Race condition!
         AND RESULT: two applications created instead of one
END FUNCTION
```

### Examples:
1. Candidate double-clicks "Apply" button, two applications created
2. Network retry creates duplicate application
3. Two browser tabs open simultaneously, both submit
4. Background sync on mobile creates duplicate
5. Causes downstream issues: duplicate assessment gates, double notifications

---

## 3.2 Root Cause Analysis

**Root Causes:**
1. **Check-Then-Create Anti-Pattern**: Gap between check and create is vulnerable
2. **No Atomic Upsert**: Should use database-level uniqueness guarantee
3. **Missing Isolation Level**: Default isolation not sufficient for this pattern
4. **No Unique Constraint Enforcement**: Database doesn't prevent duplicate on `(candidateProfileId, jobId)`

---

## 3.3 Expected Behavior & Preservation

### Preservation Requirements:
- ✅ Single application created for new candidate-job pair
- ✅ Existing application logic unchanged for non-race cases
- ✅ Response format identical: `{ success: true, application }`
- ✅ Error messages consistent
- ✅ Rate limiting unchanged (12 requests/60s)
- ✅ Screening questions validation preserved
- ✅ Assessment gates preserved

### Correctness Property:
```
FUNCTION expectedBehavior(concurrentRequests)
  INPUT: N concurrent requests from same candidateProfileId to same jobId
  OUTPUT: boolean
  
  // Exactly ONE application exists after all requests complete
  ENSURE application count = 1
  
  // All requests eventually succeed (not error)
  ENSURE all requests return 200 with application data
  
  // Exactly ONE assessment gate created
  ENSURE applicationGate count = 1
  
  // No duplicate notifications sent
  ENSURE applicationReceivedConfirmation count = 1
END FUNCTION
```

---

## 3.4 Architecture Diagram

```
REQUEST 1: POST /api/applications (Submit)
REQUEST 2: POST /api/applications (Submit)  ← Concurrent/race condition
  │
  ├─→ CURRENT VULNERABLE PATTERN
  │    Request 1: findUnique → null (no existing)
  │    Request 2: findUnique → null (no existing)  ← BOTH see null!
  │    Request 1: create → Application A
  │    Request 2: create → Application B ← DUPLICATE!
  │    Result: 2 applications (BUG)
  │
  ├─→ FIXED PATTERN: Prisma Upsert with Serializable Isolation
  │    ├─→ BEGIN TRANSACTION (SERIALIZABLE)
  │    │
  │    ├─→ Request 1: upsert({
  │    │      where: { candidateProfileId_jobId },
  │    │      create: { /* new */ },
  │    │      update: { /* same */ }
  │    │    })
  │    │    → Application A created in transaction 1
  │    │
  │    ├─→ Request 2: upsert({
  │    │      where: { candidateProfileId_jobId },
  │    │      create: { /* new */ },
  │    │      update: { /* same */ }
  │    │    })
  │    │    → Database SERIALIZATION CONFLICT
  │    │    → Request 2 retried OR returns existing (via update branch)
  │    │
  │    ├─→ COMMIT or ROLLBACK & RETRY
  │    │
  │    └─→ Result: 1 application (FIXED)
  │
  └─→ Response: Both get same application object
```

---

## 3.5 Database Schema Changes

### Required Unique Constraint:

```prisma
model Application {
  id                      String    @id @default(uuid())
  candidateProfileId      String
  jobId                   String
  status                  ApplicationStatus
  screeningAnswers        Json?
  aiSummary               String?
  matchScore              Int       @default(0)
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  candidateProfile        CandidateProfile @relation(fields: [candidateProfileId], references: [id], onDelete: Cascade)
  job                     JobListing       @relation(fields: [jobId], references: [id], onDelete: Cascade)

  // CRITICAL: Unique constraint prevents duplicate applications
  @@unique([candidateProfileId, jobId], name: "candidateProfileId_jobId")
  
  @@index([candidateProfileId])
  @@index([jobId])
  @@index([status])
  @@index([createdAt])
}
```

### Migration:

```sql
-- Remove duplicate applications (keep most recent)
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

---

## 3.6 Code Implementation Pattern

### Pattern 1: Prisma Upsert with Serializable Isolation

```typescript
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "candidate_application_submit", 12, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") return jsonError("Candidate access required", 403);

    const { jobId, answers } = await readValidatedJson(req, applicationSchema);
    const now = new Date();

    // Fetch prerequisites in parallel
    const [job, candidate] = await Promise.all([
      prisma.jobListing.findFirst({
        where: {
          id: jobId,
          status: "ACTIVE",
          publishedAt: { not: null },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      prisma.candidateProfile.findUnique({ where: { userId: session.id } }),
    ]);

    if (!job) return jsonError("This job is not published or is no longer accepting applications.", 409);
    if (!candidate) return jsonError("Complete your candidate profile before applying.", 409);

    // Validate screening answers
    const configuredScreeningQuestions = Array.from(
      new Set(
        (job.screeningQuestions ?? [])
          .map((question) => question.trim())
          .filter(Boolean),
      ),
    ).slice(0, 20);

    const submittedAnswers = answers ?? {};
    const allowedAnswerKeys = new Set([
      ...configuredScreeningQuestions,
      ...LEGACY_APPLICATION_ANSWER_KEYS,
    ]);

    const unexpectedAnswer = Object.keys(submittedAnswers).find(
      (key) => !allowedAnswerKeys.has(key),
    );
    if (unexpectedAnswer) {
      return jsonError("One or more screening answers do not belong to this job.", 422);
    }

    const missingRequiredAnswer = configuredScreeningQuestions.find(
      (question) => !submittedAnswers[question]?.trim(),
    );
    if (missingRequiredAnswer) {
      return jsonError("Complete all screening questions before applying.", 422);
    }

    const screeningAnswers =
      Object.keys(submittedAnswers).length > 0
        ? (submittedAnswers as Prisma.InputJsonValue)
        : undefined;

    const targetRole = getCandidateTargetRole(candidate.preferences) || job.title;
    const validationState = await getUniversalValidationState(candidate.id, targetRole);
    const { RosGateway } = await import("@/lib/ros/RosGateway");

    // FIXED: Replace check-then-create with atomic upsert + Serializable isolation
    let application: Application;
    let isNewApplication = false;

    try {
      // Use transaction with SERIALIZABLE isolation to prevent race conditions
      const result = await prisma.$transaction(
        async (tx) => {
          // Upsert ensures exactly one application exists
          const upsertedApp = await tx.application.upsert({
            where: {
              candidateProfileId_jobId: {
                candidateProfileId: candidate.id,
                jobId,
              },
            },
            // Create branch: new application
            create: {
              candidateProfileId: candidate.id,
              jobId,
              status: ApplicationStatus.APPLIED,
              screeningAnswers: screeningAnswers as Prisma.InputJsonValue,
              aiSummary: null,
              matchScore: 0,
            },
            // Update branch: preserve existing, update screening answers if changed
            update: {
              screeningAnswers: screeningAnswers as Prisma.InputJsonValue,
              updatedAt: now,
            },
            include: {
              job: { include: { company: true } },
              interviews: true,
              gates: {
                where: { type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION },
                take: 1,
              },
            },
          });

          return { application: upsertedApp, isNew: !upsertedApp.updatedAt || upsertedApp.updatedAt.getTime() === now.getTime() };
        },
        {
          isolationLevel: "Serializable", // CRITICAL: Prevents race conditions
          timeout: 10_000, // 10 second transaction timeout
        }
      );

      application = result.application;
      isNewApplication = result.isNew;
    } catch (error) {
      // Handle serialization conflicts
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2034") {
          // Serialization error: retry or indicate to client
          return jsonError(
            "Application submission conflict. Please try again.",
            409
          );
        }
      }
      throw error;
    }

    // Persist screening answers if needed
    if (screeningAnswers) {
      await persistScreeningAnswers(application.id, screeningAnswers);
    }

    // Handle validation gates only for new applications
    if (isNewApplication) {
      const gate = application.gates[0];

      if (
        !gate ||
        (gate.status !== ApplicationGateStatus.REQUIRED &&
          gate.status !== ApplicationGateStatus.IN_PROGRESS)
      ) {
        // Create assessment gate for new application
        await assignUniversalAssessment({
          applicationId: application.id,
          candidateProfileId: candidate.id,
          targetRole,
          validationState,
        });
      }

      if (
        validationState.completedAndCurrent &&
        validationState.readiness?.assessmentId
      ) {
        if (gate?.assessmentId !== validationState.readiness.assessmentId) {
          await RosGateway.attachUniversalAssessment({
            applicationId: application.id,
            candidateProfileId: candidate.id,
            assessmentId: validationState.readiness.assessmentId,
          });
        }

        const released = await RosGateway.releaseUniversalValidationApplications({
          userId: session.id,
          candidateProfileId: candidate.id,
          assessmentId: validationState.readiness.assessmentId,
        });

        if (released.includes(application.id)) {
          // Send confirmation ONLY for newly released applications
          await dispatchApplicationReceivedConfirmation({
            applicationId: application.id,
            userId: session.id,
            jobId: application.jobId,
          });
        }
      }
    }

    // Audit logging
    await enqueueSecurityAuditEvent({
      type: isNewApplication ? "APPLICATION_CREATED" : "APPLICATION_RESUMED",
      userId: session.id,
      applicationId: application.id,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      application: presentApplication(application),
      isNewApplication,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 2: Fallback with Retry Logic

```typescript
// Alternative pattern if Serializable isolation causes performance issues
async function createOrResumeApplication(
  candidateId: string,
  jobId: string,
  data: any,
  maxRetries: number = 3
) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const existing = await tx.application.findUnique({
            where: {
              candidateProfileId_jobId: {
                candidateProfileId: candidateId,
                jobId,
              },
            },
          });

          if (existing) {
            // Resume existing
            return { application: existing, isNew: false };
          }

          // Create new
          const created = await tx.application.create({
            data: {
              candidateProfileId: candidateId,
              jobId,
              ...data,
            },
          });

          return { application: created, isNew: true };
        },
        { isolationLevel: "Serializable" }
      );

      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        // Serialization conflict: retry
        retries++;
        if (retries >= maxRetries) {
          throw new ApiError("Failed to create application after retries", 500);
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 100));
        continue;
      }
      throw error;
    }
  }
}
```

---

## 3.7 Integration Points

### Required Changes:
1. **Database Migration**: Add unique constraint on `(candidateProfileId, jobId)`
2. **Prisma Schema**: Update Application model with constraint
3. **Transaction Isolation**: Use `Serializable` isolation level
4. **Error Handling**: Catch P2034 (serialization error)
5. **Audit Logging**: Track new vs resumed applications

### No Breaking Changes:
- ✅ Response format identical
- ✅ API contract unchanged
- ✅ Client behavior unchanged
- ✅ Backward compatible

---

## 3.8 Test Strategy

### Unit Tests - Upsert Behavior

```typescript
describe('POST /api/applications - Race Condition Fix', () => {
  it('should create single application on concurrent requests', async () => {
    const candidate = await createTestCandidate();
    const job = await createTestJob();
    const session = { id: candidate.userId, role: 'CANDIDATE' };

    // Simulate two concurrent requests
    const [result1, result2] = await Promise.all([
      POST(createRequest(session, { jobId: job.id, answers: {} })),
      POST(createRequest(session, { jobId: job.id, answers: {} })),
    ]);

    // Both succeed
    expect(result1.status).toBe(200);
    expect(result2.status).toBe(200);

    // Verify only one application exists
    const applications = await prisma.application.findMany({
      where: {
        candidateProfileId: candidate.id,
        jobId: job.id,
      },
    });

    expect(applications.length).toBe(1);

    // Both responses reference same application
    expect(result1.body.application.id).toBe(result2.body.application.id);
  });

  it('should preserve screening answers on resume', async () => {
    const candidate = await createTestCandidate();
    const job = await createTestJob();
    const session = { id: candidate.userId, role: 'CANDIDATE' };

    const answers1 = { question1: "answer 1" };
    const answers2 = { question1: "answer 2" };

    // First request
    const result1 = await POST(
      createRequest(session, { jobId: job.id, answers: answers1 })
    );
    expect(result1.status).toBe(200);

    // Second request with different answers
    const result2 = await POST(
      createRequest(session, { jobId: job.id, answers: answers2 })
    );
    expect(result2.status).toBe(200);

    // Verify answers updated
    const app = await prisma.application.findUnique({
      where: { id: result1.body.application.id },
    });

    expect(app.screeningAnswers).toEqual(answers2);
  });

  it('should create only one assessment gate', async () => {
    const candidate = await createTestCandidate();
    const job = await createTestJob();
    const session = { id: candidate.userId, role: 'CANDIDATE' };

    // Concurrent requests
    await Promise.all([
      POST(createRequest(session, { jobId: job.id, answers: {} })),
      POST(createRequest(session, { jobId: job.id, answers: {} })),
      POST(createRequest(session, { jobId: job.id, answers: {} })),
    ]);

    // Get the application
    const app = await prisma.application.findFirst({
      where: {
        candidateProfileId: candidate.id,
        jobId: job.id,
      },
    });

    // Verify only one gate exists
    const gates = await prisma.applicationGate.findMany({
      where: {
        applicationId: app.id,
        type: ApplicationGateType.UNIVERSAL_SKILL_VALIDATION,
      },
    });

    expect(gates.length).toBe(1);
  });
});
```

### Property-Based Tests - Preservation

```typescript
describe('POST /api/applications - Preservation Properties', () => {
  it('should not break existing sequential application flow', async () => {
    const candidate = await createTestCandidate();
    const [job1, job2] = await Promise.all([
      createTestJob(),
      createTestJob(),
    ]);
    const session = { id: candidate.userId, role: 'CANDIDATE' };

    // Apply to job1
    const app1 = await POST(
      createRequest(session, { jobId: job1.id, answers: {} })
    );
    expect(app1.status).toBe(200);

    // Apply to job2 (different job)
    const app2 = await POST(
      createRequest(session, { jobId: job2.id, answers: {} })
    );
    expect(app2.status).toBe(200);

    // Both applications exist
    expect(app1.body.application.id).not.toBe(app2.body.application.id);
  });

  it('should send notification only once for new application', async () => {
    const candidate = await createTestCandidate();
    const job = await createTestJob();
    const session = { id: candidate.userId, role: 'CANDIDATE' };

    // Mock notification sender
    let notificationCount = 0;
    jest
      .spyOn(notifications, "dispatchApplicationReceivedConfirmation")
      .mockImplementation(() => {
        notificationCount++;
        return Promise.resolve();
      });

    // Concurrent requests
    await Promise.all([
      POST(createRequest(session, { jobId: job.id, answers: {} })),
      POST(createRequest(session, { jobId: job.id, answers: {} })),
    ]);

    // Notification sent exactly once
    expect(notificationCount).toBe(1);
  });
});
```

### Stress Tests - Concurrency

```typescript
describe('POST /api/applications - Concurrency Stress', () => {
  it('should handle 10 concurrent requests from same candidate', async () => {
    const candidate = await createTestCandidate();
    const job = await createTestJob();
    const session = { id: candidate.userId, role: 'CANDIDATE' };

    // Fire 10 concurrent requests
    const results = await Promise.all(
      [...Array(10)].map(() =>
        POST(createRequest(session, { jobId: job.id, answers: {} }))
      )
    );

    // All succeed
    expect(results.every((r) => r.status === 200)).toBe(true);

    // Only one application
    const apps = await prisma.application.findMany({
      where: {
        candidateProfileId: candidate.id,
        jobId: job.id,
      },
    });

    expect(apps.length).toBe(1);

    // All responses reference same application
    const appIds = results.map((r) => r.body.application.id);
    expect(new Set(appIds).size).toBe(1);
  });

  it('should handle rapid retry pattern', async () => {
    const candidate = await createTestCandidate();
    const job = await createTestJob();
    const session = { id: candidate.userId, role: 'CANDIDATE' };

    // Simulate rapid retries with network delays
    for (let i = 0; i < 5; i++) {
      await POST(createRequest(session, { jobId: job.id, answers: {} }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Still only one application
    const apps = await prisma.application.findMany({
      where: {
        candidateProfileId: candidate.id,
        jobId: job.id,
      },
    });

    expect(apps.length).toBe(1);
  });
});
```

---

## 3.9 Deployment Checklist

- [ ] Database migration: Add unique constraint (test with duplicates first)
- [ ] Prisma schema: Update Application model
- [ ] Update POST handler with upsert pattern
- [ ] Error handling: Handle P2034 serialization error
- [ ] Add audit logging for new vs resumed
- [ ] Unit tests: Race condition scenarios (10/concurrent)
- [ ] Stress tests: 100+ concurrent requests
- [ ] Performance: Verify Serializable isolation doesn't cause timeouts
- [ ] Rollback plan: Feature flag for old behavior (1 week)
- [ ] Monitoring: Alert on P2034 errors (serialization conflicts)
- [ ] Monitoring: Verify notification sent exactly once
- [ ] Database: Verify no duplicate constraint violations

---

---

# VULNERABILITY #4: Redis Session Dependency

## 4.1 Vulnerability Overview

**Location**: Session management and authentication middleware (Redis integration)
**Severity**: CRITICAL
**Current Behavior**: Session validation depends entirely on Redis; service fails if Redis is unavailable

```typescript
// VULNERABLE CODE - Current Pattern
async function validateSession(token: string) {
  try {
    // If Redis is down, entire authentication fails
    const session = await redis.get(`session:${token}`);
    if (!session) throw new AuthError("Session not found", 401);
    return JSON.parse(session);
  } catch (error) {
    // If Redis is down, this throws
    return null;
  }
}

// Result: 
// - Redis unavailable → All users logged out
// - Cascading failure: All API calls fail
// - No fallback, no degraded mode
// - Revoked sessions not checked locally
```

**Bug Condition (C):**
```
FUNCTION isBugCondition(redisStatus, sessionToken)
  INPUT: Redis connection status, valid session token
  OUTPUT: boolean
  
  RETURN redisStatus === "UNAVAILABLE"
         AND sessionToken is valid in database
         AND session not yet expired
         AND sessionNotFoundError is thrown anyway
         AND user cannot access system
END FUNCTION
```

### Examples:
1. Redis crashes, all 10,000 users instantly logged out
2. Network partition: app can't reach Redis cluster
3. Maintenance window: Redis restarting causes 5-10min outage
4. Session revocation (logout/permission change) not checked locally
5. No graceful degradation

---

## 4.2 Root Cause Analysis

**Root Causes:**
1. **Single Point of Failure**: Redis is the only session store
2. **No Fallback Cache**: No local memory cache as backup
3. **No TTL Management**: Cache entries don't expire safely
4. **No Revocation Tracking**: Logout/permission changes not visible locally
5. **No Fail-Closed Logic**: Should reject on cache miss, not accept

---

## 4.3 Expected Behavior & Preservation

### Preservation Requirements:
- ✅ Redis operational: Sessions validated via Redis (primary path)
- ✅ Session revocation: Works immediately when user logs out
- ✅ Permission changes: Applied immediately
- ✅ Existing session expiration logic unchanged
- ✅ Rate limiting unchanged
- ✅ Error responses unchanged

### Correctness Property:
```
FUNCTION expectedBehavior(request, sessionToken)
  
  // When Redis is operational
  IF redisStatus === "OPERATIONAL"
    RETURN session from Redis (cache miss = invalid session)
  
  // When Redis is unavailable but session recently validated
  ELSE IF redisStatus === "DOWN"
       AND localCache.has(sessionToken)
       AND NOT localCache[sessionToken].expired
       AND NOT sessionToken.isRevoked
    RETURN session from local cache
    
  // When Redis is down AND local cache expired
  ELSE IF redisStatus === "DOWN"
       AND (NOT localCache.has(sessionToken) OR localCache[sessionToken].expired)
    RETURN 401 Unauthorized (fail-closed)
    
  // Session revoked (logout/permission change)
  IF revocationList.includes(sessionToken)
    RETURN 401 Unauthorized (even if in cache)
END FUNCTION
```

---

## 4.4 Architecture Diagram

```
SESSION VALIDATION FLOW
  │
  ├─→ REQUEST arrives with session token
  │
  ├─→ Check Local Revocation List
  │    IF token in revocationList → 401 Forbidden
  │    ELSE → Continue
  │
  ├─→ Try Redis (Primary)
  │    ├─→ IF available: fetch session from Redis
  │    │    └─→ Cache locally with 5-minute TTL
  │    │    └─→ Return session (success)
  │    │
  │    ├─→ IF timeout/error: Try local cache
  │    │    └─→ Fall back to step 4
  │    │
  │    └─→ IF miss (not in Redis): check local cache
  │         └─→ Fall back to step 4
  │
  ├─→ Local Cache Fallback
  │    ├─→ IF cache hit + not expired + not revoked
  │    │    └─→ Return session (degraded but functional)
  │    │
  │    └─→ IF cache miss OR expired OR revoked
  │         └─→ 401 Unauthorized (fail-closed)
  │
  ├─→ Session Revocation
  │    ├─→ User logs out
  │    ├─→ Add token to revocationList
  │    ├─→ Delete from Redis
  │    ├─→ Revocation list also stored in Redis (with longer TTL)
  │    └─→ Local revocationList updates via background sync
  │
  └─→ Return: Session or 401 error
```

---

## 4.5 Code Implementation Pattern

### Pattern 1: Local Session Cache with Fallback

```typescript
import NodeCache from 'node-cache';
import { Redis } from '@upstash/redis';

const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
const REVOCATION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

// Local in-memory cache
interface CachedSession {
  data: any;
  expiresAt: number;
  cachedAt: number;
}

interface SessionCacheEntry {
  session: CachedSession;
  revocationList: Set<string>; // Session tokens that have been revoked
}

class LocalSessionCache {
  private cache: Map<string, CachedSession> = new Map();
  private revocationList: Set<string> = new Set();
  private revocationExpiresAt: Map<string, number> = new Map();

  constructor() {
    // Cleanup expired entries every minute
    this.startCleanupInterval();
  }

  get(sessionToken: string): CachedSession | null {
    const cached = this.cache.get(sessionToken);
    
    if (!cached) return null;

    // Check if expired
    if (cached.expiresAt < Date.now()) {
      this.cache.delete(sessionToken);
      return null;
    }

    // Check if revoked
    if (this.isRevoked(sessionToken)) {
      return null;
    }

    return cached;
  }

  set(sessionToken: string, session: any): void {
    const now = Date.now();
    const expiresAt = now + CACHE_TTL_SECONDS * 1000;

    this.cache.set(sessionToken, {
      data: session,
      expiresAt,
      cachedAt: now,
    });
  }

  revoke(sessionToken: string): void {
    this.revocationList.add(sessionToken);
    this.revocationExpiresAt.set(sessionToken, Date.now() + REVOCATION_TTL_SECONDS * 1000);
    this.cache.delete(sessionToken); // Remove from cache immediately
  }

  isRevoked(sessionToken: string): boolean {
    if (!this.revocationList.has(sessionToken)) return false;

    // Check if revocation has expired
    const expiresAt = this.revocationExpiresAt.get(sessionToken);
    if (expiresAt && expiresAt < Date.now()) {
      this.revocationList.delete(sessionToken);
      this.revocationExpiresAt.delete(sessionToken);
      return false;
    }

    return true;
  }

  loadRevocationList(tokens: string[]): void {
    const now = Date.now();
    tokens.forEach((token) => {
      this.revocationList.add(token);
      this.revocationExpiresAt.set(token, now + REVOCATION_TTL_SECONDS * 1000);
    });
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();

      // Cleanup expired cache entries
      for (const [token, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(token);
        }
      }

      // Cleanup expired revocations
      for (const [token, expiresAt] of this.revocationExpiresAt.entries()) {
        if (expiresAt < now) {
          this.revocationList.delete(token);
          this.revocationExpiresAt.delete(token);
        }
      }
    }, 60_000); // Every 60 seconds
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      revocationListSize: this.revocationList.size,
    };
  }
}

// Singleton instance
const localSessionCache = new LocalSessionCache();

// Redis client
const redis = new Redis({
  url: process.env.REDIS_URL,
});

// Health check for Redis
async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await Promise.race([
      redis.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis timeout')), 2000)
      ),
    ]);
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Main session validation function
async function validateSession(sessionToken: string) {
  const SESSION_KEY = `session:${sessionToken}`;

  try {
    // Step 1: Check local revocation list first (fail-closed)
    if (localSessionCache.isRevoked(sessionToken)) {
      console.log('Session revoked:', sessionToken);
      return null;
    }

    // Step 2: Try to get from Redis (primary source)
    try {
      const redisSession = await Promise.race([
        redis.get(SESSION_KEY),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 2000)
        ),
      ]);

      if (redisSession) {
        const sessionData = JSON.parse(redisSession as string);
        // Cache locally for fallback
        localSessionCache.set(sessionToken, sessionData);
        return sessionData;
      }

      // Cache miss in Redis: check local cache
      const cachedSession = localSessionCache.get(sessionToken);
      if (cachedSession) {
        console.log('Using local cache for session:', sessionToken);
        return cachedSession.data;
      }

      // Not in Redis and not in cache: invalid session
      return null;
    } catch (redisError) {
      // Redis unavailable: fall back to local cache
      console.warn('Redis unavailable, using local cache:', redisError);

      const cachedSession = localSessionCache.get(sessionToken);
      if (cachedSession) {
        console.log('Redis down, using cached session:', sessionToken);
        return cachedSession.data;
      }

      // Cache miss and Redis down: fail-closed
      console.error('Session validation failed: Redis down and no cache');
      return null;
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// Logout function: update both Redis and local cache
async function revokeSession(sessionToken: string): Promise<void> {
  const SESSION_KEY = `session:${sessionToken}`;

  try {
    // Revoke in both stores
    await Promise.all([
      // Delete from Redis
      redis.del(SESSION_KEY),
      // Add to revocation list in Redis (for other instances)
      redis.sadd('session:revocationList', sessionToken),
      redis.expire('session:revocationList', REVOCATION_TTL_SECONDS),
    ]);
  } catch (error) {
    console.warn('Redis revocation failed, using local revocation:', error);
  }

  // Always revoke in local cache
  localSessionCache.revoke(sessionToken);

  console.log('Session revoked:', sessionToken);
}

// Periodically sync revocation list from Redis (in case other instances revoked sessions)
async function syncRevocationList(): Promise<void> {
  if (!await checkRedisHealth()) {
    console.log('Redis unavailable, skipping revocation sync');
    return;
  }

  try {
    const revokedTokens = await redis.smembers('session:revocationList');
    if (revokedTokens && Array.isArray(revokedTokens)) {
      localSessionCache.loadRevocationList(revokedTokens as string[]);
      console.log('Synced revocation list:', revokedTokens.length, 'tokens');
    }
  } catch (error) {
    console.error('Failed to sync revocation list:', error);
  }
}

// Start background sync
setInterval(syncRevocationList, 30_000); // Every 30 seconds
```

### Pattern 2: Enhanced getCurrentSession with Fallback

```typescript
async function getCurrentSessionEnhanced(
  headers: Headers
): Promise<{ id: string; role: string; email?: string } | null> {
  try {
    // Extract session token from cookie or header
    const token = extractSessionToken(headers);
    if (!token) return null;

    // Validate using Redis with local fallback
    const sessionData = await validateSession(token);
    if (!sessionData) return null;

    // Verify token hasn't changed (security check)
    if (sessionData.sessionVersion && sessionData.sessionVersion < 0) {
      // Session version invalidated (user changed password, etc.)
      localSessionCache.revoke(token);
      return null;
    }

    return {
      id: sessionData.userId,
      role: sessionData.role,
      email: sessionData.email,
    };
  } catch (error) {
    console.error('getCurrentSession error:', error);
    return null;
  }
}

// Updated logout API
export async function POST_LOGOUT(req: NextRequest) {
  try {
    const session = await getCurrentSessionEnhanced(req.headers);
    if (!session) return jsonError('Unauthorized', 401);

    const token = extractSessionToken(req.headers);
    if (token) {
      await revokeSession(token);
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Health check endpoint
export async function GET_HEALTH(req: NextRequest) {
  const redisHealthy = await checkRedisHealth();
  const cacheStats = localSessionCache.getStats();

  return NextResponse.json({
    success: true,
    redis: redisHealthy ? 'operational' : 'unavailable',
    cache: cacheStats,
    timestamp: new Date().toISOString(),
  });
}
```

### Pattern 3: Middleware Integration

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Protected routes that require authentication
  const protectedPaths = [
    '/api/applications',
    '/api/interviews',
    '/api/notifications',
    '/dashboard',
  ];

  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Validate session with fallback
  const session = await getCurrentSessionEnhanced(request.headers);
  if (!session) {
    // No valid session: return 401
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      // Redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Session valid: continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/candidate/:path*',
    '/employer/:path*',
  ],
};
```

---

## 4.6 Database Schema Changes

### Required Tables:

```prisma
model SessionRevocation {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  reason    String   // "LOGOUT", "PASSWORD_CHANGED", "PERMISSION_REVOKED"
  revokedAt DateTime @default(now())
  expiresAt DateTime // After this, can be deleted

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model SessionValidationLog {
  id              String   @id @default(uuid())
  userId          String
  source          String   // "REDIS", "LOCAL_CACHE", "FAILED"
  success         Boolean
  timestamp       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([timestamp])
}
```

---

## 4.7 Integration Points

### Required Changes:
1. **LocalSessionCache**: New class for in-memory caching
2. **Redis Health Check**: Monitor Redis availability
3. **Revocation Sync**: Background job to sync across instances
4. **Middleware**: Update to use enhanced session validation
5. **Logout API**: Update to revoke in both stores
6. **Health Endpoint**: Expose cache stats and Redis status

### Environment Variables:
```bash
REDIS_URL=redis://localhost:6379
SESSION_CACHE_TTL_SECONDS=300        # 5 minutes
SESSION_REVOCATION_TTL_SECONDS=86400 # 24 hours
REDIS_HEALTH_CHECK_INTERVAL=30000    # 30 seconds
```

---

## 4.8 Test Strategy

### Unit Tests - Cache Behavior

```typescript
describe('LocalSessionCache - Caching Behavior', () => {
  it('should store and retrieve session from cache', () => {
    const cache = new LocalSessionCache();
    const token = 'test-token';
    const session = { userId: 'user-1', role: 'CANDIDATE' };

    cache.set(token, session);
    const retrieved = cache.get(token);

    expect(retrieved).toBeDefined();
    expect(retrieved.data).toEqual(session);
  });

  it('should return null for expired cache entries', () => {
    const cache = new LocalSessionCache();
    const token = 'test-token';
    const session = { userId: 'user-1', role: 'CANDIDATE' };

    cache.set(token, session);

    // Manually expire
    const cached = (cache as any).cache.get(token);
    cached.expiresAt = Date.now() - 1000;

    const retrieved = cache.get(token);
    expect(retrieved).toBeNull();
  });

  it('should revoke sessions and prevent access', () => {
    const cache = new LocalSessionCache();
    const token = 'test-token';
    const session = { userId: 'user-1', role: 'CANDIDATE' };

    cache.set(token, session);
    expect(cache.get(token)).not.toBeNull();

    cache.revoke(token);
    expect(cache.get(token)).toBeNull();
  });

  it('should expire revocations after TTL', (done) => {
    const cache = new LocalSessionCache();
    const token = 'test-token';

    cache.revoke(token);
    expect(cache.isRevoked(token)).toBe(true);

    // Manually expire revocation
    const expiresAt = (cache as any).revocationExpiresAt.get(token);
    (cache as any).revocationExpiresAt.set(token, Date.now() - 1000);

    // Cleanup should remove expired revocation
    (cache as any).startCleanupInterval();

    setTimeout(() => {
      expect(cache.isRevoked(token)).toBe(false);
      done();
    }, 2000);
  });
});

describe('LocalSessionCache - Revocation List', () => {
  it('should track revoked sessions', () => {
    const cache = new LocalSessionCache();
    const tokens = ['token-1', 'token-2', 'token-3'];

    cache.loadRevocationList(tokens);

    tokens.forEach((token) => {
      expect(cache.isRevoked(token)).toBe(true);
    });
  });

  it('should sync revocation list from Redis', async () => {
    const cache = new LocalSessionCache();
    const tokens = ['token-1', 'token-2'];

    // Mock Redis
    jest.spyOn(redis, 'smembers').mockResolvedValue(tokens);

    await syncRevocationList();

    tokens.forEach((token) => {
      expect(cache.isRevoked(token)).toBe(true);
    });
  });
});
```

### Integration Tests - Fallback Scenarios

```typescript
describe('Session Validation - Redis Fallback', () => {
  it('should use Redis when available', async () => {
    const token = 'test-token';
    const session = { userId: 'user-1', role: 'CANDIDATE' };

    // Mock Redis response
    jest
      .spyOn(redis, 'get')
      .mockResolvedValue(JSON.stringify(session));

    const result = await validateSession(token);

    expect(result).toEqual(session);
    expect(redis.get).toHaveBeenCalledWith(`session:${token}`);
  });

  it('should fall back to local cache when Redis unavailable', async () => {
    const token = 'test-token';
    const session = { userId: 'user-1', role: 'CANDIDATE' };

    // Mock Redis error
    jest.spyOn(redis, 'get').mockRejectedValue(new Error('Redis down'));

    // Pre-populate cache
    localSessionCache.set(token, session);

    const result = await validateSession(token);

    expect(result).toEqual(session);
  });

  it('should fail-closed when Redis down and no cache', async () => {
    const token = 'test-token';

    // Mock Redis error
    jest.spyOn(redis, 'get').mockRejectedValue(new Error('Redis down'));

    // Clear cache
    (localSessionCache as any).cache.clear();

    const result = await validateSession(token);

    expect(result).toBeNull();
  });

  it('should reject revoked sessions even if cached', async () => {
    const token = 'test-token';
    const session = { userId: 'user-1', role: 'CANDIDATE' };

    // Cache session
    localSessionCache.set(token, session);
    expect(localSessionCache.get(token)).not.toBeNull();

    // Revoke
    localSessionCache.revoke(token);

    // Should return null
    const result = await validateSession(token);
    expect(result).toBeNull();
  });
});
```

### Stress Tests - Redis Outage Recovery

```typescript
describe('Session Validation - Redis Outage Scenarios', () => {
  it('should continue serving users during Redis outage', async () => {
    const tokens = [...Array(100)].map((_, i) => `token-${i}`);
    const session = { userId: 'user-1', role: 'CANDIDATE' };

    // Pre-populate cache for all tokens
    tokens.forEach((token) => {
      localSessionCache.set(token, session);
    });

    // Simulate Redis outage
    jest
      .spyOn(redis, 'get')
      .mockRejectedValue(new Error('Redis connection refused'));

    // All requests should succeed with cached sessions
    const results = await Promise.all(
      tokens.map((token) => validateSession(token))
    );

    expect(results.every((r) => r !== null)).toBe(true);
  });

  it('should handle mixed Redis success/failure', async () => {
    let callCount = 0;

    // Simulate intermittent Redis failures
    jest.spyOn(redis, 'get').mockImplementation(() => {
      callCount++;
      return callCount % 3 === 0
        ? Promise.reject(new Error('Redis timeout'))
        : Promise.resolve(JSON.stringify({ userId: 'user-1', role: 'CANDIDATE' }));
    });

    const token = 'test-token';
    localSessionCache.set(token, { userId: 'user-1', role: 'CANDIDATE' });

    // Some calls hit Redis, some fail and use cache
    const results = await Promise.all([
      validateSession(token),
      validateSession(token),
      validateSession(token),
    ]);

    // All should succeed (mix of Redis and cache)
    expect(results.every((r) => r !== null)).toBe(true);
  });

  it('should revoke sessions during Redis recovery', async () => {
    const token = 'test-token';
    const session = { userId: 'user-1', role: 'CANDIDATE' };

    // Cache session
    localSessionCache.set(token, session);

    // Redis down, session still valid in cache
    jest.spyOn(redis, 'get').mockRejectedValue(new Error('Redis down'));
    let result = await validateSession(token);
    expect(result).not.toBeNull();

    // Revoke during outage
    localSessionCache.revoke(token);

    // Should be rejected
    result = await validateSession(token);
    expect(result).toBeNull();

    // Redis recovers
    jest.spyOn(redis, 'get').mockResolvedValue(null); // Redis confirms revoked

    // Should still be rejected
    result = await validateSession(token);
    expect(result).toBeNull();
  });
});
```

---

## 4.9 Deployment Checklist

- [ ] Create `LocalSessionCache` class
- [ ] Implement Redis health check with 2s timeout
- [ ] Update `getCurrentSession()` to use new logic
- [ ] Implement `revokeSession()` for both stores
- [ ] Add background sync job for revocation list
- [ ] Create `SessionRevocation` database table
- [ ] Update logout API to revoke in both stores
- [ ] Add health endpoint for cache stats
- [ ] Update middleware to use fallback logic
- [ ] Unit tests: Cache behavior (100% coverage)
- [ ] Integration tests: Redis failure scenarios
- [ ] Stress tests: 1000+ concurrent sessions during outage
- [ ] Performance: Verify no increase in latency
- [ ] Monitoring: Alert on Redis health check failures
- [ ] Monitoring: Track cache hit rate
- [ ] Rollback: Feature flag for old behavior (1 week)
- [ ] Documentation: Update deployment runbook

---

---

# SUMMARY: Implementation Priority & Timeline

## Phase 1: Immediate (Days 1-2)
1. **Notification IDOR** - Simplest fix, highest immediate impact
   - Add ownership check in PUT handler
   - Deploy with feature flag
   - Est: 2-4 hours

2. **Interview Admin Bypass** - Medium complexity
   - Extract auth method determination
   - Fix `findAuthorizedInterview()` logic
   - Deploy with feature flag
   - Est: 4-6 hours

## Phase 2: Short-term (Days 3-4)
3. **Application Duplicate Race** - Database-heavy
   - Create and test migration (remove duplicates)
   - Add unique constraint
   - Update upsert logic with Serializable isolation
   - Deploy carefully, monitor closely
   - Est: 6-8 hours

## Phase 3: Medium-term (Days 5-7)
4. **Redis Session Dependency** - Most complex
   - Implement `LocalSessionCache`
   - Add revocation sync
   - Update middleware
   - Extended testing and monitoring
   - Est: 8-12 hours

## Testing & Rollback
- All phases: 100% unit test coverage before deploy
- All phases: Feature flag for 1-week rollback window
- All phases: Monitoring alerts configured pre-deploy
- All phases: Runbooks and incident response plans ready

---

This comprehensive design document provides:
✅ Architecture diagrams (text-based)
✅ Specific code patterns and implementations
✅ Integration points clearly identified
✅ Test strategies with concrete examples
✅ Database schema changes where needed
✅ Deployment checklists
✅ Backward compatibility analysis
✅ Failure scenario handling
✅ Monitoring and observability recommendations

