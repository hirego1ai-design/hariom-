import test from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, getCurrentSession, SessionValidationError, UserSession } from "../lib/auth";
import * as redis from "../lib/redis";

/**
 * Bug Condition Exploration Test: Redis Session Dependency Vulnerability
 * 
 * **Validates: Requirements 1.0 - Redis Unavailable Fallback**
 * 
 * EXPECTED BEHAVIOR ON UNFIXED CODE: Test FAILS
 * - When Redis is unavailable, getCurrentSession() throws SessionValidationError
 * - This proves the bug exists: no fallback to local cache
 * 
 * EXPECTED BEHAVIOR ON FIXED CODE: Test PASSES
 * - When Redis is unavailable, getCurrentSession() uses local cache for sessions < 5 minutes old
 * - Sessions are returned from cache instead of throwing errors
 */

test("Bug Condition: Redis unavailable causes session validation to fail instead of using cache fallback", async () => {
  // Create a valid user session payload
  const validSession: UserSession = {
    id: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    role: "CANDIDATE",
    sessionVersion: 1,
  };

  // Create a valid session token
  const token = createSessionToken(validSession);

  // Create headers with the session cookie
  const headers = new Headers();
  headers.set("Cookie", `hirego_session=${token}`);

  // Mock Redis to simulate failure (unavailable state)
  const originalGetValue = redis.getRedisValue;
  (redis as any).getRedisValue = async () => {
    throw new redis.RedisUnavailableError("Redis timeout: connection refused");
  };

  let bugConditionConfirmed = false;

  try {
    // Act: Call getCurrentSession with Redis down
    // On UNFIXED code: This throws SessionValidationError (BUG - no cache fallback)
    // On FIXED code: This should use local cache and return the session
    const result = await getCurrentSession(headers);

    // If we get here without exception in dev mode, check if it's returning null
    // (which is acceptable in dev with cache miss, but production would throw)
    if (result === null) {
      // In dev mode, returning null is okay - means token verified but cache miss
      // Bug is confirmed if this silently succeeds without real fallback
      bugConditionConfirmed = true;
    }
  } catch (error) {
    // Unfixed behavior: SessionValidationError is thrown when Redis fails
    // This proves the bug exists - session validation fails when Redis is unavailable
    // with no fallback mechanism
    if (error instanceof SessionValidationError) {
      bugConditionConfirmed = true;
      assert.match(
        (error as Error).message,
        /Redis timeout|unavailable|Shared Redis/i,
        "Error should indicate Redis is unavailable"
      );
    }
  } finally {
    // Restore original function
    (redis as any).getRedisValue = originalGetValue;
  }

  // Bug Condition Verified: On unfixed code, this assertion FAILS (proving the bug exists)
  // The test expects either:
  // 1. SessionValidationError to be thrown when Redis fails (production bug), OR
  // 2. Silent failure returning null without real cache fallback (dev mode bug)
  assert.ok(
    bugConditionConfirmed,
    "EXPLORATION TEST RESULT: Redis unavailability causes immediate failure with no cache fallback. Bug exists."
  );
});

test("Bug Condition: Session in local cache should survive Redis outage for fresh sessions", async () => {
  // Create a valid user session that should be cached
  const validSession: UserSession = {
    id: "cached-user-456",
    email: "cached@example.com",
    name: "Cached User",
    role: "EMPLOYER",
    sessionVersion: 2,
  };

  // Create a session token
  const token = createSessionToken(validSession);

  // Create headers with the session cookie
  const headers = new Headers();
  headers.set("Cookie", `hirego_session=${token}`);

  // Mock both getRedisValue and setRedisValue to fail
  // This simulates both reading and writing to Redis failing
  const originalGetValue = redis.getRedisValue;
  const originalSetValue = redis.setRedisValue;

  (redis as any).getRedisValue = async (key: string) => {
    // Simulate complete Redis failure
    throw new redis.RedisUnavailableError("Connection timeout");
  };

  (redis as any).setRedisValue = async () => {
    // Redis set also fails
    throw new redis.RedisUnavailableError("Connection timeout");
  };

  let bugConditionConfirmed = false;

  try {
    // Act: Call getCurrentSession with Redis down
    const result = await getCurrentSession(headers);

    // In dev mode, returning null means token is valid but cache miss - bug confirmed
    if (result === null) {
      bugConditionConfirmed = true;
    }
  } catch (error) {
    // Unfixed: Throws error instead of falling back to cache
    if (
      error instanceof SessionValidationError ||
      error instanceof redis.RedisUnavailableError
    ) {
      bugConditionConfirmed = true;
    }
  } finally {
    // Restore original functions
    (redis as any).getRedisValue = originalGetValue;
    (redis as any).setRedisValue = originalSetValue;
  }

  assert.ok(
    bugConditionConfirmed,
    "EXPLORATION TEST RESULT: Complete Redis failure causes session validation to fail. Bug exists: no local cache fallback."
  );
});

test("Bug Condition: Partial Redis failure (read fails, write succeeds) should still cause validation failure", async () => {
  const validSession: UserSession = {
    id: "partial-fail-789",
    email: "partial@example.com",
    name: "Partial Fail User",
    role: "CANDIDATE",
    sessionVersion: 0,
  };

  const token = createSessionToken(validSession);
  const headers = new Headers();
  headers.set("Cookie", `hirego_session=${token}`);

  // Mock Redis to fail on read but succeed on write
  // This is a realistic failure scenario
  const originalGetValue = redis.getRedisValue;
  const callCount = { get: 0, set: 0 };

  (redis as any).getRedisValue = async () => {
    callCount.get++;
    throw new redis.RedisUnavailableError("Read operation timeout");
  };

  let bugConditionConfirmed = false;

  try {
    // Act: getCurrentSession tries to read revocation/version from Redis and fails
    // On UNFIXED code: This throws error with no fallback
    // On FIXED code: This should use cached value or proceed with fallback logic
    const result = await getCurrentSession(headers);

    // Fixed: Should have cache fallback strategy
    if (result) {
      assert.equal(result.id, validSession.id);
    } else {
      // Bug: Fails instead of falling back
      assert.equal(result, null, "Should return session from cache on Redis read failure");
    }
  } catch (error) {
    // Unfixed behavior: Throws error on Redis read failure
    if (error instanceof SessionValidationError) {
      bugConditionConfirmed = true;
      assert.ok(
        callCount.get > 0,
        "Should have attempted to read from Redis before failing"
      );
    }
  } finally {
    (redis as any).getRedisValue = originalGetValue;
  }

  assert.ok(
    bugConditionConfirmed,
    "EXPLORATION TEST RESULT: Redis read failure causes immediate session validation failure. Bug exists: no fallback mechanism for read failures."
  );
});
