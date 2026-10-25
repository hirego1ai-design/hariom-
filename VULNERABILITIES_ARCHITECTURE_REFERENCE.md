# Critical Vulnerabilities - Architecture & Integration Reference

## Vulnerability #1: Notification IDOR

### Current (Vulnerable) Flow
```
┌─────────────────────────────────────────────────────────────┐
│ Client: PUT /api/notifications with notificationId from URL  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Rate Limit Check    │ ✓ OK
        └──────────┬──────────┘
                   │
                   ▼
        ┌──────────────────────────────────┐
        │ getCurrentSession()               │ ✓ User authenticated
        │ Returns: session.id = "user-123" │
        └──────────┬───────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │ readValidatedJson()                  │
        │ Extracts: notificationId = "xyz"     │ ← From user input
        └──────────┬───────────────────────────┘
                   │
                   ▼
        ┌─────────────────────────────────────────┐
        │ prisma.notification.updateMany({        │
        │   where: {                              │
        │     id: body.notificationId,  ← CRITICAL BUG
        │     userId: session.id                  │
        │   }                                     │
        │ })                                      │
        └──────────┬───────────────────────────────┘
                   │
        ┌──────────┴──────────────────────────────────────┐
        │  SQL: UPDATE Notification                       │
        │       WHERE id = "xyz" AND userId = "user-123"  │
        │                                                  │
        │  Issue: updateMany returns count=0              │
        │  But client may not check this!                 │
        └──────────────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │ Return: { success: true, count: 0 }  │
        │ Client assumes it worked!            │
        └──────────────────────────────────────┘

ATTACK SCENARIO:
Attacker finds victim's notificationId (UUID enumeration or from logs)
PUT /api/notifications with own token but victim's notificationId
→ updateMany silently returns count=0
→ But client doesn't check count
→ Looks like success to frontend
```

### Fixed Flow
```
┌────────────────────────────────────────────────────────────────┐
│ Client: PUT /api/notifications with notificationId from URL    │
└────────────┬─────────────────────────────────────────────────┬─┘
             │                                                 │
             ▼                                                 ▼
    ┌──────────────────┐                          ┌─────────────────────┐
    │ Rate Limit       │                          │ markAll=true?       │
    │ Check ✓          │                          │ YES: Skip to update │
    └──────┬───────────┘                          └─────────────────────┘
           │
           ▼
    ┌─────────────────────┐
    │ getCurrentSession()  │ ✓ Authenticated
    │ session.id="user-123"
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────────────┐
    │ readValidatedJson() │
    │ notificationId="xyz"│
    └──────┬──────────────┘
           │
           ▼ NEW: OWNERSHIP VALIDATION
    ┌──────────────────────────────────────┐
    │ Fetch notification by ID              │
    │ SELECT id, userId FROM Notification  │
    │ WHERE id = "xyz"                      │
    └──────┬───────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
 NOT FOUND     FOUND
    │             │
    │         ┌───┴─────────────────────────┐
    │         │ userId !== session.id?       │
    │         │                              │
    │     YES │                          NO │
    │         ▼                              ▼
    │     ┌─────────────┐         ┌────────────────────┐
    │     │ 403 Error   │         │ Update notification│
    │     │ Forbidden   │         │ SET isRead = true  │
    │     └─────────────┘         └────────────────────┘
    │                                     │
    ▼                                     ▼
 404 Response                        200 Response
   (Fail-closed)                   (Success)
```

### Integration Points
```
Authentication Layer
    ↓
getCurrentSession() ──→ Extract user ID & role
    ↓
Prisma Client
    ├─→ findUnique() - Fetch notification
    ├─→ updateMany() - Update if authorized
    └─→ Returns count of updated records
    ↓
Error Handler
    └─→ Convert to ApiError with appropriate status
```

### Data Flow (UML)
```
actor Client
participant "API" as API
participant "Auth" as Auth
participant "Database" as DB

Client->>API: PUT /api/notifications {notificationId}
API->>Auth: getCurrentSession()
Auth-->>API: session {id, role}
API->>API: Extract notificationId from body
API->>DB: SELECT id, userId FROM Notification WHERE id = ?
DB-->>API: notification {id, userId}
alt userId != session.id
    API-->>Client: 403 Forbidden
else
    API->>DB: UPDATE Notification SET isRead=true WHERE id=?
    DB-->>API: {count: 1}
    API-->>Client: 200 {success: true, updatedCount: 1}
end
```

