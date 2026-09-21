import { setTimeout as delay } from 'node:timers/promises';

const secret = process.env.CRON_SECRET?.trim();
const endpoint = new URL('/api/cron/recorded-assessment-analysis', process.env.APP_URL || '');

if (!secret || secret.length < 32) {
  throw new Error('Configure CRON_SECRET with at least 32 characters.');
}
if (endpoint.username || endpoint.password) {
  throw new Error('APP_URL must not contain credentials.');
}
const internalHttp =
  process.env.ALLOW_INTERNAL_HTTP === '1' &&
  ['app', 'localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && internalHttp)) {
  throw new Error('APP_URL must use HTTPS outside the private local app network.');
}

const intervalMs = 5 * 60_000;
let stopping = false;
let activeController;
let delayController;

function stop() {
  stopping = true;
  activeController?.abort();
  delayController?.abort();
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);

while (!stopping) {
  const startedAt = Date.now();
  try {
    activeController = new AbortController();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
      redirect: 'error',
      signal: AbortSignal.any([activeController.signal, AbortSignal.timeout(90_000)]),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      throw new Error(`Recorded assessment recovery tick failed with HTTP ${response.status}`);
    }
    console.log(JSON.stringify({
      worker: 'recorded-assessment-analysis-recovery',
      at: new Date().toISOString(),
      status: 'completed',
      scanned: result.scanned ?? null,
      staleProcessingMinutes: result.staleProcessingMinutes ?? null,
    }));
  } catch (error) {
    if (!stopping) {
      console.error(JSON.stringify({
        worker: 'recorded-assessment-analysis-recovery',
        at: new Date().toISOString(),
        status: 'failed',
        message: error instanceof Error ? error.message : 'Request failed',
      }));
    }
  } finally {
    activeController = undefined;
  }

  if (!stopping) {
    const elapsed = Date.now() - startedAt;
    const waitMs = Math.max(1_000, intervalMs - elapsed);
    delayController = new AbortController();
    try {
      await delay(waitMs, undefined, { signal: delayController.signal });
    } catch (error) {
      if (!stopping) throw error;
    } finally {
      delayController = undefined;
    }
  }
}
