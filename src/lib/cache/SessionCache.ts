/**
 * Local Session Cache - 5-minute fallback when Redis is unavailable
 * 
 * This cache is used when Redis fails (Redis fallback feature).
 * TTL: 5 minutes - after which cache expires and requests fail-closed
 */

interface CachedSession {
  token: string;
  sessionData: any;
  createdAt: number;
}

export class LocalSessionCache {
  private cache: Map<string, CachedSession> = new Map();
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Store a session in local cache
   */
  set(userId: string, sessionData: any, token: string): void {
    this.cache.set(userId, {
      token,
      sessionData,
      createdAt: Date.now(),
    });
  }

  /**
   * Retrieve a session from local cache if still fresh
   */
  get(userId: string): any | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;

    // Check if still within 5-minute TTL
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(userId);
      return null;
    }

    return entry.sessionData;
  }

  /**
   * Invalidate a cached session (for logout)
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear entire cache (for testing)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats (for monitoring)
   */
  getStats() {
    return {
      size: this.cache.size,
      ttlMs: this.ttlMs,
    };
  }
}

export const sessionCache = new LocalSessionCache();