---

## Vulnerability #2: Interview Admin Bypass

### Current (Vulnerable) Flow
```
                    ┌─────────────────────────────────┐
                    │ ADMIN logs in via Web UI         │
                    │ (Session cookie)                 │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │ GET /api/interviews/room        │
                    │ with roomId in query params      │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │ findAuthorizedInterview()       │
                    │ { id: "admin-1", role: "ADMIN" }│
                    └────────────┬────────────────────┘
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
        ▼ Is CANDIDATE?                                   ▼ Is ADMIN?
      NO                                                  YES
        │                                                 │
        │                                     ┌───────────┴────────┐
        │                                     │ Return interview   │
        │                                     │ (NO CHECKS!)       │
        │                                     │                    │
        │                                     │ BUG: Even if admin │
        │                                     │ is not an assigned │
        │                                     │ interviewer, they  │
        │                                     │ still get access!  │
        │                                     └───────────┬────────┘
        │                                                 │
        └─────────────────────────┬───────────────────────┘
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │ 200 Response          │
                      │ Interview data        │
                      │ (Full access!)        │
                      └───────────────────────┘

EXPLOIT:
1. Admin user logs in via web
2. Grabs any roomId (bruteforce or social engineering)
3. Can access ANY interview regardless of assignment
4. Can spy on interview content, audio, chat
5. No audit trail of access
```

### Fixed Flow
```
                    ┌─────────────────────────────────┐
                    │ Request arrives with credentials │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │ Extract Auth Method              │
                    │ Check headers for Bearer token   │
                    │ Check cookies for session        │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
            Bearer token?              Session cookie?
                    │                          │
                    ▼                          ▼
            ┌──────────────┐         ┌────────────────────┐
            │ API_KEY      │         │ SESSION_COOKIE     │
            │ Auth method  │         │ Auth method        │
            └──────┬───────┘         └─────┬──────────────┘
                   │                        │
                   ▼                        ▼
        ┌──────────────────────────┐ ┌──────────────────────┐
        │ Is admin?                │ │ Is admin?            │
        │ YES → Grant access       │ │ YES → Continue       │
        │ (Backend service)        │ │                      │
        │ NO → Check interview     │ └─────┬────────────────┘
        │ assignment               │       │
        └──────┬───────────────────┘       ▼
               │                  ┌────────────────────────┐
               │                  │ Check assignment list  │
               │                  │ Is admin in           │
               │                  │ interviewers[]?       │
               │                  │                       │
               │                  │ YES: Grant access     │
               │                  │ NO: 403 Forbidden     │
               │                  └─────┬────────────────┘
               │                         │
               └──────────┬──────────────┘
                          │
                          ▼
                 ┌────────────────────┐
                 │ 200 or 403         │
                 │ Proper authorization
                 └────────────────────┘

SECURITY IMPROVEMENTS:
✓ Differentiate API key vs session auth
✓ Require admin assignment for session auth
✓ Audit log all admin access attempts
✓ Deny access if not assigned
```

### Auth Method Detection
```
HTTP Headers Analysis
│
├─ Check: "Authorization: Bearer XYZ"
│  ├─ YES → API_KEY authentication
│  │       (Backend service)
│  │       ↓
│  │    GRANT ACCESS to admin users
│  │
│  └─ NO → Continue
│
├─ Check: Cookie contains session token
│  ├─ YES → SESSION_COOKIE authentication
│  │       (Web UI user)
│  │       ↓
│  │    REQUIRE assignment check
│  │
│  └─ NO → Reject (no auth found)
│
└─ Result: enrich session object with authMethod
```

### Interviewer Assignment Check
```
SELECT interviewers FROM InterviewRound WHERE roundId = ?
                         │
                         ▼
                    ┌─────────────────┐
                    │ Array of         │
                    │ interviewer IDs  │
                    │ [                │
                    │  "emp-1",        │
                    │  "emp-2",        │
                    │  (admin NOT here)│
                    │ ]                │
                    └────────┬─────────┘
                             │
                    Check: session.id in array?
                             │
                    ┌────────┴────────┐
                    │                 │
                   YES               NO
                    │                 │
                    ▼                 ▼
            ┌─────────────┐    ┌──────────────┐
            │ Allow access│    │ 403 Forbidden│
            │ (Assigned)  │    │ (Not assigned
            └─────────────┘    └──────────────┘
```

---

