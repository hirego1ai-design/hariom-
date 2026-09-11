import { timingSafeEqual, randomUUID } from 'crypto';
import { Redis } from '@upstash/redis';
import { ApiError } from '../apiSecurity';
import type { RecoveryReport } from './FailureRecoveryRunner';

const LOCK_KEY = 'workers:workflow-recovery:lock';
const HEARTBEAT_KEY = 'workers:workflow-recovery:heartbeat';
const LEASE_MS = 90_000;
let client: Redis | undefined;

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new ApiError('Recovery worker coordination is not configured.', 503);
  client ??= new Redis({ url, token });
  return client;
}

export function requireRecoveryWorkerKey(request: Request) {
  const expected = process.env.WORKER_RECOVERY_API_KEY?.trim();
  if (!expected || expected.length < 32) throw new ApiError('Recovery worker key is not configured.', 503);
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const actualBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    throw new ApiError('Unauthorized', 401);
  }
}

export interface RecoveryHeartbeat {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  state: 'running' | 'completed' | 'attention' | 'failed';
  report?: RecoveryReport;
}

export class RecoveryWorkerState {
  static async claim(): Promise<RecoveryHeartbeat | null> {
    const heartbeat: RecoveryHeartbeat = { runId: randomUUID(), startedAt: new Date().toISOString(), state: 'running' };
    const claimed = await redis().eval<[string, number, string], number>(
      `if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
        redis.call('SET', KEYS[2], ARGV[3], 'EX', 86400)
        return 1
      end
      return 0`,
      [LOCK_KEY, HEARTBEAT_KEY], [heartbeat.runId, LEASE_MS, JSON.stringify(heartbeat)],
    );
    return claimed === 1 ? heartbeat : null;
  }

  static async finish(heartbeat: RecoveryHeartbeat, report?: RecoveryReport): Promise<boolean> {
    const finished: RecoveryHeartbeat = {
      ...heartbeat, finishedAt: new Date().toISOString(),
      state: report ? ((report.pphBilling?.held ?? 0) > 0 || report.outbox.unhandled > 0 || report.failedWorkflowsEnqueued > 0 || report.outbox.failed > 0 || report.outbox.retried > 0 || report.timeBudgetExhausted ? 'attention' : 'completed') : 'failed',
      ...(report ? { report } : {}),
    };
    const saved = await redis().eval<[string, string], number>(
      `if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
      redis.call('SET', KEYS[2], ARGV[2], 'EX', 86400)
      redis.call('DEL', KEYS[1])
      return 1`,
      [LOCK_KEY, HEARTBEAT_KEY], [heartbeat.runId, JSON.stringify(finished)],
    );
    return saved === 1;
  }

  static async read() {
    const heartbeat = await redis().get<RecoveryHeartbeat>(HEARTBEAT_KEY);
    const ageMs = heartbeat ? Date.now() - Date.parse(heartbeat.finishedAt || heartbeat.startedAt) : null;
    return { heartbeat, stale: ageMs === null || !Number.isFinite(ageMs) || ageMs > 180_000 };
  }
}
