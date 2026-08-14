export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface BreakerState {
  state: CircuitState;
  failures: number;
  lastStateChange: number;
}

export class CircuitBreaker {
  private static breakers: Map<string, BreakerState> = new Map();

  public static async execute<T>(
    key: string,
    fn: () => Promise<T>,
    failureThreshold = 5,
    resetTimeoutMs = 30000
  ): Promise<T> {
    const now = Date.now();
    let record = this.breakers.get(key);

    if (!record) {
      record = { state: 'CLOSED', failures: 0, lastStateChange: now };
      this.breakers.set(key, record);
    }

    if (record.state === 'OPEN') {
      if (now - record.lastStateChange > resetTimeoutMs) {
        record.state = 'HALF_OPEN';
        record.lastStateChange = now;
      } else {
        throw new CircuitBreakerOpenError(`Circuit breaker is OPEN for target '${key}'`);
      }
    }

    try {
      const result = await fn();
      record.state = 'CLOSED';
      record.failures = 0;
      record.lastStateChange = now;
      return result;
    } catch (error) {
      record.failures++;
      if (record.failures >= failureThreshold || record.state === 'HALF_OPEN') {
        record.state = 'OPEN';
        record.lastStateChange = now;
      }
      throw error;
    }
  }

  public static getStatus(key: string): CircuitState {
    return this.breakers.get(key)?.state ?? 'CLOSED';
  }

  public static reset(key: string): void {
    this.breakers.delete(key);
  }
}