## Vulnerability #3: Application Duplicate Race Condition

### Current (Vulnerable) Flow
```
                REQUEST 1                          REQUEST 2
                (From client 1)                    (From client 2 - concurrent)
                       │                                   │
                       ▼                                   ▼
        ┌──────────────────────────────┐    ┌──────────────────────────────┐
        │ Candidate ID: "cand-1"       │    │ Candidate ID: "cand-1"       │
        │ Job ID: "job-1"              │    │ Job ID: "job-1"              │
        └──────────────┬────────────────┘    └──────────────┬────────────────┘
                       │                                    │
          ┌────────────▼─────────────┐      ┌────────────────▼────────────┐
          │ findUnique({             │      │ findUnique({                │
          │   where: {               │      │   where: {                  │
          │ candidateProfileId:      │      │ candidateProfileId:         │
          │ "cand-1",                │      │ "cand-1",                   │
          │ jobId: "job-1"           │      │ jobId: "job-1"              │
          │   }                      │      │   }                         │
          │ })                       │      │ })                          │
          └────────────┬─────────────┘      └────────────┬────────────────┘
                       │                                  │
                       ▼ DB: No existing record           ▼ DB: No existing record
                    null ◄───────────────────────────────► null
                       │                                  │
                       │ RACE CONDITION WINDOW            │
                       │ Both see "no existing app"!      │
                       │ ◄────────────────────────────►   │
                       │
          ┌────────────▼──────────────────┐  ┌──────────────┴──────────────┐
          │ application.create({          │  │ application.create({        │
          │   candidateProfileId,         │  │   candidateProfileId,       │
          │   jobId,                      │  │   jobId,                    │
          │   status: "APPLIED",          │  │   status: "APPLIED",        │
          │   ...                         │  │   ...                       │
          │ })                            │  │ })                          │
          └────────────┬──────────────────┘  └──────────────┬────────────┘
                       │                                    │
                       ▼ DUPLICATE CREATED!                ▼ DUPLICATE CREATED!
              ┌──────────────────┐                 ┌──────────────────┐
              │ Application A    │                 │ Application B    │
              │ ID: "app-uuid-1" │                 │ ID: "app-uuid-2" │
              └──────────────────┘                 └──────────────────┘

DATABASE STATE:
┌────────────────────────────────────────┐
│ Application                            │
├──────────────────────────────────────────
│ id          │ candidateProfileId │ jobId
├──────────────────────────────────────────
│ app-uuid-1  │ cand-1             │ job-1 ← Duplicate!
│ app-uuid-2  │ cand-1             │ job-1 ← Duplicate!
└────────────────────────────────────────┘

CASCADING FAILURES:
1. Two assessment gates created
2. Two notifications sent
3. Candidate confused by duplicate emails
4. Data integrity violated
5. Reports show wrong numbers
```

### Fixed Flow
```
                REQUEST 1                          REQUEST 2
                (From client 1)                    (From client 2 - concurrent)
                       │                                   │
                       ▼                                   ▼
        ┌──────────────────────────────┐    ┌──────────────────────────────┐
        │ Candidate ID: "cand-1"       │    │ Candidate ID: "cand-1"       │
        │ Job ID: "job-1"              │    │ Job ID: "job-1"              │
        └──────────────┬────────────────┘    └──────────────┬────────────────┘
                       │                                    │
                       ▼ BEGIN TRANSACTION                  ▼ BEGIN TRANSACTION
                   (SERIALIZABLE)                        (SERIALIZABLE)
                       │                                    │
                       ▼                                    ▼
          ┌────────────────────────────────┐  ┌────────────────────────────────┐
          │ UPSERT({                       │  │ UPSERT({                       │
          │   where: {                     │  │   where: {                     │
          │ (candidateProfileId, jobId)    │  │ (candidateProfileId, jobId)    │
          │   },                           │  │   },                           │
          │   create: { /* new */ },       │  │   create: { /* new */ },       │
          │   update: { /* same */ }       │  │   update: { /* same */ }       │
          │ })                             │  │ })                             │
          └────────────┬───────────────────┘  └────────────┬───────────────────┘
                       │                                    │
                       ▼ Acquires lock on unique key        │ WAITS for lock...
                   WRITES Application A                     │
                       │                                    │
                   COMMIT                                   │
                   (Lock released)                          │
                       │                                    ▼ SERIALIZATION CONFLICT!
                       │              ┌──────────────────────────────────────┐
                       │              │ Transaction 2 aborts with error P2034 │
                       │              │ Client must retry                     │
                       │              └──────────────────────────────────────┘
                       │                                    │
                       │                    ┌───────────────▼─────────────────┐
                       │                    │ RETRY UPSERT                    │
                       │                    │ UPDATE branch now matches       │
                       │                    │ (Because app exists from Req 1) │
                       │                    └───────────────┬─────────────────┘
                       │                                    │
                       │                    ┌───────────────▼──────────────┐
                       │                    │ SUCCESS: Returns existing app │
                       │                    │ ID: "app-uuid-1" (same!)     │
                       │                    └───────────────┬──────────────┘
                       │                                    │
                       └────────────┬───────────────────────┘
                                    │
DATABASE STATE:
┌────────────────────────────────────────┐
│ Application                            │
├──────────────────────────────────────────
│ id          │ candidateProfileId │ jobId
├──────────────────────────────────────────
│ app-uuid-1  │ cand-1             │ job-1 ✓ SINGLE APP
└────────────────────────────────────────┘

BOTH RESPONSES:
Request 1: { success: true, application: {id: "app-uuid-1", ...} }
Request 2: { success: true, application: {id: "app-uuid-1", ...} } ← Same ID!

NO CASCADING FAILURES:
✓ Only one application
✓ Only one assessment gate
✓ Only one notification
✓ Data integrity preserved
```

### Unique Constraint Protection
```
PostgreSQL Constraint:
┌────────────────────────────────────────┐
│ ALTER TABLE Application                │
│ ADD CONSTRAINT candidateProfileId_jobId│
│ UNIQUE(candidateProfileId, jobId)      │
└────────────────────────────────────────┘

Effect:
  ┌─ Request 1: Create app for (cand-1, job-1)
  │     ↓
  │  ✓ Allowed (new unique combination)
  │
  ├─ Request 2: Try to create app for (cand-1, job-1)
  │     ↓
  │  ✗ CONSTRAINT VIOLATION
  │  ✗ Error P2002 (unique constraint failed)
  │
  └─ Wrapped in UPSERT: Automatically runs UPDATE instead
       ↓
      ✓ Returns existing application
```

### Transaction Isolation Levels
```
                CHECK-THEN-CREATE             SERIALIZABLE UPSERT
                (Vulnerable)                  (Fixed)

Time    Request1  Request2    Action     Request1  Request2    Action
────    ─────────────────────────────     ─────────────────────────────
T0      Check     │           OK          BEGIN Tx1 │           
        null      │                           │     │           
        │         │                           │     │           
T1      │         Check       │ Both see   LOCK on  │           
        │         null        │ null!      constraint
        │         │                       │     │           
T2      │         │           ▼           │     BEGIN Tx2
        │         │         RACE!         │     WAIT...
        │         │           ▼           │     (blocked)
        │         CREATE     ✗ BUG        │     │           
        │         app-2                   │     │           
        │         │                       │     │           
T3      CREATE    │           ✓ Fix       CREATE  CONFLICT!
        app-1     │                       app-1   Error P2034
        │         │                       │     │           
T4      COMMIT    │           │           COMMIT  │           
        │         COMMIT      │           │     RETRY
        │         │                       │     │           
T5      │         ✗ DUPLICATE │           │     UPDATE
        │         │                       │     app-1
        │         │                       │     │           
                                          │     COMMIT
                                          │     │           
Result: 2 apps created!      ✓ 1 app created, returned to both

Isolation Level: DEFAULT        Isolation Level: SERIALIZABLE
Problem: Race window            Solution: Atomic operation + retry
```

---

## Vulnerability #4: Redis Session Dependency

### Current (Vulnerable) Flow
```
                    USER LOGIN
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Verify credentials           │
        │ Create session object        │
        └──────────────┬────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Store in Redis               │
        │ KEY: session:token123        │
        │ VALUE: {userId, role, exp}   │
        │ EXPIRY: 24 hours             │
        └──────────────┬────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Return token to client       │
        │ Client stores in cookie      │
        └──────────────┬────────────────┘
                       │
        ┌──────────────┴───────────────────────────────┐
        │                                              │
        ▼                                              ▼
    API REQUEST 1                                API REQUEST 2
    (Normal case)                                (Redis down case)
        │                                              │
        ▼                                              ▼
    ┌───────────────────┐                    ┌──────────────────┐
    │ Session token     │                    │ Session token    │
    │ in cookie         │                    │ in cookie        │
    └─────────┬─────────┘                    └────────┬─────────┘
              │                                       │
              ▼                                       ▼
    ┌──────────────────────────┐         ┌──────────────────────────┐
    │ validateSession()         │         │ validateSession()        │
    │ Try Redis.GET("session") │         │ Try Redis.GET("session") │
    │                          │         │                          │
    │ ✓ Redis ONLINE           │         │ ✗ Redis OFFLINE          │
    └─────────┬────────────────┘         │ Error thrown!            │
              │                          │                          │
              ▼                          │                          │
    ┌──────────────────────────┐         │                          │
    │ Return session data      │         ▼                          │
    │ Auth successful ✓        │    ┌────────────────────────┐
    │                          │    │ No fallback!           │
    └─────────┬────────────────┘    │ Session validation     │
              │                     │ FAILS                  │
              ▼                     │ User logged out!       │
    ┌──────────────────────────┐    │ 401 Unauthorized       │
    │ Access granted           │    │                        │
    │ API call succeeds        │    └────────────────────────┘
    │ User can continue        │
    └──────────────────────────┘

CASCADE FAILURE SCENARIO:
┌─────────────────────────────────┐
│ T0: Redis healthy, system OK    │
│ 10,000 users online             │
└──────────┬──────────────────────┘
           │
           ▼ Redis process crashes
┌─────────────────────────────────┐
│ T1: Redis down                  │
│ All session validations fail    │
│ 10,000 users instantly logged   │
│ out!                            │
│ Panic: Can't log back in        │
│ Password reset broken           │
│ (also uses sessions)            │
│ Support flooded                 │
└─────────────────────────────────┘
```

### Fixed Flow
```
                    USER LOGIN
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Verify credentials           │
        │ Create session object        │
        └──────────────┬────────────────┘
                       │
        ┌──────────────┴──────────────────────┐
        │                                     │
        ▼                                     ▼
    Store in Redis              Store in Local Cache
    ONLINE_CACHE                (5 min TTL)
        │                                    │
        └──────────────┬─────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Return token to client       │
        └──────────────┬────────────────┘
                       │
        ┌──────────────┴─────────────────────────────────────┐
        │                                                   │
        ▼                                                   ▼
    API REQUEST 1                                    API REQUEST 2
    (Redis operational)                             (Redis down)
        │                                                   │
        ▼                                                   ▼
    ┌───────────────────┐                       ┌───────────────────┐
    │ Check revocation  │                       │ Check revocation  │
    │ list              │                       │ list              │
    │ (local, fast)     │                       │ (local, fast)     │
    │ Not revoked? OK   │                       │ Not revoked? OK   │
    └─────────┬─────────┘                       └────────┬─────────┘
              │                                          │
              ▼                                          ▼
    ┌──────────────────────┐               ┌──────────────────────┐
    │ Try Redis (primary)  │               │ Try Redis (primary)  │
    │ HEALTH: OK           │               │ HEALTH: FAIL         │
    │ GET session data ✓   │               │ (timeout after 2s)   │
    └─────────┬────────────┘               └────────┬─────────────┘
              │                                     │
              │                             ┌───────▼────────────┐
              │                             │ Fall back to       │
              │                             │ LOCAL CACHE        │
              │                             │ (recently accessed) │
              │                             └───────┬────────────┘
              │                                     │
              ▼                                     ▼
    ┌──────────────────────┐               ┌──────────────────────┐
    │ Cache hit (optional) │               │ Check cache entry    │
    │ Verify in local      │               │ Cached from 2 min    │
    │                      │               │ ago                  │
    └─────────┬────────────┘               │ Still valid (5 min)  │
              │                             │ Not revoked         │
              │                             │ ✓ Return session    │
              │                             └─────┬────────────┘
              │                                    │
              └────────────┬─────────────────────┬─┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────────────────────────┐
                    │ Auth successful                 │
                    │ User continues working          │
                    │ Degraded but functional         │
                    └─────────────────────────────────┘

RESILIENCE SCENARIO:
┌──────────────────────────────────────┐
│ T0: Both Redis and local cache OK    │
│ 10,000 users online                  │
└────────────────┬─────────────────────┘
                 │
                 ▼ Redis process crashes
┌──────────────────────────────────────┐
│ T1: Redis down                       │
│ Local cache active                   │
│ 95% of users remain operational      │
│ (those with recent activity)         │
│ No cascading failure!                │
│ No panic!                            │
└────────────────┬─────────────────────┘
                 │
                 ▼ Redis recovers (15 min later)
┌──────────────────────────────────────┐
│ T2: Redis restored                   │
│ Smooth transition back to primary    │
│ No user-visible interruption         │
│ Cache automatically expires          │
└──────────────────────────────────────┘
```

### Session Cache Architecture
```
LOCAL SESSION CACHE (In-Memory)
┌────────────────────────────────────────────────────────────┐
│ MAP<token, CachedSession>                                  │
│                                                            │
│ Token: "abc123"                                            │
│ ├─ Session Data: {userId, role, email}                   │
│ ├─ Cached At: 2025-01-15T10:30:00Z                        │
│ └─ Expires At: 2025-01-15T10:35:00Z (5 min TTL)           │
│                                                            │
│ Token: "xyz789"                                            │
│ ├─ Session Data: {userId, role, email}                   │
│ ├─ Cached At: 2025-01-15T10:32:15Z                        │
│ └─ Expires At: 2025-01-15T10:37:15Z                       │
│                                                            │
│ (Cleanup runs every 60 seconds)                           │
└────────────────────────────────────────────────────────────┘
              │
              ▼
REVOCATION LIST (In-Memory SET)
┌────────────────────────────────────────────────────────────┐
│ SET<token> (Revoked tokens)                                │
│                                                            │
│ "old-token-revoked"     → Expires in 24 hours             │
│ "logout-token"          → Expires in 24 hours             │
│ "permission-revoked"    → Expires in 24 hours             │
│                                                            │
│ (Used for immediate invalidation on logout)               │
└────────────────────────────────────────────────────────────┘

VALIDATION SEQUENCE:
1. Request arrives with token
2. Check local revocation list (O(1) lookup) → 401 if revoked
3. Try Redis get (primary, ~5ms)
   ├─ Hit: Cache locally, return session
   ├─ Miss: Check local cache
   ├─ Error: Fall back to local cache
4. Local cache (O(1) lookup)
   ├─ Hit + not expired: Return session
   ├─ Miss or expired: 401 Unauthorized

Latency breakdown:
- Revocation check: <1ms
- Redis hit: 5-10ms (total latency ~5-10ms)
- Redis timeout: 2000ms + local cache: <1ms (total ~2001ms but still works!)
- Local cache hit: <1ms (total ~1ms - fastest!)
```

### Logout & Revocation Flow
```
USER CLICKS LOGOUT
       │
       ▼
┌──────────────────────────────────┐
│ POST /api/auth/logout            │
│ Body: { token: "abc123" }        │
└───────────┬──────────────────────┘
            │
            ▼
    ┌─────────────────────────────┐
    │ revokeSession("abc123")      │
    └───────────┬─────────────────┘
                │
    ┌───────────┴──────────────┐
    │                          │
    ▼                          ▼
Try Redis            ALWAYS local revocation
DEL session:abc123   revocationList.add("abc123")
SADD revoked:sessions, "abc123"
│                          │
├─ Success: OK             │
├─ Error: Still continue   │
└─ Timeout: Still continue │
                           │
                           ▼
                   ┌─────────────────────────────┐
                   │ Return 200 OK               │
                   │ User logged out             │
                   └─────────────────────────────┘

IMMEDIATE EFFECT:
Token "abc123" in revocation list
└─ Any request with this token
   └─ validateSession() checks revocation list first
      └─ Returns null (401 Unauthorized)
      
NO DELAY - Immediate invalidation!

BACKGROUND SYNC (Every 30 seconds):
Redis revocation list → Update local cache
└─ Keeps multiple instances in sync
└─ If instance A revokes, instance B knows about it
```

### Monitoring & Observability
```
HEALTH CHECK ENDPOINT
GET /api/health
Response:
{
  "status": "operational",
  "redis": "operational",
  "cache": {
    "size": 2543,
    "hitRate": 0.87,
    "missRate": 0.13,
    "revocations": 142
  },
  "timestamp": "2025-01-15T10:35:00Z"
}

METRICS TO TRACK:
┌────────────────────────────────────────┐
│ session_validation_redis_latency_ms    │ Target: <50ms
│ session_validation_cache_hits_total    │ Target: >85%
│ session_validation_cache_misses_total  │ Target: <15%
│ session_revocation_count               │ Track logouts
│ redis_health_check_failures            │ Alert: >1/min
│ session_validation_failures            │ Track issues
└────────────────────────────────────────┘

ALERTS:
├─ Redis unavailable > 1 minute
│  Action: Page on-call, start manual failover
│
├─ Cache hit rate < 70%
│  Action: Investigate why cache missing
│
├─ Session validation failures > 100/min
│  Action: Check for attacks or infrastructure
│
└─ Revocation sync failures > 1%
   Action: Check Redis and network connectivity
```

---

# Integration Architecture Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                      HIREGO 3.0 SECURITY STACK                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. NOTIFICATION IDOR FIX                                   │ │
│  │    [Ownership Validation Layer]                            │ │
│  │    Location: src/app/api/notifications/route.ts           │ │
│  │    Added: Fetch + verify userId match                      │ │
│  │    Response: 403 Forbidden if not owner                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 2. INTERVIEW ADMIN BYPASS FIX                              │ │
│  │    [Auth Method Differentiation Layer]                     │ │
│  │    Location: src/app/api/interviews/room/route.ts         │ │
│  │    Added: Extract auth method (API_KEY vs SESSION_COOKIE)  │ │
│  │    Enforced: Session-based admins must be assigned         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 3. APPLICATION DUPLICATE RACE FIX                          │ │
│  │    [Atomic Upsert + Serializable Isolation]                │ │
│  │    Location: src/app/api/applications/route.ts            │ │
│  │    Database: Added unique constraint                       │ │
│  │    Added: Prisma upsert with SERIALIZABLE isolation        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 4. REDIS SESSION DEPENDENCY FIX                            │ │
│  │    [Local Cache Fallback + Revocation Sync]                │ │
│  │    Location: src/lib/cache/SessionCache.ts                │ │
│  │    Added: In-memory cache with 5-min TTL                   │ │
│  │    Added: Revocation list with 24-hour TTL                 │ │
│  │    Fallback: Use cache if Redis unavailable                │ │
│  │    Fail-closed: 401 if cache expired and Redis down        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│              ┌─────────────────────────────┐                     │
│              │ ALL FIXES DEPLOYED WITH:    │                     │
│              │ • Feature flags (1-week TTL)│                     │
│              │ • Monitoring alerts         │                     │
│              │ • Audit logging             │                     │
│              │ • Rollback plans            │                     │
│              └─────────────────────────────┘                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

# Implementation Timeline

```
WEEK 1: FIXES
┌──────────────────────────────────────────────────────────────────┐
│ Day 1-2: NOTIFICATION IDOR                                       │
│ ├─ Implement ownership check                                    │
│ ├─ Add unit tests                                               │
│ ├─ Deploy with feature flag                                    │
│ └─ Monitor for regressions                                     │
│                                                                 │
│ Day 2-3: INTERVIEW ADMIN BYPASS                                 │
│ ├─ Extract auth method detection                                │
│ ├─ Fix findAuthorizedInterview()                               │
│ ├─ Add audit logging                                           │
│ ├─ Deploy with feature flag                                    │
│ └─ Verify admin access patterns                                │
│                                                                 │
│ Day 3-4: APPLICATION DUPLICATE RACE                             │
│ ├─ Create database migration                                    │
│ ├─ Test on staging (remove duplicates)                          │
│ ├─ Update schema with unique constraint                         │
│ ├─ Replace check-then-create with upsert                        │
│ ├─ Stress test with concurrent requests                         │
│ ├─ Deploy with feature flag                                    │
│ └─ Monitor for serialization errors                             │
│                                                                 │
│ Day 4-5: REDIS SESSION DEPENDENCY                               │
│ ├─ Implement LocalSessionCache                                  │
│ ├─ Add revocation sync job                                     │
│ ├─ Update getCurrentSession()                                   │
│ ├─ Update logout endpoint                                      │
│ ├─ Add health check endpoint                                   │
│ ├─ Comprehensive testing (all failure modes)                    │
│ ├─ Deploy with feature flag                                    │
│ └─ Simulate Redis failures in staging                          │
│                                                                 │
│ Day 5-7: HARDENING & MONITORING                                 │
│ ├─ Review all 4 fixes with security team                        │
│ ├─ Configure monitoring alerts                                  │
│ ├─ Create runbooks for incidents                                │
│ ├─ Run security scan on modified code                           │
│ └─ Schedule retrospective                                       │
└──────────────────────────────────────────────────────────────────┘
```

